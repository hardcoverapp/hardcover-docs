/**
 * Authors, series, editions, and books other services know by their own ids.
 * Catalog reads need `read:catalog`.
 */
import { HardcoverClient, Platform } from "@hardcover/sdk";

export async function authorPage(hc: HardcoverClient) {
  const author = await hc.authors.getBySlug("becky-chambers");
  if (!author) return;

  // A merged duplicate points at the record the site shows.
  if (author.canonicalId) console.log("see author", author.canonicalId);

  // Each book once, most readers first, even with more than one credit.
  const { items: books } = await hc.authors.books(author.id, { limit: 10 });
  console.log(books.map((book) => book.title));

  const series = await hc.authors.series(author.id);
  console.log(series.map((s) => s.name));
}

export async function readingOrder(hc: HardcoverClient) {
  const series = await hc.series.getBySlug("red-rising-saga");
  if (!series) return;

  // Every entry, in position order: translations, split volumes and box sets too.
  const { items: entries } = await hc.series.books(series.id);

  // A reading order like the site's: no box sets, the most-read book at each position.
  const seen = new Set<number>();
  const readingOrder = entries.filter((entry) => {
    if (entry.compilation || entry.position === null) return false;
    if (seen.has(entry.position)) return false;

    seen.add(entry.position);
    return true;
  });

  for (const entry of readingOrder) console.log(entry.position, entry.book?.title);
}

export async function importFromGoodreads(hc: HardcoverClient, goodreadsIds: string[]) {
  // One request for the whole list. Ids with no match are left out.
  const matches = await hc.books.findByExternalIds(Platform.Goodreads, goodreadsIds);

  const found = new Set(matches.map((match) => match.externalId));
  const missing = goodreadsIds.filter((id) => !found.has(id));

  for (const match of matches) {
    // editionId is the exact edition when the mapping names one.
    await hc.library.add(match.book.id, match.editionId ? { editionId: match.editionId } : {});
  }

  console.log(`${matches.length} added, ${missing.length} to search for by hand`);
}

export async function editionById(hc: HardcoverClient, editionId: number) {
  // Library entries carry an editionId; this resolves it, with its book.
  const edition = await hc.books.edition(editionId);
  console.log(edition?.book.title, edition?.editionFormat, edition?.isbn13);
}
