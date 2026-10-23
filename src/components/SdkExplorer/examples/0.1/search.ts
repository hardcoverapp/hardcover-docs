/**
 * Searching. Your query goes straight to the API, which owns matching:
 * titles, authors, series, and whatever it learns next, with no SDK update
 * needed. For barcode scans, match the ISBN exactly instead: see
 * bulk-scan-to-list.ts. The SDK just tidies the response:
 * numeric ids, camelCase keys, and the total count.
 */
import { HardcoverClient } from "@hardcover/sdk";

export async function searchBooks(hc: HardcoverClient) {
  const { hits, found } = await hc.search.books("project hail mary", { perPage: 5 });
  console.log(`${found} matches`);
  for (const book of hits) {
    console.log(book.id, book.title, book.releaseYear, book.authorNames?.join(", "));
  }

  // Every search type has a method: authors, series, characters, lists,
  // prompts, publishers, users.
  const { hits: authors } = await hc.search.authors("andy weir");
  console.log(authors[0]?.name, authors[0]?.booksCount);
}

/** Tune matching with the API's own options; anything else, use raw(). */
export async function tunedSearch(hc: HardcoverClient) {
  await hc.search.books("dune", {
    fields: ["title", "author_names"],
    weights: [5, 1],
    sort: "users_count:desc",
    filterBy: "release_year:>1960",
    page: 2,
  });
  const raw = await hc.search.raw("dune"); // untouched, including Typesense's `results`
  console.log(raw.ids);
}
