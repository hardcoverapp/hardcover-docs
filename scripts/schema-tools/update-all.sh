#!/bin/bash

# Script to update all schema documentation
# Usage: ./update-all.sh YOUR_BEARER_TOKEN

set -e  # Exit on error

if [ -z "$1" ]; then
    echo "Error: Bearer token required"
    echo "Usage: ./update-all.sh YOUR_BEARER_TOKEN"
    exit 1
fi

BEARER_TOKEN=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "📡 Step 1/5: Fetching schema from API..."
cd "$ROOT_DIR"
curl -X POST https://api.hardcover.app/v1/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -d '{"query":"query IntrospectionQuery { __schema { queryType { name } mutationType { name } subscriptionType { name } types { ...FullType } directives { name description locations args { ...InputValue } } } } fragment FullType on __Type { kind name description fields(includeDeprecated: true) { name description args { ...InputValue } type { ...TypeRef } isDeprecated deprecationReason } inputFields { ...InputValue } interfaces { ...TypeRef } enumValues(includeDeprecated: true) { name description isDeprecated deprecationReason } possibleTypes { ...TypeRef } } fragment InputValue on __InputValue { name description type { ...TypeRef } defaultValue } fragment TypeRef on __Type { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name ofType { kind name } } } } } } } }"}' \
  -o schema.json -s

if [ ! -f "schema.json" ]; then
    echo "❌ Failed to fetch schema.json"
    exit 1
fi

echo "✓ Schema fetched successfully"

echo ""
echo "🔄 Step 2/5: Converting to SDL format..."
node "$SCRIPT_DIR/convert-schema.js"

if [ ! -f "schema.graphql" ]; then
    echo "❌ Failed to create schema.graphql"
    exit 1
fi

echo "✓ Conversion complete"

echo ""
echo "📊 Step 3/5: Extracting schema fields..."
node "$SCRIPT_DIR/extract-schema-fields.js"

if [ ! -f "schema-fields.json" ]; then
    echo "❌ Failed to create schema-fields.json"
    exit 1
fi

echo "✓ Fields extracted"

echo ""
echo "📝 Step 4/5: Generating markdown tables..."
node "$SCRIPT_DIR/generate-schema-tables.js"

echo "✓ Tables generated"

echo ""
echo "✏️  Step 5/5: Updating documentation files..."
node "$SCRIPT_DIR/update-schema-docs.js"

echo ""
echo "✅ All done! Schema documentation has been updated."
echo ""
echo "Generated files:"
echo "  - schema.json (API introspection result)"
echo "  - schema.graphql (SDL format)"
echo "  - schema-fields.json (extracted fields)"
echo "  - schema-tables/ (markdown previews)"
echo ""
echo "⚠️  Don't forget to review the changes before committing!"
