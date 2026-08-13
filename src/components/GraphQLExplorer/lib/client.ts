/**
 * GraphQL transport.
 *
 * This is the whole network layer: it takes a query and a credential and
 * returns a result. It does not translate, does not touch storage, and does not
 * reach into UI state.
 *
 * The previous implementation returned a hand-rolled thenable rather than a
 * promise, which meant no `catch`, no `await`, and — because nothing enforced
 * settle-once — a response carrying a GraphQL `errors` array with a falsy first
 * message would invoke *both* the reject and resolve callbacks, flashing an
 * error and then rendering success.
 */
import { authorizationHeader, type Credential } from "./credentials";
import {
  errorFromGraphQLErrors,
  errorFromResponse,
  explorerError,
  extractDetail,
  type ExplorerError,
} from "./errors";

export type QueryResult =
  | { ok: true; data: unknown }
  | { ok: false; error: ExplorerError };

export interface QueryRequest {
  endpoint: string;
  query: string;
  credential: Credential;
  signal?: AbortSignal;
}

const ok = (data: unknown): QueryResult => ({ ok: true, data });
const fail = (error: ExplorerError): QueryResult => ({ ok: false, error });

/** Parse a response body without letting malformed JSON throw past us. */
const readBody = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const executeQuery = async ({
  endpoint,
  query,
  credential,
  signal,
}: QueryRequest): Promise<QueryResult> => {
  const authorization = authorizationHeader(credential);
  if (!authorization) {
    return fail(explorerError("empty_token"));
  }

  if (!query?.trim()) {
    return fail(explorerError("empty_query"));
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify({ query }),
      signal,
    });
  } catch (cause) {
    // An aborted request is a caller decision, not a failure to report.
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    return fail(explorerError("connection_error"));
  }

  const body = await readBody(response);

  if (!response.ok) {
    return fail(errorFromResponse(response.status, body, response.headers));
  }

  if (!body || typeof body !== "object") {
    return fail(explorerError("server_error"));
  }

  const payload = body as Record<string, unknown>;

  // Hasura reports authorization and validation problems in-band with HTTP 200.
  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return fail(errorFromGraphQLErrors(payload.errors));
  }

  if (payload.error) {
    return fail(explorerError("query_error", extractDetail(payload)));
  }

  return ok(payload.data);
};

export type ViewerIdResult =
  /** The signed-in user's id. */
  | { status: "ok"; userId: string }
  /**
   * Authenticated, but the id could not be read — most likely a token scoped to
   * `read:catalog` without `read:me`. This is NOT an invalid credential, and
   * treating it as one is the bug this shape exists to prevent.
   */
  | { status: "unavailable"; error: ExplorerError }
  /** The credential itself was rejected. */
  | { status: "unauthenticated"; error: ExplorerError };

const VIEWER_QUERY = `query { me { id } }`;

/**
 * Resolve the signed-in user's id, used for `##USER_ID##` substitution.
 *
 * `me` maps to the `read:me` scope. A perfectly valid token that simply wasn't
 * granted that scope must come back as `unavailable`, not as a bad token.
 */
export const fetchViewerId = async (
  request: Omit<QueryRequest, "query">,
): Promise<ViewerIdResult> => {
  const result = await executeQuery({ ...request, query: VIEWER_QUERY });

  if (!result.ok) {
    const { code } = result.error;
    if (code === "invalid_token" || code === "expired_credential") {
      return { status: "unauthenticated", error: result.error };
    }
    return { status: "unavailable", error: result.error };
  }

  const me = (result.data as Record<string, unknown> | null)?.me;
  const first = Array.isArray(me) ? me[0] : me;
  const id = (first as Record<string, unknown> | undefined)?.id;

  if (id === undefined || id === null) {
    return { status: "unavailable", error: explorerError("insufficient_scope") };
  }

  return { status: "ok", userId: String(id) };
};
