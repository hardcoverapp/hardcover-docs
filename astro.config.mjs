import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

import react from "@astrojs/react";

import { URLS } from './src/Consts';

import * as EN from './src/content/docs/ui.json';
import * as ES from './src/content/docs/es/ui.json';
import * as FR from './src/content/docs/fr/ui.json';
import * as IT from './src/content/docs/it/ui.json';
import * as PL from './src/content/docs/pl/ui.json';

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
            baseUrl: 'https://github.com/hardcoverapp/hardcover-docs/edit/main/'
        },
        lastUpdated: true,
        locales: {
            'es': {
                label: ES.lang.label,
                lang: ES.lang.code
            },
            'fr': {
                 label: FR.lang.label,
                 lang: FR.lang.code
             },
            'it': {
                label: IT.lang.label,
                lang: IT.lang.code
            },
            'pl': {
                label: PL.lang.label,
                lang: PL.lang.code
            },
            root: {
                label: EN.lang.label,
                lang: EN.lang.code
            },
        },
        logo: {
            src: './src/assets/hardcover.svg'
        },
        sidebar: [
            {
                label: EN.sidebar.api.title,
                collapsed: true,
                items: [
                    {
                        label: EN.sidebar.api.gettingStarted,
                        slug: 'api/getting-started',
                        translations: {
                            es: ES.sidebar.api.gettingStarted,
                            fr: FR.sidebar.api.gettingStarted,
                            it: IT.sidebar.api.gettingStarted,
                            pl: PL.sidebar.api.gettingStarted
                        }
                    },
                    {
                        label: EN.sidebar.api.guides,
                        translations: {
                            es: ES.sidebar.api.guides,
                            fr: FR.sidebar.api.guides,
                            it: IT.sidebar.api.guides,
                            pl: PL.sidebar.api.guides
                        },
                        autogenerate: {directory: 'api/guides'},
                        collapsed: true,
                    },
                    {
                        label: EN.sidebar.api.schemas,
                        translations: {
                            es: ES.sidebar.api.schemas,
                            fr: FR.sidebar.api.schemas,
                            it: IT.sidebar.api.schemas,
                            pl: PL.sidebar.api.schemas
                        },
                        autogenerate: {directory: 'api/GraphQL/Schemas'},
                        collapsed: true,
                    }
                ]
            },
            {
                label: EN.sidebar.contributing.title,
                collapsed: true,
                items: [
                    {
                        label: EN.sidebar.contributing.api,
                        slug: 'contributing/api-docs',

                        translations: {
                            es: ES.sidebar.contributing.api,
                            fr: FR.sidebar.contributing.api,
                            it: IT.sidebar.contributing.api,
                            pl: PL.sidebar.contributing.api
                        }
                    },
                    {
                        label: EN.sidebar.contributing.librarian,
                        slug: 'contributing/librarian-guides',

                        translations: {
                            es: ES.sidebar.contributing.librarian,
                            fr: FR.sidebar.contributing.librarian,
                            it: IT.sidebar.contributing.librarian,
                            pl: PL.sidebar.contributing.librarian
                        }
                    },
                    {
                        label: EN.sidebar.contributing.translations,
                        slug: 'contributing/doc-translations',

                        translations: {
                            es: ES.sidebar.contributing.translations,
                            fr: FR.sidebar.contributing.translations,
                            it: IT.sidebar.contributing.translations,
                            pl: PL.sidebar.contributing.translations
                        }
                    }
                ],
                translations: {
                    es: ES.sidebar.contributing.title,
                    fr: FR.sidebar.contributing.title,
                    it: IT.sidebar.contributing.title,
                    pl: PL.sidebar.contributing.title
                }
            },
            {
                label: EN.sidebar.librarians.title,
                collapsed: true,
                items: [
                    {
                        label: EN.sidebar.librarians.editing,
                        slug: 'librarians/editing',

                        translations: {
                            es: ES.sidebar.librarians.editing,
                            fr: FR.sidebar.librarians.editing,
                            it: IT.sidebar.librarians.editing,
                            pl: PL.sidebar.librarians.editing
                        }
                    },
                    {
                        label: EN.sidebar.librarians.faq,
                        slug: 'librarians/faq',

                        translations: {
                            es: ES.sidebar.librarians.faq,
                            fr: FR.sidebar.librarians.faq,
                            it: IT.sidebar.librarians.faq,
                            pl: PL.sidebar.librarians.faq
                        }
                    },
                    // {
                    //     label: EN.sidebar.librarians.gettingStarted,
                    //     slug: 'librarians/getting-started',
                    //
                    //     translations: {
                    //         es: ES.sidebar.librarians.gettingStarted,
                    //         fr: FR.sidebar.librarians.gettingStarted,
                    //         it: IT.sidebar.librarians.gettingStarted,
                    //         pl: PL.sidebar.librarians.gettingStarted
                    //     }
                    // }
                    {
                        label: EN.sidebar.librarians.resources,
                        autogenerate: {directory: 'librarians/Resources'},

                        translations: {
                            es: ES.sidebar.librarians.resources,
                            fr: FR.sidebar.librarians.resources,
                            it: IT.sidebar.librarians.resources,
                            pl: PL.sidebar.librarians.resources
                        }
                    },
                    {
                        label: EN.sidebar.librarians.standards,
                        autogenerate: {directory: 'librarians/Standards'},

                        translations: {
                            es: ES.sidebar.librarians.standards,
                            fr: FR.sidebar.librarians.standards,
                            it: IT.sidebar.librarians.standards,
                            pl: PL.sidebar.librarians.standards
                        }
                    }
                ],

                translations: {
                    es: ES.sidebar.librarians.title,
                    fr: FR.sidebar.librarians.title,
                    it: IT.sidebar.librarians.title,
                    pl: PL.sidebar.librarians.title
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
            en: EN.site.title,
        }
    }), tailwind({
        applyBaseStyles: false
    }), react()],
    site: URLS.DOCS
});
