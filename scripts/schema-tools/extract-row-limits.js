// Row caps for API tokens: how many rows each query returns at most, from the
// Hasura permissions in a checkout of the Hardcover app (the `limit` on each
// table's `user` select permission, the role API tokens run as).
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

// The `user` role's select permission, and its limit if it has one. The
// metadata is plain YAML in a fixed shape, so this reads it line by line
// rather than adding a YAML parser for one file type.
function userSelectLimit(text) {
  const select = text.split(/^select_permissions:\s*$/m)[1];
  if (!select) return undefined;

  const section = select.split(/^\S/m)[0];
  const permissions = section.split(/^\s*- role: /m).slice(1);
  const user = permissions.find((permission) => permission.startsWith("user\n"));
  if (!user) return undefined;

  const limit = user.match(/^\s+limit: (\d+)\s*$/m);
  return limit ? Number(limit[1]) : null;
}

function tableName(text) {
  return text.match(/^table:\s*\n\s+name: (\S+)/m)?.[1];
}

const limits = {};

for (const file of fs.readdirSync(tablesDir).sort()) {
  if (!file.endsWith(".yaml") || file === "tables.yaml") continue;

  const text = fs.readFileSync(path.join(tablesDir, file), "utf8");
  const name = tableName(text);
  const limit = userSelectLimit(text);

  if (name && limit !== undefined) limits[name] = limit;
}

fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(limits, null, 2)}\n`);
console.log(`Wrote ${Object.keys(limits).length} row limits to ${OUTPUT_PATH}`);
