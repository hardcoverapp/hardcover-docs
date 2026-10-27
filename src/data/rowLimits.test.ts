import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { rowLimit } from "./rowLimits";

const schemas = join(import.meta.dirname, "../content/docs/api/GraphQL/Schemas");

it("every schema page lists row limits only for queries the API has", () => {
  const unknown: string[] = [];

  for (const file of readdirSync(schemas).filter((name) => name.endsWith(".mdx"))) {
    const text = readFileSync(join(schemas, file), "utf8");

    for (const match of text.matchAll(/<SchemaAccess typeName="([^"]+)"(?: queries=\{(\[[^\]]*\])\})? \/>/g)) {
      const queries: string[] = match[2] ? JSON.parse(match[2]) : [match[1]!];
      for (const query of queries) if (rowLimit(query) === undefined) unknown.push(`${file}: ${query}`);
    }
  }

  expect(unknown).toEqual([]);
});
