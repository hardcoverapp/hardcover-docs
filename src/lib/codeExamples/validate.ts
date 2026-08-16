import { loadLanguages } from "./loadLanguages";
import { loadManifests } from "./loadManifests";
import { findDuplicateSectionNames } from "./codeSnippets";

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

  // Group every non-manifest file under src/examples/<dir>/ (any depth) by
  // its top-level example directory, so "file exists on disk but isn't
  // listed anywhere" can be checked below. Split on the *first* segment
  // after the root, not the last two.
  // a nested file like "mygo/cmd/main.go" has dir "mygo", file "cmd/main.go".
  const EXAMPLES_ROOT = "/src/examples/";
  const rawFiles = import.meta.glob("/src/examples/**/*", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;
  const filesByDir = new Map<string, string[]>();
  for (const path of Object.keys(rawFiles)) {
    const rel = path.slice(EXAMPLES_ROOT.length);
    const slash = rel.indexOf("/");
    if (slash === -1) continue; // stray file directly under src/examples/, e.g. languages.jsonc

    const dir = rel.slice(0, slash);
    const file = rel.slice(slash + 1);
    if (file === "example.json" || file === "example.jsonc") continue;

    (filesByDir.get(dir) ?? filesByDir.set(dir, []).get(dir)!).push(file);
  }

  const issues: Issue[] = [];
  for (const [dir, manifest] of Object.entries(manifests)) {
    const onDisk = filesByDir.get(dir) ?? [];
    const seen = new Map<string, string>(); // file -> group label ('files' for support files), to catch duplicates

    // Normalize both shapes to the same [groupLabel, entries][] form, so the
    // rest of the checks don't care which one this directory uses.
    const groupedEntries =
      "items" in manifest
        ? [["items", manifest.items] as const]
        : Object.entries(manifest.groups);

    for (const [groupLabel, entries] of groupedEntries) {
      if (entries.length === 0) {
        issues.push({
          severity: "error",
          message: `${dir}/example.json (${groupLabel}): empty -- must list at least one entry`,
        });
      }
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

        // Per-entry support files (entry.files) -- same existence/duplicate
        // checks as a regular entry file, tagged under this entry's key.
        const entryKey = "key" in entry ? entry.key : entry.label;
        for (const supportFile of entry.files ?? []) {
          if (!onDisk.includes(supportFile)) {
            issues.push({
              severity: "error",
              message: `${dir}/example.json (${groupLabel}): support file "${supportFile}" for "${entryKey}" does not exist`,
            });
          }
          if (seen.has(supportFile)) {
            issues.push({
              severity: "error",
              message: `${dir}/${supportFile} is listed in both "${seen.get(supportFile)}" and "${entryKey}"'s files`,
            });
          }
          seen.set(supportFile, `${entryKey}'s files`);
        }
      }
    }

    // Directory-wide support files (manifest.files) -- shared across every
    // entry regardless of language, e.g. a README.
    for (const file of manifest.files ?? []) {
      if (!onDisk.includes(file)) {
        issues.push({
          severity: "error",
          message: `${dir}/example.json: support file "${file}" does not exist`,
        });
      }
      if (seen.has(file)) {
        issues.push({
          severity: "error",
          message: `${dir}/${file} is listed in both "${seen.get(file)}" and "files"`,
        });
      }
      seen.set(file, "files");
    }

    for (const file of onDisk) {
      if (!seen.has(file)) {
        issues.push({
          severity: "error",
          message: `${dir}/${file} exists but is not listed in example.json(c)`,
        });
      }

      // extractSection always matches the first START/END pair for a name;
      // listSectionLines (used for the raw-file scroll-to-section highlight)
      // ends up with the last one instead -- so a repeated name means the
      // rendered snippet and the highlighted region point at different
      // places. Catch the repeat itself rather than let the two disagree.
      const content = rawFiles[`/src/examples/${dir}/${file}`];
      for (const name of findDuplicateSectionNames(content)) {
        issues.push({
          severity: "error",
          message: `${dir}/${file}: section "${name}" defined more than once`,
        });
      }
    }
  }
  return issues;
}
