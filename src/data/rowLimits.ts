// The most rows each query returns to an API token, from row-limits.json
// (scripts/schema-tools/extract-row-limits.js reads it from the app's Hasura
// permissions). A larger `limit` is cut to the cap without an error.
import limits from "../../row-limits.json";

/** The cap for a query (books → 1000), null when it has none, undefined when it isn't listed. */
export function rowLimit(query: string): number | null | undefined {
  return (limits as Record<string, number | null>)[query];
}
