import fs from 'fs';
import { buildClientSchema, printSchema } from 'graphql';

// Read the introspection result
const introspectionResult = JSON.parse(fs.readFileSync('schema.json', 'utf8'));

// Build the schema from introspection
const schema = buildClientSchema(introspectionResult.data);

// Print the schema in SDL format
const sdl = printSchema(schema);

// Write to file
fs.writeFileSync('schema.graphql', sdl);

console.log('Schema successfully converted to SDL format and saved to schema.graphql');
