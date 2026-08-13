/**
 * Credential handling for the explorer.
 *
 * A credential used to be a bare `string`, which could not express the two
 * things that now matter: how the reader authenticated, and what that
 * authentication is allowed to do.
 *
 * The Hardcover API issues opaque tokens (`hc_pat_…` for personal access
 * tokens, `hc_at_…` for OAuth access tokens). The `oauth` case is modelled here
 * so the OAuth follow-up is additive; nothing in this PR produces one.
 */

export type Credential =
  | { kind: "none" }
  | { kind: "pat"; token: string }
  | {
      kind: "oauth";
      accessToken: string;
      /** Epoch milliseconds, or null when the issuer did not say. */
      expiresAt: number | null;
      /** Granted scopes, from the token endpoint's `scope` response field. */
      scopes: string[];
    };

export const NO_CREDENTIAL: Credential = { kind: "none" };

/**
 * Storage keys are unchanged from the previous implementation so readers who
 * already pasted a token keep it across this refactor.
 */
const TOKEN_KEY = "auth_token";
const USER_ID_KEY = "user_id";

const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    // Storage can throw in hardened browser settings; treat as unavailable.
    return null;
  }
};

export const readCredential = (): Credential => {
  const token = storage()?.getItem(TOKEN_KEY)?.trim();
  return token ? { kind: "pat", token } : NO_CREDENTIAL;
};

export const writeCredential = (credential: Credential): void => {
  const store = storage();
  if (!store) return;

  if (credential.kind === "none") {
    store.removeItem(TOKEN_KEY);
    return;
  }

  store.setItem(
    TOKEN_KEY,
    credential.kind === "pat" ? credential.token : credential.accessToken,
  );
};

export const clearCredential = (): void => {
  const store = storage();
  store?.removeItem(TOKEN_KEY);
  store?.removeItem(USER_ID_KEY);
};

export const readUserId = (): string | null => storage()?.getItem(USER_ID_KEY) ?? null;

export const writeUserId = (userId: string): void => {
  storage()?.setItem(USER_ID_KEY, userId);
};

/**
 * Build the Authorization header value.
 *
 * Readers routinely paste the token with the `Bearer ` prefix already attached,
 * so tolerate both forms rather than sending `Bearer Bearer …`.
 */
export const authorizationHeader = (credential: Credential): string | null => {
  const raw =
    credential.kind === "pat"
      ? credential.token
      : credential.kind === "oauth"
        ? credential.accessToken
        : null;

  if (!raw?.trim()) return null;

  const token = raw.trim();
  return /^bearer\s/i.test(token) ? token : `Bearer ${token}`;
};

export const hasCredential = (credential: Credential): boolean =>
  authorizationHeader(credential) !== null;

/** Expiry is only ever known for OAuth; a PAT's lifetime is opaque to us. */
export const isExpired = (credential: Credential, now: number = Date.now()): boolean =>
  credential.kind === "oauth" &&
  credential.expiresAt !== null &&
  credential.expiresAt <= now;

/**
 * Scopes are only discoverable on the OAuth path, where the token endpoint
 * returns them. A pasted PAT is opaque — the introspection endpoint requires
 * client-secret auth, which a public browser client cannot do — so this returns
 * `null` meaning "unknown", never `false`.
 *
 * Callers must treat `null` as "try it and see", not as a denial.
 */
export const grantedScopes = (credential: Credential): string[] | null =>
  credential.kind === "oauth" ? credential.scopes : null;

/**
 * Scope satisfaction, matching the API's hierarchy: a granted `read:library`
 * covers a requested `read:library:public`, and `all` covers everything.
 */
export const satisfiesScope = (granted: string, requested: string): boolean =>
  granted === "all" || granted === requested || requested.startsWith(`${granted}:`);

/**
 * Returns `null` when scopes are unknown (PAT), otherwise whether the scope is
 * covered.
 */
export const hasScope = (credential: Credential, requested: string): boolean | null => {
  const scopes = grantedScopes(credential);
  if (scopes === null) return null;
  return scopes.some((granted) => satisfiesScope(granted, requested));
};
