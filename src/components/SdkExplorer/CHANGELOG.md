# Changelog

Changes to `@hardcover/sdk`, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/). Before 1.0, a minor version (0.2.0)
may rename or remove things; each one is listed here with what to change.

## 0.1.1 - 2026-10-29

More of what the site shows, typed, and one naming fix. Nothing is removed;
the deprecated keys below still work.

### Added

- **Similar books.** `books.similar(bookId, { limit, offset })` returns the
  site's "Similar books", most similar first, up to 100. `updatedAt` is null
  until the site has built the book's list, so an empty page then means "not
  built yet", not "no matches".
- **Ratings histogram.** Book details (`books.get()`, `books.getBySlug()`)
  include `ratingsDistribution`: how many ratings the book has at each star
  value, as `{ rating, count }[]` (new `RatingCount`). It's `[]` when nobody
  has rated the book.
- **Banner images.** Book details include `cachedHeaderImage`, and user
  profiles (including `me.get()`) include `cachedCover`. Both are
  `CachedImage`, and `{}` when there's no banner, which is most of the time.
- **A reader's genres.** User profiles include `cachedGenres`, their most-read
  genres with a count each (new `CachedGenre`).
- **Quiet imports.** `library.add(bookId, { imported: true })` adds a book
  without posting it to followers' feeds, for bulk imports and syncs (new
  `LibraryAddOptions`). The Goodreads import example uses it.
- **Staff flag.** User profiles include `admin`, true for Hardcover staff, for
  showing the site's "Team" badge.
- **More typed JSON columns.** `cachedSimilarBookIds` on books and
  `cachedBookIds` on vibes are `number[]` for anyone who selects them with
  `request()` or `graphql()`. A search hit's `featuredSeries` is typed (new
  `SearchFeaturedSeries`) instead of `Record<string, unknown>`.

### Changed

- **camelCase inside JSON columns.** A few JSON columns store snake_case keys.
  Each now also arrives in camelCase, so the same data reads the same
  everywhere, including search hits:

  | Column | Was | Now |
  |---|---|---|
  | Images (`cachedImage`, `cachedHeaderImage`, `cachedCover`, author images) | `color_name` | `colorName` |
  | `cachedContributors` | `contributor_role_id`, `_name`, `_blurb` | `contributorRoleId`, `contributorRoleName`, `contributorRoleBlurb` |
  | `cachedContributors` | `contributor_specialization_id`, `_name`, `_blurb` | `contributorSpecializationId`, `contributorSpecializationName`, `contributorSpecializationBlurb` |
  | `cachedFeaturedSeries.series` | `books_count`, `primary_books_count` | `booksCount`, `primaryBooksCount` |

- The repository moved to
  [hardcoverapp/hardcover-sdk](https://github.com/hardcoverapp/hardcover-sdk)
  (it was `community-sdk`); the package's links point there.
- The README and the package's homepage link to the
  [documentation](https://docs.hardcover.app/sdk/typescript/) rather than the
  repository.

### Deprecated

- **The snake_case keys in the table above.** They still arrive next to the
  camelCase ones, so nothing breaks, and your editor marks them as deprecated.
  A later minor release removes them. To update, switch to the camelCase
  names, for example `book.cachedImage.color_name` to
  `book.cachedImage.colorName`.

## 0.1.0 - 2026-10-22

The first release.

### Added

- **Client.** `HardcoverClient` with a personal access token or an OAuth
  session. Typed resources: `me`, `library`, `reads`, `lists`, `search`,
  `books`, `authors`, `series`, `journal`, `goals`, `vibes`, `prompts`,
  `users`, `likes`, `activities`, `notifications`.
- **Any operation.** `request(operations.X, variables)` runs a built-in
  operation with typed results; `graphql(query)` runs any query your token's
  scopes allow, with the same auth, retries and errors.
- **OAuth sign-in** (`@hardcover/sdk/oauth`): browser sign-in with PKCE,
  device codes for TVs and command-line tools, and OpenID Connect. The session
  refreshes tokens before they expire, never spends a refresh token twice,
  stores each new pair before using it, and calls `onSignedOut` once when the
  user needs to sign in again. Tokens go wherever you choose (`secureStore`
  for Keychain and Keystore, `memoryStore`, or your own).
- **Reading stats** (`@hardcover/sdk/stats`): books, reads, pages, listening
  time, ratings, formats, genres, moods, authors and reads per month for a
  year, a month, a custom range or a reader's whole history, counted the way
  the Stats page on hardcover.app counts them.
- **Rate limits.** The client paces itself from the API's headers, backs off
  when other apps share the budget, and can send concurrent reads as one
  request (`batch: true`).
- **Errors.** One typed error per failure: `ScopeError` names the missing
  scopes, `RateLimitError` says how long to wait, `SignedOutError` means show
  sign-in, and more. Reads are retried after network and server errors; writes
  are never sent twice.
- **Paging.** List methods return pages (`items`, `limit`, `offset`,
  `hasMore`) and never ask for more than the API returns for that list, so
  `hasMore` stays right when you ask for a large page. `allPages(...)` walks
  every page of any list method for you.
- **Incremental sync.** `library.changes()` returns what changed since a
  cursor, and can report removed entries.
- **Testing.** `MockTransport` (`@hardcover/sdk/testing`) drives a real client
  with canned responses.
- **Editor help.** Every method, resource, option and error explains itself on
  hover, including the scopes it needs, with links to the API docs.

### Notes

- Runs on Node 22.12+, browsers, Deno, Bun and React Native (Hermes). ES
  modules only; CommonJS code on Node 22.12+ can `require()` it.
- No runtime dependencies.
- Stats count pages and time from finished books, so readers who log daily
  progress may see different page totals on hardcover.app.
