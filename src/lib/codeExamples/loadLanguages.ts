import { parse } from "jsonc-parser";

export function loadLanguages(): Record<
  string,
  { label: string; lang: string }
> {
  const raw = import.meta.glob(
    ["/src/examples/languages.json", "/src/examples/languages.jsonc"],
    { query: "?raw", import: "default", eager: true },
  ) as Record<string, string>;
  const paths = Object.keys(raw);
  if (paths.length !== 1) {
    throw new Error("Expected exactly one of src/examples/languages.json(c)");
  }
  return parse(raw[paths[0]]);
}
