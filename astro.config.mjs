import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

import react from "@astrojs/react";

import { URLS } from './src/Consts';

// https://astro.build/config
export default defineConfig({
    favicon: './src/assets/hardcover.svg',
    integrations: [starlight({
        components: {
            SocialIcons: './src/components/SocialIcons.astro'
        },
        customCss: ['./src/tailwind.css'],
        defaultLocale: 'root',
        editLink: {
            baseUrl: 'https://github.com/hardcoverapp/hardcover-docs/tree/main/'
        },
        lastUpdated: true,
        locales: {
            'es': {
                label: 'Español',
                lang: 'es'
            },
            'fr': {
                 label: 'Français',
                 lang: 'fr'
             },
            'it': {
                label: 'Italiano',
                lang: 'it'
            },
            'pl': {
                label: 'Polski',
                lang: 'pl'
            },
            root: {
                label: 'English',
                lang: 'en'
            },
        },
        logo: {
            src: './src/assets/hardcover.svg'
        },
        sidebar: [
            {
                label: 'API Docs',
                collapsed: true,
                items: [
                    {
                        slug: 'api/getting-started',
                        translations: {
                            es: 'Empezando',
                            fr: 'Commencer',
                            it: 'Iniziare',
                            pl: 'Zaczynając'
                        }
                    },
                    {
                        slug: 'api/contributing',
                        translations: {
                            es: 'Contribuir',
                            fr: 'Contribuer',
                            it: 'Contribuire',
                            pl: 'Współpraca'
                        }
                    },
                    {
                        label: 'Guides',
                        translations: {
                            es: 'Guías',
                            fr: 'Guides',
                            it: 'Guide',
                            pl: 'Przewodniki'
                        },
                        autogenerate: {directory: 'api/guides'},
                        collapsed: true,
                    },
                    {
                        label: 'Schemas',
                        translations: {
                            es: 'Esquemas',
                            fr: 'Schémas',
                            it: 'Schemi',
                            pl: 'Schematy'
                        },
                        autogenerate: {directory: 'api/GraphQL/Schemas'},
                        collapsed: true,
                    }
                ]
            },
            {
                label: 'Librarian Guides',
                collapsed: true,
                autogenerate: {directory: 'librarians'},
                translations: {
                    es: 'Guías del bibliotecario',
                    fr: 'Guides du bibliothécaire',
                    it: 'Guide del bibliotecario',
                    pl: 'Przewodniki bibliotekarza'
                }
            }
        ],
        social: {
            discord: URLS.DISCORD,
            github: URLS.GITHUB,
            instagram: URLS.INSTAGRAM,
            mastodon: URLS.MASTODON,
        },
        title: {
            en: 'Hardcover',
            es: 'Hardcover',
            fr: 'Hardcover',
            it: 'Hardcover',
            pl: 'Hardcover'
        }
    }), tailwind({
        applyBaseStyles: false
    }), react()],
    site: URLS.DOCS
});
