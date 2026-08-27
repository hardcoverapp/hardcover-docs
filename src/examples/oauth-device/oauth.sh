#!/usr/bin/env bash
# Needs curl. Paste this in block by block, or run the whole thing with `bash oauth.sh`.

# SECTION START: hardcoverOauthEndpoints :SECTION
DEVICE_ENDPOINT="https://api.hardcover.app/oauth2/device"
TOKEN_ENDPOINT="https://api.hardcover.app/oauth2/token"
REVOKE_ENDPOINT="https://api.hardcover.app/oauth2/revoke"
GRAPHQL_ENDPOINT="https://api.hardcover.app/v1/graphql"
# SECTION END: hardcoverOauthEndpoints :SECTION

# SECTION START: credentials :SECTION
CLIENT_ID="your-client-id"
# SECTION END: credentials :SECTION

# SECTION START: oauthWantedScope :SECTION
SCOPE="read:me:content"
# SECTION END: oauthWantedScope :SECTION

field() { grep -o "\"$2\":\"[^\"]*\"" <<<"$1" | cut -d'"' -f4; }
number() { grep -o "\"$2\":[0-9]*" <<<"$1" | cut -d: -f2; }

# SECTION START: startDeviceAuth :SECTION
DEVICE_RESPONSE=$(curl -s "$DEVICE_ENDPOINT" \
  --data-urlencode "client_id=${CLIENT_ID}" \
  --data-urlencode "scope=${SCOPE}")

DEVICE_CODE=$(field "$DEVICE_RESPONSE" device_code)
USER_CODE=$(field "$DEVICE_RESPONSE" user_code)
VERIFICATION_URI=$(field "$DEVICE_RESPONSE" verification_uri)
INTERVAL=$(number "$DEVICE_RESPONSE" interval)
# SECTION END: startDeviceAuth :SECTION

# SECTION START: showUserCode :SECTION
echo "Go to $VERIFICATION_URI and enter code: $USER_CODE"
# SECTION END: showUserCode :SECTION

# SECTION START: pollForToken :SECTION
while :; do
  sleep "$INTERVAL"

  TOKEN_RESPONSE=$(curl -s "$TOKEN_ENDPOINT" \
    --data-urlencode "grant_type=urn:ietf:params:oauth:grant-type:device_code" \
    --data-urlencode "device_code=${DEVICE_CODE}" \
    --data-urlencode "client_id=${CLIENT_ID}")

  ACCESS_TOKEN=$(field "$TOKEN_RESPONSE" access_token)
  [ -n "$ACCESS_TOKEN" ] && break

  # authorization_pending: keep polling.
  # slow_down: also keep polling, a real client should add a few seconds to $INTERVAL each time it sees this.
  ERROR=$(field "$TOKEN_RESPONSE" error)
  [ "$ERROR" = "authorization_pending" ] || [ "$ERROR" = "slow_down" ] || {
    echo "sign-in failed: $ERROR" >&2
    break
  }
done

REFRESH_TOKEN=$(field "$TOKEN_RESPONSE" refresh_token)
# SECTION END: pollForToken :SECTION

# SECTION START: useAPI :SECTION
curl -s "$GRAPHQL_ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -d '{"query": "{ me { id username name } }"}'
# SECTION END: useAPI :SECTION

# SECTION START: revokingToken :SECTION
curl -s "$REVOKE_ENDPOINT" \
  --data-urlencode "token=${REFRESH_TOKEN}" \
  --data-urlencode "token_type_hint=refresh_token" \
  --data-urlencode "client_id=${CLIENT_ID}"
# SECTION END: revokingToken :SECTION
