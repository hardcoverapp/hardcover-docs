import fs from "fs";

const HOST = "https://api.hardcover.app";

const url = `${HOST}/capabilities.json`;
const response = await fetch(url);

if (!response.ok) {
  console.error(
    `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
  );
  process.exit(1);
}

const capabilities = await response.json();

fs.writeFileSync("capabilities.json", JSON.stringify(capabilities, null, 2));

console.log(
  `Fetched ${capabilities.scopes.length} scopes. ${url} -> capabilities.json`,
);
