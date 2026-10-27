/**
 * Quick start: create a client and read your own data.
 *
 * Get a token at hardcover.app → Account → API Access. Keep it out of source
 * control and out of browser bundles; apps that act for other users should use
 * OAuth instead.
 */
import { HardcoverClient, UserBookStatus } from "@hardcover/sdk";

export async function quickStart(token: string) {
  const hc = new HardcoverClient({ token, userAgent: "my-reading-app/1.0" });

  const me = await hc.me.get();
  console.log(`Signed in as ${me.username}`);

  // Everything you're reading right now.
  const reading = await hc.library.list({ status: UserBookStatus.CurrentlyReading });
  for (const entry of reading.items) {
    console.log(entry.book.title, entry.userBookReads[0]?.progressPages ?? 0, "pages in");
  }

  // Rate limits are handled for you: the client paces itself from the
  // gateway's headers. The latest state is always available.
  console.log(hc.rateLimit?.burst?.remaining, "requests left in this burst");
}
