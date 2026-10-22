// The SDK languages and what each supports, from the SDK repo's languages.json
// (the source of its README matrix), shaped for readers: each resource's read
// and write rows become one row, and rows only SDK contributors need are left out.
import data from "../languages.json";
import { isPrerelease, latestRelease } from "./releases";

export type Status = "done" | "partial" | "planned" | "n/a";

interface Feature {
  id: string;
  group: string;
  label: string;
}

export interface Language {
  id: string;
  name: string;
  package: string;
  support: Record<string, Status>;
}

export interface MatrixRow {
  key: string;
  label: string;
  status: Record<string, Status>;
}

export interface MatrixGroup {
  name: string;
  rows: MatrixRow[];
}

const features = data.features as Feature[];
export const languages = data.languages as Language[];

// How the SDK is built and tested, not what it does for an app.
const CONTRIBUTOR_ONLY = new Set(["codegen", "test-conformance", "test-contract", "test-live-read", "test-live-write"]);

// The matrix's groups, by what an app does with them. Read and write halves
// share a key ("res-library"). A feature that isn't placed in a group (and isn't
// contributor-only) fails the tests, so a new SDK feature can't go missing here.
export const GROUPS: { name: string; keys: string[] }[] = [
  { name: "Connecting", keys: ["transport", "errors", "action-envelopes", "rate-limit"] },
  { name: "Signing in", keys: ["auth-pat", "auth-pkce", "auth-device", "auth-refresh"] },
  { name: "A reader's books", keys: ["res-library", "res-reads", "res-journal", "res-lists", "res-goals", "stats"] },
  { name: "Vibes and prompts", keys: ["res-vibes", "res-prompts"] },
  { name: "The catalog", keys: ["res-books", "res-authors", "res-series", "res-search"] },
  { name: "People and activity", keys: ["res-me", "res-users", "res-social", "res-notifications"] },
  { name: "Testing your app", keys: ["test-mock"] },
  { name: "Where it runs", keys: ["rt-web", "rt-react-native"] },
  { name: "Availability", keys: ["published"] },
];

// What's missing from a partial cell, by row key and language. Only partial
// cells may have one (the tests check), so a note goes when the cell turns done.
export const PARTIAL_NOTES: Record<string, Record<string, string>> = {
  "test-mock": {
    typescript: "`MockTransport` is ready. Recorded API responses to test against come later.",
  },
  "rt-web": {
    typescript: "Fully tested on Node, and runs in the browser in these docs. The published package gets its own browser check when the docs switch to it.",
  },
  "rt-react-native": {
    typescript: "Runs on React Native's Hermes engine in every test run. Not yet tried in an app on a device.",
  },
};

// Labels written for the SDK repo that read better here.
const LABELS: Record<string, string> = {
  transport: "Any GraphQL query, with the client's auth, retries and errors",
  errors: "Typed errors, one per kind of failure",
  "action-envelopes": "Failed writes reported as errors, with the API's reason",
  "rate-limit": "Rate-limit pacing, backoff and request batching",
  "auth-refresh": "Token refresh and sign-out",
  "rt-web": "Node and browsers",
  "test-mock": "Mock transport and recorded responses",
  "rt-react-native": "React Native",
  published: "Published to its package registry",
};

/** Shorter names for the matrix's column headings, with a note under them. */
export const SHORT_NAMES: Record<string, { name: string; note: string }> = {
  jvm: { name: "Kotlin", note: "Java too" },
};

/** Where a language's docs start, once it has them. */
export const DOCS: Record<string, string> = {
  typescript: "/sdk/typescript/",
};

// A read and a write half shown as one row: done only when both are.
function combine(a: Status, b: Status): Status {
  if (a === b) return a;
  if ([a, b].some((status) => status === "done" || status === "partial")) return "partial";
  return "planned";
}

/** Every feature as one row per key, read and write halves merged. */
export function rows(): Map<string, MatrixRow> {
  const byKey = new Map<string, MatrixRow>();

  for (const feature of features) {
    if (CONTRIBUTOR_ONLY.has(feature.id)) continue;

    // "res-library-read" and "res-library-write" share the row "res-library".
    const half = feature.id.match(/^(.*)-(read|write)$/);
    const key = half ? half[1]! : feature.id;

    // Read-only resources say "(read)" in the SDK repo; here every row is what you can do.
    const label = (half ? feature.label.replace(/: (read|write).*$/, "") : (LABELS[feature.id] ?? feature.label)).replace(/ \(read\)$/, "");

    const status = Object.fromEntries(languages.map((language) => [language.id, language.support[feature.id] ?? "planned"]));
    const existing = byKey.get(key);

    if (existing) {
      for (const language of languages) existing.status[language.id] = combine(existing.status[language.id]!, status[language.id]!);
    } else {
      byKey.set(key, { key, label, status });
    }
  }

  return byKey;
}

/** The rows in their reader-facing groups. */
export function matrix(): MatrixGroup[] {
  const byKey = rows();

  return GROUPS.map((group) => ({
    name: group.name,
    rows: group.keys.flatMap((key) => byKey.get(key) ?? []),
  }));
}

/** "Pre-release (0.1.0)", "Released (1.2.0)" or "Planned". */
export function languageStatus(language: Language): string {
  const release = latestRelease(language.id);
  if (!release) return "Planned";

  return isPrerelease(release) ? `Pre-release (${release})` : `Released (${release})`;
}

/** The package name without its registry note: "@hardcover/sdk (npm)" → "@hardcover/sdk", "TBD (PyPI)" → undefined. */
export function packageName(language: Language): string | undefined {
  const name = language.package.replace(/\s*\(.*\)$/, "");
  return name && name !== "TBD" ? name : undefined;
}
