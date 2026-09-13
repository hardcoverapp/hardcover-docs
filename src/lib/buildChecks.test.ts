// Chained into `npm run build` directly (not an Astro integration hook --
// astro:build:start fires after Astro closes the Vite module runner,
// which breaks import.meta.glob-based imports like loadManifests).
//
// Add future build-blocking checks here instead of new package.json entries.

import { expect, it } from "vitest";
import { validateExamples } from "./codeExamples/validate";

it("code examples are consistent", () => {
  expect(validateExamples().filter((i) => i.severity === "error")).toEqual([]);
});
