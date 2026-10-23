// The generated SDK pages (scripts/generate-sdk-pages.mjs) must be valid MDX:
// in prose, { } would run as JavaScript and < would start a component, which
// breaks the page at render time, after `astro check` has passed.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { versions } from "./catalog";

const root = join(import.meta.dirname, "../../../content/docs/sdk/typescript");

// Every version's resource pages, and the changelog.
const pages = [
  ...versions.flatMap((version) => {
    const dir = join(root, version, "resources");
    return readdirSync(dir).filter((name) => name.endsWith(".mdx")).map((name) => join(dir, name));
  }),
  join(root, "changelog.mdx"),
];

it("generated pages have no unescaped braces or angle brackets in prose", () => {
  const problems: string[] = [];

  for (const file of pages) {
    let fenced = false;

    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        // Code blocks, frontmatter, imports, comments and components are meant to be code.
        if (line.startsWith("```")) fenced = !fenced;
        if (fenced || /^(```|---|import |\{\/\*|<SdkExplorer |<SdkExample |title:|description:|slug:|layout:)/.test(line)) return;

        // Inline code and scope pills are literal; check what's outside them.
        const prose = line.replace(/`[^`]*`/g, "").replace(/<ScopePill scope="[^"]+" \/>/g, "");
        if (/(?<!\\)[{}]|<(?!\/?br)/.test(prose)) problems.push(`${file.slice(root.length + 1)}:${i + 1}: ${line.trim()}`);
      });
  }

  expect(problems).toEqual([]);
});

it("every page of a version says which version it documents in its URL", () => {
  const wrong = pages
    .filter((file) => !file.endsWith("changelog.mdx"))
    .filter((file) => {
      const version = file.slice(root.length + 1).split("/")[0];
      return !readFileSync(file, "utf8").includes(`slug: sdk/typescript/${version}/`);
    });

  expect(wrong).toEqual([]);
});
