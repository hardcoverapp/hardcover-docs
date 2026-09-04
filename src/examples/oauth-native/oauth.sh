#!/usr/bin/env bash
# Needs curl and openssl. Paste this in block by block, or run the whole thing with `bash oauth.sh`.

# SECTION START: hardcoverOauthEndpoints :SECTION
AUTHORIZE_ENDPOINT="https://hardcover.app/oauth2/authorize"
TOKEN_ENDPOINT="https://api.hardcover.app/oauth2/token"
REVOKE_ENDPOINT="https://api.hardcover.app/oauth2/revoke"
GRAPHQL_ENDPOINT="https://api.hardcover.app/v1/graphql"
# SECTION START: oauthIssuer :SECTION
ISSUER="https://api.hardcover.app"
# SECTION END: oauthIssuer :SECTION
# SECTION END: hardcoverOauthEndpoints :SECTION

# SECTION START: credentials :SECTION
# Public client (no secret), PKCE is what proves this request is legit.
CLIENT_ID="163f8e7c-970a-463d-b6b4-a4e51e4cb4dd"
# SECTION END: credentials :SECTION

# SECTION START: oauthReturnAddress :SECTION
# A fixed port, since this script isn't actually listening on anything.
# Hardcover ignores the port on loopback redirect URIs, so any value works.
REDIRECT_URI="http://127.0.0.1:8080/callback"
# SECTION END: oauthReturnAddress :SECTION

# SECTION START: oauthWantedScope :SECTION
SCOPE="read:me:content"
# SECTION END: oauthWantedScope :SECTION

# pulls "name" out of a flat JSON response like {"name":"value"}
field() { grep -o "\"$2\":\"[^\"]*\"" <<<"$1" | cut -d'"' -f4; }

# SECTION START: setupValues :SECTION
STATE=$(openssl rand -base64 24 | tr '+/' '-_' | tr -d '=')
VERIFIER=$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=')
CODE_CHALLENGE=$(printf '%s' "$VERIFIER" | openssl dgst -sha256 -binary | openssl base64 | tr '+/' '-_' | tr -d '=')
# SECTION END: setupValues :SECTION

# SECTION START: prepParams :SECTION
AUTH_URL="${AUTHORIZE_ENDPOINT}?\
response_type=code&\
client_id=${CLIENT_ID}&\
redirect_uri=${REDIRECT_URI}&\
state=${STATE}&\
code_challenge=${CODE_CHALLENGE}&\
code_challenge_method=S256&\
scope=${SCOPE}"
# SECTION END: prepParams :SECTION

# SECTION START: sendUser :SECTION
echo "$AUTH_URL"
# SECTION END: sendUser :SECTION

echo "open that URL and approve. Nothing is actually listening on port 8080, so the browser will show a connection error, but it'll still be sitting on the right URL, copy code/state/iss out of its address bar"
read -rp "code: " REPLY_CODE
read -rp "state: " REPLY_STATE
read -rp "iss: " REPLY_ISS

# SECTION START: fetchSecrets :SECTION
CODE="$REPLY_CODE"
RETURNED_STATE="$REPLY_STATE"
ISS="$REPLY_ISS"
# SECTION END: fetchSecrets :SECTION

# SECTION START: checkState :SECTION
[ "$RETURNED_STATE" = "$STATE" ] || echo "state mismatch, stop here"
# SECTION END: checkState :SECTION

# SECTION START: checkIssuer :SECTION
[ "$ISS" = "$ISSUER" ] || echo "wrong issuer, stop here"
# SECTION END: checkIssuer :SECTION

# SECTION START: exchangeCode :SECTION
TOKEN_RESPONSE=$(curl -s "$TOKEN_ENDPOINT" \
  --data-urlencode "grant_type=authorization_code" \
  --data-urlencode "code=${CODE}" \
  --data-urlencode "redirect_uri=${REDIRECT_URI}" \
  --data-urlencode "code_verifier=${VERIFIER}" \
  --data-urlencode "client_id=${CLIENT_ID}")
echo "$TOKEN_RESPONSE"
# SECTION END: exchangeCode :SECTION

# SECTION START: storingToken :SECTION
ACCESS_TOKEN=$(field "$TOKEN_RESPONSE" access_token)
REFRESH_TOKEN=$(field "$TOKEN_RESPONSE" refresh_token)
# SECTION END: storingToken :SECTION

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
