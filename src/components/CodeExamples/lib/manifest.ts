import { loadLanguages, type Entry, type Manifest } from "./loaders";

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

// null represents the flat "items" shape -- no named group. Callers map it
// to whatever local convention they need ('items' for messages, undefined
// for a URL fragment/heading, etc.) since a falsy check (`groupLabel ||
// undefined`, `groupLabel && <h2>`) already treats null the same as ''.
export function toGroupList(manifest: Manifest): [string | null, Entry[]][] {
  return "items" in manifest
    ? [[null, manifest.items]]
    : Object.entries(manifest.groups);
}

export function getGroupEntries(
  manifest: Manifest,
  dir: string,
  group?: string,
): Entry[] {
  if ("items" in manifest) {
    if (group) {
      throw new Error(
        `${dir}/example.json uses flat "items" (no groups) -- remove group="${group}"`,
      );
    }
    return manifest.items;
  }

  if (!group) {
    throw new Error(
      `${dir}/example.json defines groups -- pass group= explicitly (available: ${Object.keys(manifest.groups).join(", ")})`,
    );
  }

  const found = manifest.groups[group];
  if (!found) {
    throw new Error(
      `No group "${group}" in ${dir}/example.json (available: ${Object.keys(manifest.groups).join(", ")})`,
    );
  }

  return found;
}
