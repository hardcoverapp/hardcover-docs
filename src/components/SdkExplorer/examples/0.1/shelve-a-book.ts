/**
 * Shelving a book: add it, change its status, rate it, take it off.
 *
 * Only the fields you pass are sent. Review fields need the `write:reviews`
 * scope, so a plain status change never includes them.
 */
import { HardcoverClient, PrivacySetting, UserBookStatus } from "@hardcover/sdk";

export async function shelveABook(hc: HardcoverClient, bookId: number) {
  // Want to Read is the default status.
  const entry = await hc.library.add(bookId, { privacy: PrivacySetting.Follows });

  // Already on the shelf? forBook returns the entry, or null.
  const same = await hc.library.forBook(bookId);
  console.log(same?.id === entry.id);

  // Marking Read without a date records today in *your* timezone, the way
  // the Hardcover app does. Pass `date` (YYYY-MM-DD) to set it yourself.
  await hc.library.setStatus(entry.id, UserBookStatus.Read);
  await hc.library.setStatus(entry.id, UserBookStatus.Read, { date: "2026-09-01" });

  // 0.5 to 5 in half steps; null clears it. Invalid ratings throw a
  // RangeError before anything is sent.
  await hc.library.rate(entry.id, 4.5);

  // A review needs the write:reviews scope.
  await hc.library.update(entry.id, { review: { markdown: "Couldn't put it down.", hasSpoilers: false } });

  await hc.library.remove(entry.id);
}
