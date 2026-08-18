import fs from "fs";

const capabilities = JSON.parse(fs.readFileSync("capabilities.json", "utf8"));

const byName = new Map(capabilities.scopes.map((s) => [s.scope, s]));

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

// Keep only the narrowest scope(s) per operation: drop a candidate if it
// implies another candidate already covering the same operation.
function minimalScopes(scopeNames) {
  const names = [...scopeNames];
  return names
    .filter((name) => !names.some((other) => other !== name && byName.get(name).implies.includes(other)))
    .sort();
}

const result = {};
for (const [operation, { read, write }] of index) {
  result[operation] = {
    read: minimalScopes(read),
    write: minimalScopes(write),
  };
}

fs.writeFileSync("capability-scopes.json", JSON.stringify(result, null, 2));

console.log(`Indexed ${Object.keys(result).length} operations -> capability-scopes.json`);
