import { describe, expect, test } from 'vitest';
import { latestChangelogRelease } from './landing-news.ts';

describe('latestChangelogRelease', () => {
    test('reads the first release heading', () => {
        const changelog = '# Changelog\n\nIntro.\n\n## 0.1.1 - 2026-10-29\n\nStuff.\n\n## 0.1.0 - 2026-10-22\n';
        expect(latestChangelogRelease(changelog)).toEqual({ version: '0.1.1', date: new Date('2026-10-29') });
    });

    test('skips an Unreleased section with no date', () => {
        expect(latestChangelogRelease('## Unreleased\n\n## 0.2.0 - 2026-12-01\n')?.version).toBe('0.2.0');
    });

    test('undefined when there are no releases', () => {
        expect(latestChangelogRelease('# Changelog\n')).toBeUndefined();
    });
});
