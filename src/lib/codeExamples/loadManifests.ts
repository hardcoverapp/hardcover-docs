import { parse } from "jsonc-parser";

export type Entry = { file: string } & (
  { key: string } | { label: string; lang: string }
);
export type Manifest = { items: Entry[] } | { groups: Record<string, Entry[]> };

export function loadManifests(): Record<string, Manifest> {
  const raw = import.meta.glob(
    ["/src/examples/*/example.json", "/src/examples/*/example.jsonc"],
    { query: "?raw", import: "default", eager: true },
  ) as Record<string, string>;

  const byDir: Record<string, Manifest> = {};
  for (const [path, text] of Object.entries(raw)) {
    const dir = path.split("/").at(-2)!;
    if (byDir[dir]) {
      throw new Error(
        `${dir} has both example.json and example.jsonc — pick one`,
      );
    }
    byDir[dir] = parse(text);
  }
  return byDir;
}
