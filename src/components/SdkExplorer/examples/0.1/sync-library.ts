/**
 * Keeping a local copy of the library in sync, e.g. an offline-first app.
 * The first sync starts with no cursor; later syncs fetch only what changed.
 *
 * Removed entries don't appear as changes: the API deletes them outright and
 * has no deletion feed yet. Passing the ids you hold as `knownIds` (once per
 * sync) returns `removedIds`, at the cost of one ids-only read.
 */
import type { HardcoverClient, LibraryChange } from "@hardcover/sdk";

/** Your app's storage. Upsert by id: a sync may repeat an entry it already sent. */
export interface LibraryStore {
  cursor(): Promise<string | null>;
  ids(): Promise<number[]>;
  save(entries: LibraryChange[], cursor: string | null): Promise<void>;
  remove(ids: number[]): Promise<void>;
}

export async function syncLibrary(hc: HardcoverClient, store: LibraryStore) {
  let since = await store.cursor();
  for (;;) {
    const page = await hc.library.changes({ since, limit: 100 });
    await store.save(page.items, page.cursor);
    since = page.cursor;
    if (!page.hasMore) break;
  }

  // One more call with the final cursor finds removals (and anything that
  // changed meanwhile).
  const last = await hc.library.changes({ since, knownIds: await store.ids() });
  await store.save(last.items, last.cursor);
  await store.remove(last.removedIds ?? []);
}
