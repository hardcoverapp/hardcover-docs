import { describe, expect, test } from 'vitest';
import { isExternal, isReferenceSection } from './nav.ts';

describe('isExternal', () => {
    test('absolute http(s) URLs are external', () => {
        expect(isExternal('https://discord.gg/x')).toBe(true);
        expect(isExternal('http://example.com')).toBe(true);
        expect(isExternal('HTTPS://EXAMPLE.COM')).toBe(true);
    });

    test('site-relative paths are internal', () => {
        expect(isExternal('/api/guides')).toBe(false);
        expect(isExternal('/showcase')).toBe(false);
        expect(isExternal('#anchor')).toBe(false);
        expect(isExternal('mailto:a@b.com')).toBe(false);
    });
});

describe('isReferenceSection', () => {
    test('the reference sections match', () => {
        expect(isReferenceSection('/api')).toBe(true);
        expect(isReferenceSection('/api/getting-started')).toBe(true);
        expect(isReferenceSection('/librarians')).toBe(true);
        expect(isReferenceSection('/librarians/standards')).toBe(true);
    });

    test('a leading locale segment is tolerated', () => {
        expect(isReferenceSection('/it/api/getting-started')).toBe(true);
        expect(isReferenceSection('/es/librarians')).toBe(true);
    });

    test('marketing routes do not match', () => {
        expect(isReferenceSection('/')).toBe(false);
        expect(isReferenceSection('/showcase')).toBe(false);
        expect(isReferenceSection('/contributing')).toBe(false);
    });

    test('lookalike paths are not misclassified', () => {
        // Must be the whole segment — "apidocs" / "apiary" are not /api.
        expect(isReferenceSection('/apidocs')).toBe(false);
        expect(isReferenceSection('/librariesnearby')).toBe(false);
    });
});
