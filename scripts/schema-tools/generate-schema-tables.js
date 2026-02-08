import fs from 'fs';

// Read the extracted schema fields
const schemaFields = JSON.parse(fs.readFileSync('schema-fields.json', 'utf8'));

// Read custom field descriptions (if file exists)
let customDescriptions = {};
const descriptionsFile = 'field-descriptions.json';
if (fs.existsSync(descriptionsFile)) {
  customDescriptions = JSON.parse(fs.readFileSync(descriptionsFile, 'utf8'));
  console.log(`Loaded custom descriptions for ${Object.keys(customDescriptions).length - 1} types`);
}

// Function to generate markdown table for a type
function generateMarkdownTable(typeName, fields) {
  // Include:
  // - Fields without args
  // - JSON/JSONB fields (even with path args)
  // - Simple relationship fields (object relationships without complex args)
  const includedFields = fields.filter(field => {
    if (!field.hasArgs) return true;
    // Include JSON fields with path argument
    if (field.type.includes('json')) return true;
    // Exclude array relationships with complex args
    return false;
  });

  let markdown = `## ${typeName.charAt(0).toUpperCase() + typeName.slice(1)} Fields\n\n`;
  markdown += '<table>\n';
  markdown += '    <thead>\n';
  markdown += '    <tr>\n';
  markdown += '        <th>Field</th>\n';
  markdown += '        <th>Type</th>\n';
  markdown += '        <th>Description</th>\n';
  markdown += '    </tr>\n';
  markdown += '    </thead>\n';
  markdown += '    <tbody>\n';

  // Get custom descriptions for this type
  const typeDescriptions = customDescriptions[typeName] || {};

  for (const field of includedFields) {
    // Prefer schema description, fall back to custom description
    const description = field.description || typeDescriptions[field.name] || '';
    markdown += '    <tr>\n';
    markdown += `        <td>${field.name}</td>\n`;
    markdown += `        <td>${field.type}</td>\n`;
    markdown += `        <td>${description}</td>\n`;
    markdown += '    </tr>\n';
  }

  markdown += '    </tbody>\n';
  markdown += '</table>\n\n';

  return markdown;
}

// Generate tables for all types
const outputDir = 'schema-tables';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

for (const [typeName, fields] of Object.entries(schemaFields)) {
  const markdown = generateMarkdownTable(typeName, fields);
  fs.writeFileSync(`${outputDir}/${typeName}.md`, markdown);
}

console.log(`Generated ${Object.keys(schemaFields).length} schema tables in ${outputDir}/`);

// Also create a summary showing field counts
const summary = {};
for (const [typeName, fields] of Object.entries(schemaFields)) {
  const simpleFields = fields.filter(field => !field.hasArgs);
  const relationshipFields = fields.filter(field => field.hasArgs);
  summary[typeName] = {
    total: fields.length,
    simple: simpleFields.length,
    relationships: relationshipFields.length
  };
}

console.log('\nField counts by type:');
console.log(JSON.stringify(summary, null, 2));
