#!/usr/bin/env node
// Copies the TypeScript SDK's method catalog and changelog, and the language
// matrix, from an SDK repo checkout into the docs. Run after the SDK
// changes, then `npm run generate:sdk-pages`.
//
//   npm run sync:sdk-catalog                    from ../hardcover-sdk
//   SDK_REPO=/path/to/hardcover-sdk npm run sync:sdk-catalog
//
// The catalog is saved under the SDK's minor version (catalogs/0.1.json), so
// each version keeps its own pages. Syncing a new minor version adds a
// catalog; older ones stay as they were released.
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const repo = resolve(process.env.SDK_REPO ?? "../hardcover-sdk");
const catalog = resolve(repo, "shared/catalog.json");
const changelog = resolve(repo, "packages/typescript/CHANGELOG.md");
const pkg = resolve(repo, "packages/typescript/package.json");
const languages = resolve(repo, "languages.json");
const examples = resolve(repo, "packages/typescript/examples");
const enums = resolve(repo, "shared/enums.json");
const errors = resolve(repo, "shared/errors.json");

for (const file of [catalog, changelog, pkg, languages, examples, enums, errors]) {
  if (!existsSync(file)) {
    console.error(`Missing ${file}. Set SDK_REPO to an SDK repo checkout.`);
    process.exit(1);
  }
}

const { version } = JSON.parse(readFileSync(pkg, "utf8"));
const minor = version.split(".").slice(0, 2).join(".");

const targets = [
  [catalog, `src/components/SdkExplorer/catalogs/${minor}.json`],
  [changelog, "src/components/SdkExplorer/CHANGELOG.md"],
  // Which languages exist and what each supports, for the SDKs overview page.
  [languages, "src/components/SdkExplorer/languages.json"],
];

for (const [source, target] of targets) {
  copyFileSync(source, resolve(target));
  console.log(`Copied ${source} → ${target}`);
}

// The SDK's examples, which the SDK type-checks in CI, shown as-is in this
// version's guides and resource pages. Replaced whole, so a removed example goes too.
const examplesTarget = resolve(`src/components/SdkExplorer/examples/${minor}`);
rmSync(examplesTarget, { recursive: true, force: true });
cpSync(examples, examplesTarget, { recursive: true, filter: (path) => !path.endsWith("README.md") });
console.log(`Copied ${examples} → src/components/SdkExplorer/examples/${minor}`);

// The SDK commit these came from, so a docs PR shows which SDK state it pins.
const commit = execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
writeFileSync(resolve(examplesTarget, "SDK_COMMIT"), `${commit}\n`);
console.log(`Recorded SDK commit ${commit}`);

// The enums and errors every SDK shares, for this version's reference page.
mkdirSync(resolve(`src/components/SdkExplorer/reference/${minor}`), { recursive: true });
for (const [source, name] of [[enums, "enums.json"], [errors, "errors.json"]]) {
  copyFileSync(source, resolve(`src/components/SdkExplorer/reference/${minor}/${name}`));
}
console.log(`Copied shared enums and errors → src/components/SdkExplorer/reference/${minor}`);

// Record the release this version is at, so a tagged one (1.0.0-beta.2) is
// shown as a pre-release until the plain release (1.0.0) is synced.
const releasesFile = resolve("src/components/SdkExplorer/releases.json");
const releases = existsSync(releasesFile) ? JSON.parse(readFileSync(releasesFile, "utf8")) : {};

releases.typescript = { ...releases.typescript, [minor]: version };
writeFileSync(releasesFile, `${JSON.stringify(releases, null, 2)}\n`);
console.log(`Recorded typescript ${minor} at ${version}`);
