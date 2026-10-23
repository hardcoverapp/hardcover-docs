// The scopes a GraphQL query needs, worked out the way the API checks them
// (from capabilities.json, the API's own list):
//   - each top-level field (operation) needs its scope; a narrower scope it
//     includes also works (read:library:public for user_books)
//   - selecting a protected column anywhere (email) needs that column's scope
//   - a mutation argument that writes a review needs write:reviews
// Nested relationships aren't checked separately, so they add nothing.
import { Kind, parse, type ArgumentNode, type ObjectFieldNode, type SelectionNode, type ValueNode } from "graphql";
import capabilities from "../../capabilities.json";

interface Scope {
  scope: string;
  operations?: string[];
  columns?: string[];
  arguments?: string[];
}

// "all" grants everything, so it never says what a query specifically needs.
const scopes = (capabilities.scopes as Scope[]).filter((s) => s.scope !== "all");

const depth = (scope: string) => scope.split(":").length;

/** The scope an operation needs: the broadest one that lists it (read:catalog for books). */
export function operationScope(operation: string): string | undefined {
  return scopes
    .filter((s) => s.operations?.includes(operation))
    .map((s) => s.scope)
    .sort((a, b) => depth(a) - depth(b))[0];
}

// Columns and arguments need their narrowest scope (read:me:email); broader ones grant it.
function narrowest(key: "columns" | "arguments", name: string): string | undefined {
  return scopes
    .filter((s) => s[key]?.includes(name))
    .map((s) => s.scope)
    .sort((a, b) => depth(b) - depth(a))[0];
}

/**
 * A docs example as plain GraphQL. Examples hold placeholders like
 * ##USER_ID## (the explorer fills in the reader's id), and # starts a comment
 * in GraphQL, so swap them for a number before parsing.
 */
export function withoutPlaceholders(query: string): string {
  return query.replace(/##[A-Z_]+##/g, "1");
}

/** Every scope a query needs, in the order they appear; [] when it can't be read. */
export function queryScopes(query: string): string[] {
  let document;
  try {
    document = parse(withoutPlaceholders(query));
  } catch {
    return [];
  }

  const fragments = new Map(
    document.definitions.filter((d) => d.kind === Kind.FRAGMENT_DEFINITION).map((d) => [d.name.value, d]),
  );

  const needed = new Set<string>();
  const add = (scope: string | undefined) => scope && needed.add(scope);

  for (const definition of document.definitions) {
    if (definition.kind !== Kind.OPERATION_DEFINITION) continue;

    for (const field of topLevelFields(definition.selectionSet.selections, fragments)) {
      add(operationScope(field.name.value));

      if (definition.operation === "mutation") {
        for (const name of argumentNames(field.arguments ?? [])) add(narrowest("arguments", name));
      }
    }

    for (const name of selectedFieldNames(definition.selectionSet.selections, fragments)) {
      add(narrowest("columns", name));
    }
  }

  return [...needed];
}

type Fragments = Map<string, { selectionSet: { selections: readonly SelectionNode[] } }>;

// Top-level fields, through fragments and inline fragments, as the API reads them.
function topLevelFields(selections: readonly SelectionNode[], fragments: Fragments, seen = new Set<string>()) {
  return selections.flatMap((selection): Extract<SelectionNode, { kind: Kind.FIELD }>[] => {
    if (selection.kind === Kind.FIELD) return [selection];
    if (selection.kind === Kind.INLINE_FRAGMENT) return topLevelFields(selection.selectionSet.selections, fragments, seen);

    const fragment = fragments.get(selection.name.value);
    if (!fragment || seen.has(selection.name.value)) return [];
    return topLevelFields(fragment.selectionSet.selections, fragments, new Set([...seen, selection.name.value]));
  });
}

// Every field name selected at any depth.
function selectedFieldNames(selections: readonly SelectionNode[], fragments: Fragments, seen = new Set<string>()): string[] {
  return selections.flatMap((selection) => {
    if (selection.kind === Kind.FIELD) {
      return [selection.name.value, ...selectedFieldNames(selection.selectionSet?.selections ?? [], fragments, seen)];
    }
    if (selection.kind === Kind.INLINE_FRAGMENT) return selectedFieldNames(selection.selectionSet.selections, fragments, seen);

    const fragment = fragments.get(selection.name.value);
    if (!fragment || seen.has(selection.name.value)) return [];
    return selectedFieldNames(fragment.selectionSet.selections, fragments, new Set([...seen, selection.name.value]));
  });
}

// Argument names, including keys inside object arguments (object: { review_raw: "…" }).
function argumentNames(nodes: readonly (ArgumentNode | ObjectFieldNode)[]): string[] {
  return nodes.flatMap((node) => [node.name.value, ...valueKeys(node.value)]);
}

function valueKeys(value: ValueNode): string[] {
  if (value.kind === Kind.OBJECT) return argumentNames(value.fields);
  if (value.kind === Kind.LIST) return value.values.flatMap(valueKeys);
  return [];
}
