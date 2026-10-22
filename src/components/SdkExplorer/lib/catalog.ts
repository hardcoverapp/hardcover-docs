/**
 * The SDK method catalog: every method, its inputs, examples and whether it
 * changes data. It's the SDK repo's shared/catalog.json, copied here by
 * `npm run sync:sdk-catalog`, so the explorer describes exactly what the SDK
 * does.
 */
import data from "../catalog.json";

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

export const resources = (data as unknown as { resources: Resource[] }).resources;

/** "library.add" → its resource and method, or undefined. */
export function findMethod(id: string): { resource: Resource; method: Method } | undefined {
  const [resourceName, methodName] = id.split(".");

  const resource = resources.find((r) => r.name === resourceName);
  const method = resource?.methods.find((m) => m.name === methodName);

  return resource && method ? { resource, method } : undefined;
}
