import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// jsdom's CSS parser can't handle Tailwind v4 output (@layer, oklch(), nesting),
// so it writes a bare "Could not parse CSS stylesheet" to stderr whenever a
// styled component's stylesheet is parsed. It goes straight to the stream (not
// through console), so filter the stream. The styles aren't under test; every
// other stderr write passes through untouched.
const realStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, ...rest) => {
    if (typeof chunk === 'string' && chunk.includes('Could not parse CSS stylesheet')) {
        return true;
    }
    return realStderrWrite(chunk, ...rest);
};

// Recent Node versions define their own global `localStorage`, which is
// undefined unless Node starts with --localstorage-file, and it hides jsdom's.
// Give tests a working in-memory one whenever the global isn't usable.
class MemoryStorage {
    #items = new Map();
    get length() { return this.#items.size; }
    key(index) { return [...this.#items.keys()][index] ?? null; }
    getItem(key) { return this.#items.has(String(key)) ? this.#items.get(String(key)) : null; }
    setItem(key, value) { this.#items.set(String(key), String(value)); }
    removeItem(key) { this.#items.delete(String(key)); }
    clear() { this.#items.clear(); }
}

for (const name of ['localStorage', 'sessionStorage']) {
    if (typeof globalThis[name]?.clear !== 'function') {
        const storage = new MemoryStorage();
        Object.defineProperty(globalThis, name, { value: storage, configurable: true, writable: true });
        if (typeof window !== 'undefined' && window !== globalThis) {
            Object.defineProperty(window, name, { value: storage, configurable: true, writable: true });
        }
    }
}

// Mock ResizeObserver for recharts
global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe() {
        // Mock implementation
        this.callback([{ contentRect: { width: 500, height: 300 } }], this);
    }
    unobserve() {}
    disconnect() {}
};

// runs a clean after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
})