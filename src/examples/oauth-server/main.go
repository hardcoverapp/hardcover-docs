package main

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

// SECTION START: hardcoverOauthEndpoints :SECTION
// Values can come from discovery
// https://api.hardcover.app/.well-known/oauth-authorization-server
const (
	AuthorizeEndpoint = "https://hardcover.app/oauth2/authorize"
	TokenEndpoint     = "https://api.hardcover.app/oauth2/token"
	RevokeEndpoint    = "https://api.hardcover.app/oauth2/revoke"
	GraphQLEndpoint   = "https://api.hardcover.app/v1/graphql"
	// SECTION START: oauthIssuer :SECTION
	Issuer = "https://api.hardcover.app"
	// SECTION END: oauthIssuer :SECTION
)

// SECTION END: hardcoverOauthEndpoints :SECTION

const PORT = 8080

// SECTION START: credentials :SECTION
// Client secret lives on the server only! It must never reach the browser
var (
	ClientID     = mustEnv("HARDCOVER_CLIENT_ID")
	ClientSecret = mustEnv("HARDCOVER_CLIENT_SECRET")
)

// SECTION END: credentials :SECTION

// SECTION START: oauthReturnAddress :SECTION
var Host = fmt.Sprintf("http://localhost:%d", PORT)
var RedirectURI = fmt.Sprintf("%s/callback", Host)

// SECTION END: oauthReturnAddress :SECTION

// SECTION START: oauthWantedScope :SECTION
const Scope = "read:me:content"

// SECTION END: oauthWantedScope :SECTION

func mustEnv(name string) string {
	v := os.Getenv(name)
	if v == "" {
		log.Fatalf("missing required env var %s", name)
	}
	return v
}

func randomString(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		log.Fatal(err)
	}
	return base64.RawURLEncoding.EncodeToString(b)
}

func challenge(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

type Token struct {
	AccessToken  string
	RefreshToken string
	ExpiresAt    time.Time
}

// Stand-in for wherever you actually keep sessions (a DB row, a signed http-only cookie, etc.) Global + in-memory so this stays a single file
// Probably better to key of of session, but this makes it simpler for the demo
var (
	tokensMu sync.Mutex
	tokens   = map[string]Token{} // state -> tokens
)

// One pending login per state value
var (
	pendingMu sync.Mutex
	pending   = map[string]string{} // session -> verifier
)

func main() {
	http.HandleFunc("/", handleHome)
	http.HandleFunc("/login", handleLogin)
	http.HandleFunc("/callback", handleCallback)
	http.HandleFunc("/logout", handleLogout)

	log.Printf("listening on %s\n", Host)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", PORT), nil))
}

func getSession(r *http.Request) string {
	sessionCookie, err := r.Cookie("session")
	if err == http.ErrNoCookie || sessionCookie == nil || sessionCookie.Value == "" {
		return ""
	}

	return sessionCookie.Value
}

func handleHome(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	session := getSession(r)
	if session == "" {
		fmt.Fprint(w, `<a href="/login">Sign in with Hardcover</a>`)
		return
	}

	tokensMu.Lock()
	token := tokens[session]
	tokensMu.Unlock()

	if token.AccessToken == "" {
		fmt.Fprint(w, `<a href="/login">Sign in with Hardcover</a>`)
		return
	}

	if token.ExpiresAt.Before(time.Now()) {
		// Handle refresh here
		fmt.Fprint(w, `Your session expired. <a href="/login">Sign in again</a>.`)
		return
	}

	name, username, err := fetchProfile(token.AccessToken)
	if err != nil {
		// Usually a saved token that has been revoked since last visit
		tokensMu.Lock()
		delete(tokens, session)
		tokensMu.Unlock()
		fmt.Fprint(w, `Your session expired. <a href="/login">Sign in again</a>.`)
		return
	}

	fmt.Fprintf(w, `Signed in as %s (@%s). <a href="/logout">Sign out</a>`, name, username)
}

// step 1/2: prep and send the user

func handleLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	// SECTION START: setupValues :SECTION
	state := randomString(24)
	verifier := randomString(32)
	codeChallenge := challenge(verifier)
	// SECTION END: setupValues :SECTION

	// SECTION START: storeSecrets :SECTION
	pendingMu.Lock()
	pending[state] = verifier
	pendingMu.Unlock()
	// SECTION END: storeSecrets :SECTION

	// SECTION START: prepParams :SECTION
	params := url.Values{
		"response_type":         {"code"},
		"client_id":             {ClientID},
		"redirect_uri":          {RedirectURI},
		"state":                 {state},
		"code_challenge":        {codeChallenge},
		"code_challenge_method": {"S256"},
		"scope":                 {Scope},
	}
	// SECTION END: prepParams :SECTION

	// SECTION START: sendUser :SECTION
	http.Redirect(w, r, AuthorizeEndpoint+"?"+params.Encode(), http.StatusFound)
	// SECTION END: sendUser :SECTION
}

// step 4: catch and verify the user

func handleCallback(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	q := r.URL.Query()

	if errParam := q.Get("error"); errParam != "" {
		// The user declined, or the app is misconfigured
		http.Error(w, "sign-in failed: "+q.Get("error_description"), http.StatusBadRequest)
		return
	}

	// SECTION START: fetchSecrets :SECTION
	state := q.Get("state")
	pendingMu.Lock()
	verifier, ok := pending[state]
	delete(pending, state)
	pendingMu.Unlock()
	// SECTION END: fetchSecrets :SECTION

	// SECTION START: checkState :SECTION
	if !ok || q.Get("code") == "" {
		http.Error(w, "sign-in failed: unexpected callback, try again", http.StatusBadRequest)
		return
	}
	// SECTION END: checkState :SECTION

	// SECTION START: checkIssuer :SECTION
	if q.Get("iss") != Issuer {
		http.Error(w, "sign-in failed: response came from the wrong issuer", http.StatusBadRequest)
		return
	}
	// SECTION END: checkIssuer :SECTION

	// step 5: trade for the token

	// SECTION START: exchangeCode :SECTION
	form := url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {q.Get("code")},
		"redirect_uri":  {RedirectURI}, // must match step 2 exactly
		"code_verifier": {verifier},
	}
	req, _ := http.NewRequest(http.MethodPost, TokenEndpoint, strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.SetBasicAuth(ClientID, ClientSecret)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, "sign-in failed: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	var token struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		ExpiresIn    int    `json:"expires_in"`
		Error        string `json:"error"`
		ErrorDesc    string `json:"error_description"`
	}
	json.NewDecoder(resp.Body).Decode(&token)

	if resp.StatusCode != http.StatusOK || token.Error != "" {
		// Read this one. Nearly every first-run failure lands here, usually a redirect_uri that doesn't match what's registered
		http.Error(w, "sign-in failed: "+token.ErrorDesc, http.StatusBadGateway)
		return
	}
	// SECTION END: exchangeCode :SECTION

	// Set a session so we know how they are
	session := randomString(32)
	http.SetCookie(w, &http.Cookie{
		Name:  "session",
		Value: session,

		HttpOnly: true,
	})

	// SECTION START: storingToken :SECTION
	tokensMu.Lock()
	tokens[session] = Token{
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		ExpiresAt:    time.Now().Add(time.Duration(token.ExpiresIn) * time.Second),
	}
	tokensMu.Unlock()
	// SECTION END: storingToken :SECTION

	http.Redirect(w, r, "/", http.StatusFound)
}

// step 6: use the token

func fetchProfile(accessToken string) (name, username string, err error) {
	// SECTION START: useAPI :SECTION
	body, _ := json.Marshal(map[string]string{
		"query": "{ me { id username name } }",
	})
	req, _ := http.NewRequest(http.MethodPost, GraphQLEndpoint, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	var result struct {
		Data struct {
			Me []struct {
				Name     string `json:"name"`
				Username string `json:"username"`
			} `json:"me"`
		} `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	// SECTION END: useAPI :SECTION

	if len(result.Data.Me) == 0 {
		return "", "", fmt.Errorf("no profile returned")
	}
	me := result.Data.Me[0]

	return me.Name, me.Username, nil
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")

	session := getSession(r)
	if session == "" {
		http.Redirect(w, r, "/", http.StatusFound)
		return
	}

	tokensMu.Lock()
	token := tokens[session]
	delete(tokens, session)
	tokensMu.Unlock()

	// Optional, but tells the server the token is dead now instead of leaving it valid until it expires
	if token.RefreshToken != "" {
		// SECTION START: revokingToken :SECTION
		form := url.Values{
			"token":           {token.RefreshToken},
			"token_type_hint": {"refresh_token"},
		}
		req, _ := http.NewRequest(http.MethodPost, RevokeEndpoint, strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		req.SetBasicAuth(ClientID, ClientSecret)
		go http.DefaultClient.Do(req)
		// SECTION END: revokingToken :SECTION
	}

	http.Redirect(w, r, "/", http.StatusFound)
}
