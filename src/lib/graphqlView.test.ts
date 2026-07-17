import { describe, expect, test } from 'vitest';
import { determineBestView } from './graphqlView.ts';

describe('determineBestView', () => {
    test('a single numeric row is not charted (regression: empty-chart bug)', () => {
        // One point is nothing to plot, and ChartResults refuses fewer than 2 —
        // so a one-row result must fall through to table, not chart.
        expect(determineBestView({ books: [{ id: 1, pages: 300 }] }, true)).toBe('table');
    });

    test('two or more numeric rows auto-select chart', () => {
        expect(
            determineBestView({ books: [{ id: 1, pages: 300 }, { id: 2, pages: 250 }] }, true)
        ).toBe('chart');
    });

    test('chart is suppressed when charting is unavailable', () => {
        expect(
            determineBestView({ books: [{ id: 1, pages: 300 }, { id: 2, pages: 250 }] }, false)
        ).toBe('table');
    });

    test('rows without numeric fields go to table', () => {
        expect(determineBestView({ users: [{ name: 'a' }, { name: 'b' }] }, true)).toBe('table');
    });

    test('a single object (not an array) uses JSON', () => {
        expect(determineBestView({ me: { id: 1, username: 'kylie' } }, true)).toBe('json');
    });

    test('an empty array uses JSON', () => {
        expect(determineBestView({ books: [] }, true)).toBe('json');
    });

    test('very wide rows (>15 keys) fall back to JSON, not table', () => {
        const wide = Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`k${i}`, `v${i}`]));
        expect(determineBestView({ things: [wide, wide] }, true)).toBe('json');
    });

    test('null / missing data uses JSON', () => {
        expect(determineBestView(null, true)).toBe('json');
        expect(determineBestView(undefined, true)).toBe('json');
    });

    test('array of primitives (not objects) uses JSON', () => {
        expect(determineBestView({ ids: [1, 2, 3] }, true)).toBe('json');
    });
});
