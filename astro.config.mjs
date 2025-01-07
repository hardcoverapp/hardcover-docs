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
            // 'fr': {
            //     label: 'Français',
            //     lang: 'fr'
            // },
            root: {
                label: 'English',
                lang: 'en'
            },
            // 'sp': {
            //     label: 'Español',
            //     lang: 'es'
            // }
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
                    },
                    {
                        slug: 'api/contributing',
                    },
                    {
                        label: 'Guides',
                        translations: {
                            // fr: 'Guides',
                            // es: 'Guías'
                        },
                        autogenerate: {directory: 'api/guides'},
                        collapsed: true,
                    },
                    {
                        label: 'Schemas',
                        translations: {
                            // fr: 'Schémas',
                            // es: 'Esquemas'
                        },
                        autogenerate: {directory: 'api/GraphQL/Schemas'},
                        collapsed: true,
                    }
                ]
            },
            {
                label: 'Librarian Guides',
                collapsed: true,
                autogenerate: {directory: 'librarians'}
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
            // es: 'Documentación de la API',
            // fr: 'Documentation de l\'API'
        }
    }), tailwind({
        applyBaseStyles: false
    }), react()],
    site: URLS.DOCS
});
