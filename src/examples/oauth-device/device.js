// SECTION START: hardcoverOauthEndpoints :SECTION
// Published at /.well-known/oauth-authorization-server
const DEVICE_ENDPOINT = "https://api.hardcover.app/oauth2/device";
const TOKEN_ENDPOINT = "https://api.hardcover.app/oauth2/token";
const REVOKE_ENDPOINT = "https://api.hardcover.app/oauth2/revoke";
const GRAPHQL_ENDPOINT = "https://api.hardcover.app/v1/graphql";
// SECTION END: hardcoverOauthEndpoints :SECTION

// SECTION START: credentials :SECTION
const CLIENT_ID = "163f8e7c-970a-463d-b6b4-a4e51e4cb4dd";
// SECTION END: credentials :SECTION

// SECTION START: oauthWantedScope :SECTION
const SCOPE = "read:me:content";
// SECTION END: oauthWantedScope :SECTION

const signInBtn = document.getElementById("sign-in");
const signOutBtn = document.getElementById("sign-out");
const cancelBtn = document.getElementById("cancel");
const panel = document.getElementById("panel");
const userCodeEl = document.getElementById("user-code");
const verificationUriEl = document.getElementById("verification-uri");
const directLinkEl = document.getElementById("direct-link");
const statusEl = document.getElementById("status");

// lets Cancel abort an in-flight poll
let controller = null;

// helpers

async function postForm(url, params, signal) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    // fetch rejects with an opaque TypeError on a CORS failure
    throw new Error(`Couldn't reach ${new URL(url).pathname}`);
  }
  return { res, body: await res.json().catch(() => ({})) };
}

// Resolves after ms, or immediately if the user hits Cancel
const wait = (ms, signal) =>
  new Promise((resolve) => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(id);
        resolve();
      },
      { once: true },
    );
  });

// ui helper

function render({ signedIn = false, polling = false, message = "" }) {
  statusEl.textContent = message;
  panel.hidden = !polling;
  signInBtn.hidden = signedIn || polling;
  signOutBtn.hidden = !signedIn;
}

// entry point

function main() {
  signInBtn.addEventListener("click", signIn);
  signOutBtn.addEventListener("click", signOut);
  cancelBtn.addEventListener("click", () => controller?.abort());

  const savedToken = localStorage.getItem("access_token");
  if (savedToken) showProfile(savedToken);
}

// step 1: ask for a code

async function signIn() {
  controller = new AbortController();
  render({ polling: true, message: "Requesting a code" });

  try {
    const device = await requestDeviceCode(controller.signal);
    displayCode(device);
    render({ polling: true, message: "Waiting for approval" });

    const token = await pollForToken(device, controller.signal);
    localStorage.setItem("access_token", token.access_token);
    await showProfile(token.access_token);
  } catch (err) {
    if (err.name === "AbortError") {
      render({ message: "Cancelled." });
      return;
    }
    render({ message: err.message });
  }
}

async function requestDeviceCode(signal) {
  // SECTION START: startDeviceAuth :SECTION
  const { res, body } = await postForm(
    DEVICE_ENDPOINT,
    {
      client_id: CLIENT_ID,
      scope: SCOPE,
    },
    signal,
  );

  if (!res.ok) {
    throw new Error(
      body.error_description ??
        body.error ??
        `HTTP ${res.status} from the device endpoint`,
    );
  }
  return body;
  // SECTION END: startDeviceAuth :SECTION
}

// step 2: show it

function displayCode({
  user_code,
  verification_uri,
  verification_uri_complete,
}) {
  // SECTION START: showUserCode :SECTION
  userCodeEl.textContent = user_code;
  verificationUriEl.href = verification_uri;
  verificationUriEl.textContent = verification_uri;

  // verification_uri_complete carries the code in the URL so nobody has to type it. Optional in the spec (on a e-reader this is the QR code)
  directLinkEl.textContent = "";
  if (verification_uri_complete) {
    const a = document.createElement("a");
    a.href = verification_uri_complete;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "Or open the approval page with the code filled in";
    directLinkEl.append(a);
  }
  // SECTION END: showUserCode :SECTION
}

// step 3: poll

async function pollForToken(
  { device_code, interval = 5, expires_in = 900 },
  signal,
) {
  // SECTION START: pollForToken :SECTION
  const deadline = Date.now() + expires_in * 1000;
  let delay = interval * 1000;

  while (Date.now() < deadline) {
    await wait(delay, signal);
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");

    const { res, body } = await postForm(
      TOKEN_ENDPOINT,
      {
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        device_code,
        client_id: CLIENT_ID,
      },
      signal,
    );

    if (res.ok) return body;

    // While the user is still deciding, the server answers HTTP 400 with an error body. Branch on body.error not the status code
    switch (body.error) {
      case "authorization_pending":
        break;

      case "slow_down":
        delay += 5000;
        break;

      case "access_denied":
        throw new Error("Request denied. Nothing was authorized.");

      case "expired_token":
        throw new Error("That code expired. Start again for a fresh one.");

      default:
        throw new Error(
          body.error_description ?? body.error ?? `HTTP ${res.status}`,
        );
    }
  }

  throw new Error("Timed out waiting for approval.");
  // SECTION END: pollForToken :SECTION
}

// step 4: use the token

async function showProfile(accessToken) {
  // SECTION START: useAPI :SECTION
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query: "{ me { id username name } }" }),
  });
  const body = await res.json().catch(() => ({}));
  const user = body.data?.me?.[0];
  // SECTION END: useAPI :SECTION

  if (!user) {
    // Usually a saved token that expired or was revoked since last visit
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

async function signOut() {
  const accessToken = localStorage.getItem("access_token");
  localStorage.removeItem("access_token");
  render({ message: "Signed out." });

  if (accessToken) {
    // SECTION START: revokingToken :SECTION
    postForm(
      REVOKE_ENDPOINT,
      {
        token: accessToken,
        token_type_hint: "access_token",
        client_id: CLIENT_ID,
      },
      new AbortController().signal,
    ).catch(() => {});
    // SECTION END: revokingToken :SECTION
  }
}

main();
