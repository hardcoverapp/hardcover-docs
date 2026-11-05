import { describe, expect, test } from 'vitest';
import { showcaseSchema } from './showcase-schema.ts';

const entry = {
    name: 'Test',
    slug: 'test',
    summary: 's',
    description: 'd',
    author: { name: 'Kylie', github: 'kylie' },
    links: [],
    categories: ['Other'],
    features: ['client'],
    dateAdded: '2025-01-01',
    dateUpdated: '2025-01-01',
};

const parse = (overrides: Record<string, unknown> = {}) => showcaseSchema.safeParse({ ...entry, ...overrides });

describe('showcaseSchema', () => {
    test('accepts a minimal entry and defaults the optional lists', () => {
        const result = parse();
        expect(result.success).toBe(true);
        expect(result.data).toMatchObject({ platforms: [], formats: [], connects: [], picks: [] });
    });

    test('rejects values outside the fixed lists', () => {
        expect(parse({ categories: ['Game'] }).success).toBe(false);
        expect(parse({ platforms: ['ios', 'playstation'] }).success).toBe(false);
        expect(parse({ formats: ['comic'] }).success).toBe(false);
        expect(parse({ features: ['sdk'] }).success).toBe(false);
    });

    test('requires at least one feature', () => {
        expect(parse({ features: [] }).success).toBe(false);
    });

    test('connects needs exactly one of api or sdk', () => {
        expect(parse({ connects: ['api', 'pat'] }).success).toBe(true);
        expect(parse({ connects: ['sdk', 'oauth'] }).success).toBe(true);
        expect(parse({ connects: ['api', 'sdk'] }).success).toBe(false);
        expect(parse({ connects: ['pat'] }).success).toBe(false);
    });

    test('picks need a YYYY-MM month, a picker and a reason', () => {
        const pick = { month: '2026-11', by: 'someone', why: 'Solves a real problem.' };
        expect(parse({ picks: [pick] }).success).toBe(true);
        expect(parse({ picks: [{ ...pick, month: '2026-13' }] }).success).toBe(false);
        expect(parse({ picks: [{ ...pick, month: '2026-11-01' }] }).success).toBe(false);
        expect(parse({ picks: [{ month: '2026-11', by: 'someone' }] }).success).toBe(false);
        expect(parse({ picks: [{ ...pick, why: 'x'.repeat(501) }] }).success).toBe(false);
    });
});
