# Changelog

Changes to `@hardcover/sdk`, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/). Before 1.0, a minor version (0.2.0)
may rename or remove things; each one is listed here with what to change.

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
