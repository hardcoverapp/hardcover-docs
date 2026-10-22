/**
 * The TypeScript a reader would write to make the same call: imports, the
 * client, and the call itself, from the same arguments the explorer runs.
 */
import type { Arg, PeriodInput } from "./args";
import type { Resource } from "./catalog";

export interface Snippet {
  /** The whole file, ready to copy. */
  code: string;
}

const INDENT = "  ";

/**
 * Code for `hc.resource.method(...args)`, or for a function resource (stats)
 * `method(hc, ...args)` imported from its module.
 */
export function snippet(resource: Resource, method: string, args: Arg[]): Snippet {
  const enums = new Set<string>();
  collectEnums(args, enums);

  const isFunction = resource.call === "function";
  const sdkImports = ["HardcoverClient", ...[...enums].sort()];

  const lines = [`import { ${sdkImports.join(", ")} } from "@hardcover/sdk";`];
  if (isFunction) {
    const helpers = usesPeriod(args) ? ["period", method] : [method];
    lines.push(`import { ${helpers.sort().join(", ")} } from "${resource.module}";`);
  }

  lines.push(
    "",
    "// A personal access token from hardcover.app → Account → API Access.",
    "// Apps that sign people in pass `auth: session` instead (see OAuth).",
    "const hc = new HardcoverClient({ token: process.env.HARDCOVER_TOKEN });",
    "",
  );

  const callee = isFunction ? method : `hc.${resource.name}.${method}`;
  const leading = isFunction ? ["hc"] : [];
  lines.push(`const result = await ${callee}(${printArgs(callee, args, leading)});`);

  return { code: lines.join("\n") };
}

// Arguments as Prettier would lay them out: on one line when it fits; else a
// final object or array opens on the call line with its entries below it;
// else one argument per line.
const LINE = 80;

function printArgs(callee: string, args: Arg[], leading: string[]): string {
  const inline = [...leading, ...args.map((arg) => print(arg, 0))];
  const oneLine = `const result = await ${callee}(${inline.join(", ")});`;

  if (oneLine.length <= LINE && !oneLine.includes("\n")) return inline.join(", ");

  const last = args[args.length - 1];
  if (last && (last.kind === "object" || last.kind === "array" || last.kind === "json")) {
    const before = inline.slice(0, -1);
    return [...before, print(last, 0, true)].join(", ");
  }

  return `\n${inline.map((arg) => `${INDENT}${arg},`).join("\n")}\n`;
}

function usesPeriod(args: Arg[]): boolean {
  return args.some((arg) => arg.kind === "period");
}

function collectEnums(args: Arg[], into: Set<string>): void {
  for (const arg of args) {
    if (arg.kind === "enum") into.add(arg.enum);
    if (arg.kind === "array") collectEnums(arg.items, into);
    if (arg.kind === "object") collectEnums(arg.entries.map(([, value]) => value), into);
  }
}

function print(arg: Arg, depth: number, expand = false): string {
  switch (arg.kind) {
    case "number":
    case "boolean":
      return String(arg.value);
    case "string":
      return JSON.stringify(arg.value);
    case "date":
      return `new Date(${JSON.stringify(arg.value)})`;
    case "enum":
      return `${arg.enum}.${arg.key}`;
    case "null":
      return "null";
    case "absent":
      return "undefined";
    case "period":
      return printPeriod(arg.period);
    case "array":
      return printList(arg.items.map((item) => print(item, depth + 1)), "[", "]", depth, false, expand);
    case "object":
      return printList(arg.entries.map(([key, value]) => `${key}: ${print(value, depth + 1)}`), "{", "}", depth, true, expand);
    case "json":
      return printJson(arg.value, depth, expand);
  }
}

function printPeriod(period: PeriodInput): string {
  switch (period.kind) {
    case "life":
      return "period.life()";
    case "year":
      return `period.year(${period.year})`;
    case "month":
      return `period.month(${period.year}, ${period.month})`;
    case "custom":
      return `period.custom(${JSON.stringify(period.from)}, ${JSON.stringify(period.to)})`;
  }
}

// Short lists stay on one line; longer ones break, one item per line.
function printList(items: string[], open: string, close: string, depth: number, spaced = false, expand = false): string {
  if (items.length === 0) return `${open}${close}`;

  const oneLine = spaced ? `${open} ${items.join(", ")} ${close}` : `${open}${items.join(", ")}${close}`;
  if (!expand && oneLine.length <= 60 && !oneLine.includes("\n")) return oneLine;

  const inner = INDENT.repeat(depth + 1);
  return `${open}\n${items.map((item) => `${inner}${item},`).join("\n")}\n${INDENT.repeat(depth)}${close}`;
}

// JSON as a JavaScript literal: keys unquoted when they're plain identifiers.
function printJson(value: unknown, depth: number, expand = false): string {
  if (Array.isArray(value)) return printList(value.map((item) => printJson(item, depth + 1)), "[", "]", depth, false, expand);

  if (value && typeof value === "object") {
    const entries = Object.entries(value).map(([key, inner]) => {
      const name = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
      return `${name}: ${printJson(inner, depth + 1)}`;
    });
    return printList(entries, "{", "}", depth, true, expand);
  }

  return JSON.stringify(value);
}
