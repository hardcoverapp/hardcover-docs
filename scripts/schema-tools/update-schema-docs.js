import fs from 'fs';
import { schemaTypes } from './config.js';

function extractTableFromGenerated(schemaName) {
  const tablePath = `schema-tables/${schemaName}.md`;
  if (!fs.existsSync(tablePath)) {
    return null;
  }
  const content = fs.readFileSync(tablePath, 'utf8');
  const tableMatch = content.match(/<table>[\s\S]*?<\/table>/);
  return tableMatch ? tableMatch[0] : null;
}

for (const [schemaName, filePath] of Object.entries(schemaTypes)) {
  const generatedTable = extractTableFromGenerated(schemaName);
  if (!generatedTable) {
    console.log(`No generated table for ${schemaName}, skipping...`);
    continue;
  }

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}, skipping...`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  let updatedContent = content.replace(
    /lastUpdated: \d{4}-\d{2}-\d{2}/,
    `lastUpdated: ${new Date().toISOString().split('T')[0]}`
  );

  const tableRegex = /(#{1,3} Fields\s*)<table>[\s\S]*?<\/table>/;

  if (tableRegex.test(updatedContent)) {
    const match = updatedContent.match(tableRegex);
    const heading = match[1];
    updatedContent = updatedContent.replace(tableRegex, `${heading}${generatedTable}`);
    fs.writeFileSync(filePath, updatedContent);
    console.log(`✓ Updated ${schemaName}`);
  } else {
    console.log(`✗ Could not find fields table in ${schemaName}`);
  }
}

console.log('\nSchema documentation update complete!');
