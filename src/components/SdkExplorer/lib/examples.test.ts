// The SDK's examples as the docs show them: one function at a time, each
// shown exactly once, in a guide or on its resource page.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import placements from "../resource-examples.json";
import { versions } from "./catalog";
import { exampleCode, exampleFile, exampleFiles } from "./examples";

const docs = join(import.meta.dirname, "../../../content/docs/sdk/typescript");

// <SdkExample version="0.1" file="…" fn="…" /> in hand-written guides.
function guidePlacements(version: string): string[] {
  const dir = join(docs, version, "guides");
  if (!statSync(dir, { throwIfNoEntry: false })) return [];

  return readdirSync(dir)
    .filter((name) => name.endsWith(".mdx"))
    .flatMap((name) =>
      [...readFileSync(join(dir, name), "utf8").matchAll(/<SdkExample version="([^"]+)" file="([^"]+)" fn="([^"]+)"/g)].map((m) => {
        expect(m[1], `${name} shows another version's example`).toBe(version);
        return `${m[2]}.${m[3]}`;
      }),
    );
}

describe("example code", () => {
  it("cuts out one function with its comment and only the imports it uses", () => {
    const code = exampleCode("0.1", "shelve-a-book", "shelveABook");

    expect(code).toMatch(/^import \{ [^}]+ \} from "@hardcover\/sdk";\n\n/);
    expect(code).toContain("export async function shelveABook(");
    expect(code.trimEnd().endsWith("}")).toBe(true);
    expect(code.match(/export async function/g)).toHaveLength(1);
  });

  it("drops imports the function doesn't use", () => {
    const code = exampleCode("0.1", "catalog", "authorPage");
    expect(code).not.toContain("Platform");
  });

  it("reads a file's summary and functions", () => {
    const file = exampleFile("0.1", "catalog");
    expect(file.summary).toMatch(/^Authors, series/);
    expect(file.functions).toEqual(["authorPage", "readingOrder", "importFromGoodreads", "editionById"]);
  });
});

for (const version of versions) {
  it(`${version}: shows every example function exactly once`, () => {
    const shown = [
      ...Object.values(placements.resources).flatMap((list) => list.map((e) => `${e.file}.${e.fn}`)),
      ...placements.notShown.map((e) => `${e.file}.${e.fn}`),
      ...guidePlacements(version),
    ];

    const all = exampleFiles(version).flatMap((file) => exampleFile(version, file).functions.map((fn) => `${file}.${fn}`));

    expect(all.filter((name) => !shown.includes(name)), "examples not shown anywhere").toEqual([]);
    expect(shown.filter((name, i) => shown.indexOf(name) !== i), "examples shown twice").toEqual([]);
    expect(shown.filter((name) => !all.includes(name)), "placements for examples that don't exist").toEqual([]);
  });
}
