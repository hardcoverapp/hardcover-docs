// Which release each documented SDK version is at, and whether it's a
// pre-release. releases.json is written by `npm run sync:sdk-catalog` from the
// SDK's package.json: { "typescript": { "0.1": "0.1.0" } }.
import releases from "../releases.json";

/** A 0.x release, or one with a tag (1.0.0-beta.2, 2.0.0-rc.1). */
export function isPrerelease(release: string): boolean {
  return release.startsWith("0.") || release.includes("-");
}

/** The release synced for a documented version ("0.1" → "0.1.0"), if any. */
export function releaseOf(language: string, version: string): string | undefined {
  return (releases as Record<string, Record<string, string>>)[language]?.[version];
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
