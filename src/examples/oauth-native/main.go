package main

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os/exec"
	"runtime"
)

// SECTION START: hardcoverOauthEndpoints :SECTION
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

// SECTION START: credentials :SECTION
// Public client (no secret). Anyone can pull this out of the compiled binary, which is exactly why a native app can't be trusted with a secret
const ClientID = "163f8e7c-970a-463d-b6b4-a4e51e4cb4dd"

// SECTION END: credentials :SECTION

// SECTION START: oauthWantedScope :SECTION
const Scope = "read:me:content"

// SECTION END: oauthWantedScope :SECTION

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

func openBrowser(target string) {
	name := "xdg-open"
	switch runtime.GOOS {
	case "darwin":
		name = "open"
	case "windows":
		name = "start"
	}
	_ = exec.Command(name, target).Start() // best effort -- we printed the link too
}

func main() {
	// SECTION START: oauthReturnAddress :SECTION
	// Bind to any free loopback port.
	// Hardcover matches loopback redirect URIs by scheme/host/path only, so the registered URI doesn't need to name a specific port
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	port := listener.Addr().(*net.TCPAddr).Port
	redirectURI := fmt.Sprintf("http://127.0.0.1:%d/callback", port)
	// SECTION END: oauthReturnAddress :SECTION

	// SECTION START: setupValues :SECTION
	state := randomString(24)
	verifier := randomString(32)
	codeChallenge := challenge(verifier)
	// SECTION END: setupValues :SECTION

	// SECTION START: prepParams :SECTION
	params := url.Values{
		"response_type":         {"code"},
		"client_id":             {ClientID},
		"redirect_uri":          {redirectURI},
		"state":                 {state},
		"code_challenge":        {codeChallenge},
		"code_challenge_method": {"S256"},
		"scope":                 {Scope},
	}
	authURL := AuthorizeEndpoint + "?" + params.Encode()
	// SECTION END: prepParams :SECTION

	// SECTION START: sendUser :SECTION
	fmt.Println("Open this URL and approve access:", authURL)
	openBrowser(authURL)
	// SECTION END: sendUser :SECTION

	// SECTION START: fetchSecrets :SECTION
	q := awaitCallback(listener) // blocks until the browser hits us back
	// SECTION END: fetchSecrets :SECTION

	// SECTION START: checkState :SECTION
	if q.Get("code") == "" || q.Get("state") != state {
		log.Fatal("sign-in failed: unexpected callback, try again")
	}
	// SECTION END: checkState :SECTION

	// SECTION START: checkIssuer :SECTION
	if q.Get("iss") != Issuer {
		log.Fatal("sign-in failed: response came from the wrong issuer")
	}
	// SECTION END: checkIssuer :SECTION

	// SECTION START: exchangeCode :SECTION
	form := url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {q.Get("code")},
		"redirect_uri":  {redirectURI}, // must match step 2 exactly, port included
		"code_verifier": {verifier},
		"client_id":     {ClientID}, // no secret -- PKCE alone authenticates a public client
	}
	resp, err := http.PostForm(TokenEndpoint, form)
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()

	var token struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		Error        string `json:"error"`
		ErrorDesc    string `json:"error_description"`
	}
	json.NewDecoder(resp.Body).Decode(&token)

	if resp.StatusCode != http.StatusOK || token.Error != "" {
		// Read this one. Nearly every first-run failure lands here, usually a redirect_uri that doesn't match what's registered
		log.Fatalf("sign-in failed: %s", token.ErrorDesc)
	}
	// SECTION END: exchangeCode :SECTION

	// SECTION START: storingToken :SECTION
	// A CLI/desktop app should put these in the OS keychain, not a plain file (e.g. github.com/zalando/go-keyring)
	saveToKeychain(token.AccessToken, token.RefreshToken)
	// SECTION END: storingToken :SECTION

	// SECTION START: useAPI :SECTION
	body, _ := json.Marshal(map[string]string{"query": "{ me { id username name } }"})
	req, _ := http.NewRequest(http.MethodPost, GraphQLEndpoint, bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)

	apiResp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	defer apiResp.Body.Close()
	out, _ := io.ReadAll(apiResp.Body)
	fmt.Println(string(out))
	// SECTION END: useAPI :SECTION

	// SECTION START: revokingToken :SECTION
	http.PostForm(RevokeEndpoint, url.Values{
		"token":           {token.RefreshToken},
		"token_type_hint": {"refresh_token"},
		"client_id":       {ClientID},
	})
	// SECTION END: revokingToken :SECTION
}

// awaitCallback blocks until the browser hits our one-shot listener, then shuts it down
func awaitCallback(listener net.Listener) url.Values {
	result := make(chan url.Values, 1)
	srv := &http.Server{
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			fmt.Fprint(w, "Signed in, you can close this tab.")
			result <- r.URL.Query()
		}),
	}
	go srv.Serve(listener)
	q := <-result
	go srv.Close()
	return q
}

func saveToKeychain(accessToken, refreshToken string) {
	// left as an exercise -- e.g. github.com/zalando/go-keyring
}
