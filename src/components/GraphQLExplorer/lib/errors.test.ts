import { describe, expect, test } from "vitest";
import { errorFromGraphQLErrors, errorFromResponse, extractDetail } from "./errors";

describe("extractDetail", () => {
  test("reads the singular error string the proxy returns", () => {
    expect(extractDetail({ error: "Unable to verify token" })).toBe("Unable to verify token");
  });

  test("joins the bare string codes the query limiter returns", () => {
    expect(extractDetail({ errors: ["top_level_limit_exceeded", "other"] })).toBe(
      "top_level_limit_exceeded, other",
    );
  });

  test("reads the message from a GraphQL error object", () => {
    expect(extractDetail({ errors: [{ message: "field not found" }] })).toBe("field not found");
  });

  test("returns undefined when there is nothing to read", () => {
    expect(extractDetail({})).toBeUndefined();
    expect(extractDetail(null)).toBeUndefined();
  });
});

describe("errorFromResponse", () => {
  test("401 is an invalid token", () => {
    expect(errorFromResponse(401, { error: "Unable to verify token" }).code).toBe("invalid_token");
  });

  test("403 from the query limiter is a blocked operation", () => {
    expect(errorFromResponse(403, { errors: ["top_level_query_limit_exceeded"] }).code).toBe(
      "blocked_operation",
    );
  });

  test("403 mentioning scope is an insufficient scope", () => {
    expect(errorFromResponse(403, { error: "missing scope read:library" }).code).toBe(
      "insufficient_scope",
    );
  });

  test("403 for a quota block is a blocked operation", () => {
    expect(
      errorFromResponse(403, { error: "Your quota has been reached for this query." }).code,
    ).toBe("blocked_operation");
  });

  test("429 is rate limited and carries Retry-After", () => {
    const headers = new Headers({ "Retry-After": "30" });
    const error = errorFromResponse(429, { error: "Throttled" }, headers);
    expect(error.code).toBe("rate_limited");
    expect(error.retryAfter).toBe(30);
  });

  test("429 falls back to X-RateLimit-Reset", () => {
    const headers = new Headers({ "X-RateLimit-Reset": "12" });
    expect(errorFromResponse(429, {}, headers).retryAfter).toBe(12);
  });

  test("5xx is a server error", () => {
    expect(errorFromResponse(503, null).code).toBe("server_error");
  });

  test("408 is treated as a connection problem", () => {
    expect(errorFromResponse(408, null).code).toBe("connection_error");
  });
});

describe("errorFromGraphQLErrors", () => {
  test("produces exactly one error even when the first message is missing", () => {
    // Regression: the old thenable rejected without returning in this case and
    // then fell through to resolve, so the UI flashed an error and then
    // rendered success from the same response.
    const error = errorFromGraphQLErrors([{ message: "" }]);
    expect(error.code).toBe("query_error");
  });

  test("recognises an in-band scope failure", () => {
    const error = errorFromGraphQLErrors([
      { message: "field 'me' not found in type: 'query_root' (insufficient scope)" },
    ]);
    expect(error.code).toBe("insufficient_scope");
  });

  test("carries the message through as untranslated detail", () => {
    expect(errorFromGraphQLErrors([{ message: "boom" }]).detail).toBe("boom");
  });
});
