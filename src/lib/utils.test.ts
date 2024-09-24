import { expect, test } from 'vitest'
import {cn, uCFirst} from "./utils.ts";

test('uCFirst', () => {
  expect(uCFirst('hello')).toBe('Hello');
  expect(uCFirst('world')).toBe('World');
  expect(uCFirst('')).toBe('');
  expect(uCFirst('hello world!')).toBe('Hello world!');
});

test('cn', () => {
    expect(cn('text-center', 'text-blue-500')).toBe('text-center text-blue-500');
    expect(cn('text-center', 'text-blue-500', 'text-lg')).toBe('text-center text-blue-500 text-lg');
});
