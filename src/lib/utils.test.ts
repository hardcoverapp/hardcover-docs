import { expect, test } from 'vitest'
import { uCFirst} from "./utils.ts";

test('uCFirst', () => {
  expect(uCFirst('hello')).toBe('Hello');
  expect(uCFirst('world')).toBe('World');
  expect(uCFirst('')).toBe('');
  expect(uCFirst('hello world!')).toBe('Hello world!');
});
