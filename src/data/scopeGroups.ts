// Builds the PAT Link Builder's scope tree directly from capabilities.json
// (kept at the repo root, refreshed by scripts/schema-tools/fetch-capabilities.js)
// so it can't drift out of sync with a separately generated copy.

import capabilities from "../../capabilities.json";

export type ScopeItem = {
  scope: string;
  description: string;
  warning?: boolean;
};
export type ScopeGroupItem = ScopeItem & { children?: ScopeItem[] };
export type ScopeGroupDef = { label: string; items: ScopeGroupItem[] };

const scopes = capabilities.scopes.filter(s => s.scope !== "all");

function segments(scope: string): number {
  return scope.split(":").length;
}

// No field in capabilities.json marks a scope as sensitive -- flag anything
// exposing an `:email` leaf the same way the account settings UI does.
function isSensitive(scope: string): boolean {
  return scope.split(":").pop() === "email";
}

function toItem(scope: (typeof scopes)[number]): ScopeItem {
  const item: ScopeItem = { scope: scope.scope, description: scope.description ?? "" };
  if (isSensitive(scope.scope)) item.warning = true;
  return item;
}

// A scope's `implies` list mixes its own children (nesting) with unrelated
// scopes it grants as a side effect (e.g. read:me:email -> read:me:content).
// Only the latter belong here -- children are expressed via the group tree
// below instead.
export const EXPLICIT_IMPLICATIONS: Record<string, string> = {};
for (const scope of scopes) {
  for (const implied of scope.implies ?? []) {
    if (!implied.startsWith(`${scope.scope}:`)) {
      EXPLICIT_IMPLICATIONS[scope.scope] = implied;
    }
  }
}

export const WILDCARD_SCOPE: ScopeItem = {
  scope: "all",
  description: "Full access to all scopes",
  warning: true,
};

// Top-level items are two-segment scopes (e.g. "read:library"); their
// children are three-segment scopes nested under them (e.g.
// "read:library:public"). capabilities.json is already in the right display
// order, so this just partitions it rather than re-sorting.
const groups: Record<"read" | "write", ScopeGroupItem[]> = { read: [], write: [] };

for (const scope of scopes) {
  if (segments(scope.scope) !== 2) continue;
  const children = scopes
    .filter(s => segments(s.scope) === 3 && s.scope.startsWith(`${scope.scope}:`))
    .map(toItem);

  const item: ScopeGroupItem = toItem(scope);
  if (children.length) item.children = children;
  groups[scope.action as "read" | "write"].push(item);
}

const SCOPE_GROUPS: ScopeGroupDef[] = [
  { label: "Read", items: groups.read },
  { label: "Write", items: groups.write },
];

export default SCOPE_GROUPS;
