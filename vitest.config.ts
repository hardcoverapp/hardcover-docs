/// <reference types="vitest" />
import {defineConfig} from 'vitest/config';
import { resolve } from 'path';

export default defineConfig(
    {
        test: {
            coverage: {
                reporter: ['text', 'json-summary', 'json'],
                reportOnFailure: true,
            },
            environment: 'jsdom',
            globals: true,
            setupFiles: './vitest-setup.js',
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
            },
            // The linked @hardcover/sdk's source, as in astro.config.mjs.
            // REMOVE when switching to the published npm package.
            conditions: ['@hardcover/source', 'module', 'browser', 'development|production'],
        }
    }
);