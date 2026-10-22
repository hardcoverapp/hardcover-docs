/**
 * The SDK method catalogs: every method, its inputs, examples and whether it
 * changes data. Each is the SDK repo's shared/catalog.json as of a minor
 * version (catalogs/0.1.json), copied by `npm run sync:sdk-catalog`, so each
 * version's pages describe exactly what that version does.
 */

/** One input: a positional parameter, or a field inside an options object. */
export interface Param {
  name: string;
  kind: ParamKind;
  label: string;
  required?: boolean;
  example?: unknown;
  hint?: string;

  /** kind "enum": the SDK enum's name, e.g. "UserBookStatus". */
  enum?: string;

  /** kind "literal": the allowed strings; kind "enum": the members allowed, when not all are. */
  values?: string[];

  /** An empty value is passed as null (e.g. clearing a rating) rather than left out. */
  nullable?: boolean;

  /** With a token, look up an example in the reader's own account (it wins over `example`). */
  exampleFrom?: import("./lookup").Lookup;

  /** kind "lines": what each line is. */
  itemKind?: "number" | "text";

  /** kind "options": the fields inside the options object. */
  fields?: Param[];
}

export type ParamKind =
  | "number"
  | "text"
  | "longText"
  | "lines"
  | "date"
  | "datetime"
  | "boolean"
  | "enum"
  | "literal"
  | "options"
  | "json"
  | "period";

export interface Method {
  name: string;
  summary: string;
  scopes: string[];
  writes: boolean;
  destructive?: boolean;
  returns?: string;
  params: Param[];
}

export interface Resource {
  name: string;
  summary: string;
  methods: Method[];

  /** "function": each method is a function from `module`, called with the client first (stats). Otherwise a client property, hc.<name>. */
  call?: "function";
  module?: string;
}

const files = import.meta.glob<{ resources: Resource[] }>("../catalogs/*.json", { eager: true, import: "default" });

/** Each documented minor version ("0.1") and its resources. */
export const catalogs: Record<string, Resource[]> = Object.fromEntries(
  Object.entries(files).map(([path, data]) => [path.replace(/^.*\/(.+)\.json$/, "$1"), data.resources]),
);

/** Minor versions, newest first. */
export const versions = Object.keys(catalogs).sort(byVersion).reverse();
export const latestVersion = versions[0]!;

/** The newest version's resources. */
export const resources = catalogs[latestVersion]!;

/** "library.add" → its resource and method in that version (the newest by default), or undefined. */
export function findMethod(id: string, version = latestVersion): { resource: Resource; method: Method } | undefined {
  const [resourceName, methodName] = id.split(".");

  const resource = catalogs[version]?.find((r) => r.name === resourceName);
  const method = resource?.methods.find((m) => m.name === methodName);

  return resource && method ? { resource, method } : undefined;
}

function byVersion(a: string, b: string): number {
  const [aMajor = 0, aMinor = 0] = a.split(".").map(Number);
  const [bMajor = 0, bMinor = 0] = b.split(".").map(Number);
  return aMajor - bMajor || aMinor - bMinor;
}
