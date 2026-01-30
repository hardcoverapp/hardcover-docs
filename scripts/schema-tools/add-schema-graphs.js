import fs from 'fs';
import { schemaTypes } from './config.js';

for (const [typeName, filePath] of Object.entries(schemaTypes)) {
  if (!fs.existsSync(filePath)) {
    console.log(`✗ File not found: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('SchemaGraph')) {
    console.log(`- ${typeName} already has SchemaGraph`);
    continue;
  }

  // Add import after GraphQLExplorer import
  content = content.replace(
    /import GraphQLExplorer from .+;/,
    `$&\nimport SchemaGraph from '@/components/SchemaGraph/SchemaGraph.astro';`
  );

  // Add SchemaGraph section after frontmatter and imports
  const schemaSection = `\n## Schema Relationships\n\n<SchemaGraph typeName="${typeName}" />\n`;

  // Find first heading and insert before it
  const firstHeadingMatch = content.match(/\n(#{1,2} [^\n]+)/);
  if (firstHeadingMatch) {
    content = content.replace(firstHeadingMatch[0], schemaSection + firstHeadingMatch[0]);
  }

  fs.writeFileSync(filePath, content);
  console.log(`✓ Added SchemaGraph to ${typeName}`);
}

console.log('\nDone!');
