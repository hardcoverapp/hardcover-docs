# Schema Documentation Tools

Scripts for updating GraphQL API documentation from schema introspection.

## Quick Start

```bash
./scripts/schema-tools/update-all.sh YOUR_BEARER_TOKEN
```

## Scripts

| Script | Purpose | Input | Output |
|--------|---------|-------|--------|
| `update-all.sh` | Run full pipeline | Bearer token | All outputs below |
| `convert-schema.js` | Convert introspection to SDL | schema.json | schema.graphql |
| `extract-schema-fields.js` | Extract field metadata | schema.json | schema-fields.json |
| `generate-schema-tables.js` | Generate markdown tables | schema-fields.json | schema-tables/*.md |
| `update-schema-docs.js` | Update MDX documentation | schema-tables/*.md | Schemas/*.mdx |
| `add-schema-graphs.js` | Add SchemaGraph to new pages | - | Schemas/*.mdx |

## Configuration

**config.js** - Single source of truth for schema types and file paths. To add a new type, add one entry here.

**field-descriptions.json** (in project root) - Custom field descriptions merged into generated tables. Schema descriptions take priority when present.

## Run Individual Scripts

All scripts run from project root:

```bash
node scripts/schema-tools/convert-schema.js
node scripts/schema-tools/extract-schema-fields.js
node scripts/schema-tools/generate-schema-tables.js
node scripts/schema-tools/update-schema-docs.js
node scripts/schema-tools/add-schema-graphs.js
```

## Generated Files

Created in project root:
- `schema.json` - API introspection result
- `schema.graphql` - SDL format
- `schema-fields.json` - Extracted field data
- `field-descriptions.json` - Custom descriptions
- `schema-tables/` - Markdown preview files

## Notes

- Field tables are updated; other content is preserved
- `lastUpdated` frontmatter is set to current date
- Complex relationship fields are filtered out for readability
- Review changes before committing
