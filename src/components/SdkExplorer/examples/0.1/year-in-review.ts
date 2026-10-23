/**
 * A reader's year, owned editions, and reads edited by hand.
 * Reading needs `read:me:content` and `read:library`; edits need `write:library`.
 */
import { allPages, DatePrecision, HardcoverClient } from "@hardcover/sdk";

export async function yearInReview(hc: HardcoverClient, year: number) {
  // Every read finished that year, newest first, each with its book.
  const thatYear = (page: { limit: number; offset: number }) =>
    hc.reads.finished({ from: `${year}-01-01`, to: `${year}-12-31`, ...page });

  // allPages fetches one page after another until the last.
  const finished = [];
  for await (const read of allPages(thatYear)) finished.push(read);

  const pages = finished.reduce((sum, read) => sum + (read.edition?.pages ?? 0), 0);
  console.log(`${finished.length} books, about ${pages} pages`);

  const fiveStars = finished.filter((read) => read.userBook?.rating === 5);
  console.log("five stars:", fiveStars.map((read) => read.userBook?.book?.title));
}

export async function logAnOldRead(hc: HardcoverClient, userBookId: number) {
  // A read from before you used Hardcover. The server writes the journal entries.
  const read = await hc.reads.add(userBookId, {
    startedAt: "2018-06-01",
    finishedAt: "2018-06-30",
    precision: DatePrecision.Month, // "sometime in June"
  });

  // Only what you set changes; null clears a date.
  await hc.reads.update(read.id, { startedAt: "2018-06-03" });

  // Changed your mind?
  await hc.reads.delete(read.id);
}

export async function ownedEditions(hc: HardcoverClient, editionId: number, bookId: number) {
  // Owned editions live on the reader's "Owned" list, which the server creates.
  await hc.library.markOwned(editionId);

  const { items } = await hc.library.owned();
  console.log(items.map((row) => `${row.book?.title} (${row.edition?.editionFormat})`));

  // There's no un-own action; this takes the book off the Owned list.
  await hc.library.unmarkOwned(bookId);
}
