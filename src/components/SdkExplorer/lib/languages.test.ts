import { expect, it } from "vitest";
import data from "../languages.json";
import { GROUPS, languages, languageStatus, matrix, packageName, PARTIAL_NOTES, rows as allRows } from "./languages";

const rows = matrix().flatMap((group) => group.rows);

it("shows each resource once, read and write together", () => {
  expect(rows.filter((row) => row.label.includes("`library`"))).toHaveLength(1);
  expect(rows.some((row) => /: (read|write)/.test(row.label))).toBe(false);
});

it("leaves out rows only SDK contributors need", () => {
  expect(rows.some((row) => /conformance|contract|codegen|live integration/i.test(row.label))).toBe(false);
});

it("covers every language in every row", () => {
  for (const row of rows) expect(Object.keys(row.status).sort()).toEqual(languages.map((l) => l.id).sort());
});

it("marks a merged row done only when both halves are", () => {
  const ts = data.languages.find((l) => l.id === "typescript")!.support as Record<string, string>;
  const library = rows.find((row) => row.label.includes("`library`"))!;
  const both = ts["res-library-read"] === "done" && ts["res-library-write"] === "done";

  expect(library.status.typescript === "done").toBe(both);
});

it("names the TypeScript package and release, and the rest as planned", () => {
  const typescript = languages.find((l) => l.id === "typescript")!;
  expect(packageName(typescript)).toBe("@hardcover/sdk");
  expect(languageStatus(typescript)).toMatch(/^(Pre-release|Released) \(\d/);

  for (const language of languages.filter((l) => l.id !== "typescript")) {
    expect(packageName(language)).toBeUndefined();
    expect(languageStatus(language)).toBe("Planned");
  }
});

it("places every feature in one of the page's groups", () => {
  const placed = new Set(GROUPS.flatMap((group) => group.keys));
  expect([...allRows().keys()].filter((key) => !placed.has(key))).toEqual([]);
});

it("groups only rows that exist", () => {
  const keys = new Set(allRows().keys());
  expect(GROUPS.flatMap((group) => group.keys).filter((key) => !keys.has(key))).toEqual([]);
});

it("has notes only on partial cells, so a note goes when its cell is done", () => {
  const byKey = allRows();
  const stale = Object.entries(PARTIAL_NOTES).flatMap(([key, notes]) =>
    Object.keys(notes)
      .filter((language) => byKey.get(key)?.status[language] !== "partial")
      .map((language) => `${key} (${language})`),
  );

  expect(stale).toEqual([]);
});
