// The generated SDK pages (scripts/generate-sdk-pages.mjs) must be valid MDX:
// in prose, { } would run as JavaScript and < would start a component, which
// breaks the page at render time, after `astro check` has passed.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

const dir = join(import.meta.dirname, "../../../content/docs/sdk/typescript/resources");

it("generated pages have no unescaped braces or angle brackets in prose", () => {
  const problems: string[] = [];

  for (const file of readdirSync(dir).filter((name) => name.endsWith(".mdx"))) {
    readFileSync(join(dir, file), "utf8")
      .split("\n")
      .forEach((line, i) => {
        // Frontmatter, imports, comments and components are meant to be code.
        if (/^(---|import |\{\/\*|<SdkExplorer |title:|description:|layout:)/.test(line)) return;

        // Inline code is literal; check what's outside it.
        const prose = line.replace(/`[^`]*`/g, "");
        if (/(?<!\\)[{}]|<(?!\/?br)/.test(prose)) problems.push(`${file}:${i + 1}: ${line.trim()}`);
      });
  }

  expect(problems).toEqual([]);
});
