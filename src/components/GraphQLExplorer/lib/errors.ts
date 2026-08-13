/**
 * Explorer error vocabulary.
 *
 * The service layer emits codes, never user-facing sentences. Translation
 * happens at the presentation boundary (see `ui/ErrorNotice.tsx`), which is what
 * lets callers branch on *why* something failed rather than only display it.
 *
 * Previously every failure collapsed into one already-translated string, so an
 * expired token, a missing scope, a blocked operator and a rate limit were
 * indistinguishable to everything downstream.
 */

export type ExplorerErrorCode =
  /** No query text to run. */
  | "empty_query"
  /** No credential supplied. */
  | "empty_token"
  /** Query contains a mutation and the explorer is read-only. */
  | "mutation_not_allowed"
  /** Credential rejected outright (HTTP 401). */
  | "invalid_token"
  /** Credential was valid but has expired or been revoked. */
  | "expired_credential"
  /** Credential lacks a scope this operation requires (HTTP 403). */
  | "insufficient_scope"
  /**
   * Operation is refused by the API gateway regardless of scope: pattern
   * operators (`_ilike`, `_regex`, …) and the per-request top-level field caps.
   */
  | "blocked_operation"
  /** Throttled (HTTP 429). */
  | "rate_limited"
  /** Request never reached the API. */
  | "connection_error"
  /** API returned 5xx. */
  | "server_error"
  /** HTTP 200 with a GraphQL `errors` array. */
  | "query_error";

export interface ExplorerError {
  code: ExplorerErrorCode;
  /**
   * Raw, untranslated detail from the API when it supplied one. Presentation
   * may show this alongside the translated copy; it must never be the only
   * thing shown, because it is always English.
   */
  detail?: string;
  /** Seconds until the throttle resets, when the response advertised it. */
  retryAfter?: number;
}

export const explorerError = (
  code: ExplorerErrorCode,
  detail?: string,
  retryAfter?: number,
): ExplorerError => ({ code, detail, retryAfter });

/**
 * Substrings the API uses when refusing an operation outright rather than for
 * lack of scope. Grounded in `api/app/models/api_request.rb` and
 * `api/app/services/graphql_query_limit.rb`.
 */
const BLOCKED_OPERATION_MARKERS = [
  "top_level_limit_exceeded",
  "top_level_query_limit_exceeded",
  "top_level_mutation_limit_exceeded",
  "search_query_limit_exceeded",
  "quota has been reached",
];

const SCOPE_MARKERS = ["scope", "insufficient", "not permitted for this token"];

/** Pull whatever human-readable message a response body carries. */
export const extractDetail = (body: unknown): string | undefined => {
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;

  if (typeof record.error === "string") return record.error;

  if (Array.isArray(record.errors) && record.errors.length > 0) {
    const first = record.errors[0];
    if (typeof first === "string") return record.errors.join(", ");
    if (first && typeof first === "object") {
      const message = (first as Record<string, unknown>).message;
      if (typeof message === "string") return message;
    }
  }

  return undefined;
};

const matches = (haystack: string | undefined, needles: string[]): boolean =>
  !!haystack && needles.some((needle) => haystack.toLowerCase().includes(needle));

/**
 * Map a non-OK HTTP response onto a code.
 *
 * 403 is deliberately split three ways: the API returns it for missing scope,
 * for operations it refuses outright, and for quota blocks, and the explorer
 * should say something different for each.
 */
export const errorFromResponse = (
  status: number,
  body: unknown,
  headers?: Headers,
): ExplorerError => {
  const detail = extractDetail(body);

  if (status === 401) {
    return explorerError("invalid_token", detail);
  }

  if (status === 403) {
    if (matches(detail, BLOCKED_OPERATION_MARKERS)) {
      return explorerError("blocked_operation", detail);
    }
    if (matches(detail, SCOPE_MARKERS)) {
      return explorerError("insufficient_scope", detail);
    }
    return explorerError("blocked_operation", detail);
  }

  if (status === 429) {
    return explorerError("rate_limited", detail, retryAfterFrom(headers));
  }

  if (status >= 500) {
    return explorerError("server_error", detail);
  }

  if (status === 408) {
    return explorerError("connection_error", detail);
  }

  return explorerError("query_error", detail);
};

/**
 * `Retry-After` and `X-RateLimit-Reset` are CORS-exposed by the API precisely so
 * browser clients can back off rather than hammering.
 */
const retryAfterFrom = (headers?: Headers): number | undefined => {
  if (!headers) return undefined;

  const retryAfter = headers.get("Retry-After");
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (Number.isFinite(seconds)) return seconds;
  }

  const reset = headers.get("X-RateLimit-Reset") ?? headers.get("RateLimit-Reset");
  if (reset) {
    const seconds = Number.parseInt(reset, 10);
    if (Number.isFinite(seconds)) return seconds;
  }

  return undefined;
};

/**
 * Map a 200 response that carried a GraphQL `errors` array.
 *
 * Hasura reports authorization failures in-band with 200, so a missing scope can
 * arrive here rather than as a 403.
 */
export const errorFromGraphQLErrors = (errors: unknown): ExplorerError => {
  const detail = extractDetail({ errors });

  if (matches(detail, SCOPE_MARKERS)) {
    return explorerError("insufficient_scope", detail);
  }
  if (matches(detail, BLOCKED_OPERATION_MARKERS)) {
    return explorerError("blocked_operation", detail);
  }

  return explorerError("query_error", detail);
};
