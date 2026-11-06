import type { ShowcaseProject } from '@/components/showcase/types';

/**
 * Build-time showcase exports for other sites. The JSON is the full-data
 * contract; bump FEED_VERSION on any breaking change to its shape. Adding
 * fields is not breaking.
 */

export const FEED_VERSION = 1;

const TITLE = 'Hardcover Community Showcase';
const DESCRIPTION = 'Projects built with the Hardcover API';

function absolute(path: string, site: string): string {
  return new URL(path, site).href;
}

function projectUrl(slug: string, site: string): string {
  return absolute(`/showcase/${slug}`, site);
}

function newestFirst(projects: ShowcaseProject[]): ShowcaseProject[] {
  return [...projects].sort(
    (a, b) => b.dateAdded.getTime() - a.dateAdded.getTime() || a.name.localeCompare(b.name),
  );
}

export function projectDates(project: ShowcaseProject) {
  const added = project.dateAdded.toISOString();
  const entryUpdated = project.dateUpdated.toISOString();
  const repoPushed = project.stats?.lastPushed ? new Date(project.stats.lastPushed).toISOString() : undefined;
  const starsUpdated = project.stats?.starsUpdated ? new Date(project.stats.starsUpdated).toISOString() : undefined;
  const latest = [added, entryUpdated, repoPushed, starsUpdated]
    .filter((date): date is string => date !== undefined)
    .reduce((a, b) => (a > b ? a : b));
  return { added, entryUpdated, repoPushed, starsUpdated, latest };
}

export function buildShowcaseJson(projects: ShowcaseProject[], site: string, now = new Date()) {
  return {
    version: FEED_VERSION,
    title: TITLE,
    description: DESCRIPTION,
    homePageUrl: absolute('/showcase', site),
    feedUrl: absolute('/showcase.json', site),
    generated: now.toISOString(),
    descriptionFormat: 'markdown',
    projects: newestFirst(projects).map((project) => ({
      slug: project.slug,
      name: project.name,
      url: projectUrl(project.slug, site),
      summary: project.summary,
      description: project.description,
      author: project.author,
      links: project.links,
      categories: project.categories,
      platforms: project.platforms,
      formats: project.formats,
      features: project.features,
      connects: project.connects,
      tags: project.tags ?? [],
      featured: project.featured ?? false,
      picks: project.picks,
      screenshots: (project.screenshots ?? []).map((shot) => ({ ...shot, src: absolute(shot.src, site) })),
      stats: { githubStars: project.stats?.githubStars },
      dates: projectDates(project),
    })),
  };
}

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);
}

export function buildShowcaseRss(projects: ShowcaseProject[], site: string, now = new Date()): string {
  const sorted = newestFirst(projects);
  const lastBuild = sorted[0]?.dateAdded ?? now;

  const items = sorted.map((project) => {
    const url = projectUrl(project.slug, site);
    const categories = project.categories
      .map((category) => `      <category>${escapeXml(category)}</category>`)
      .join('\n');
    return [
      '    <item>',
      `      <title>${escapeXml(project.name)}</title>`,
      `      <link>${escapeXml(url)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      `      <description>${escapeXml(project.summary)}</description>`,
      `      <dc:creator>${escapeXml(project.author.name)}</dc:creator>`,
      categories,
      `      <pubDate>${project.dateAdded.toUTCString()}</pubDate>`,
      '    </item>',
    ].join('\n');
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    `    <title>${TITLE}</title>`,
    `    <link>${escapeXml(absolute('/showcase', site))}</link>`,
    `    <description>${DESCRIPTION}</description>`,
    '    <language>en</language>',
    `    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(absolute('/showcase.xml', site))}" rel="self" type="application/rss+xml"/>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
