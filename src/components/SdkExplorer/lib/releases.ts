// Which release each documented SDK version is at, and whether it's a
// pre-release. releases.json is written by `npm run sync:sdk-catalog` from the
// SDK's package.json: { "typescript": { "0.1": "0.1.0" } }.
import releases from "../releases.json";

/** A 0.x release, or one with a tag (1.0.0-beta.2, 2.0.0-rc.1). */
export function isPrerelease(release: string): boolean {
  return release.startsWith("0.") || release.includes("-");
}

const byLanguage = releases as Record<string, Record<string, string>>;

/** The release synced for a documented version ("0.1" → "0.1.0"), if any. */
export function releaseOf(language: string, version: string): string | undefined {
  return byLanguage[language]?.[version];
}

/** A language's newest documented release ("0.1.0"), or undefined when it has none yet. */
export function latestRelease(language: string): string | undefined {
  const versions = Object.keys(byLanguage[language] ?? {}).sort((a, b) => {
    const [aMajor = 0, aMinor = 0] = a.split(".").map(Number);
    const [bMajor = 0, bMinor = 0] = b.split(".").map(Number);
    return bMajor - aMajor || bMinor - aMinor;
  });

  return versions[0] ? releaseOf(language, versions[0]) : undefined;
}

/**
 * How a pre-release version is named in banners and badges ("0.1.x", or the
 * tagged release itself, "1.0.0-beta.2"), or undefined for a stable one.
 */
export function prereleaseLabel(language: string, version: string): string | undefined {
  const release = releaseOf(language, version) ?? `${version}.0`;
  if (!isPrerelease(release)) return undefined;

  return release.includes("-") ? release : `${version}.x`;
}
