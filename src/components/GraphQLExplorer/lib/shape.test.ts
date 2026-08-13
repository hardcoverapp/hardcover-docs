import { describe, expect, test } from "vitest";
import {
  flattenForDisplay,
  flattenPaths,
  formatCellValue,
  formatFieldLabel,
  formatStatValue,
  extractStatTiles,
  sortByDate,
  withinDaysOfNewest,
} from "./shape";

describe("flattenForDisplay", () => {
  test("flattens an all-primitive nested object into dotted columns", () => {
    expect(flattenForDisplay({ a: 1, b: { nested: "x" } })).toEqual({
      a: 1,
      "b.nested": "x",
    });
  });

  test("joins an array of primitives", () => {
    expect(flattenForDisplay({ tags: ["fiction", "mystery"] })).toEqual({
      tags: "fiction, mystery",
    });
  });

  test("summarises an array of objects", () => {
    expect(flattenForDisplay({ books: [{ id: 1 }, { id: 2 }] })).toEqual({
      books: "[2 items]",
    });
  });

  test("renders an empty array as blank", () => {
    expect(flattenForDisplay({ tags: [] })).toEqual({ tags: "" });
  });

  test("previews a deeply nested object as JSON rather than exploding columns", () => {
    expect(flattenForDisplay({ meta: { inner: { deep: 1 } } })).toEqual({
      meta: JSON.stringify({ inner: { deep: 1 } }),
    });
  });

  test("preserves null and undefined", () => {
    expect(flattenForDisplay({ a: null, b: undefined })).toEqual({ a: null, b: undefined });
  });
});

describe("flattenPaths", () => {
  test("recurses to reach a deeply nested numeric field", () => {
    expect(flattenPaths({ book: { stats: { pages: 300 } } })).toEqual({
      "book.stats.pages": 300,
    });
  });

  test("preserves arrays rather than summarising them", () => {
    const result = flattenPaths({ tags: ["a", "b"] });
    expect(result.tags).toEqual(["a", "b"]);
  });

  test("leaves non-plain objects alone", () => {
    const date = new Date();
    expect(flattenPaths({ at: date }).at).toBe(date);
  });
});

describe("formatCellValue", () => {
  test("renders null explicitly and undefined as blank", () => {
    expect(formatCellValue(null)).toBe("null");
    expect(formatCellValue(undefined)).toBe("");
  });

  test("renders booleans", () => {
    expect(formatCellValue(false)).toBe("false");
  });

  test("passes an item-count summary through untouched", () => {
    expect(formatCellValue("[2 items]")).toBe("[2 items]");
  });

  test("truncates long strings", () => {
    const long = "x".repeat(150);
    expect(formatCellValue(long)).toBe(`${"x".repeat(100)}...`);
  });
});

describe("extractStatTiles", () => {
  // The real shape from `lists_aggregate` on api/GraphQL/Schemas/Lists.mdx.
  const aggregate = {
    lists_aggregate: {
      aggregate: {
        count: 305752,
        avg: { books_count: 19.209964284779822, likes_count: 0.013841283131426777 },
        max: { books_count: 17829, likes_count: 229 },
      },
    },
  };

  test("recognises a Hasura aggregate and strips the shared prefix", () => {
    const tiles = extractStatTiles(aggregate);
    expect(tiles?.map((t) => t.key)).toEqual([
      "count",
      "avg.books_count",
      "avg.likes_count",
      "max.books_count",
      "max.likes_count",
    ]);
  });

  test("labels the tiles readably", () => {
    const tiles = extractStatTiles(aggregate);
    expect(tiles?.map((t) => t.label)).toContain("Avg Books Count");
    expect(tiles?.map((t) => t.label)).toContain("Max Likes Count");
  });

  test("declines anything containing an array, which is a series", () => {
    expect(extractStatTiles({ books: [{ id: 1, pages: 300 }] })).toBeNull();
  });

  test("declines a mix of numbers and strings, which tables better", () => {
    expect(extractStatTiles({ me: { id: 1, username: "kylie" } })).toBeNull();
  });

  test("declines empty or non-object input", () => {
    expect(extractStatTiles(null)).toBeNull();
    expect(extractStatTiles({})).toBeNull();
  });

  test("declines a wall of numbers that wants a table instead", () => {
    const many = Object.fromEntries(
      Array.from({ length: 13 }, (_, i) => [`field_${i}`, i]),
    );
    expect(extractStatTiles(many)).toBeNull();
  });
});

describe("formatStatValue", () => {
  test("separates thousands on integers", () => {
    expect(formatStatValue(305752)).toBe("305,752");
  });

  test("trims a long float to something readable", () => {
    expect(formatStatValue(19.209964284779822)).toBe("19.21");
  });

  test("keeps small fractions meaningful rather than rounding to zero", () => {
    expect(formatStatValue(0.013841283131426777)).toBe("0.0138");
  });
});

describe("sortByDate", () => {
  test("puts newest-first rows into time order", () => {
    const rows = [
      { created_at: "2026-04-01" },
      { created_at: "2025-01-01" },
      { created_at: "2026-08-01" },
    ];
    expect(sortByDate(rows, "created_at").map((r) => r.created_at)).toEqual([
      "2025-01-01",
      "2026-04-01",
      "2026-08-01",
    ]);
  });

  test("does not mutate the input", () => {
    const rows = [{ d: "2026-02-01" }, { d: "2025-02-01" }];
    sortByDate(rows, "d");
    expect(rows[0].d).toBe("2026-02-01");
  });
});

describe("withinDaysOfNewest", () => {
  const rows = [
    { d: "2026-08-13" },
    { d: "2026-08-10" },
    { d: "2026-06-01" },
    { d: "2025-01-01" },
  ];

  test("windows back from the newest row, not from today", () => {
    expect(withinDaysOfNewest(rows, "d", 7).map((r) => r.d)).toEqual([
      "2026-08-13",
      "2026-08-10",
    ]);
  });

  test("works when rows arrive newest-first", () => {
    // Regression: the newest date used to be read as the last array element.
    // Rows come back newest-first, so that was the OLDEST — the window started
    // before every point and every range rendered an identical chart.
    const newestFirst = [...rows];
    expect(withinDaysOfNewest(newestFirst, "d", 7)).toHaveLength(2);
  });

  test("works when rows arrive oldest-first too", () => {
    const oldestFirst = [...rows].reverse();
    expect(withinDaysOfNewest(oldestFirst, "d", 7)).toHaveLength(2);
  });

  test("a wide window keeps everything", () => {
    expect(withinDaysOfNewest(rows, "d", 3650)).toHaveLength(4);
  });

  test("keeps rows whose date cannot be parsed", () => {
    const withJunk = [...rows, { d: "not a date" }];
    expect(withinDaysOfNewest(withJunk, "d", 7)).toHaveLength(3);
  });

  test("returns everything when no row has a usable date", () => {
    const undateable = [{ d: "x" }, { d: "y" }];
    expect(withinDaysOfNewest(undateable, "d", 7)).toHaveLength(2);
  });
});

describe("formatFieldLabel", () => {
  test("capitalises each dotted segment", () => {
    expect(formatFieldLabel("book.stats.pages")).toBe("Book Stats Pages");
    expect(formatFieldLabel("rating")).toBe("Rating");
  });

  test("splits snake_case, which most numeric schema fields use", () => {
    expect(formatFieldLabel("users_count")).toBe("Users Count");
    expect(formatFieldLabel("followed_users_count")).toBe("Followed Users Count");
  });

  test("survives stray separators", () => {
    expect(formatFieldLabel("__typename")).toBe("Typename");
    expect(formatFieldLabel("audio_seconds.")).toBe("Audio Seconds");
  });

  test("uppercases known acronyms rather than title-casing them", () => {
    expect(formatFieldLabel("isbn_13")).toBe("ISBN 13");
    expect(formatFieldLabel("book_id")).toBe("Book ID");
    expect(formatFieldLabel("openlibrary_url")).toBe("Openlibrary URL");
    expect(formatFieldLabel("iso_3166")).toBe("ISO 3166");
  });

  test("pluralises acronyms without shouting the s", () => {
    expect(formatFieldLabel("isbns")).toBe("ISBNs");
    expect(formatFieldLabel("book_ids")).toBe("Book IDs");
  });

  test("matches whole segments only, never prefixes", () => {
    // `identifiers` starts with `id` and must not become "IDENTIFIERS".
    expect(formatFieldLabel("identifiers")).toBe("Identifiers");
    expect(formatFieldLabel("isolation_level")).toBe("Isolation Level");
  });

  test("leaves ordinary short words alone", () => {
    expect(formatFieldLabel("is_read")).toBe("Is Read");
    expect(formatFieldLabel("born_year")).toBe("Born Year");
  });
});
