/**
 * Scanning barcodes into a list.
 *
 * Scans match the edition exactly by ISBN-13 or ISBN-10, never through
 * search: the barcode identifies one specific edition, and that's the one
 * that should land on the list.
 *
 * lists.addBooks takes the raw scanner output. It matches exact ISBN-13 and
 * ISBN-10 only (spaces and hyphens are fine) and never guesses:
 * - every code is looked up in one request,
 * - exact editions are added in batches, paced to stay inside your rate limit,
 * - anything it can't match comes back in `notAdded` for you to handle.
 * UPC barcodes always land in `notAdded`: Hardcover identifies editions by ISBN.
 * Adding a book that's already on the list is harmless.
 */
import { HardcoverClient, PrivacySetting } from "@hardcover/sdk";

/** One scan: the exact edition, or nothing. */
export async function scanToList(hc: HardcoverClient, scanned: string, listId: number) {
  const [edition] = await hc.books.findByIsbn([scanned]); // "978-0-593-13520-4" works as-is
  if (!edition) {
    // Not an ISBN we know, or a UPC. Offer a title search instead of guessing.
    return console.log("No exact match. Try the ISBN barcode, usually inside the cover, or search by title.");
  }
  await hc.lists.addBook(listId, edition.bookId, { editionId: edition.id });
}

/** A whole shelf at once. */
export async function bulkScanToList(hc: HardcoverClient, scannedCodes: string[]) {
  const list = await hc.lists.create({ name: "Book club shelf", privacy: PrivacySetting.Private });

  const { added, notAdded } = await hc.lists.addBooks(list.id, scannedCodes);
  console.log(`${added.length} added`);

  for (const miss of notAdded) {
    if (miss.reason === "no_exact_edition") {
      // Not an ISBN we know (or a UPC). Let the user search, or skip it.
      console.log(`No exact match for ${miss.code}`);
    } else {
      // The add itself failed; `error` says why. Safe to retry.
      console.log(`Couldn't add ${miss.code}: ${miss.error.message}`);
    }
  }

  // One at a time works too, with an optional edition.
  const first = added[0];
  if (first) {
    await hc.lists.removeBook(list.id, first.bookId); // false if it wasn't there
    await hc.lists.addBook(list.id, first.bookId, { editionId: first.editionId });
  }

  // listBooks is one page (50 by default); booksCount is the whole list.
  const withBooks = await hc.lists.get(list.id);
  console.log(withBooks?.booksCount, "books on the list");
}
