/**
 * What the explorer is allowed to run.
 *
 * This replaces three independent copies of a naive `includes('mutation')`
 * substring check — one in each `.astro` wrapper and one in the runner — which
 * disagreed with each other on casing and false-positived on any query
 * containing the word.
 *
 * Keeping the decision in one place is what makes "mutations are allowed for
 * these resources" a future data change rather than an edit across three files.
 */
import { explorerError, type ExplorerError } from "./errors";
import { hasCredential, isExpired, type Credential } from "./credentials";

export type PolicyVerdict = { allowed: true } | { allowed: false; error: ExplorerError };

const ALLOWED: PolicyVerdict = { allowed: true };

const deny = (error: ExplorerError): PolicyVerdict => ({ allowed: false, error });

/**
 * Remove comments and string literals so their contents cannot be mistaken for
 * syntax. A `where: { title: { _eq: "mutation" } }` filter is a query, not a
 * mutation, and the old substring check got that wrong.
 */
const stripNonSyntax = (query: string): string =>
  query
    .replace(/"""[\s\S]*?"""/g, '""')
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/#[^\n]*/g, "");

/**
 * A mutation operation definition: the `mutation` keyword, an optional name and
 * variable list, then a selection set.
 *
 * The word boundary after `mutation` is what keeps a field named `mutation_log`
 * from matching. Matching is case-insensitive: `Mutation` is not valid GraphQL,
 * but blocking it is the safe direction and it removes the casing disagreement
 * the two old checks had.
 */
const MUTATION_OPERATION = /\bmutation\b\s*(?:[A-Za-z_]\w*)?\s*(?:\([^)]*\))?\s*\{/i;

export const isMutation = (query: string): boolean =>
  MUTATION_OPERATION.test(stripNonSyntax(query ?? ""));

export interface PolicyOptions {
  /**
   * Seam for the OAuth follow-up: once a token can carry `write:*` scopes, this
   * becomes scope-driven rather than a blanket refusal. Nothing sets it today.
   */
  allowMutations?: boolean;
}

/**
 * Decide whether a query may be sent, most query-specific reason first so the
 * reader is told the useful thing rather than "paste a token" for a query that
 * would never be permitted anyway.
 */
export const canRun = (
  query: string,
  credential: Credential,
  options: PolicyOptions = {},
): PolicyVerdict => {
  if (!query?.trim()) {
    return deny(explorerError("empty_query"));
  }

  if (isMutation(query) && !options.allowMutations) {
    return deny(explorerError("mutation_not_allowed"));
  }

  if (!hasCredential(credential)) {
    return deny(explorerError("empty_token"));
  }

  if (isExpired(credential)) {
    return deny(explorerError("expired_credential"));
  }

  return ALLOWED;
};
