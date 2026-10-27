/**
 * The reading journal.
 *
 * Preferred: let the server write it. When you use library, reads and lists,
 * the server journals status changes, starting and finishing reads, progress,
 * ratings, reviews and list adds for you. Hover a JournalEvent to see which
 * call writes it. Use journal.add for what only the reader can write: notes
 * and quotes (or backfilling history).
 */
import { HardcoverClient, JournalEvent, PrivacySetting } from "@hardcover/sdk";

export async function notesAndQuotes(hc: HardcoverClient, bookId: number) {
  // A note (the default event), using the reader's account privacy setting.
  const note = await hc.journal.add(bookId, { entry: "The Rocky chapters are the best part." });

  // A private quote from a specific day, tagged.
  await hc.journal.add(bookId, {
    event: JournalEvent.Quote,
    entry: "Fist my bump.",
    privacy: PrivacySetting.Private,
    date: "2026-09-24",
    tags: [{ tag: "Rocky", category: "Tag", spoiler: false }],
  });

  await hc.journal.update(note.id, { entry: "Rocky is the best part." });

  // Everything for the book, newest first: your notes and quotes alongside the
  // entries the server wrote as you read.
  const { items } = await hc.journal.forBook(bookId);
  for (const entry of items) console.log(entry.actionAt, entry.event, entry.entry ?? "");
}

export async function tidyUp(hc: HardcoverClient, bookId: number, entryId: number) {
  await hc.journal.delete(entryId);
  // Careful: this removes every entry for the book, including the server's.
  await hc.journal.clearForBook(bookId);
}

// Possible, but usually not what you want: the server already writes this
// when you call library.setStatus(..., UserBookStatus.Read). Adding it here
// creates a second entry.
export async function manualStatusEntry(hc: HardcoverClient, bookId: number) {
  await hc.journal.add(bookId, { event: JournalEvent.StatusRead, date: "2025-12-31" });
}
