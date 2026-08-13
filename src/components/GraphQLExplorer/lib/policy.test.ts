import { describe, expect, test } from "vitest";
import { canRun, isMutation } from "./policy";
import type { Credential } from "./credentials";

const pat: Credential = { kind: "pat", token: "hc_pat_abc" };
const none: Credential = { kind: "none" };

describe("isMutation", () => {
  test("detects an anonymous mutation", () => {
    expect(isMutation("mutation { insert_user_book { id } }")).toBe(true);
  });

  test("detects a named mutation with variables", () => {
    expect(isMutation("mutation AddBook($id: Int!) { insert_user_book { id } }")).toBe(true);
  });

  test("detects mutation regardless of casing", () => {
    // Not valid GraphQL, but the two old checks disagreed on this and one of
    // them let it through to a "Try it" tab that then refused to run.
    expect(isMutation("Mutation { insert_user_book { id } }")).toBe(true);
  });

  test("a field whose name merely starts with 'mutation' is not a mutation", () => {
    expect(isMutation("query { mutation_log { id } }")).toBe(false);
  });

  test("the word inside a string literal is not a mutation", () => {
    expect(isMutation('query { books(where: {title: {_eq: "mutation"}}) { id } }')).toBe(false);
  });

  test("the word inside a comment is not a mutation", () => {
    expect(isMutation("# this is not a mutation { }\nquery { books { id } }")).toBe(false);
  });

  test("a plain query is not a mutation", () => {
    expect(isMutation("query { books(limit: 5) { id title } }")).toBe(false);
  });

  test("empty input is not a mutation", () => {
    expect(isMutation("")).toBe(false);
  });
});

describe("canRun", () => {
  test("allows a normal query with a credential", () => {
    expect(canRun("query { books { id } }", pat)).toEqual({ allowed: true });
  });

  test("rejects an empty query before anything else", () => {
    const verdict = canRun("   ", none);
    expect(verdict).toMatchObject({ allowed: false });
    expect(verdict.allowed === false && verdict.error.code).toBe("empty_query");
  });

  test("reports the mutation block before asking for a token", () => {
    // A mutation is refused whether or not you are signed in, so telling the
    // reader to paste a token first would be a dead end.
    const verdict = canRun("mutation { insert_user_book { id } }", none);
    expect(verdict.allowed === false && verdict.error.code).toBe("mutation_not_allowed");
  });

  test("allows a mutation when the caller opts in", () => {
    const verdict = canRun("mutation { insert_user_book { id } }", pat, {
      allowMutations: true,
    });
    expect(verdict).toEqual({ allowed: true });
  });

  test("requires a credential", () => {
    const verdict = canRun("query { books { id } }", none);
    expect(verdict.allowed === false && verdict.error.code).toBe("empty_token");
  });

  test("rejects an expired oauth credential", () => {
    const expired: Credential = {
      kind: "oauth",
      accessToken: "hc_at_abc",
      expiresAt: Date.now() - 1000,
      scopes: ["read:catalog"],
    };
    const verdict = canRun("query { books { id } }", expired);
    expect(verdict.allowed === false && verdict.error.code).toBe("expired_credential");
  });
});
