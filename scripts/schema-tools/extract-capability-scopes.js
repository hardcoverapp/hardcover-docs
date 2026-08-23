import fs from "fs";

const capabilities = JSON.parse(fs.readFileSync("capabilities.json", "utf8"));

// operation -> { read: Set<scope>, write: Set<scope> }
const index = new Map();

for (const scope of capabilities.scopes) {
  if (scope.action !== "read" && scope.action !== "write") continue; // skip wildcard scopes like "all"

  for (const operation of scope.operations) {
    if (!index.has(operation)) {
      index.set(operation, { read: new Set(), write: new Set() });
    }
    index.get(operation)[scope.action].add(scope.scope);
  }
}

const result = {};
for (const [operation, { read, write }] of index) {
  result[operation] = {
    read: [...read].sort(),
    write: [...write].sort(),
  };
}

fs.writeFileSync("capability-scopes.json", JSON.stringify(result, null, 2));

console.log(`Indexed ${Object.keys(result).length} operations -> capability-scopes.json`);
