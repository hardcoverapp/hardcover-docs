/**
 * Vibes: book-recommendation lists built from signals. Creating them and
 * tuning their signals is a Supporter perk; the server enforces it and its
 * message comes back as an ActionError.
 *
 * Two things to know today:
 * - Results come from the site. A vibe's books are generated when it's opened
 *   on hardcover.app, so check `resultsPending` before treating an empty page
 *   as "no matches".
 * - Existing signals and exclusions can't be listed or removed through the
 *   API yet, so updates add them.
 */
import {
  HardcoverClient,
  PrivacySetting,
  VibeAudience,
  VibeGenre,
  VibeSignalType,
} from "@hardcover/sdk";

export async function cozyMysteries(hc: HardcoverClient) {
  const vibe = await hc.vibes.create({
    title: "Cozy mysteries",
    privacy: PrivacySetting.Private,
    signals: [
      // Taxonomy values autocomplete, and any value the server knows works.
      { type: VibeSignalType.Genre, value: VibeGenre.Mystery, weight: 4 },
      { type: VibeSignalType.Genre, value: VibeGenre.Thriller, weight: -3 },
      { type: VibeSignalType.Audience, value: VibeAudience.YoungAdult, weight: -2 },
      { type: VibeSignalType.Book, id: 427578, weight: 2 }, // more like this book
      { type: VibeSignalType.Semantic, text: "small towns, tea, no gore", weight: 3 },
      { type: VibeSignalType.Popularity, weight: -1 }, // dig up hidden gems
    ],
    // Lean on the reader's own recent five-star books.
    dynamicSignals: [{ category: "recent_rated_books", count: 5, minRating: 5, weight: 3 }],
  });

  const page = await hc.vibes.books(vibe.id, { limit: 10 });
  if (page.resultsPending) {
    console.log("Recommendations aren't ready yet. Open the vibe on hardcover.app to generate them.");
  } else {
    for (const book of page.items) console.log(book.title);
  }

  // Not quite right? Add signals or exclusions.
  await hc.vibes.update(vibe.id, { addExclusions: [{ type: "author", id: 123 }] });
}

export async function browseVibes(hc: HardcoverClient) {
  const { items } = await hc.vibes.mine();
  for (const vibe of items) console.log(vibe.title, vibe.vibeType, vibe.privacySettingId);
}
