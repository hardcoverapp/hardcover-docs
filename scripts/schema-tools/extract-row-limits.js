// Row caps for API tokens: how many rows each query returns at most, from the
// Hasura permissions in a checkout of the Hardcover app. API tokens run as the
// `user` role, which inherits from other roles where it has no permission of
// its own (inherited_roles.yaml).
//
//   node scripts/schema-tools/extract-row-limits.js            reads ../app
//   APP_REPO=/path/to/hardcover node scripts/schema-tools/extract-row-limits.js
//
// Writes row-limits.json: { "books": 1000, "user_books": null, ... }, where
// null means no cap. Without an app checkout it leaves the file as it is.
import fs from "fs";
import path from "path";

const appRepo = path.resolve(process.env.APP_REPO ?? "../app");
const tablesDir = path.join(appRepo, "hasura/metadata/databases/Default/tables");
const OUTPUT_PATH = "row-limits.json";

if (!fs.existsSync(tablesDir)) {
  console.warn(`No Hasura metadata at ${tablesDir}; keeping the existing ${OUTPUT_PATH}. Set APP_REPO to an app checkout.`);
  process.exit(0);
}

// Each role's select permission on a table: { limit } (limit null for none).
// The metadata is plain YAML in a fixed shape, so this reads it line by line
// rather than adding a YAML parser for one file type.
function selectPermissions(text) {
  const select = text.split(/^select_permissions:\s*$/m)[1];
  if (!select) return {};

  const section = select.split(/^\S/m)[0];
  const permissions = {};

  for (const block of section.split(/^\s*- role: /m).slice(1)) {
    const role = block.split("\n")[0].trim();
    const limit = block.match(/^\s+limit: (\d+)\s*$/m);
    permissions[role] = { limit: limit ? Number(limit[1]) : null };
  }

  return permissions;
}

// inherited_roles.yaml: role_name -> the roles it combines.
function inheritedRoles() {
  const file = path.join(appRepo, "hasura/metadata/inherited_roles.yaml");
  if (!fs.existsSync(file)) return {};

  const roles = {};
  for (const block of fs.readFileSync(file, "utf8").split(/^- role_name: /m).slice(1)) {
    const [name, ...rest] = block.split("\n");
    roles[name.trim()] = rest.map((line) => line.match(/^\s+- (\S+)/)?.[1]).filter(Boolean);
  }
  return roles;
}

const inherited = inheritedRoles();

// The cap API tokens get, as Hasura works it out for the `user` role: its own
// permission on the table if it has one, otherwise the largest limit among the
// roles it inherits (none if any of them has none). undefined: no access.
function effectiveLimit(role, permissions) {
  if (permissions[role]) return permissions[role].limit;

  const parents = (inherited[role] ?? [])
    .map((parent) => effectiveLimit(parent, permissions))
    .filter((limit) => limit !== undefined);

  if (parents.length === 0) return undefined;
  return parents.includes(null) ? null : Math.max(...parents);
}

function tableName(text) {
  return text.match(/^table:\s*\n\s+name: (\S+)/m)?.[1];
}

const limits = {};

for (const file of fs.readdirSync(tablesDir).sort()) {
  if (!file.endsWith(".yaml") || file === "tables.yaml") continue;

  const text = fs.readFileSync(path.join(tablesDir, file), "utf8");
  const name = tableName(text);
  const limit = effectiveLimit("user", selectPermissions(text));

  if (name && limit !== undefined) limits[name] = limit;
}

fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(limits, null, 2)}\n`);
console.log(`Wrote ${Object.keys(limits).length} row limits to ${OUTPUT_PATH}`);
