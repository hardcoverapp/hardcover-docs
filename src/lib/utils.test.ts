import {describe, expect, test} from 'vitest'
import {cn, uCFirst} from "./utils.ts";

test('uCFirst', () => {
    expect(uCFirst('hello')).toBe('Hello');
    expect(uCFirst('world')).toBe('World');
    expect(uCFirst('')).toBe('');
    expect(uCFirst('hello world!')).toBe('Hello world!');
});

describe('cn', () => {
    test('cn with multiple strings', () => {
        expect(cn('text-center', 'text-blue-500')).toBe('text-center text-blue-500');
        expect(cn('text-center', 'text-blue-500', 'text-lg')).toBe('text-center text-blue-500 text-lg');
    });

    test('cn with empty string', () => {
        expect(cn('text-center', '')).toBe('text-center');
        expect(cn('', 'text-blue-500')).toBe('text-blue-500');
        expect(cn('', '')).toBe('');
    });

    test('cn with undefined', () => {
        expect(cn('text-center', undefined)).toBe('text-center');
        expect(cn(undefined, 'text-blue-500')).toBe('text-blue-500');
        expect(cn(undefined, undefined)).toBe('');
    });

    test('cn with null', () => {
        expect(cn('text-center', null)).toBe('text-center');
        expect(cn(null, 'text-blue-500')).toBe('text-blue-500');
        expect(cn(null, null)).toBe('');
    });

    test('cn with false', () => {
        expect(cn('text-center', false)).toBe('text-center');
        expect(cn(false, 'text-blue-500')).toBe('text-blue-500');
        expect(cn(false, false)).toBe('');
    });
});
