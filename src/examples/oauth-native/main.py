#!/usr/bin/env python3
"""OAuth native/desktop client demo (loopback redirect + PKCE). Needs `pip install requests`."""

import base64
import hashlib
import http.server
import secrets
import sys
import time
import urllib.parse
import webbrowser

import requests

# SECTION START: hardcoverOauthEndpoints :SECTION
AUTHORIZE_ENDPOINT = "https://hardcover.app/oauth2/authorize"
TOKEN_ENDPOINT = "https://api.hardcover.app/oauth2/token"
REVOKE_ENDPOINT = "https://api.hardcover.app/oauth2/revoke"
GRAPHQL_ENDPOINT = "https://api.hardcover.app/v1/graphql"
# SECTION START: oauthIssuer :SECTION
ISSUER = "https://api.hardcover.app"
# SECTION END: oauthIssuer :SECTION
# SECTION END: hardcoverOauthEndpoints :SECTION

# SECTION START: credentials :SECTION
# Public client (no secret). Anyone can pull this out of the installed app, which is exactly why a native app can't be trusted with a secret
CLIENT_ID = "163f8e7c-970a-463d-b6b4-a4e51e4cb4dd"
# SECTION END: credentials :SECTION

# SECTION START: oauthWantedScope :SECTION
SCOPE = "read:me:content"
# SECTION END: oauthWantedScope :SECTION


def random_string(n_bytes):
    return base64.urlsafe_b64encode(secrets.token_bytes(n_bytes)).rstrip(b"=").decode()


def challenge(verifier):
    digest = hashlib.sha256(verifier.encode()).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()


class CallbackHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"Signed in, you can close this tab.")
        self.server.query = urllib.parse.parse_qs(
            urllib.parse.urlparse(self.path).query
        )

    def log_message(self, format, *args):
        pass  # keep stdout clean


def await_callback(server):
    server.handle_request()  # blocks until the browser hits us back, handles exactly one request
    return {k: v[0] for k, v in server.query.items()}


def main():
    # SECTION START: oauthReturnAddress :SECTION
    # Bind to any free loopback port.
    # Hardcover matches loopback redirect URIs by scheme/host/path only, so the registered URI doesn't need to name a specific port
    server = http.server.HTTPServer(("127.0.0.1", 0), CallbackHandler)
    port = server.server_address[1]
    redirect_uri = f"http://127.0.0.1:{port}/callback"
    # SECTION END: oauthReturnAddress :SECTION

    # SECTION START: setupValues :SECTION
    state = random_string(24)
    verifier = random_string(32)
    code_challenge = challenge(verifier)
    # SECTION END: setupValues :SECTION

    # SECTION START: prepParams :SECTION
    params = urllib.parse.urlencode(
        {
            "response_type": "code",
            "client_id": CLIENT_ID,
            "redirect_uri": redirect_uri,
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
            "scope": SCOPE,
        }
    )
    auth_url = f"{AUTHORIZE_ENDPOINT}?{params}"
    # SECTION END: prepParams :SECTION

    # SECTION START: sendUser :SECTION
    print("Open this URL and approve access:", auth_url)
    webbrowser.open(auth_url)
    # SECTION END: sendUser :SECTION

    # SECTION START: fetchSecrets :SECTION
    q = await_callback(server)
    # SECTION END: fetchSecrets :SECTION

    # SECTION START: checkState :SECTION
    if not q.get("code") or q.get("state") != state:
        sys.exit("sign-in failed: unexpected callback, try again")
    # SECTION END: checkState :SECTION

    # SECTION START: checkIssuer :SECTION
    if q.get("iss") != ISSUER:
        sys.exit("sign-in failed: response came from the wrong issuer")
    # SECTION END: checkIssuer :SECTION

    # SECTION START: exchangeCode :SECTION
    resp = requests.post(
        TOKEN_ENDPOINT,
        data={
            "grant_type": "authorization_code",
            "code": q["code"],
            "redirect_uri": redirect_uri,  # must match step 2 exactly, port included
            "code_verifier": verifier,
            "client_id": CLIENT_ID,  # no secret -- PKCE alone authenticates a public client
        },
    )
    token = resp.json()

    if not resp.ok:
        # Read this one. Nearly every first-run failure lands here, usually a redirect_uri that doesn't match what's registered
        sys.exit(
            f"sign-in failed: {token.get('error_description', token.get('error'))}"
        )
    # SECTION END: exchangeCode :SECTION

    # SECTION START: storingToken :SECTION
    # A CLI/desktop app should put these in the OS keychain, not a plain file (e.g. the `keyring` package)
    save_to_keychain(token["access_token"], token["refresh_token"])
    # SECTION END: storingToken :SECTION

    # SECTION START: useAPI :SECTION
    api = requests.post(
        GRAPHQL_ENDPOINT,
        headers={"Authorization": f"Bearer {token['access_token']}"},
        json={"query": "{ me { id username name } }"},
    )
    print(api.text)
    # SECTION END: useAPI :SECTION

    # SECTION START: revokingToken :SECTION
    requests.post(
        REVOKE_ENDPOINT,
        data={
            "token": token["refresh_token"],
            "token_type_hint": "refresh_token",
            "client_id": CLIENT_ID,
        },
    )
    # SECTION END: revokingToken :SECTION


def save_to_keychain(access_token, refresh_token):
    pass  # left as an exercise -- e.g. the `keyring` package


if __name__ == "__main__":
    main()
