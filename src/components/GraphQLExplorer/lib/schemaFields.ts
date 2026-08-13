/**
 * Access point for the generated schema snapshot.
 *
 * `schema-fields.json` lives at the repo root and is shared: it is written by
 * `scripts/schema-tools/extract-schema-fields.js`, read by
 * `scripts/schema-tools/generate-schema-tables.js`, and imported by
 * `src/lib/schemaGraphUtils.ts` for the SchemaGraph component. It deliberately
 * stays at the root rather than moving in here.
 *
 * This module exists so the explorer's nesting doesn't put
 * `../../../../schema-fields.json` at every call site.
 */
import schemaFieldsData from "../../../../schema-fields.json";

export interface FieldDefinition {
  name: string;
  type: string;
  description: string;
  hasArgs: boolean;
}

export const schemaFields = schemaFieldsData as Record<string, FieldDefinition[]>;

export default schemaFields;
