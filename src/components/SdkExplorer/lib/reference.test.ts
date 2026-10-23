import * as sdk from "@hardcover/sdk";
import { describe, expect, it } from "vitest";
import { versions } from "./catalog";
import { enumDocs, ERROR_TEXT, errorDocs } from "./reference";

describe("errors", () => {
  for (const version of versions) {
    const { errors } = errorDocs(version);

    it(`${version}: every error has reader-facing text, and no text is left over`, () => {
      const names = errors.map((e) => e.name);
      expect(names.filter((name) => !ERROR_TEXT[name])).toEqual([]);
      expect(Object.keys(ERROR_TEXT).filter((name) => !names.includes(name))).toEqual([]);
    });

    it(`${version}: lists each error after its parent`, () => {
      for (const error of errors.filter((e) => e.depth > 0)) {
        const parent = errors.findIndex((e) => e.name === error.parent);
        expect(parent).toBeLessThan(errors.indexOf(error));
      }
    });
  }
});

describe("enums", () => {
  const latest = versions[0]!;

  it("names every member the way the SDK exports it", () => {
    const exported = sdk as unknown as Record<string, Record<string, unknown> | undefined>;

    for (const e of enumDocs(latest).filter((doc) => doc.members.some((m) => !m.member.startsWith('"')))) {
      for (const member of e.members) {
        expect(exported[e.name]?.[member.member], `${e.name}.${member.member}`).toBe(member.value);
      }
    }
  });

  it("gives every enum its values or a note", () => {
    const generated = { TrendingDuration: ["all", "month"] };
    for (const e of enumDocs(latest, generated)) expect(e.members.length > 0 || Boolean(e.note), e.name).toBe(true);
  });
});
