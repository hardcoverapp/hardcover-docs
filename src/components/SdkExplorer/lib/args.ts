/**
 * Form values → the SDK call's arguments, following the catalog's rule:
 * params in call order; an options object holds only the fields you set;
 * enum keys become the SDK's enum values.
 *
 * The same structure feeds both running the call and writing its code, so
 * the snippet always matches what ran.
 */
import type { Method, Param } from "./catalog";

/** What the form holds: text per input (checkboxes as booleans), keyed by path ("bookId", "options.status"). */
export type Values = Record<string, string | boolean | undefined>;

/** A neutral description of one argument, before it's either run or printed as code. */
export type Arg =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "boolean"; value: boolean }
  | { kind: "date"; value: string }
  | { kind: "enum"; enum: string; key: string }
  | { kind: "array"; items: Arg[] }
  | { kind: "object"; entries: [string, Arg][] }
  | { kind: "json"; value: unknown }
  | { kind: "period"; period: PeriodInput }
  | { kind: "null" }
  | { kind: "absent" };

export type PeriodInput =
  | { kind: "life" }
  | { kind: "year"; year: number }
  | { kind: "month"; year: number; month: number }
  | { kind: "custom"; from: string; to: string };

/** An input that can't be used as given; `path` names the field so the form can point at it. */
export class InputError extends Error {
  readonly path: string;

  constructor(path: string, message: string) {
    super(message);
    this.path = path;
  }
}

/** The starting values: each input's example, as text. */
export function exampleValues(method: Method): Values {
  const values: Values = {};

  const fill = (params: Param[], prefix: string) => {
    for (const param of params) {
      const path = prefix + param.name;

      if (param.kind === "options") fill(param.fields ?? [], `${path}.`);
      else if (param.kind === "period") Object.assign(values, periodExample(path, param.example));
      else if (param.example !== undefined) values[path] = toText(param);
    }
  };

  fill(method.params, "");
  return values;
}

/** The call's arguments, in order. Trailing absent arguments are dropped. */
export function buildArgs(method: Method, values: Values): Arg[] {
  const args = method.params.map((param) => toArg(param, param.name, values));

  while (args.length && args[args.length - 1]!.kind === "absent") args.pop();

  return args;
}

function toArg(param: Param, path: string, values: Values): Arg {
  if (param.kind === "options") {
    const entries = (param.fields ?? [])
      .map((field) => [field.name, toArg(field, `${path}.${field.name}`, values)] as [string, Arg])
      .filter(([, arg]) => arg.kind !== "absent");

    // An empty optional options object is left out; a required one is passed empty.
    return entries.length || param.required ? { kind: "object", entries } : { kind: "absent" };
  }

  if (param.kind === "period") return { kind: "period", period: readPeriod(path, values) };

  const raw = values[path];

  // A required boolean is a checkbox; an optional one can also be left unset.
  if (param.kind === "boolean") {
    if (raw === true || raw === "true") return { kind: "boolean", value: true };
    if (raw === "false" || param.required) return { kind: "boolean", value: false };
    return { kind: "absent" };
  }

  const text = typeof raw === "string" ? raw.trim() : "";

  if (!text) {
    if (param.nullable) return { kind: "null" };
    if (param.required) throw new InputError(path, `${param.label} is required.`);
    return { kind: "absent" };
  }

  switch (param.kind) {
    case "number":
      return { kind: "number", value: readNumber(path, param.label, text) };

    case "date":
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new InputError(path, `${param.label} must be a date like 2025-03-01.`);
      return { kind: "string", value: text };

    case "datetime":
      if (Number.isNaN(new Date(text).getTime())) throw new InputError(path, `${param.label} must be a date and time.`);
      return { kind: "date", value: new Date(text).toISOString() };

    case "enum":
      return { kind: "enum", enum: param.enum!, key: text };

    case "lines": {
      const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
      const items: Arg[] = lines.map((line) =>
        param.itemKind === "number" ? { kind: "number", value: readNumber(path, param.label, line) } : { kind: "string", value: line },
      );
      return { kind: "array", items };
    }

    case "json":
      try {
        return { kind: "json", value: JSON.parse(text) };
      } catch {
        throw new InputError(path, `${param.label} isn't valid JSON.`);
      }

    default:
      return { kind: "string", value: text };
  }
}

function readNumber(path: string, label: string, text: string): number {
  const value = Number(text);
  if (!Number.isFinite(value)) throw new InputError(path, `${label} must be a number.`);
  return value;
}

// A period is edited as four inputs: kind, then year/month or from/to.
function readPeriod(path: string, values: Values): PeriodInput {
  const kind = String(values[`${path}.kind`] ?? "year");
  const year = Number(values[`${path}.year`]);

  if (kind === "life") return { kind };
  if (kind === "custom") {
    const from = String(values[`${path}.from`] ?? "");
    const to = String(values[`${path}.to`] ?? "");
    if (!from || !to) throw new InputError(`${path}.from`, "A custom range needs both dates.");
    return { kind, from, to };
  }

  if (!Number.isInteger(year)) throw new InputError(`${path}.year`, "Year must be a whole number.");
  if (kind === "month") return { kind, year, month: Number(values[`${path}.month`] ?? 1) };

  return { kind: "year", year };
}

function periodExample(path: string, example: unknown): Values {
  const year = new Date().getFullYear();
  const given = (example && typeof example === "object" ? example : {}) as Record<string, unknown>;

  return {
    [`${path}.kind`]: String(given.kind ?? "year"),
    [`${path}.year`]: String(given.year ?? year),
    [`${path}.month`]: String(given.month ?? 1),
    [`${path}.from`]: String(given.from ?? `${year}-01-01`),
    [`${path}.to`]: String(given.to ?? `${year}-12-31`),
  };
}

// An example as the text a form field shows.
function toText(param: Param): string | boolean {
  const example = param.example;

  if (param.kind === "boolean") return param.required ? Boolean(example) : String(Boolean(example));
  if (param.kind === "json") return JSON.stringify(example, null, 2);
  if (Array.isArray(example)) return example.join("\n");

  return String(example);
}
