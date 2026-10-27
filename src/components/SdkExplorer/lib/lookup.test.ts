import { describe, expect, it } from "vitest";
import { findMethod } from "./catalog";
import { lookupInputs, pick } from "./lookup";

describe("pick", () => {
  it("follows a dot path into a result", () => {
    expect(pick({ items: [{ id: 7 }] }, "items.0.id")).toBe(7);
  });

  it("maps over an array with *", () => {
    expect(pick({ listBooks: [{ id: 1 }, { id: 2 }] }, "listBooks.*.id")).toEqual([1, 2]);
  });

  it("takes the whole result for an empty path", () => {
    expect(pick(42, "")).toBe(42);
  });

  it("gives undefined when the account has nothing there", () => {
    expect(pick({ items: [] }, "items.0.id")).toBeUndefined();
    expect(pick(null, "items.0.id")).toBeUndefined();
  });
});

describe("lookupInputs", () => {
  it("finds lookups inside options, in call order", () => {
    const reorder = findMethod("lists.reorder")!.method;
    const paths = lookupInputs(reorder.params).map((input) => input.path);

    expect(paths.indexOf("listId")).toBeLessThan(paths.indexOf("listBookIds"));
  });
});
