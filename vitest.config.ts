/// <reference types="vitest" />
import {getViteConfig} from 'astro/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default getViteConfig(
    {
        plugins: [react()],
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
    },
    {
        site: 'https://docs.hardcover.app',
        trailingSlash: 'always',
    },
);