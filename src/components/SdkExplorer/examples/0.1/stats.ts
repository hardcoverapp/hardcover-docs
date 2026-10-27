/**
 * Reading stats: a year in review, a month, and everything you've read.
 *
 * Stats live in their own entry point, so apps that don't show them don't
 * ship them. The numbers match the Stats page on hardcover.app, except pages
 * and time, which come from finished books rather than daily progress.
 */
import { HardcoverClient } from "@hardcover/sdk";
import { computeStats, fetchStatsData, period, readingStats } from "@hardcover/sdk/stats";

export async function yearInReview(hc: HardcoverClient) {
  // The reader's time zone decides which year "this year" is.
  const stats = await readingStats(hc, period.thisYear({ timeZone: "America/Denver" }));

  console.log(`${stats.books} books, ${stats.pages} pages, ${stats.hoursListened} hours listened`);
  console.log("Most read author:", stats.authors[0]?.author.name);
  console.log("Top genres:", stats.genres.slice(0, 5).map((g) => g.tag).join(", "));

  // A chart of books per month: the app decides how it looks.
  for (const month of stats.byMonth) console.log(month.month, "█".repeat(month.reads));
}

// Fetch once, then compute as many periods as you need (no extra requests).
export async function compareYears(hc: HardcoverClient) {
  const data = await fetchStatsData(hc);

  const lastYear = computeStats(data, period.year(2025));
  const yearBefore = computeStats(data, period.year(2024));
  const life = computeStats(data, period.life());

  return {
    booksChange: lastYear.books - yearBefore.books,
    averageRating: lastYear.ratings.average,
    audiobookShare: life.formats.find((f) => f.label === "Audiobooks")!.reads / Math.max(life.reads, 1),
  };
}
