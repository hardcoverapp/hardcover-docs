import fs from "fs";
import { buildClientSchema } from "graphql";

const OUTPUT_PATH = "src/content/docs/api/GraphQL/Actions.mdx";

const introspection = JSON.parse(fs.readFileSync("schema.json", "utf8"));
const schema = buildClientSchema(introspection.data);
const operationScopes = JSON.parse(
  fs.readFileSync("capability-scopes.json", "utf8"),
);

const queryFields = schema.getQueryType()?.getFields() ?? {};
const mutationFields = schema.getMutationType()?.getFields() ?? {};

// Hasura auto-generates a description that just repeats the field name for most
// custom actions -- not useful to show, so treat those the same as "no description".
function describe(operation, fieldDef) {
  const description = fieldDef?.description || "";
  if (!description || description === operation) return "";
  return description;
}

function scopesCell(scopeNames) {
  if (!scopeNames.length) return "None documented";
  return scopeNames.join(", ");
}

const rows = { query: [], mutation: [] };

for (const [operation, { read, write }] of Object.entries(operationScopes)) {
  if (operation in queryFields) {
    rows.query.push({
      operation,
      scopes: read,
      description: describe(operation, queryFields[operation]),
    });
  } else if (operation in mutationFields) {
    rows.mutation.push({
      operation,
      scopes: write,
      description: describe(operation, mutationFields[operation]),
    });
  }
}

rows.query.sort((a, b) => a.operation.localeCompare(b.operation));
rows.mutation.sort((a, b) => a.operation.localeCompare(b.operation));

function renderTable(entries) {
  const lines = [];
  lines.push("<table>");
  lines.push("    <thead>");
  lines.push("    <tr>");
  lines.push("        <th>Action</th>");
  lines.push("        <th>Required Scopes</th>");
  lines.push("        <th>Description</th>");
  lines.push("    </tr>");
  lines.push("    </thead>");
  lines.push("    <tbody>");
  for (const { operation, scopes, description } of entries) {
    lines.push("    <tr>");
    lines.push(`        <td>${operation}</td>`);
    lines.push(`        <td>${scopesCell(scopes)}</td>`);
    lines.push(`        <td>${description}</td>`);
    lines.push("    </tr>");
  }
  lines.push("    </tbody>");
  lines.push("</table>");
  return lines.join("\n");
}

const content = `---
title: Actions & Scopes
description: Every GraphQL action recognized by the capabilities system, and which OAuth scope(s) grant access to it.
category: reference
layout: /src/layouts/documentation.astro
---

Each action below is a GraphQL query or mutation root field. To call it with an
access token (OAuth or PAT), the token needs **any one** of the listed scopes -- they are
alternatives, not a combined requirement. Scopes can imply other, narrower scopes;
see [capabilities.json](https://api.hardcover.app/capabilities.json) for the full
scope definitions.

Distributing a tool that needs specific scopes? The [PAT Link Builder](/api/pat-link-builder)
generates a link that pre-selects them on the New API Key form for your users.

## Queries

${renderTable(rows.query)}

## Mutations

${renderTable(rows.mutation)}
`;

fs.writeFileSync(OUTPUT_PATH, content);

console.log(
  `Generated ${OUTPUT_PATH} with ${rows.query.length} queries and ${rows.mutation.length} mutations`,
);
