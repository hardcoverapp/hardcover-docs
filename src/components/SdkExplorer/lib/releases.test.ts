import { expect, it } from "vitest";
import { isPrerelease } from "./releases";

it("treats 0.x and tagged releases as pre-releases", () => {
  expect(isPrerelease("0.1.0")).toBe(true);
  expect(isPrerelease("1.0.0-beta.2")).toBe(true);
  expect(isPrerelease("2.1.0-rc.1")).toBe(true);
  expect(isPrerelease("1.0.0")).toBe(false);
  expect(isPrerelease("1.2.3")).toBe(false);
});
