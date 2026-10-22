#!/usr/bin/env node
// Copies the TypeScript SDK's method catalog and changelog from a
// community-sdk checkout into the docs. Run after the SDK changes, then
// `npm run generate:sdk-pages`.
//
//   npm run sync:sdk-catalog                    from ../hardcover-sdk
//   SDK_REPO=/path/to/community-sdk npm run sync:sdk-catalog
//
// The catalog is saved under the SDK's minor version (catalogs/0.1.json), so
// each version keeps its own pages. Syncing a new minor version adds a
// catalog; older ones stay as they were released.
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const repo = resolve(process.env.SDK_REPO ?? "../hardcover-sdk");
const catalog = resolve(repo, "shared/catalog.json");
const changelog = resolve(repo, "packages/typescript/CHANGELOG.md");
const pkg = resolve(repo, "packages/typescript/package.json");

for (const file of [catalog, changelog, pkg]) {
  if (!existsSync(file)) {
    console.error(`Missing ${file}. Set SDK_REPO to a community-sdk checkout.`);
    process.exit(1);
  }
}

const { version } = JSON.parse(readFileSync(pkg, "utf8"));
const minor = version.split(".").slice(0, 2).join(".");

const targets = [
  [catalog, `src/components/SdkExplorer/catalogs/${minor}.json`],
  [changelog, "src/components/SdkExplorer/CHANGELOG.md"],
];

for (const [source, target] of targets) {
  copyFileSync(source, resolve(target));
  console.log(`Copied ${source} → ${target}`);
}
