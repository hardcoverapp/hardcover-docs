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