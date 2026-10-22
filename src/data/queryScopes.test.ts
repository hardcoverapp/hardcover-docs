import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { Kind, parse } from "graphql";
import { describe, expect, it } from "vitest";
import { operationScope, queryScopes, withoutPlaceholders } from "./queryScopes";

describe("queryScopes", () => {
  it("needs each top-level operation's scope, once", () => {
    expect(queryScopes(`{ books { id } user_books { id } more: books { title } }`)).toEqual(["read:catalog", "read:library"]);
  });

  it("adds nothing for nested relationships", () => {
    expect(queryScopes(`{ me { user_books { book { title } } } }`)).toEqual(["read:me"]);
  });

  it("needs a protected column's own scope wherever it's selected", () => {
    expect(queryScopes(`{ me { email } }`)).toEqual(["read:me", "read:me:email"]);
  });

  it("needs write:reviews for a mutation that writes a review", () => {
    expect(queryScopes(`mutation { update_user_book(id: 1, object: { review_raw: "Loved it" }) { id } }`)).toEqual([
      "write:library",
      "write:reviews",
    ]);
  });

  it("follows fragments at the top level", () => {
    expect(queryScopes(`query { ...Shelf } fragment Shelf on query_root { user_books { id } }`)).toEqual(["read:library"]);
  });

  it("reads examples with placeholders", () => {
    expect(queryScopes(`{ user_books(where: {user_id: {_eq: ##USER_ID##}}) { id } }`)).toEqual(["read:library"]);
  });

  it("gives nothing for a query it can't read", () => {
    expect(queryScopes("not graphql {")).toEqual([]);
  });

  it("uses the broadest scope that lists an operation", () => {
    expect(operationScope("books")).toBe("read:catalog");
    expect(operationScope("me")).toBe("read:me");
  });
});

// Every GraphQL example on the site, from <GraphQLExplorer query={`…`} />.
function examples(dir: string): { file: string; query: string }[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return examples(path);
    if (!name.endsWith(".mdx")) return [];

    const text = readFileSync(path, "utf8");
    return [...text.matchAll(/<GraphQLExplorer[^>]*?query=\{`([\s\S]*?)`\}/g)].map((match) => ({ file: path, query: match[1]! }));
  });
}

const docs = join(import.meta.dirname, "../content/docs");


it("every GraphQL example calls only operations the API knows, so it can list their scopes", () => {
  const problems: string[] = [];

  for (const { file, query } of examples(join(docs, "api"))) {
    // Draft guides have empty examples still to be written.
    if (!query.trim()) continue;

    const where = file.slice(docs.length + 1);
    let document;

    try {
      document = parse(withoutPlaceholders(query));
    } catch (error) {
      problems.push(`${where}: doesn't parse (${(error as Error).message})`);
      continue;
    }

    for (const definition of document.definitions) {
      if (definition.kind !== Kind.OPERATION_DEFINITION) continue;

      for (const selection of definition.selectionSet.selections) {
        if (selection.kind === Kind.FIELD && !selection.name.value.startsWith("__") && !operationScope(selection.name.value)) {
          problems.push(`${where}: ${selection.name.value} isn't a listed operation`);
        }
      }
    }
  }

  expect(problems).toEqual([]);
});
