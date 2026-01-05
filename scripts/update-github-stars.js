#!/usr/bin/env node

/**
 * Updates GitHub star counts for all showcase projects.
 *
 * Usage:
 *   node scripts/update-github-stars.js
 *
 * Can be run manually or scheduled via GitHub Actions.
 * Uses the GitHub API (no auth required for public repos, but rate-limited to 60 req/hr).
 * Set GITHUB_TOKEN env var for higher rate limits (5000 req/hr).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOWCASE_DIR = path.join(__dirname, '../src/content/showcase');

async function fetchGitHubStars(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'hardcover-docs-star-updater',
  };

  // Use token if available for higher rate limits
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`  Repository not found: ${owner}/${repo}`);
        return null;
      }
      if (response.status === 403) {
        console.error('  Rate limit exceeded. Set GITHUB_TOKEN env var for higher limits.');
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.stargazers_count;
  } catch (error) {
    console.error(`  Error fetching ${owner}/${repo}:`, error.message);
    return null;
  }
}

function extractGitHubRepo(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match) {
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  }
  return null;
}

function parseYaml(content) {
  // Simple YAML parser for our specific format
  const lines = content.split('\n');
  let githubUrl = null;

  for (const line of lines) {
    if (line.includes('github.com/')) {
      const match = line.match(/"(https:\/\/github\.com\/[^"]+)"/);
      if (match) {
        githubUrl = match[1];
        break;
      }
    }
  }

  return { githubUrl };
}

function updateYamlStars(content, stars) {
  // Check if stats section exists
  if (content.includes('stats:')) {
    // Update existing githubStars
    if (content.includes('githubStars:')) {
      return content.replace(/githubStars:\s*\d+/, `githubStars: ${stars}`);
    } else {
      // Add githubStars to existing stats section
      return content.replace(/stats:/, `stats:\n  githubStars: ${stars}`);
    }
  } else {
    // Add stats section at the end
    const trimmed = content.trimEnd();
    return `${trimmed}\n\nstats:\n  githubStars: ${stars}\n`;
  }
}

async function processFile(filePath) {
  const filename = path.basename(filePath);
  console.log(`Processing ${filename}...`);

  const content = fs.readFileSync(filePath, 'utf-8');
  const { githubUrl } = parseYaml(content);

  if (!githubUrl) {
    console.log('  No GitHub URL found, skipping');
    return { file: filename, status: 'skipped', reason: 'no-github-url' };
  }

  const repo = extractGitHubRepo(githubUrl);
  if (!repo) {
    console.log('  Could not parse GitHub URL, skipping');
    return { file: filename, status: 'skipped', reason: 'invalid-url' };
  }

  console.log(`  Fetching stars for ${repo.owner}/${repo.repo}...`);
  const stars = await fetchGitHubStars(repo.owner, repo.repo);

  if (stars === null) {
    return { file: filename, status: 'error', reason: 'fetch-failed' };
  }

  // Check current stars
  const currentMatch = content.match(/githubStars:\s*(\d+)/);
  const currentStars = currentMatch ? parseInt(currentMatch[1], 10) : null;

  if (currentStars === stars) {
    console.log(`  Stars unchanged (${stars})`);
    return { file: filename, status: 'unchanged', stars };
  }

  const updatedContent = updateYamlStars(content, stars);
  fs.writeFileSync(filePath, updatedContent);

  console.log(`  Updated: ${currentStars ?? 'none'} -> ${stars}`);
  return { file: filename, status: 'updated', oldStars: currentStars, newStars: stars };
}

async function main() {
  console.log('Updating GitHub stars for showcase projects\n');

  const files = fs.readdirSync(SHOWCASE_DIR)
    .filter(f => f.endsWith('.yaml'))
    .map(f => path.join(SHOWCASE_DIR, f));

  const results = [];

  for (const file of files) {
    const result = await processFile(file);
    results.push(result);
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  // Summary
  console.log('\n--- Summary ---');
  const updated = results.filter(r => r.status === 'updated');
  const unchanged = results.filter(r => r.status === 'unchanged');
  const skipped = results.filter(r => r.status === 'skipped');
  const errors = results.filter(r => r.status === 'error');

  console.log(`Updated: ${updated.length}`);
  console.log(`Unchanged: ${unchanged.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Errors: ${errors.length}`);

  if (updated.length > 0) {
    console.log('\nUpdated files:');
    updated.forEach(r => {
      console.log(`  ${r.file}: ${r.oldStars ?? 'none'} -> ${r.newStars}`);
    });
  }

  // Exit with error if any failures
  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
