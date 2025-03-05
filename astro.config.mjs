import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

import react from "@astrojs/react";

import { URLS } from './src/Consts';
import {translations} from './src/translations.js';

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
                label: translations.getLocale('es').lang.label,
                lang: translations.getLocale('es').lang.code
            },
            'fr': {
                 label: translations.getLocale('fr').lang.label,
                 lang: translations.getLocale('fr').lang.code
             },
            'it': {
                label: translations.getLocale('it').lang.label,
                lang: translations.getLocale('it').lang.code
            },
            'pl': {
                label: translations.getLocale('pl').lang.label,
                lang: translations.getLocale('pl').lang.code
            },
            root: {
                label: translations.getLocale('en').lang.label,
                lang: translations.getLocale('en').lang.code
            },
        },
        logo: {
            src: './src/assets/hardcover.svg'
        },
        sidebar: [
            {
                label: translations.getLocale('en').sidebar.api.title,
                collapsed: true,
                items: [
                    {
                        label: translations.getLocale('en').sidebar.api.gettingStarted,
                        slug: 'api/getting-started',
                        translations: {
                            es: translations.getLocale('es').sidebar.api.gettingStarted,
                            fr: translations.getLocale('fr').sidebar.api.gettingStarted,
                            it: translations.getLocale('it').sidebar.api.gettingStarted,
                            pl: translations.getLocale('pl').sidebar.api.gettingStarted
                        }
                    },
                    {
                        label: translations.getLocale('en').sidebar.api.guides,
                        translations: {
                            es: translations.getLocale('es').sidebar.api.guides,
                            fr: translations.getLocale('fr').sidebar.api.guides,
                            it: translations.getLocale('it').sidebar.api.guides,
                            pl: translations.getLocale('pl').sidebar.api.guides
                        },
                        autogenerate: {directory: 'api/guides'},
                        collapsed: true,
                    },
                    {
                        label: translations.getLocale('en').sidebar.api.schemas,
                        translations: {
                            es: translations.getLocale('es').sidebar.api.schemas,
                            fr: translations.getLocale('fr').sidebar.api.schemas,
                            it: translations.getLocale('it').sidebar.api.schemas,
                            pl: translations.getLocale('pl').sidebar.api.schemas
                        },
                        autogenerate: {directory: 'api/GraphQL/Schemas'},
                        collapsed: true,
                    }
                ]
            },
            {
                label: translations.getLocale('en').sidebar.contributing.title,
                collapsed: true,
                items: [
                    {
                        label: translations.getLocale('en').sidebar.contributing.api,
                        slug: 'contributing/api-docs',

                        translations: {
                            es: translations.getLocale('es').sidebar.contributing.api,
                            fr: translations.getLocale('fr').sidebar.contributing.api,
                            it: translations.getLocale('it').sidebar.contributing.api,
                            pl: translations.getLocale('pl').sidebar.contributing.api
                        }
                    },
                    {
                        label: translations.getLocale('en').sidebar.contributing.librarian,
                        slug: 'contributing/librarian-guides',

                        translations: {
                            es: translations.getLocale('es').sidebar.contributing.librarian,
                            fr: translations.getLocale('fr').sidebar.contributing.librarian,
                            it: translations.getLocale('it').sidebar.contributing.librarian,
                            pl: translations.getLocale('pl').sidebar.contributing.librarian
                        }
                    },
                    {
                        label: translations.getLocale('en').sidebar.contributing.translations,
                        slug: 'contributing/doc-translations',

                        translations: {
                            es: translations.getLocale('es').sidebar.contributing.translations,
                            fr: translations.getLocale('fr').sidebar.contributing.translations,
                            it: translations.getLocale('it').sidebar.contributing.translations,
                            pl: translations.getLocale('pl').sidebar.contributing.translations
                        }
                    }
                ],
                translations: {
                    es: translations.getLocale('es').sidebar.contributing.title,
                    fr: translations.getLocale('fr').sidebar.contributing.title,
                    it: translations.getLocale('it').sidebar.contributing.title,
                    pl: translations.getLocale('pl').sidebar.contributing.title
                }
            },
            {
                label: translations.getLocale('en').sidebar.librarians.title,
                collapsed: true,
                items: [
                    {
                        label: translations.getLocale('en').sidebar.librarians.editing,
                        slug: 'librarians/editing',

                        translations: {
                            es: translations.getLocale('es').sidebar.librarians.editing,
                            fr: translations.getLocale('fr').sidebar.librarians.editing,
                            it: translations.getLocale('it').sidebar.librarians.editing,
                            pl: translations.getLocale('pl').sidebar.librarians.editing
                        }
                    },
                    {
                        label: translations.getLocale('en').sidebar.librarians.faq,
                        slug: 'librarians/faq',

                        translations: {
                            es: translations.getLocale('es').sidebar.librarians.faq,
                            fr: translations.getLocale('fr').sidebar.librarians.faq,
                            it: translations.getLocale('it').sidebar.librarians.faq,
                            pl: translations.getLocale('pl').sidebar.librarians.faq
                        }
                    },
                    // {
                    //     label: translations.getLocale('en').sidebar.librarians.gettingStarted,
                    //     slug: 'librarians/getting-started',
                    //
                    //     translations: {
                    //         es: translations.getLocale('es').sidebar.librarians.gettingStarted,
                    //         fr: translations.getLocale('fr').sidebar.librarians.gettingStarted,
                    //         it: translations.getLocale('it').sidebar.librarians.gettingStarted,
                    //         pl: translations.getLocale('pl').sidebar.librarians.gettingStarted
                    //     }
                    // }
                    {
                        label: translations.getLocale('en').sidebar.librarians.resources,
                        autogenerate: {directory: 'librarians/Resources'},

                        translations: {
                            es: translations.getLocale('es').sidebar.librarians.resources,
                            fr: translations.getLocale('fr').sidebar.librarians.resources,
                            it: translations.getLocale('it').sidebar.librarians.resources,
                            pl: translations.getLocale('pl').sidebar.librarians.resources
                        }
                    },
                    {
                        label: translations.getLocale('en').sidebar.librarians.standards,
                        autogenerate: {directory: 'librarians/Standards'},

                        translations: {
                            es: translations.getLocale('es').sidebar.librarians.standards,
                            fr: translations.getLocale('fr').sidebar.librarians.standards,
                            it: translations.getLocale('it').sidebar.librarians.standards,
                            pl: translations.getLocale('pl').sidebar.librarians.standards
                        }
                    }
                ],

                translations: {
                    es: translations.getLocale('es').sidebar.librarians.title,
                    fr: translations.getLocale('fr').sidebar.librarians.title,
                    it: translations.getLocale('it').sidebar.librarians.title,
                    pl: translations.getLocale('pl').sidebar.librarians.title
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
            en: translations.getLocale('en').site.title,
        }
    }), tailwind({
        applyBaseStyles: false
    }), react()],
    site: URLS.DOCS
});
