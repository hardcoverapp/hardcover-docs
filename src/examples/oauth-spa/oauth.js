// SECTION START: clientId :SECTION
const CLIENT_ID = "1ffaaf04-5aad-46f2-89ea-42c5ba7f5c65";
// SECTION END: clientId :SECTION

// SECTION START: hardcoverOauthEndpoints :SECTION
// Values can come from discovery
// https://api.hardcover.app/.well-known/oauth-authorization-server
const AUTHORIZE_ENDPOINT = "https://hardcover.app/oauth2/authorize";
const TOKEN_ENDPOINT = "https://api.hardcover.app/oauth2/token";
const REVOKE_ENDPOINT = "https:/api.hardcover.app/oauth2/revoke";
const GRAPHQL_ENDPOINT = "https://api.hardcover.app/v1/graphql";
// SECTION START: oauthIssuer :SECTION
const ISSUER = "https://api.hardcover.app";
// SECTION END: oauthIssuer :SECTION
// SECTION END: hardcoverOauthEndpoints :SECTION

// SECTION START: oauthReturnAddress :SECTION
const REDIRECT_URI = location.origin + location.pathname;
// SECTION END: oauthReturnAddress :SECTION

// SECTION START: oauthWantedScope :SECTION
const SCOPE = "read:me:content";
// SECTION END: oauthWantedScope :SECTION

const signInBtn = document.getElementById("sign-in");
const signOutBtn = document.getElementById("sign-out");
const statusEl = document.getElementById("status");

// helpers

// Modern browsers can use `Uint8Array.prototype.toBase64({ alphabet: "base64url" })`
// But since it was was only added to all browsers in 2025 https://caniuse.com/mdn-javascript_builtins_uint8array_tobase64
// We will be using btoa and replacing the chars needed to get to the url alphabet, also dropping the padding
const base64url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

const randomString = (byteLength) =>
  base64url(crypto.getRandomValues(new Uint8Array(byteLength)));

async function sha256(input) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return base64url(new Uint8Array(digest));
}

// ui helper

function render({ signedIn, message }) {
  statusEl.textContent = message;
  signInBtn.hidden = signedIn;
  signOutBtn.hidden = !signedIn;
}

// --- step 1: send the user to the provider ---------------------------

async function signIn() {
  const state = randomString(24);
  const verifier = randomString(32); // the spec wants a 43-128 long verifier

  // Only the hash travels in the URL now. The verifier stays here and is
  // sent in step 2, which proves the same browser started and finished the
  // flow — so a stolen code is useless on its own. That's all PKCE is.
  sessionStorage.setItem("pkce_verifier", verifier);
  sessionStorage.setItem("oauth_state", state); // guards against a forged callback

  location.href = `${AUTHORIZE_ENDPOINT}?${new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state,
    code_challenge: await sha256(verifier),
    code_challenge_method: "S256",
    scope: SCOPE,
  })}`;
}

// --- step 2: trade the code for a token ------------------------------

async function handleCallback(params) {
  const state = sessionStorage.getItem("oauth_state");
  const verifier = sessionStorage.getItem("pkce_verifier");
  sessionStorage.removeItem("oauth_state");
  sessionStorage.removeItem("pkce_verifier");

  history.replaceState({}, "", REDIRECT_URI); // drop ?code= so a refresh can't replay it

  // No verifier means this tab never started the flow. No state match means
  // someone else's callback landed here. Either way, stop.
  if (!verifier || params.get("state") !== state) {
    render({
      signedIn: false,
      message: "Sign-in failed: unexpected callback. Try again.",
    });
    return;
  }

  // Hardcover sets authorization_response_iss_parameter_supported, so every
  // callback names the server that issued the code (RFC 9207). Check it.
  // If your app supports more than one provider, this is what stops a
  // malicious one from handing you a code that you then redeem at another
  // provider's token endpoint — a mix-up attack. state can't catch that,
  // because the state is legitimately yours.
  if (params.get("iss") !== ISSUER) {
    render({
      signedIn: false,
      message: "Sign-in failed: response came from the wrong issuer.",
    });
    return;
  }

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: params.get("code"),
      redirect_uri: REDIRECT_URI, // must match step 1 exactly
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });
  const token = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Read this one. Nearly every first-run failure lands here, usually a
    // redirect_uri that doesn't match what's registered.
    render({
      signedIn: false,
      message: `Sign-in failed: ${token.error_description ?? token.error ?? res.status}`,
    });
    return;
  }

  // token is also carrying expires_in, and a refresh_token if you asked for
  // one. See the note at the bottom.
  localStorage.setItem("access_token", token.access_token);
  showProfile(token.access_token);
}

// --- step 3: use the token -------------------------------------------

async function showProfile(accessToken) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      query: "{ me { id username name image { url } } }",
    }),
  });
  const body = await res.json().catch(() => ({}));
  const user = body.data?.me?.[0];

  if (!user) {
    // Usually a saved token that has expired or been revoked since last visit.
    localStorage.removeItem("access_token");
    render({
      signedIn: false,
      message: "Your session expired. Sign in again.",
    });
    return;
  }

  render({
    signedIn: true,
    message: `Signed in as ${user.name} (@${user.username})`,
  });
}

// --- sign out ---------------------------------------------------------

async function signOut() {
  const accessToken = localStorage.getItem("access_token");
  localStorage.removeItem("access_token");
  render({ signedIn: false, message: "Signed out." });

  // Optional, but tells the server the token is dead now instead of leaving
  // it valid until it expires.
  if (accessToken) {
    fetch(REVOKE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token: accessToken,
        token_type_hint: "access_token",
        client_id: CLIENT_ID,
      }),
    }).catch(() => {});
  }
}

// --- entry point ------------------------------------------------------

signInBtn.addEventListener("click", signIn);
signOutBtn.addEventListener("click", signOut);

const params = new URLSearchParams(location.search);
const savedToken = localStorage.getItem("access_token");

if (params.has("error")) {
  // The user declined, or the app is misconfigured.
  history.replaceState({}, "", REDIRECT_URI);
  render({
    signedIn: false,
    message: `Sign-in failed: ${params.get("error_description") ?? params.get("error")}`,
  });
} else if (params.has("code")) {
  handleCallback(params);
} else if (savedToken) {
  showProfile(savedToken); // still signed in from a previous visit
}

/*
      Left out on purpose, in rough order of when you'll want them:

      - Discovery. GET /.well-known/oauth-authorization-server returns every
        endpoint, grant type, and scope this server supports. Reading it at
        startup means you don't hardcode URLs that may move, and you can check
        what's actually supported instead of guessing. Worth noting from that
        document: token_endpoint_auth_methods_supported includes "none", which
        is what says a public client like this page is allowed; and the only
        response type is "code", so there's no implicit flow to fall back to.
      - Refreshing. The token response includes expires_in. Store the expiry,
        and when it passes, POST grant_type=refresh_token to the token endpoint
        instead of sending the user through the redirect again.
      - Token storage. localStorage is the common choice for a demo, and it means
        any XSS on your page can read the token. A variable in memory plus a
        silent refresh on load is the stricter version; a backend that holds the
        token and sets a cookie is stricter still.
      - Concurrency. Two tabs both refreshing at once will race.
    */
