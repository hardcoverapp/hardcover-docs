import { loadLanguages } from "./loadLanguages";
import { loadManifests } from "./loadManifests";

export interface Issue {
  severity: "error" | "warning";
  message: string;
}

export function validateExamples(): Issue[] {
  // Both loaders throw on a structural problem (e.g. a directory with both
  // example.json and example.jsonc). Caught here and reported as a normal
  // Issue instead of an unhandled exception, so it shows up in the same
  // formatted build-log output as everything else.
  let languages: Record<string, { label: string; lang: string }>;
  let manifests: ReturnType<typeof loadManifests>;
  try {
    languages = loadLanguages();
    manifests = loadManifests();
  } catch (e) {
    return [{ severity: "error", message: (e as Error).message }];
  }

  // Group every non-manifest file under src/examples/*/ by directory, so
  // "file exists on disk but isn't listed anywhere" can be checked below.
  const rawFilePaths = Object.keys(
    import.meta.glob("/src/examples/*/*", { eager: true }),
  );
  const filesByDir = new Map<string, string[]>();
  for (const path of rawFilePaths) {
    const dir = path.split("/").at(-2)!;
    const file = path.split("/").at(-1)!;
    if (file === "example.json" || file === "example.jsonc") continue;

    (filesByDir.get(dir) ?? filesByDir.set(dir, []).get(dir)!).push(file);
  }

  const issues: Issue[] = [];
  for (const [dir, manifest] of Object.entries(manifests)) {
    const onDisk = filesByDir.get(dir) ?? [];
    const seen = new Map<string, string>(); // file -> group label, to catch duplicates

    // Normalize both shapes to the same [groupLabel, entries][] form, so the
    // rest of the checks don't care which one this directory uses.
    const groupedEntries =
      "items" in manifest
        ? [["items", manifest.items] as const]
        : Object.entries(manifest.groups);

    for (const [groupLabel, entries] of groupedEntries) {
      for (const entry of entries) {
        const { file } = entry;
        // Inline entries ({ label, lang, file }) skip this check entirely,
        // there's no registry key to be unknown.
        if ("key" in entry && !languages[entry.key]) {
          issues.push({
            severity: "error",
            message: `${dir}/example.json (${groupLabel}): unknown language key "${entry.key}"`,
          });
        }
        if (!onDisk.includes(file)) {
          issues.push({
            severity: "error",
            message: `${dir}/example.json (${groupLabel}): file "${file}" does not exist`,
          });
        }
        if (seen.has(file)) {
          issues.push({
            severity: "error",
            message: `${dir}/${file} is listed in both "${seen.get(file)}" and "${groupLabel}"`,
          });
        }
        seen.set(file, groupLabel);
      }
    }

    for (const file of onDisk) {
      if (!seen.has(file)) {
        issues.push({
          severity: "error",
          message: `${dir}/${file} exists but is not listed in example.json(c)`,
        });
      }
    }
  }
  return issues;
}
