#!/usr/bin/env python3
"""OAuth Device Authorization Grant demo. Needs `pip install requests`."""

import sys
import time

import requests

# SECTION START: hardcoverOauthEndpoints :SECTION
# Published at /.well-known/oauth-authorization-server
DEVICE_ENDPOINT = "https://api.hardcover.app/oauth2/device"
TOKEN_ENDPOINT = "https://api.hardcover.app/oauth2/token"
REVOKE_ENDPOINT = "https://api.hardcover.app/oauth2/revoke"
GRAPHQL_ENDPOINT = "https://api.hardcover.app/v1/graphql"
# SECTION END: hardcoverOauthEndpoints :SECTION

# SECTION START: credentials :SECTION
CLIENT_ID = "163f8e7c-970a-463d-b6b4-a4e51e4cb4dd"
# SECTION END: credentials :SECTION

# SECTION START: oauthWantedScope :SECTION
SCOPE = "read:me:content"
# SECTION END: oauthWantedScope :SECTION


def main():
    # SECTION START: startDeviceAuth :SECTION
    resp = requests.post(DEVICE_ENDPOINT, data={"client_id": CLIENT_ID, "scope": SCOPE})
    resp.raise_for_status()
    device = resp.json()
    # SECTION END: startDeviceAuth :SECTION

    # SECTION START: showUserCode :SECTION
    print(f"Go to {device['verification_uri']} and enter code: {device['user_code']}")
    # optionally turn device["verification_uri_complete"] into a QR code
    # SECTION END: showUserCode :SECTION

    # SECTION START: pollForToken :SECTION
    deadline = time.monotonic() + device.get("expires_in", 900)
    interval = device.get("interval", 5)

    token = None
    while time.monotonic() < deadline:
        time.sleep(interval)

        poll = requests.post(
            TOKEN_ENDPOINT,
            data={
                "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
                "device_code": device["device_code"],
                "client_id": CLIENT_ID,
            },
        )
        body = poll.json()

        if poll.ok:
            token = body
            break

        # authorization_pending: keep polling
        # slow_down: also keep polling, a real client should add `interval` seconds to its wait each time it sees this
        error = body.get("error")
        if error not in ("authorization_pending", "slow_down"):
            sys.exit(f"sign-in failed: {error}")
        if error == "slow_down":
            interval += 5

    if token is None:
        sys.exit("sign-in failed: timed out waiting for approval")
    # SECTION END: pollForToken :SECTION

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


if __name__ == "__main__":
    main()
