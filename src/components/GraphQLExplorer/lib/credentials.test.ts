import { describe, expect, test } from "vitest";
import {
  authorizationHeader,
  hasScope,
  isExpired,
  satisfiesScope,
  type Credential,
} from "./credentials";

const pat: Credential = { kind: "pat", token: "hc_pat_abc" };

const oauth = (scopes: string[], expiresAt: number | null = null): Credential => ({
  kind: "oauth",
  accessToken: "hc_at_abc",
  expiresAt,
  scopes,
});

describe("authorizationHeader", () => {
  test("adds the Bearer prefix", () => {
    expect(authorizationHeader(pat)).toBe("Bearer hc_pat_abc");
  });

  test("tolerates a token that already carries the prefix", () => {
    expect(authorizationHeader({ kind: "pat", token: "Bearer hc_pat_abc" })).toBe(
      "Bearer hc_pat_abc",
    );
  });

  test("is null when there is no credential", () => {
    expect(authorizationHeader({ kind: "none" })).toBeNull();
    expect(authorizationHeader({ kind: "pat", token: "   " })).toBeNull();
  });
});

describe("isExpired", () => {
  test("a PAT never reports as expired, because we cannot know", () => {
    expect(isExpired(pat)).toBe(false);
  });

  test("an oauth credential past its expiry is expired", () => {
    expect(isExpired(oauth([], Date.now() - 1))).toBe(true);
  });

  test("an oauth credential without a stated expiry is not expired", () => {
    expect(isExpired(oauth([], null))).toBe(false);
  });
});

describe("satisfiesScope", () => {
  test("an exact match satisfies", () => {
    expect(satisfiesScope("read:catalog", "read:catalog")).toBe(true);
  });

  test("a parent scope covers a child, matching the API hierarchy", () => {
    expect(satisfiesScope("read:library", "read:library:public")).toBe(true);
  });

  test("a child does not cover its parent", () => {
    expect(satisfiesScope("read:library:public", "read:library")).toBe(false);
  });

  test("the wildcard covers everything", () => {
    expect(satisfiesScope("all", "write:catalog:edit")).toBe(true);
  });

  test("an unrelated scope does not satisfy", () => {
    expect(satisfiesScope("read:catalog", "read:catalogue")).toBe(false);
  });
});

describe("hasScope", () => {
  test("is unknown for a PAT rather than false", () => {
    // A pasted PAT is opaque: introspection needs client-secret auth, which a
    // public browser client cannot do. Reporting `false` here would let the UI
    // refuse a query the token is perfectly entitled to run.
    expect(hasScope(pat, "read:catalog")).toBeNull();
  });

  test("resolves against granted oauth scopes", () => {
    expect(hasScope(oauth(["read:catalog"]), "read:catalog")).toBe(true);
    expect(hasScope(oauth(["read:catalog"]), "read:me")).toBe(false);
  });
});
