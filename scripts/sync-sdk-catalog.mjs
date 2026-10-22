#!/usr/bin/env node
// Copies the SDK method catalog (shared/catalog.json in the community-sdk
// repo) into the SDK explorer. Run after the SDK adds or changes a method.
//   npm run sync:sdk-catalog                    from ../hardcover-sdk
//   SDK_REPO=/path/to/community-sdk npm run sync:sdk-catalog
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const repo = resolve(process.env.SDK_REPO ?? "../hardcover-sdk");
const source = resolve(repo, "shared/catalog.json");
const target = resolve("src/components/SdkExplorer/catalog.json");

if (!existsSync(source)) {
  console.error(`No catalog at ${source}. Set SDK_REPO to a community-sdk checkout.`);
  process.exit(1);
}

copyFileSync(source, target);
console.log(`Copied ${source} → ${target}`);
