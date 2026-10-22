/**
 * Examples from the reader's own account. An input with `exampleFrom` (e.g.
 * "your newest library entry") is filled by a read-only lookup once the
 * reader has a token.
 *
 * Every explorer on a page shares one client and one cache: a dozen library
 * explorers ask for "your newest library entry" once, and lookups made at the
 * same moment go out as a single batched request.
 */
import { HardcoverClient } from "@hardcover/sdk";
import { readUserId, writeUserId } from "@/components/GraphQLExplorer/lib/credentials";
import { URLS } from "@/Consts";
import type { Param } from "./catalog";

export interface Lookup {
  method: string;
  args: unknown[];
  /** A dot path into the result; `*` maps over an array; empty takes the whole result. */
  pick: string;
}

// The reader's newest library entry, for "$entry".
const NEWEST_ENTRY: Lookup = { method: "library.list", args: [{ limit: 1 }], pick: "items.0.id" };

let shared: { token: string; client: HardcoverClient } | null = null;
const cache = new Map<string, Promise<unknown>>();

function clientFor(token: string): HardcoverClient {
  if (shared?.token !== token) {
    shared = {
      token,
      client: new HardcoverClient({ token, endpoint: URLS.GRAPHQL_URL, userAgent: "hardcover-docs-sdk-explorer", batch: true }),
    };
    cache.clear();
  }

  return shared.client;
}

/**
 * Asks who the token belongs to and stores the id beside it, as the GraphQL
 * explorer does. Call after saving a new token; returns the id, or null when
 * the token can't read it.
 */
export async function rememberViewer(token: string): Promise<number | null> {
  try {
    const id = await clientFor(token).me.id();
    writeUserId(String(id));
    return id;
  } catch {
    return null;
  }
}

// The stored id when there is one, else ask once.
async function viewerId(token: string): Promise<number | null> {
  const stored = Number(readUserId());
  if (Number.isInteger(stored) && stored > 0) return stored;

  return rememberViewer(token);
}

/**
 * An example from the reader's account, as form text, or undefined when the
 * account has nothing to offer (no goals yet, say) or the lookup fails.
 * `values` are the form's current values, for "$<input>" arguments.
 */
export async function lookupExample(lookup: Lookup, token: string, values: Record<string, unknown>): Promise<string | undefined> {
  try {
    if (lookup.method === "me.id") return String((await viewerId(token)) ?? "") || undefined;

    const args = await Promise.all(lookup.args.map((arg) => resolveArg(arg, token, values)));
    if (args.some((arg) => arg === undefined)) return undefined;

    const result = await run(lookup.method, args, token);
    const picked = pick(result, lookup.pick);

    if (picked === undefined || picked === null) return undefined;
    return Array.isArray(picked) ? picked.join("\n") : String(picked);
  } catch {
    // An example is a convenience; the field stays empty and its hint explains.
    return undefined;
  }
}

async function resolveArg(arg: unknown, token: string, values: Record<string, unknown>): Promise<unknown> {
  if (typeof arg !== "string" || !arg.startsWith("$")) return arg;

  if (arg === "$me") return (await viewerId(token)) ?? undefined;
  if (arg === "$entry") return Number(await lookupExample(NEWEST_ENTRY, token, values)) || undefined;

  // Another input's current value.
  const value = values[arg.slice(1)];
  return typeof value === "string" && value.trim() ? Number(value) || value : undefined;
}

// One cached call per method and arguments, per page.
function run(method: string, args: unknown[], token: string): Promise<unknown> {
  const key = `${method}(${JSON.stringify(args)})`;

  if (!cache.has(key)) {
    const [resourceName, methodName] = method.split(".");
    const client = clientFor(token) as unknown as Record<string, Record<string, (...a: unknown[]) => Promise<unknown>>>;
    const resource = client[resourceName!]!;

    cache.set(key, resource[methodName!]!.call(resource, ...args));
  }

  return cache.get(key)!;
}

/** "items.0.id" or "listBooks.*.id" from a result. */
export function pick(value: unknown, path: string): unknown {
  if (!path) return value;

  const [head, ...rest] = path.split(".");
  const next = rest.join(".");

  if (head === "*") return Array.isArray(value) ? value.map((item) => pick(item, next)) : undefined;
  if (value === null || typeof value !== "object") return undefined;

  return pick((value as Record<string, unknown>)[head!], next);
}

/** The inputs that can be looked up, with their form paths, in call order. */
export function lookupInputs(params: Param[], prefix = ""): { path: string; lookup: Lookup }[] {
  return params.flatMap((param) => {
    const path = prefix + param.name;

    if (param.kind === "options") return lookupInputs(param.fields ?? [], `${path}.`);
    return param.exampleFrom ? [{ path, lookup: param.exampleFrom }] : [];
  });
}
