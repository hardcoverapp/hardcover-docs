/**
 * Reading progress, including a re-read. Based on a real flow:
 * add a book and start it, update progress a few days later, finish it,
 * start it again the next week, then update progress on the re-read.
 *
 * The server does the bookkeeping:
 * - Currently Reading starts a *read* (a new one on a re-read); Read finishes it.
 * - It writes the journal for every step ("started", "progress", "finished").
 *   Don't write journal entries for these yourself, or they'll appear twice.
 * - Progress of 100% finishes the read and marks the book Read.
 */
import { HardcoverClient, UserBookStatus } from "@hardcover/sdk";

export async function readingProgress(hc: HardcoverClient, bookId: number) {
  // Day 1: add it and start reading.
  const entry = await hc.library.add(bookId, { status: UserBookStatus.CurrentlyReading });

  // Day 4: progress in whichever unit your app has. setProgress always targets
  // the read in progress, so it's right even after a re-read.
  await hc.reads.setProgress(entry.id, { pages: 142 });
  // or { percent: 45 }: converted with the read's edition (pages, or seconds for audiobooks)
  // or { seconds: 5400 } for audiobooks

  // Logging it later? occurredAt backdates the journal entry to when it happened.
  await hc.reads.setProgress(entry.id, { pages: 180, occurredAt: new Date("2026-09-24T21:00:00-06:00") });

  // Day 8: finished.
  await hc.library.setStatus(entry.id, UserBookStatus.Read);

  // Next week: read it again. The server starts a second read.
  await hc.library.setStatus(entry.id, UserBookStatus.CurrentlyReading);

  // Later that day: this lands on the re-read, never the finished first read.
  await hc.reads.setProgress(entry.id, { percent: 15 });

  const reads = await hc.reads.list(entry.id); // newest first
  console.log(reads.map((r) => ({ started: r.startedAt, finished: r.finishedAt, pages: r.progressPages })));
}
