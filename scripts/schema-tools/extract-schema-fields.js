import fs from 'fs';
import { buildClientSchema, isObjectType, isListType, isNonNullType } from 'graphql';
import { typeNames } from './config.js';

const introspectionResult = JSON.parse(fs.readFileSync('schema.json', 'utf8'));
const schema = buildClientSchema(introspectionResult.data);

function getTypeString(type) {
  if (isNonNullType(type)) {
    return `${getTypeString(type.ofType)}!`;
  }
  if (isListType(type)) {
    return `[${getTypeString(type.ofType)}]`;
  }
  return type.name;
}

function extractFields(typeName) {
  const type = schema.getType(typeName);

  if (!type || !isObjectType(type)) {
    console.log(`Type ${typeName} not found or is not an object type`);
    return null;
  }

  const fields = type.getFields();
  const fieldList = [];

  for (const [fieldName, field] of Object.entries(fields)) {
    fieldList.push({
      name: fieldName,
      type: getTypeString(field.type),
      description: field.description || '',
      hasArgs: field.args && field.args.length > 0
    });
  }

  return fieldList;
}

const results = {};

for (const typeName of typeNames) {
  const fields = extractFields(typeName);
  if (fields) {
    results[typeName] = fields;
  }
}

fs.writeFileSync('schema-fields.json', JSON.stringify(results, null, 2));

console.log(`Extracted fields for ${Object.keys(results).length} types`);
