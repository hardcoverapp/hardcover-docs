// Signing users in with OAuth. The session owns the tokens: it refreshes them
// before they expire, refreshes once more after a 401, never spends a refresh
// token twice, and stores each new pair before using it. Your app decides
// three things: its client id and redirect URI, which scopes to ask for, and
// where tokens are stored.
import { HardcoverClient, SignedOutError } from "@hardcover/sdk";
import { memoryStore, OAuthSession, secureStore, type SecureKeyValue } from "@hardcover/sdk/oauth";

// React Native (Expo). Pass in expo-secure-store and expo-web-browser:
//   import * as SecureStore from "expo-secure-store";
//   import { openAuthSessionAsync } from "expo-web-browser";
type OpenAuthSession = (url: string, redirectUri: string) => Promise<{ type: string; url?: string }>;

export function createSession(SecureStore: SecureKeyValue, showSignIn: () => void) {
  const session = new OAuthSession({
    clientId: "your-client-id", // hardcover.app → Account → Developer apps
    redirectUri: "yourapp://oauth/callback", // registered for your app, exactly
    userAgent: "YourApp/1.0",
    store: secureStore(SecureStore, "hardcover-tokens"), // Keychain / Keystore, never AsyncStorage
    onSignedOut: () => showSignIn(), // revoked on the website, expired, or signed out
  });

  const client = new HardcoverClient({ auth: session, userAgent: "YourApp/1.0" });

  return { session, client };
}

export async function signIn(session: OAuthSession, openAuthSessionAsync: OpenAuthSession) {
  // Ask only for what the app uses. The user sees these on the consent screen.
  const attempt = session.authorize({ scopes: ["read:library", "write:library", "read:lists"] });

  const result = await openAuthSessionAsync(attempt.url, attempt.redirectUri);
  if (result.type !== "success" || !result.url) return false; // the user closed the browser

  // Checks state and issuer, exchanges the code, stores the tokens.
  await session.completeAuthorization(result.url, attempt);

  return true;
}

// Every request after that just works, and keeps working across app launches.
export async function myShelf(client: HardcoverClient) {
  try {
    return await client.library.list();
  } catch (error) {
    // onSignedOut already ran; the request needs a signed-in user.
    if (error instanceof SignedOutError) return null;
    throw error;
  }
}

// A TV app or a CLI: show a short code, the user approves it on their phone.
export async function signInOnTv() {
  const session = new OAuthSession({ clientId: "your-client-id", store: memoryStore() });

  await session.signInWithDevice({
    scopes: ["read:library"],
    onCode: ({ userCode, verificationUri }) => console.log(`Go to ${verificationUri} and enter ${userCode}`),
  });

  return new HardcoverClient({ auth: session });
}

// Sign-out revokes on Hardcover (so the app disappears from the user's
// authorized apps) and clears the store.
export async function signOut(session: OAuthSession) {
  await session.signOut();
}
