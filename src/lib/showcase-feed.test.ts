import { describe, expect, test } from 'vitest';
import { buildShowcaseJson, buildShowcaseRss, escapeXml, FEED_VERSION, projectDates } from './showcase-feed.ts';
import type { ShowcaseProject } from '@/components/showcase/types';

const SITE = 'https://docs.hardcover.app';

function project(overrides: Partial<ShowcaseProject> = {}): ShowcaseProject {
    return {
        name: 'Test',
        slug: 'test',
        summary: 's',
        description: 'd',
        author: { name: 'Kylie' },
        links: [],
        categories: ['Other'],
        platforms: [],
        formats: [],
        features: ['client'],
        connects: [],
        picks: [],
        dateAdded: new Date('2025-01-01'),
        dateUpdated: new Date('2025-06-01'),
        ...overrides,
    };
}

describe('buildShowcaseJson', () => {
    test('sorts newest first and makes URLs absolute', () => {
        const feed = buildShowcaseJson([
            project({ slug: 'old', dateAdded: new Date('2024-01-01') }),
            project({
                slug: 'new',
                dateAdded: new Date('2026-01-01'),
                screenshots: [{ src: '/showcase/new/1.webp', alt: 'a' }],
            }),
        ], SITE);

        expect(feed.version).toBe(FEED_VERSION);
        expect(feed.projects.map((p) => p.slug)).toEqual(['new', 'old']);
        expect(feed.projects[0].url).toBe('https://docs.hardcover.app/showcase/new');
        expect(feed.projects[0].screenshots?.[0].src).toBe('https://docs.hardcover.app/showcase/new/1.webp');
    });

    test('fills defaults and publishes dates only under dates', () => {
        const [entry] = buildShowcaseJson([project()], SITE).projects;
        expect(entry.tags).toEqual([]);
        expect(entry.featured).toBe(false);
        expect(entry).not.toHaveProperty('dateAdded');
        expect(entry.dates.added).toBe('2025-01-01T00:00:00.000Z');
    });
});

describe('projectDates', () => {
    test('latest is the newest date present', () => {
        const dates = projectDates(project({
            stats: { lastPushed: '2026-02-01', starsUpdated: '2025-09-01' },
        }));
        expect(dates.repoPushed).toBe('2026-02-01T00:00:00.000Z');
        expect(dates.latest).toBe('2026-02-01T00:00:00.000Z');
    });

    test('without stats, latest falls back to the entry dates', () => {
        const dates = projectDates(project());
        expect(dates.repoPushed).toBeUndefined();
        expect(dates.starsUpdated).toBeUndefined();
        expect(dates.latest).toBe('2025-06-01T00:00:00.000Z');
    });
});

describe('buildShowcaseRss', () => {
    test('escapes text content', () => {
        expect(escapeXml(`a & <b> "c" 'd'`)).toBe('a &amp; &lt;b&gt; &quot;c&quot; &apos;d&apos;');
        const rss = buildShowcaseRss([project({ name: 'Books & <Things>' })], SITE);
        expect(rss).toContain('<title>Books &amp; &lt;Things&gt;</title>');
    });

    test('emits one item per project with permalink guid and pubDate', () => {
        const rss = buildShowcaseRss([project({ slug: 'a' }), project({ slug: 'b' })], SITE);
        expect(rss.match(/<item>/g)).toHaveLength(2);
        expect(rss).toContain('<guid isPermaLink="true">https://docs.hardcover.app/showcase/a</guid>');
        expect(rss).toContain('<pubDate>Wed, 01 Jan 2025 00:00:00 GMT</pubDate>');
    });

    test('lastBuildDate follows the newest project, not the build time', () => {
        const rss = buildShowcaseRss([project({ dateAdded: new Date('2026-03-04') })], SITE, new Date('2030-01-01'));
        expect(rss).toContain('<lastBuildDate>Wed, 04 Mar 2026 00:00:00 GMT</lastBuildDate>');
    });
});
