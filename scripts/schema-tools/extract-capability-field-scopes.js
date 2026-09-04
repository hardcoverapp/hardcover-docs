import fs from "fs";
import {
  buildClientSchema,
  isNonNullType,
  isListType,
  isObjectType,
} from "graphql";

const capabilities = JSON.parse(fs.readFileSync("capabilities.json", "utf8"));
const introspection = JSON.parse(fs.readFileSync("schema.json", "utf8"));
const schema = buildClientSchema(introspection.data);

function namedReturnType(fieldDef) {
  let type = fieldDef.type;
  while (isNonNullType(type) || isListType(type)) type = type.ofType;
  return type;
}

function resolveOperationType(operation) {
  for (const rootType of [schema.getQueryType(), schema.getMutationType()]) {
    const field = rootType?.getFields()[operation];
    if (field) return namedReturnType(field);
  }
  return null;
}

// typeName -> fieldName -> { read: Set, write: Set }
const fieldIndex = new Map();

for (const scope of capabilities.scopes) {
  if (scope.action !== "read" && scope.action !== "write") continue;
  if (!scope.columns?.length) continue;

  for (const operation of scope.operations) {
    const returnType = resolveOperationType(operation);
    if (!returnType || !isObjectType(returnType)) continue;

    const typeFields = returnType.getFields();
    for (const column of scope.columns) {
      if (!(column in typeFields)) continue;

      if (!fieldIndex.has(returnType.name))
        fieldIndex.set(returnType.name, new Map());
      const fields = fieldIndex.get(returnType.name);
      if (!fields.has(column))
        fields.set(column, { read: new Set(), write: new Set() });
      fields.get(column)[scope.action].add(scope.scope);
    }
  }
}

const result = {};
for (const [typeName, fields] of fieldIndex) {
  result[typeName] = {};
  for (const [fieldName, { read, write }] of fields) {
    result[typeName][fieldName] = {
      read: [...read].sort(),
      write: [...write].sort(),
    };
  }
}

fs.writeFileSync(
  "capability-field-scopes.json",
  JSON.stringify(result, null, 2),
);

const fieldCount = Object.values(result).reduce(
  (n, f) => n + Object.keys(f).length,
  0,
);
console.log(
  `Indexed ${fieldCount} field-level scope overrides -> capability-field-scopes.json`,
);
