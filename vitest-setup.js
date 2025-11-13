import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

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