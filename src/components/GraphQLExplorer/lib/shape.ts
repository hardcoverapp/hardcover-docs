/**
 * Reshaping GraphQL responses for display.
 *
 * Both result views need to turn nested response objects into flat, dotted
 * paths, and both previously carried their own copy of that walk — one in
 * `TableResults`, one in `ChartResults`, reachable only by rendering a React
 * component.
 *
 * The walk is shared. The leaf handling deliberately is not: the table flattens
 * *for display* and must render something readable in a cell, while the chart
 * flattens *to find plottable values* and must leave arrays and numbers intact.
 * Collapsing those into one function would change both behaviours.
 */

type Flat = Record<string, any>;

/** Own enumerable entries with the dotted path already built. */
function* pathEntries(obj: any, prefix: string): Generator<[string, string, any]> {
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    yield [key, prefix ? `${prefix}.${key}` : key, obj[key]];
  }
}

const isPlainObject = (value: any): boolean =>
  typeof value === "object" && value !== null && value.constructor === Object;

/**
 * Flatten to plottable value paths.
 *
 * Arrays are preserved rather than summarised, and any plain object is
 * recursed into regardless of how complex it is, so `book.stats.pages` remains
 * reachable as a numeric field.
 */
export const flattenPaths = (obj: any, prefix = ""): Flat => {
  const flattened: Flat = {};

  for (const [, path, value] of pathEntries(obj, prefix)) {
    if (value === null || value === undefined) {
      flattened[path] = value;
    } else if (Array.isArray(value)) {
      flattened[path] = value;
    } else if (typeof value === "object") {
      if (isPlainObject(value)) {
        Object.assign(flattened, flattenPaths(value, path));
      } else {
        flattened[path] = value;
      }
    } else {
      flattened[path] = value;
    }
  }

  return flattened;
};

/**
 * Flatten for tabular display.
 *
 * Arrays collapse to a readable summary, objects whose values are all
 * primitives are flattened one level into their own columns, and anything more
 * complex becomes a JSON preview rather than exploding the column count.
 */
export const flattenForDisplay = (obj: any, prefix = ""): Flat => {
  const flattened: Flat = {};

  for (const [, path, value] of pathEntries(obj, prefix)) {
    if (value === null || value === undefined) {
      flattened[path] = value;
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        flattened[path] = "";
      } else if (typeof value[0] === "object") {
        flattened[path] = `[${value.length} items]`;
      } else {
        flattened[path] = value.join(", ");
      }
    } else if (typeof value === "object") {
      const allPrimitive = Object.values(value).every(
        (nested) => nested === null || nested === undefined || typeof nested !== "object",
      );

      if (allPrimitive) {
        Object.assign(flattened, flattenForDisplay(value, path));
      } else {
        flattened[path] = JSON.stringify(value);
      }
    } else {
      flattened[path] = value;
    }
  }

  return flattened;
};

/**
 * Order rows by a date field, oldest first.
 *
 * A time axis must be plotted in time order. The API returns rows in query
 * order — usually newest first — so plotting them as-is draws the line zig-zag
 * through time and labels the axis backwards. Rows with an unparseable date
 * keep their relative position rather than being dropped.
 */
export const sortByDate = <T extends Record<string, any>>(rows: T[], field: string): T[] =>
  [...rows].sort((a, b) => {
    const left = new Date(a[field]).getTime();
    const right = new Date(b[field]).getTime();
    if (Number.isNaN(left) || Number.isNaN(right)) return 0;
    return left - right;
  });

/**
 * Keep rows within `days` of the newest row.
 *
 * The window is measured back from the newest point present, not from today, so
 * a dataset that stops months ago still shows its own last N days.
 *
 * The newest point is found with `Math.max`, not by reading the last element:
 * rows commonly arrive newest-first, so treating the final element as the
 * newest put the window boundary before every point and made the filter a
 * silent no-op.
 */
export const withinDaysOfNewest = <T extends Record<string, any>>(
  rows: T[],
  field: string,
  days: number,
): T[] => {
  const timestamps = rows
    .map((row) => new Date(row[field]).getTime())
    .filter((time) => !Number.isNaN(time));

  if (timestamps.length === 0) return rows;

  const start = new Date(Math.max(...timestamps));
  start.setDate(start.getDate() - days);
  const boundary = start.getTime();

  return rows.filter((row) => {
    const time = new Date(row[field]).getTime();
    // Undateable rows are kept rather than silently dropped.
    return Number.isNaN(time) || time >= boundary;
  });
};

export interface StatTile {
  /** Dotted path with the shared prefix removed. */
  key: string;
  label: string;
  value: number;
}

/** Upper bound before a wall of tiles stops being scannable and wants a table. */
const MAX_STAT_TILES = 12;

/**
 * Recognise a result that is a handful of headline numbers rather than a series.
 *
 * Hasura aggregates look like
 * `{lists_aggregate: {aggregate: {count, avg: {...}, max: {...}}}}` — a single
 * nested object with no array anywhere. There is nothing to plot: the values
 * are unrelated magnitudes (a count in the hundreds of thousands beside an
 * average below 1), so a shared axis would render all but the largest as
 * nothing. Stat tiles are the honest form.
 *
 * Returns null when the shape is anything else, so callers fall through to the
 * table and chart paths unchanged.
 */
export const extractStatTiles = (results: any): StatTile[] | null => {
  if (!results || typeof results !== "object" || Array.isArray(results)) return null;

  const flat = flattenPaths(results);
  const entries = Object.entries(flat);

  if (entries.length === 0) return null;

  // Any array means this is a series; leave it to the chart and table views.
  if (entries.some(([, value]) => Array.isArray(value))) return null;

  const numeric = entries.filter(
    ([, value]) => typeof value === "number" && Number.isFinite(value),
  );

  if (numeric.length === 0 || numeric.length > MAX_STAT_TILES) return null;

  // Every value must be a number; a mix of numbers and strings is record-shaped
  // data that reads better as a single-row table.
  if (numeric.length !== entries.length) return null;

  const prefix = commonPathPrefix(numeric.map(([path]) => path));

  return numeric.map(([path, value]) => {
    const key = path.slice(prefix.length);
    return { key, label: formatFieldLabel(key), value: value as number };
  });
};

/** The shared leading path segments, including the trailing dot. */
const commonPathPrefix = (paths: string[]): string => {
  if (paths.length === 0) return "";

  const segmentLists = paths.map((path) => path.split("."));
  const shortest = Math.min(...segmentLists.map((segments) => segments.length));

  const shared: string[] = [];
  for (let index = 0; index < shortest - 1; index++) {
    const segment = segmentLists[0][index];
    if (segmentLists.every((segments) => segments[index] === segment)) {
      shared.push(segment);
    } else {
      break;
    }
  }

  return shared.length > 0 ? `${shared.join(".")}.` : "";
};

/**
 * Render a statistic for display.
 *
 * Integers get thousands separators; fractions get enough precision to stay
 * meaningful without printing the full float (`0.013841283131426777`).
 */
export const formatStatValue = (value: number): string => {
  if (Number.isInteger(value)) return value.toLocaleString();

  const magnitude = Math.abs(value);
  if (magnitude >= 100) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (magnitude >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return value.toLocaleString(undefined, { maximumSignificantDigits: 3 });
};

/** Render a flattened value as table cell text. */
export const formatCellValue = (value: any): string => {
  if (value === null) return "null";
  if (value === undefined) return "";
  if (typeof value === "boolean") return value.toString();
  if (typeof value === "string" && value.startsWith("[") && value.endsWith(" items]")) {
    return value;
  }
  if (typeof value === "string" && value.length > 100) {
    return `${value.substring(0, 100)}...`;
  }
  return String(value);
};

/**
 * Segments that are acronyms and take full uppercase rather than title case.
 *
 * Kept to what actually appears in `schema-fields.json` (`id`, `url`, `isbn`,
 * `asin`, `iso`, `uid`) plus `uuid`. Adding one is a one-line change; guessing
 * at a larger vocabulary only risks mangling a real word that happens to be
 * short.
 *
 * Matching is whole-segment, never prefix, which is what keeps `identifiers`
 * from becoming "IDENTIFIERS".
 */
const ACRONYMS = new Set(["id", "url", "uid", "uuid", "isbn", "asin", "iso"]);

const titleCase = (word: string): string => {
  const lower = word.toLowerCase();

  if (ACRONYMS.has(lower)) return word.toUpperCase();

  // Plural of an acronym keeps its lowercase s: "ISBNs", not "ISBNS".
  if (lower.endsWith("s") && ACRONYMS.has(lower.slice(0, -1))) {
    return `${lower.slice(0, -1).toUpperCase()}s`;
  }

  return word.charAt(0).toUpperCase() + word.slice(1);
};

/**
 * Turn a dotted field path into a human label: `book.stats.pages` ->
 * "Book Stats Pages", `users_count` -> "Users Count", `isbn_13` -> "ISBN 13".
 *
 * Both `.` and `_` are separators by the time a path reaches a chart legend, so
 * they are treated the same.
 */
export const formatFieldLabel = (field: string): string =>
  field
    .split(".")
    .flatMap((part) => part.split("_"))
    .filter(Boolean)
    .map(titleCase)
    .join(" ");
