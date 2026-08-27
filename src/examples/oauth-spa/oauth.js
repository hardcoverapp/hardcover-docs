// SECTION START: clientId :SECTION
const CLIENT_ID = "64003fc6-9a33-4787-b80b-4827f40d46c6";
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

// entry point

function main() {
  signInBtn.addEventListener("click", signIn);
  signOutBtn.addEventListener("click", signOut);

  const params = new URLSearchParams(location.search);
  const savedToken = localStorage.getItem("oauth_token")?.access_token;

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
}

// step 1/2: prep and send the user

async function signIn() {
  // SECTION START: setupValues :SECTION
  const state = randomString(24);
  const verifier = randomString(32);
  const challenge_code = await sha256(verifier);
  // SECTION END: setupValues :SECTION

  // SECTION START: storeSecrets :SECTION
  sessionStorage.setItem("pkce_verifier", verifier);
  sessionStorage.setItem("oauth_state", state);
  // SECTION END: storeSecrets :SECTION

  // SECTION START: prepParams :SECTION
  const queryParams = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state: state,
    code_challenge: challenge_code,
    code_challenge_method: "S256",
    scope: SCOPE,
  });
  // SECTION END: prepParams :SECTION

  // SECTION START: sendUser :SECTION
  location.href = `${AUTHORIZE_ENDPOINT}?${queryParams}`;
  // SECTION END: sendUser :SECTION
}

// step 4: catch and verify the user

async function handleCallback(params) {
  // SECTION START: fetchSecrets :SECTION
  const state = sessionStorage.getItem("oauth_state");
  const verifier = sessionStorage.getItem("pkce_verifier");
  sessionStorage.removeItem("oauth_state");
  sessionStorage.removeItem("pkce_verifier");

  history.replaceState({}, "", REDIRECT_URI); // drop ?code= so a refresh can't replay it
  // SECTION END: fetchSecrets :SECTION

  // SECTION START: checkState :SECTION
  if (!verifier || params.get("state") !== state) {
    render({
      signedIn: false,
      message: "Sign-in failed: unexpected callback. Try again.",
    });
    return;
  }
  // SECTION END: checkState :SECTION

  // SECTION START: checkIssuer :SECTION
  if (params.get("iss") !== ISSUER) {
    render({
      signedIn: false,
      message: "Sign-in failed: response came from the wrong issuer.",
    });
    return;
  }
  // SECTION END: checkIssuer :SECTION

  // step 5: trade for the token

  // SECTION START: exchangeCode :SECTION
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: params.get("code"),
      redirect_uri: REDIRECT_URI, // must match step 2 exactly
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });
  const token = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Read this one. Nearly every first-run failure lands here, usually a redirect_uri that doesn't match what's registered.
    render({
      signedIn: false,
      message: `Sign-in failed: ${token.error_description ?? token.error ?? res.status}`,
    });
    return;
  }
  // SECTION END: exchangeCode :SECTION

  // SECTION START: storingToken :SECTION
  localStorage.setItem("oauth_token", token);
  // SECTION END: storingToken :SECTION
  showProfile(token.access_token);
}

// step 6: use the token

async function showProfile(accessToken) {
  // SECTION START: useAPI :SECTION
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
  // SECTION END: useAPI :SECTION

  if (!user) {
    // Usually a saved token that has expired or been revoked since last visit.
    localStorage.removeItem("oauth_token");
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

// sign out

async function signOut() {
  const accessToken = localStorage.getItem("oauth_token")?.access_token;
  localStorage.removeItem("oauth_token");
  render({ signedIn: false, message: "Signed out." });

  // Optional, but tells the server the token is dead now instead of leaving
  // it valid until it expires.
  if (accessToken) {
    // SECTION START: revokingToken :SECTION
    fetch(REVOKE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token: accessToken,
        token_type_hint: "access_token",
        client_id: CLIENT_ID,
      }),
    }).catch(() => {});
    // SECTION END: revokingToken :SECTION
  }
}

main();
