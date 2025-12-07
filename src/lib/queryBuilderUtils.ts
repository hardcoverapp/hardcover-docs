import schemaFields from "../../schema-fields.json";
import { QUERY_BUILDER } from "@/Consts";

export interface FieldDefinition {
  name: string;
  type: string;
  description: string;
  hasArgs: boolean;
}

export interface SelectedField {
  name: string;
  type: string;
  selected: boolean;
  children?: SelectedField[];
  args?: Record<string, any>;
}

/**
 * Check if a type is a scalar (primitive) type
 */
export function isScalarType(type: string): boolean {
  // Remove ! and [] to get base type
  const baseType = type.replace(/!|\[|\]/g, "");
  return QUERY_BUILDER.SCALAR_TYPES.includes(baseType as any);
}

/**
 * Check if a type is an array type
 */
export function isArrayType(type: string): boolean {
  return type.includes("[");
}

/**
 * Extract the base type name from a GraphQL type string
 * e.g., "[books!]!" -> "books", "String!" -> "String"
 */
export function extractBaseType(type: string): string {
  return type.replace(/!|\[|\]/g, "");
}

/**
 * Get all available query types from the schema
 */
export function getAvailableQueryTypes(): string[] {
  return Object.keys(schemaFields).sort();
}

/**
 * Get fields for a given type
 */
export function getFieldsForType(typeName: string): FieldDefinition[] {
  return (schemaFields as Record<string, FieldDefinition[]>)[typeName] || [];
}

/**
 * Check if a type has nested fields (is an object type)
 */
export function hasNestedFields(typeName: string): boolean {
  const baseType = extractBaseType(typeName);
  return !isScalarType(baseType) && baseType in schemaFields;
}

/**
 * Generate a default query structure for a given type
 * Maximum depth is configured in queryBuilderConfig
 */
export function generateDefaultQuery(
  typeName: string,
  maxDepth: number = QUERY_BUILDER.MAX_DEPTH,
  currentDepth: number = 0
): SelectedField[] {
  const fields = getFieldsForType(typeName);
  const result: SelectedField[] = [];

  for (const field of fields) {
    const baseType = extractBaseType(field.type);
    const isScalar = isScalarType(baseType);

    // Check if field should be excluded based on patterns
    const shouldExclude = QUERY_BUILDER.EXCLUDED_FIELD_PATTERNS.some(pattern =>
      field.name.includes(pattern)
    );

    const fieldData: SelectedField = {
      name: field.name,
      type: field.type,
      selected: isScalar && !shouldExclude, // Auto-select simple fields, exclude patterns
      children: undefined,
    };

    // Recursively add nested fields for object types, but stop at max depth
    if (!isScalar && hasNestedFields(baseType) && currentDepth < maxDepth) {
      fieldData.children = generateDefaultQuery(baseType, maxDepth, currentDepth + 1);
    }

    result.push(fieldData);
  }

  return result;
}

/**
 * Generate GraphQL query string from selected fields
 */
export function generateQueryString(
  queryType: string,
  selectedFields: SelectedField[],
  queryArgs?: Record<string, any>
): string {
  function buildFieldsString(fields: SelectedField[], indent: number = 2): string {
    const indentStr = " ".repeat(indent);
    const lines: string[] = [];

    for (const field of fields) {
      // Check if this field or any of its children are selected
      const hasSelectedChildren =
        field.children && field.children.some((c) => c.selected || hasAnySelectedDescendants(c));

      // Include field if it's selected OR if it has selected children (for relationships)
      if (field.selected || hasSelectedChildren) {
        if (hasSelectedChildren) {
          // This is a relationship field with selected children
          lines.push(`${indentStr}${field.name} {`);
          lines.push(buildFieldsString(field.children!, indent + 2));
          lines.push(`${indentStr}}`);
        } else {
          // This is a scalar field that's selected
          lines.push(`${indentStr}${field.name}`);
        }
      }
    }

    return lines.join("\n");
  }

  function hasAnySelectedDescendants(field: SelectedField): boolean {
    if (field.selected) return true;
    if (field.children) {
      return field.children.some((c) => hasAnySelectedDescendants(c));
    }
    return false;
  }

  /**
   * Convert a JavaScript object to GraphQL object syntax
   * GraphQL needs unquoted keys and enum values
   */
  function toGraphQLObject(obj: any): string {
    if (obj === null || obj === undefined) return 'null';
    if (typeof obj === 'string') {
      // Check if it's a numeric string
      if (/^-?\d+(\.\d+)?$/.test(obj)) {
        return obj; // Return as unquoted number
      }
      // Check if it's a boolean
      if (obj === 'true' || obj === 'false') {
        return obj;
      }
      // Check if it's an enum value (order_by directions)
      if (obj === 'asc' || obj === 'desc' || obj === 'asc_nulls_first' ||
          obj === 'asc_nulls_last' || obj === 'desc_nulls_first' || obj === 'desc_nulls_last') {
        return obj;
      }
      // Otherwise it's a string that needs quotes
      return `"${obj}"`;
    }
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    }
    if (Array.isArray(obj)) {
      return `[${obj.map(toGraphQLObject).join(', ')}]`;
    }
    if (typeof obj === 'object') {
      const pairs = Object.entries(obj)
        .map(([k, v]) => `${k}: ${toGraphQLObject(v)}`)
        .join(', ');
      return `{${pairs}}`;
    }
    return String(obj);
  }

  // Build query arguments if provided
  let argsString = "";
  if (queryArgs && Object.keys(queryArgs).length > 0) {
    const argPairs = Object.entries(queryArgs)
      .filter(([_, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => {
        if (typeof value === "string") {
          return `${key}: "${value}"`;
        } else if (typeof value === "object") {
          return `${key}: ${toGraphQLObject(value)}`;
        } else {
          return `${key}: ${value}`;
        }
      });
    if (argPairs.length > 0) {
      argsString = `(${argPairs.join(", ")})`;
    }
  }

  const fieldsString = buildFieldsString(selectedFields);
  return `query {
  ${queryType}${argsString} {
${fieldsString}
  }
}`;
}

/**
 * Count selected fields in a tree
 */
export function countSelectedFields(fields: SelectedField[]): number {
  let count = 0;
  for (const field of fields) {
    if (field.selected) count++;
    if (field.children) {
      count += countSelectedFields(field.children);
    }
  }
  return count;
}

/**
 * Toggle a field and optionally all its children
 */
export function toggleField(
  fields: SelectedField[],
  fieldPath: string[],
  value?: boolean
): SelectedField[] {
  if (fieldPath.length === 0) return fields;

  return fields.map((field) => {
    if (field.name === fieldPath[0]) {
      if (fieldPath.length === 1) {
        // Toggle this field
        const newSelected = value !== undefined ? value : !field.selected;
        return {
          ...field,
          selected: newSelected,
          // If selecting a parent field with children, select all scalar children
          children: field.children
            ? toggleAllChildren(field.children, newSelected)
            : field.children,
        };
      } else {
        // Recurse into children
        return {
          ...field,
          children: field.children
            ? toggleField(field.children, fieldPath.slice(1), value)
            : field.children,
        };
      }
    }
    return field;
  });
}

/**
 * Toggle all children recursively
 */
function toggleAllChildren(
  fields: SelectedField[],
  selected: boolean
): SelectedField[] {
  return fields.map((field) => ({
    ...field,
    selected: selected,
    children: field.children ? toggleAllChildren(field.children, selected) : field.children,
  }));
}

/**
 * Get common query arguments for a type
 */
export function getCommonArgsForType(typeName: string): Record<string, string> {
  // Common Hasura arguments
  const commonArgs: Record<string, string> = {
    limit: "number",
    offset: "number",
    order_by: "object",
    where: "object",
  };

  return commonArgs;
}

/**
 * Parse GraphQL query arguments from a query string
 */
export function parseQueryArguments(query: string, queryType: string): Record<string, any> {
  try {
    const args: Record<string, any> = {};

    // Find the query type with its arguments
    const queryTypeRegex = new RegExp(`${queryType}\\s*\\(([^)]+)\\)`, 's');
    const match = query.match(queryTypeRegex);

    if (!match) return args;

    const argsString = match[1];

    // Parse limit
    const limitMatch = argsString.match(/limit:\s*(\d+)/);
    if (limitMatch) {
      args.limit = parseInt(limitMatch[1]);
    }

    // Parse offset
    const offsetMatch = argsString.match(/offset:\s*(\d+)/);
    if (offsetMatch) {
      args.offset = parseInt(offsetMatch[1]);
    }

    // Parse order_by - extract the object
    const orderByMatch = argsString.match(/order_by:\s*\{([^}]+)\}/);
    if (orderByMatch) {
      const orderByContent = orderByMatch[1].trim();
      const fieldMatch = orderByContent.match(/(\w+):\s*(\w+)/);
      if (fieldMatch) {
        args.order_by = {
          [fieldMatch[1]]: fieldMatch[2]
        };
      }
    }

    // Parse where - this is complex, so we'll do a basic extraction
    const whereMatch = argsString.match(/where:\s*\{([\s\S]+)\}/);
    if (whereMatch) {
      // For now, we'll skip complex where clause parsing
      // as it requires a full GraphQL parser
      // The user can re-enter it manually in the query args editor
    }

    return args;
  } catch (error) {
    console.error('Error parsing query arguments:', error);
    return {};
  }
}

/**
 * Parse a GraphQL query to extract the field selection tree
 */
export function parseQueryFields(query: string, queryType: string): string[] {
  try {
    // Find the query type and locate the field selection block
    // It comes after the query name and optional arguments: queryType(...) { fields }
    const queryTypePattern = `${queryType}(?:\\s*\\([^)]*\\))?\\s*\\{`;
    const queryTypeRegex = new RegExp(queryTypePattern, 's');
    const startMatch = query.match(queryTypeRegex);

    if (!startMatch) return [];

    // Find where the field selection starts (after the opening brace)
    const startIndex = query.indexOf(startMatch[0]) + startMatch[0].length;

    // Extract the fields body by counting braces
    let braceCount = 1;
    let endIndex = startIndex;

    for (let i = startIndex; i < query.length && braceCount > 0; i++) {
      if (query[i] === '{') braceCount++;
      if (query[i] === '}') braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }

    const fieldsBody = query.substring(startIndex, endIndex);

    // Extract only top-level fields (not nested ones)
    const topLevelFields: string[] = [];
    const lines = fieldsBody.split('\n');
    let braceDepth = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Count braces to track depth
      const openBraces = (trimmed.match(/\{/g) || []).length;
      const closeBraces = (trimmed.match(/\}/g) || []).length;

      // Only process fields at depth 0 (top-level)
      if (braceDepth === 0) {
        const fieldMatch = trimmed.match(/^(\w+)/);
        if (fieldMatch && !trimmed.startsWith('}')) {
          topLevelFields.push(fieldMatch[1]);
        }
      }

      braceDepth += openBraces - closeBraces;
    }

    return topLevelFields;
  } catch (error) {
    console.error('Error parsing query fields:', error);
    return [];
  }
}

/**
 * Mark fields as selected based on a list of field names
 */
export function selectFieldsByNames(
  fields: SelectedField[],
  fieldNames: string[]
): SelectedField[] {
  return fields.map((field) => ({
    ...field,
    selected: fieldNames.includes(field.name),
    children: field.children
      ? selectFieldsByNames(field.children, fieldNames)
      : field.children,
  }));
}
