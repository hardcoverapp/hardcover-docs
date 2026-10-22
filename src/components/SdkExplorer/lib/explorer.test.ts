// The SDK explorer's logic: every catalog method turns its examples into
// arguments and code, and the code reads the way an app would write it.
import { describe, expect, it } from "vitest";
import { buildArgs, exampleValues, InputError } from "./args";
import { catalogs, findMethod } from "./catalog";
import { scopeInfo } from "@/data/scopes";
import { snippet } from "./codegen";

const lookup = (id: string) => {
  const found = findMethod(id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
};

const codeFor = (id: string, values?: Record<string, string | boolean>) => {
  const { resource, method } = lookup(id);
  return snippet(resource, method.name, buildArgs(method, { ...exampleValues(method), ...values })).code;
};

describe("every catalog method", () => {
  for (const [version, resources] of Object.entries(catalogs)) {
    for (const resource of resources) {
      for (const method of resource.methods) {
        it(`${version}: ${resource.name}.${method.name} builds from its examples or names the missing input`, () => {
          try {
            const args = buildArgs(method, exampleValues(method));
            expect(snippet(resource, method.name, args).code).toContain(method.name);
          } catch (error) {
            // Ids that belong to the reader have no example; the form asks for them.
            expect(error).toBeInstanceOf(InputError);
          }
        });

        it(`${version}: ${resource.name}.${method.name} needs only scopes the API describes`, () => {
          const unknown = method.scopes.filter((scope) => !scopeInfo(scope).description);
          expect(unknown).toEqual([]);
        });
      }
    }
  }
});

describe("code", () => {
  it("passes positional ids, then an options object of only what's set", () => {
    expect(codeFor("library.add")).toContain("await hc.library.add(427578, {\n  status: UserBookStatus.WantToRead,\n});");
    expect(codeFor("library.add", { "options.status": "" })).toContain("await hc.library.add(427578);");
  });

  it("keeps a call that fits on one line", () => {
    expect(codeFor("books.get")).toContain("const result = await hc.books.get(427578);");
  });

  it("imports exactly the enums it uses", () => {
    expect(codeFor("library.add")).toContain('import { HardcoverClient, UserBookStatus } from "@hardcover/sdk";');
    expect(codeFor("books.get")).toContain('import { HardcoverClient } from "@hardcover/sdk";');
  });

  it("calls stats as a function from its own entry point", () => {
    const code = codeFor("stats.readingStats", { "period.kind": "month", "period.year": "2025", "period.month": "3" });

    expect(code).toContain('import { period, readingStats } from "@hardcover/sdk/stats";');
    expect(code).toContain("await readingStats(hc, period.month(2025, 3));");
  });

  it("sends null for a cleared nullable input", () => {
    expect(codeFor("library.rate", { id: "7", rating: "" })).toContain("hc.library.rate(7, null)");
  });
});

describe("inputs", () => {
  it("points at the input that's wrong", () => {
    const { method } = lookup("books.get");

    expect(() => buildArgs(method, { id: "abc" })).toThrow(InputError);

    try {
      buildArgs(method, { id: "abc" });
    } catch (error) {
      expect((error as InputError).path).toBe("id");
    }
  });

  it("asks for required inputs that have no value", () => {
    const { method } = lookup("library.get");
    expect(() => buildArgs(method, {})).toThrow(/required/);
  });
});
