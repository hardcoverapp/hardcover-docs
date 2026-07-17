import { describe, expect, test } from 'vitest';
import {
    getLastActivity,
    hostname,
    isRepoActive,
    repoPath,
    resolveProjectLinks,
} from './showcase.ts';
import { isOpenSource } from '@/components/showcase/ShowcaseCard';
import type { ShowcaseProject, ShowcaseLink } from '@/components/showcase/types';

function project(overrides: Partial<ShowcaseProject> = {}): ShowcaseProject {
    return {
        name: 'Test',
        slug: 'test',
        summary: 's',
        description: 'd',
        author: { name: 'Kylie' },
        links: [],
        categories: ['Other'],
        dateAdded: new Date('2025-01-01'),
        dateUpdated: new Date('2025-06-01'),
        ...overrides,
    };
}

const gh = (url: string): ShowcaseLink => ({ label: 'GitHub', url, type: 'github' });
const web = (url: string): ShowcaseLink => ({ label: 'Site', url, type: 'website' });

describe('repoPath / hostname', () => {
    test('repoPath extracts owner/repo', () => {
        expect(repoPath('https://github.com/owner/repo')).toBe('owner/repo');
        expect(repoPath('https://github.com/owner/repo/')).toBe('owner/repo');
    });
    test('hostname strips www', () => {
        expect(hostname('https://www.example.com/x')).toBe('example.com');
        expect(hostname('https://sub.example.com')).toBe('sub.example.com');
    });
    test('unparseable URLs return empty string, not throw', () => {
        expect(repoPath('not a url')).toBe('');
        expect(hostname('not a url')).toBe('');
    });
});

describe('isOpenSource', () => {
    test('a github link makes a project open source', () => {
        expect(isOpenSource(project({ links: [gh('https://github.com/o/r')] }))).toBe(true);
        expect(isOpenSource(project({ links: [web('https://x.com')] }))).toBe(false);
        expect(isOpenSource(project({ links: [] }))).toBe(false);
    });
});

describe('resolveProjectLinks', () => {
    test('OSS project: github is primary, domain is github.com/owner/repo', () => {
        const p = project({ links: [gh('https://github.com/owner/repo'), web('https://demo.app')] });
        const { oss, primaryLink, secondaryLinks, domain } = resolveProjectLinks(p);
        expect(oss).toBe(true);
        expect(primaryLink?.type).toBe('github');
        expect(domain).toBe('github.com/owner/repo');
        expect(secondaryLinks.map((l) => l.type)).toEqual(['website']);
    });

    test('closed project: first site/demo/store is primary, domain is its hostname', () => {
        const p = project({ links: [web('https://www.myapp.com')] });
        const { oss, primaryLink, domain } = resolveProjectLinks(p);
        expect(oss).toBe(false);
        expect(primaryLink?.type).toBe('website');
        expect(domain).toBe('myapp.com');
    });

    test('no links: no primary, domain is null (caller shows a fallback)', () => {
        const { primaryLink, secondaryLinks, domain } = resolveProjectLinks(project({ links: [] }));
        expect(primaryLink).toBeUndefined();
        expect(secondaryLinks).toEqual([]);
        expect(domain).toBeNull();
    });
});

describe('getLastActivity', () => {
    test('OSS uses the repo push date', () => {
        const p = project({ links: [gh('https://github.com/o/r')], stats: { lastPushed: '2026-04-23' } });
        expect(getLastActivity(p)?.toISOString().slice(0, 10)).toBe('2026-04-23');
    });
    test('closed uses the project dateUpdated', () => {
        const p = project({ links: [web('https://x.com')], dateUpdated: new Date('2025-06-01') });
        expect(getLastActivity(p)?.toISOString().slice(0, 10)).toBe('2025-06-01');
    });
});

describe('isRepoActive', () => {
    const now = new Date('2026-07-17').getTime();
    const ossWith = (lastPushed: string) =>
        project({ links: [gh('https://github.com/o/r')], stats: { lastPushed } });

    test('true when pushed within 90 days', () => {
        expect(isRepoActive(ossWith('2026-06-01'), now)).toBe(true);
    });
    test('false when older than 90 days', () => {
        expect(isRepoActive(ossWith('2026-01-01'), now)).toBe(false);
    });
    test('false for closed-source projects regardless of dates', () => {
        expect(isRepoActive(project({ links: [web('https://x.com')] }), now)).toBe(false);
    });
});
