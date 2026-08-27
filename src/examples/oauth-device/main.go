package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"time"
)

// SECTION START: hardcoverOauthEndpoints :SECTION
const (
	DeviceEndpoint  = "https://api.hardcover.app/oauth2/device"
	TokenEndpoint   = "https://api.hardcover.app/oauth2/token"
	RevokeEndpoint  = "https://api.hardcover.app/oauth2/revoke"
	GraphQLEndpoint = "https://api.hardcover.app/v1/graphql"
)

// SECTION END: hardcoverOauthEndpoints :SECTION

// SECTION START: credentials :SECTION
// Public client (no secret)
const ClientID = "your-client-id"

// SECTION END: credentials :SECTION

// SECTION START: oauthWantedScope :SECTION
const Scope = "read:me:content"

// SECTION END: oauthWantedScope :SECTION

func main() {
	// SECTION START: startDeviceAuth :SECTION
	resp, err := http.PostForm(DeviceEndpoint, url.Values{
		"client_id": {ClientID},
		"scope":     {Scope},
	})
	if err != nil {
		log.Fatal(err)
	}
	defer resp.Body.Close()

	var device struct {
		DeviceCode              string `json:"device_code"`
		UserCode                string `json:"user_code"`
		VerificationURI         string `json:"verification_uri"`
		VerificationURIComplete string `json:"verification_uri_complete"`
		ExpiresIn               int    `json:"expires_in"`
		Interval                int    `json:"interval"`
	}
	json.NewDecoder(resp.Body).Decode(&device)
	// SECTION END: startDeviceAuth :SECTION

	// SECTION START: showUserCode :SECTION
	fmt.Printf("Go to %s and enter code: %s\n", device.VerificationURI, device.UserCode)
	// or turn device.VerificationURIComplete into a QR code
	// SECTION END: showUserCode :SECTION

	// SECTION START: pollForToken :SECTION
	deadline := time.Now().Add(time.Duration(device.ExpiresIn) * time.Second)
	interval := time.Duration(device.Interval) * time.Second

	var token struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		Error        string `json:"error"`
	}
	for time.Now().Before(deadline) {
		pollResp, err := http.PostForm(TokenEndpoint, url.Values{
			"grant_type":  {"urn:ietf:params:oauth:grant-type:device_code"},
			"device_code": {device.DeviceCode},
			"client_id":   {ClientID},
		})
		if err != nil {
			log.Fatal(err)
		}
		json.NewDecoder(pollResp.Body).Decode(&token)
		pollResp.Body.Close()

		if token.AccessToken != "" {
			break
		}
		// authorization_pending: keep polling
		// slow_down: also keep polling, a real client should add `interval` seconds to its wait each time it sees this
		// Anything else means give up
		if token.Error != "authorization_pending" && token.Error != "slow_down" {
			log.Fatalf("sign-in failed: %s", token.Error)
		}

		time.Sleep(interval)
	}
	if token.AccessToken == "" {
		log.Fatal("sign-in failed: timed out waiting for approval")
	}
	// SECTION END: pollForToken :SECTION

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
