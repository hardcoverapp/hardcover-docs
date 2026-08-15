import { loadLanguages } from "./loadLanguages";
import type { Entry } from "./loadManifests";

const languages = loadLanguages();

export function resolveMeta(
  entry: Entry,
  context: string,
): { label: string; lang: string } {
  if ("key" in entry) {
    const meta = languages[entry.key];
    if (!meta)
      throw new Error(`Unknown language key "${entry.key}" (${context})`);
    return meta;
  }
  return { label: entry.label, lang: entry.lang };
}
