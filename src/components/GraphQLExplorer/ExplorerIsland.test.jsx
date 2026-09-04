import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExplorerIsland } from "./ExplorerIsland";

/**
 * End-to-end cover for the restructure: Astro props -> provider -> policy ->
 * client -> results. Each piece is unit tested, but this is the wiring, which is
 * what a restructure actually risks.
 */

const QUERY = "query { books(limit: 1) { id title } }";

const jsonResponse = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("ExplorerIsland", () => {
  test("refuses a mutation instead of offering to run it", () => {
    render(<ExplorerIsland query="mutation { insert_user_book { id } }" />);

    expect(
      screen.getByText(/Mutation queries are not currently allowed/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /run/i })).not.toBeInTheDocument();
  });

  test("does not treat a field named like a mutation as one", () => {
    render(<ExplorerIsland query="query { mutation_log { id } }" />);

    expect(screen.getByRole("button", { name: /run/i })).toBeInTheDocument();
  });

  test("asks for a token before running, and says so", async () => {
    const user = userEvent.setup();
    render(<ExplorerIsland query={QUERY} />);

    await user.click(screen.getByRole("button", { name: /run/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/No auth token provided/i);
  });

  test("runs a query with a stored token and renders the results", async () => {
    window.localStorage.setItem("auth_token", "hc_pat_test");

    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { books: [{ id: 1, title: "Dune" }] } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<ExplorerIsland query={QUERY} />);

    await user.click(await screen.findByRole("button", { name: /run/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer hc_pat_test");

    expect(await screen.findByText("Dune")).toBeInTheDocument();
  });

  test("surfaces a rate limit distinctly from a bad token", async () => {
    window.localStorage.setItem("auth_token", "hc_pat_test");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: "Throttled" }, { status: 429 }),
      ),
    );

    const user = userEvent.setup();
    render(<ExplorerIsland query={QUERY} />);

    await user.click(await screen.findByRole("button", { name: /run/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Too many requests/i);
  });

  test("a scope-limited token is not reported as invalid", async () => {
    // Regression: validation ran `me { id }`, so a token scoped to
    // read:catalog (correct for most documented examples) was rejected as bad.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          errors: [{ message: "field 'me' not found (insufficient scope)" }],
        }),
      ),
    );

    const user = userEvent.setup();
    render(<ExplorerIsland query={QUERY} />);

    const field = screen.getByRole("textbox", { name: /^authorization token$/i });
    await user.type(field, "hc_pat_catalog_only");
    await user.tab();

    await waitFor(() =>
      expect(window.localStorage.getItem("auth_token")).toBe("hc_pat_catalog_only"),
    );

    expect(screen.queryByText(/Invalid or expired auth token/i)).not.toBeInTheDocument();
  });
});
