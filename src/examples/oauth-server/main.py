#!/usr/bin/env python3
"""OAuth confidential (server-side) client demo. Needs `pip install requests`.

Run with HARDCOVER_CLIENT_ID and HARDCOVER_CLIENT_SECRET set in the environment.
"""

import base64
import hashlib
import os
import secrets
import sys
import threading
import time
import urllib.parse
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import requests

# SECTION START: hardcoverOauthEndpoints :SECTION
# Values can come from discovery
# https://api.hardcover.app/.well-known/oauth-authorization-server
AUTHORIZE_ENDPOINT = "https://hardcover.app/oauth2/authorize"
TOKEN_ENDPOINT = "https://api.hardcover.app/oauth2/token"
REVOKE_ENDPOINT = "https://api.hardcover.app/oauth2/revoke"
GRAPHQL_ENDPOINT = "https://api.hardcover.app/v1/graphql"
# SECTION START: oauthIssuer :SECTION
ISSUER = "https://api.hardcover.app"
# SECTION END: oauthIssuer :SECTION
# SECTION END: hardcoverOauthEndpoints :SECTION

PORT = 8080


# SECTION START: credentials :SECTION
# Client secret lives on the server only! It must never reach the browser
def must_env(name):
    value = os.environ.get(name)
    if not value:
        sys.exit(f"missing required env var {name}")
    return value


CLIENT_ID = must_env("HARDCOVER_CLIENT_ID")
CLIENT_SECRET = must_env("HARDCOVER_CLIENT_SECRET")
# SECTION END: credentials :SECTION

# SECTION START: oauthReturnAddress :SECTION
HOST = f"http://localhost:{PORT}"
REDIRECT_URI = f"{HOST}/callback"
# SECTION END: oauthReturnAddress :SECTION

# SECTION START: oauthWantedScope :SECTION
SCOPE = "read:me:content"
# SECTION END: oauthWantedScope :SECTION


def random_string(n_bytes):
    return base64.urlsafe_b64encode(secrets.token_bytes(n_bytes)).rstrip(b"=").decode()


def challenge(verifier):
    digest = hashlib.sha256(verifier.encode()).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()


# Stand-in for wherever you actually keep sessions (a DB row, a signed http-only cookie, etc.) Global + in-memory so this stays a single file
# Probably better to key off of session, but this makes it simpler for the demo
tokens_lock = threading.Lock()
tokens = {}  # session -> {"access_token", "refresh_token", "expires_at"}

# One pending login per state value
pending_lock = threading.Lock()
pending = {}  # state -> verifier


class Handler(BaseHTTPRequestHandler):
    def get_session(self):
        jar = cookies.SimpleCookie(self.headers.get("Cookie", ""))
        return jar["session"].value if "session" in jar else ""

    def send_html(self, status, body):
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(body.encode())

    def redirect(self, location):
        self.send_response(302)
        self.send_header("Location", location)
        self.end_headers()

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path == "/":
            self.handle_home()
        elif path == "/login":
            self.handle_login()
        elif path == "/callback":
            self.handle_callback()
        elif path == "/logout":
            self.handle_logout()
        else:
            self.send_response(404)
            self.end_headers()

    def handle_home(self):
        session = self.get_session()
        if not session:
            return self.send_html(200, '<a href="/login">Sign in with Hardcover</a>')

        with tokens_lock:
            token = tokens.get(session)

        if not token:
            return self.send_html(200, '<a href="/login">Sign in with Hardcover</a>')

        if token["expires_at"] < time.time():
            # Handle refresh here
            return self.send_html(
                200, 'Your session expired. <a href="/login">Sign in again</a>.'
            )

        profile = fetch_profile(token["access_token"])
        if profile is None:
            # Usually a saved token that has been revoked since last visit
            with tokens_lock:
                tokens.pop(session, None)
            return self.send_html(
                200, 'Your session expired. <a href="/login">Sign in again</a>.'
            )

        name, username = profile
        self.send_html(
            200, f'Signed in as {name} (@{username}). <a href="/logout">Sign out</a>'
        )

    # step 1/2: prep and send the user

    def handle_login(self):
        # SECTION START: setupValues :SECTION
        state = random_string(24)
        verifier = random_string(32)
        code_challenge = challenge(verifier)
        # SECTION END: setupValues :SECTION

        # SECTION START: storeSecrets :SECTION
        with pending_lock:
            pending[state] = verifier
        # SECTION END: storeSecrets :SECTION

        # SECTION START: prepParams :SECTION
        params = urllib.parse.urlencode(
            {
                "response_type": "code",
                "client_id": CLIENT_ID,
                "redirect_uri": REDIRECT_URI,
                "state": state,
                "code_challenge": code_challenge,
                "code_challenge_method": "S256",
                "scope": SCOPE,
            }
        )
        # SECTION END: prepParams :SECTION

        # SECTION START: sendUser :SECTION
        self.redirect(f"{AUTHORIZE_ENDPOINT}?{params}")
        # SECTION END: sendUser :SECTION

    # step 4: catch and verify the user

    def handle_callback(self):
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        q = {k: v[0] for k, v in query.items()}

        if "error" in q:
            # The user declined, or the app is misconfigured
            return self.send_html(
                400, f"sign-in failed: {q.get('error_description', '')}"
            )

        # SECTION START: fetchSecrets :SECTION
        state = q.get("state", "")
        with pending_lock:
            verifier = pending.pop(state, None)
        # SECTION END: fetchSecrets :SECTION

        # SECTION START: checkState :SECTION
        if verifier is None or not q.get("code"):
            return self.send_html(400, "sign-in failed: unexpected callback, try again")
        # SECTION END: checkState :SECTION

        # SECTION START: checkIssuer :SECTION
        if q.get("iss") != ISSUER:
            return self.send_html(
                400, "sign-in failed: response came from the wrong issuer"
            )
        # SECTION END: checkIssuer :SECTION

        # step 5: trade for the token

        # SECTION START: exchangeCode :SECTION
        resp = requests.post(
            TOKEN_ENDPOINT,
            auth=(CLIENT_ID, CLIENT_SECRET),
            data={
                "grant_type": "authorization_code",
                "code": q["code"],
                "redirect_uri": REDIRECT_URI,  # must match step 2 exactly
                "code_verifier": verifier,
            },
        )
        token = resp.json()

        if not resp.ok:
            # Read this one. Nearly every first-run failure lands here, usually a redirect_uri that doesn't match what's registered
            return self.send_html(
                502, f"sign-in failed: {token.get('error_description', '')}"
            )
        # SECTION END: exchangeCode :SECTION

        # Set a session so we know who they are
        session = random_string(32)
        self.send_response(302)
        self.send_header("Location", "/")
        self.send_header("Set-Cookie", f"session={session}; HttpOnly")
        self.end_headers()

        # SECTION START: storingToken :SECTION
        with tokens_lock:
            tokens[session] = {
                "access_token": token["access_token"],
                "refresh_token": token["refresh_token"],
                "expires_at": time.time() + token["expires_in"],
            }
        # SECTION END: storingToken :SECTION

    def handle_logout(self):
        session = self.get_session()
        if not session:
            return self.redirect("/")

        with tokens_lock:
            token = tokens.pop(session, None)

        # Optional, but tells the server the token is dead now instead of leaving it valid until it expires
        if token and token.get("refresh_token"):
            # SECTION START: revokingToken :SECTION
            threading.Thread(
                target=lambda: requests.post(
                    REVOKE_ENDPOINT,
                    auth=(CLIENT_ID, CLIENT_SECRET),
                    data={
                        "token": token["refresh_token"],
                        "token_type_hint": "refresh_token",
                    },
                )
            ).start()
            # SECTION END: revokingToken :SECTION

        self.redirect("/")

    def log_message(self, format, *args):
        pass  # keep stdout clean


# step 6: use the token


def fetch_profile(access_token):
    # SECTION START: useAPI :SECTION
    resp = requests.post(
        GRAPHQL_ENDPOINT,
        headers={"Authorization": f"Bearer {access_token}"},
        json={"query": "{ me { id username name } }"},
    )
    result = resp.json()
    me = result.get("data", {}).get("me") or []
    # SECTION END: useAPI :SECTION

    if not me:
        return None
    return me[0]["name"], me[0]["username"]


if __name__ == "__main__":
    print(f"listening on {HOST}")
    ThreadingHTTPServer(("", PORT), Handler).serve_forever()
