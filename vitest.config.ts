/// <reference types="vitest" />
import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
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
        }
    }
);