/**
 * Book details, editions, similar books, trending and new releases. Catalog reads need `read:catalog`.
 */
import { HardcoverClient } from "@hardcover/sdk";

export async function bookDetails(hc: HardcoverClient) {
  const book = await hc.books.getBySlug("project-hail-mary"); // or hc.books.get(id)
  if (!book) return;
  console.log(book.title, book.releaseYear, book.rating);
  console.log(book.contributions.map((c) => c.author?.name).join(", "));
  console.log(book.bookSeries.map((s) => `${s.series?.name} #${s.position}`));

  // Ratings per star value, for a histogram. Empty when nobody has rated it.
  for (const { rating, count } of book.ratingsDistribution) console.log(`${rating}★`, count);

  // Editions, most-read first, a page at a time.
  const { items: editions, hasMore } = await hc.books.editions(book.id, { limit: 10 });
  for (const e of editions) console.log(e.id, e.editionFormat, e.isbn13, e.pages);
  console.log(hasMore ? "more editions available" : "that's all of them");
}

export async function similarBooks(hc: HardcoverClient, bookId: number) {
  // The site's "Similar books", most similar first, up to 100 a page at a time.
  const similar = await hc.books.similar(bookId, { limit: 10 });
  for (const b of similar.items) console.log(b.title);

  // The site builds the list the first time someone opens the book's page,
  // so an empty page with no updatedAt means "not built yet", not "no matches".
  if (similar.updatedAt === null) console.log("no similar books yet");
}

export async function exactIsbnLookup(hc: HardcoverClient, isbns: string[]) {
  // Exact matches only, each with its book. Spaces and hyphens are fine.
  // For fuzzy matching (titles, partial ISBNs), use hc.search.books instead.
  const editions = await hc.books.findByIsbn(isbns);
  for (const e of editions) console.log(e.isbn13, "→", e.book.title);
}

export async function trendingAndBatches(hc: HardcoverClient) {
  // Trending books, in trending order, a page at a time like every list.
  const trending = await hc.books.trending({ duration: "week", limit: 10 });
  if (trending.hasMore) console.log("more trending books on the next page");

  // Many books at once, returned in the order you asked for.
  const books = await hc.books.getMany(trending.items.map((b) => b.id).reverse());
  console.log(books.map((b) => b.title));
}

export async function trendingOnePerSeries(hc: HardcoverClient) {
  const { items } = await hc.books.trending({ duration: "week", limit: 30 });

  // Every book carries its main series (the one the site shows), so this needs
  // no extra requests. Standalones have none and always count.
  const seen = new Set<number>();
  const onePerSeries = items.filter((book) => {
    const series = book.cachedFeaturedSeries.series?.id;
    if (series === undefined) return true;
    if (seen.has(series)) return false;
    seen.add(series);
    return true;
  });

  for (const book of onePerSeries) {
    const { series, position } = book.cachedFeaturedSeries;
    console.log(book.title, series ? `${series.name} #${position}` : "standalone");
  }
}

export async function newReleases(hc: HardcoverClient) {
  // Books first released this week, most readers first. Dates are inclusive.
  const { items } = await hc.books.released({ from: "2026-10-12", to: "2026-10-18", limit: 10 });
  for (const b of items) console.log(b.releaseYear, b.title, b.usersCount);
}
