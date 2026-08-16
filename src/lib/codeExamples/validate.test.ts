import { expect, it } from "vitest";
import { validateExamples } from "./validate";

it("all code-example manifests are consistent", () => {
  expect(validateExamples().filter((i) => i.severity === "error")).toEqual([]);
});
