/** The newest release heading in a Keep a Changelog file: "## 0.1.1 - 2026-10-29". */
export function latestChangelogRelease(changelog: string): { version: string; date: Date } | undefined {
  const match = changelog.match(/^## (\S+) - (\d{4}-\d{2}-\d{2})/m);
  return match ? { version: match[1], date: new Date(match[2]) } : undefined;
}
