/**
 * Running a call with the real SDK and recording what it sent.
 *
 * Reads run against the API with the reader's token. Writes are previewed:
 * any reads the method needs first (such as looking up who you are) still go
 * out, and the first write is recorded and stopped, so nothing changes on the
 * reader's account.
 */
import * as sdk from "@hardcover/sdk";
import { fetchTransport, HardcoverClient, HardcoverError, type HttpRequest, type RateLimitState } from "@hardcover/sdk";
import * as statsModule from "@hardcover/sdk/stats";
import { URLS } from "@/Consts";
import type { Arg, PeriodInput } from "./args";
import type { Resource } from "./catalog";

/** One request the SDK made (or, in a preview, would have made). */
export interface SentRequest {
  /** Operation names; more than one when the SDK batched reads into one request. */
  operations: string[];
  kind: "read" | "write";
  variables: unknown[];
  /** False for the write a preview stopped before sending. */
  sent: boolean;
  status?: number;
}

export interface Outcome {
  mode: "run" | "preview";
  /** The method's return value (runs only). */
  result?: unknown;
  error?: { name: string; message: string; fields: Record<string, unknown> };
  requests: SentRequest[];
  rateLimit?: RateLimitState;
}

// Thrown by the preview transport at the first write; never escapes `call`.
class StopBeforeWrite extends Error {}

// Function resources by module (stats today): their exports, called with the client first.
const MODULES: Record<string, Record<string, unknown>> = {
  "@hardcover/sdk/stats": statsModule as unknown as Record<string, unknown>,
};

const periods = statsModule.period;

export async function call(options: {
  resource: Resource;
  method: string;
  args: Arg[];
  token: string;
  preview: boolean;
}): Promise<Outcome> {
  const { resource, method, args, token, preview } = options;
  const requests: SentRequest[] = [];
  const network = fetchTransport();

  const client = new HardcoverClient({
    token,
    endpoint: URLS.GRAPHQL_URL,
    userAgent: "hardcover-docs-sdk-explorer",
    transport: {
      async send(request) {
        const record = describe(request);
        requests.push(record);

        if (preview && record.kind === "write") {
          record.sent = false;
          throw new StopBeforeWrite();
        }

        const response = await network.send(request);
        record.status = response.status;
        return response;
      },
    },
  });

  const outcome: Outcome = { mode: preview ? "preview" : "run", requests };

  try {
    const values = args.map(toValue);
    const result = await invoke(client, resource, method, values);

    if (!preview) outcome.result = result;
  } catch (error) {
    if (!(error instanceof StopBeforeWrite)) outcome.error = describeError(error);
  }

  outcome.rateLimit = client.rateLimit;
  return outcome;
}

type Callable = (...args: unknown[]) => Promise<unknown>;

// hc.resource.method(...values), or module.method(hc, ...values) for a function resource.
function invoke(client: HardcoverClient, resource: Resource, method: string, values: unknown[]): Promise<unknown> {
  if (resource.call === "function") {
    const fn = MODULES[resource.module ?? ""]?.[method] as Callable | undefined;
    if (!fn) throw new Error(`${resource.module} has no ${method}`);
    return fn(client, ...values);
  }

  const property = (client as unknown as Record<string, Record<string, Callable>>)[resource.name];
  return property![method]!.call(property, ...values);
}

// What a request carries: one operation, or several batched into an array.
function describe(request: HttpRequest): SentRequest {
  const body = JSON.parse(request.body) as Item | Item[];
  const items = Array.isArray(body) ? body : [body];

  return {
    operations: items.map((item) => item.operationName ?? "(anonymous)"),
    kind: items.some((item) => /^\s*mutation\b/.test(item.query)) ? "write" : "read",
    variables: items.map((item) => item.variables ?? {}),
    sent: true,
  };
}

interface Item {
  query: string;
  operationName?: string;
  variables?: unknown;
}

// An argument description → the value the SDK takes.
function toValue(arg: Arg): unknown {
  switch (arg.kind) {
    case "number":
    case "string":
    case "boolean":
      return arg.value;
    case "date":
      return new Date(arg.value);
    case "enum":
      return (sdk as unknown as Record<string, Record<string, unknown>>)[arg.enum]?.[arg.key] ?? arg.key;
    case "array":
      return arg.items.map(toValue);
    case "object":
      return Object.fromEntries(arg.entries.map(([key, value]) => [key, toValue(value)]));
    case "json":
      return arg.value;
    case "period":
      return toPeriod(arg.period);
    case "null":
      return null;
    case "absent":
      return undefined;
  }
}

function toPeriod(period: PeriodInput) {
  switch (period.kind) {
    case "life":
      return periods.life();
    case "year":
      return periods.year(period.year);
    case "month":
      return periods.month(period.year, period.month);
    case "custom":
      return periods.custom(period.from, period.to);
  }
}

// An error's name, message and its own fields (missingScopes, retryAfterSeconds…).
function describeError(error: unknown): Outcome["error"] {
  if (!(error instanceof Error)) return { name: "Error", message: String(error), fields: {} };

  const fields: Record<string, unknown> = {};
  if (error instanceof HardcoverError) {
    for (const [key, value] of Object.entries(error)) {
      if (value !== undefined && key !== "cause") fields[key] = value;
    }
  }

  return { name: error.name, message: error.message, fields };
}
