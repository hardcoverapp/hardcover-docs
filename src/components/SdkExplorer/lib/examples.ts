// The SDK's examples (packages/typescript/examples, synced per minor version
// by `npm run sync:sdk-catalog`), cut into one function at a time for guides
// and resource pages. The code shown is the SDK's own, which its CI type-checks.
const files = import.meta.glob<string>("../examples/*/*.ts", { query: "?raw", import: "default", eager: true });

export interface ExampleFile {
  /** The file's opening doc comment, as plain text. */
  summary: string;
  /** Exported function names, in file order. */
  functions: string[];
}

function source(version: string, file: string): string {
  const text = files[`../examples/${version}/${file}.ts`];
  if (text === undefined) throw new Error(`No SDK example ${version}/${file}.ts. Run npm run sync:sdk-catalog.`);
  return text;
}

/** Every example file of a version, by name ("reading-progress"). */
export function exampleFiles(version: string): string[] {
  const prefix = `../examples/${version}/`;
  return Object.keys(files)
    .filter((path) => path.startsWith(prefix))
    .map((path) => path.slice(prefix.length, -".ts".length))
    .sort();
}

export function exampleFile(version: string, file: string): ExampleFile {
  const text = source(version, file);
  const opening = text.match(/^\/\*\*([\s\S]*?)\*\//)?.[1] ?? text.match(/^((?:\/\/.*\n)+)/)?.[1] ?? "";

  return {
    summary: opening
      .split("\n")
      .map((line) => line.replace(/^\s*(\*|\/\/)\s?/, ""))
      .join("\n")
      .trim(),
    functions: [...text.matchAll(/^export (?:async )?function (\w+)/gm)].map((match) => match[1]!),
  };
}

/**
 * One exported function with the comment right above it, plus an import line
 * naming only what it uses:
 *
 *   import { HardcoverClient, UserBookStatus } from "@hardcover/sdk";
 *
 *   export async function shelveABook(hc: HardcoverClient, bookId: number) { … }
 */
export function exampleCode(version: string, file: string, fn: string): string {
  const lines = source(version, file).split("\n");

  const start = lines.findIndex((line) => new RegExp(`^export (async )?function ${fn}\\b`).test(line));
  if (start === -1) throw new Error(`No function ${fn} in SDK example ${version}/${file}.ts.`);

  // The function ends at the first closing brace back at the left margin.
  const end = lines.findIndex((line, i) => i > start && line === "}");

  // Comment lines directly above belong to it.
  let first = start;
  while (first > 0 && /^\s*(\/\/|\/\*\*|\*)/.test(lines[first - 1]!)) first -= 1;

  const body = lines.slice(first, end + 1).join("\n");
  const declared = declarations(lines, body);

  return [...imports(lines, [...declared, body].join("\n")), ...declared, body].join("\n");
}

// Top-level types, interfaces and constants the function uses (like the store
// interface a sync function takes), with their comments, so the snippet stands alone.
function declarations(lines: string[], body: string): string[] {
  const blocks: string[] = [];

  lines.forEach((line, start) => {
    const name = line.match(/^(?:export )?(?:type|interface|const) (\w+)/)?.[1];
    if (!name || !new RegExp(`\\b${name}\\b`).test(body)) return;

    // One line, or up to the closing brace at the left margin.
    const end = /[;{]\s*$/.test(line) && line.trimEnd().endsWith("{") ? lines.findIndex((l, i) => i > start && /^\}/.test(l)) : start;

    let first = start;
    while (first > 0 && /^\s*(\/\/|\/\*\*|\*)/.test(lines[first - 1]!)) first -= 1;

    blocks.push(lines.slice(first, end + 1).join("\n"), "");
  });

  return blocks;
}

// The file's import statements, cut down to the names the snippet uses.
function imports(lines: string[], body: string): string[] {
  const statements = lines.join("\n").match(/^import [\s\S]*?;$/gm) ?? [];
  const used = (name: string) => new RegExp(`\\b${name}\\b`).test(body);

  const kept = statements.flatMap((statement) => {
    const named = statement.match(/^import (type )?\{([^}]*)\} from (["'][^"']+["']);$/);
    if (!named) return [statement];

    const names = named[2]!.split(",").map((name) => name.trim()).filter(Boolean);
    const needed = names.filter((name) => used(name.replace(/^type\s+/, "").split(/\s+as\s+/).pop()!));

    return needed.length ? [`import ${named[1] ?? ""}{ ${needed.join(", ")} } from ${named[3]};`] : [];
  });

  return kept.length ? [...kept, ""] : [];
}
