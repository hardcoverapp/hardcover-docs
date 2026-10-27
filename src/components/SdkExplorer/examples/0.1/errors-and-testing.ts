/**
 * Handling errors, and testing your own code without the network.
 *
 * Every failure is a HardcoverError subclass, and `operationName` says which
 * call failed (e.g. "AddUserBook"). The ones apps usually handle:
 * - ScopeError: the token lacks scopes; `missingScopes` lists every one.
 * - AuthenticationError: expired or revoked token.
 * - RateLimitError: the daily cap is spent, or a burst limit outlasted the
 *   retries (rare: the client paces itself from the rate-limit headers).
 * - ActionError: the API rejected a write; `messages` explain why.
 * - NetworkError / TimeoutError: `mayHaveSucceeded` is true for writes that
 *   may have landed. Check before retrying.
 */
import {
  ActionError,
  AuthenticationError,
  HardcoverClient,
  NetworkError,
  RateLimitError,
  ScopeError,
  TimeoutError,
} from "@hardcover/sdk";
import { MockTransport } from "@hardcover/sdk/testing";

export async function handleErrors(hc: HardcoverClient, bookId: number) {
  try {
    await hc.library.add(bookId);
  } catch (error) {
    if (error instanceof ScopeError) {
      // Personal access tokens: link to a new token with the scopes pre-checked.
      // (OAuth apps request the scopes again at authorization instead.)
      const grant = `https://hardcover.app/account/api/keys/new?scope=${encodeURIComponent(error.missingScopes.join(" "))}`;
      console.log(`${error.operationName} needs ${error.missingScopes.join(", ")}. Create a token: ${grant}`);
    }
    else if (error instanceof AuthenticationError) console.log("Sign in again");
    else if (error instanceof RateLimitError) {
      const what = error.window === "daily" ? "Daily limit reached" : "Too busy right now";
      console.log(`${what}; try in ${error.retryAfterSeconds}s`);
    }
    else if (error instanceof ActionError) console.log(error.messages.join("\n"));
    else if ((error instanceof NetworkError || error instanceof TimeoutError) && error.mayHaveSucceeded) {
      console.log("Check the shelf before retrying");
    }
    else throw error;
  }
}

/** Your tests can drive a real client with canned responses. */
export async function testWithoutTheNetwork() {
  const transport = new MockTransport([
    { status: 200, body: { data: { me: [{ id: 1, username: "reader" }] } } },
  ]);
  const hc = new HardcoverClient({ token: "test-token", transport });

  const me = await hc.me.get();
  console.log(me.username); // "reader"
  console.log(transport.requests.length); // 1: every request the client sent
}
