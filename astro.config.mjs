import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

import react from "@astrojs/react";

import {URLS} from './src/Consts';
import {useTranslation} from './src/lib/utils'

// https://astro.build/config
export default defineConfig({
    favicon: './src/assets/hardcover.svg',
    integrations: [starlight({
        components: {
            SocialIcons: './src/components/SocialIcons.astro',
            EditLink: './src/components/PageEdit.astro'
        },
        customCss: ['./src/tailwind.css'],
        defaultLocale: 'root',
        editLink: {
            baseUrl: URLS.GITHUB_EDIT
        },
        head: [
            {
                tag: 'script',
                attrs: {
                    src: 'https://plausible.hardcover.app/js/script.js',
                    'data-domain': 'docs.hardcover.app',
                    defer: true
                },
            },
        ],
        lastUpdated: true,
        locales: {
            // 'es': {
            //     label: useTranslation('lang.label', 'es'),
            //     lang: useTranslation('lang.code', 'es'),
            // },
            // 'fr': {
            //     label: useTranslation('lang.label', 'fr'),
            //     lang: useTranslation('lang.code', 'fr')
            // },
            'it': {
                label: useTranslation('lang.label', 'it'),
                lang: useTranslation('lang.code', 'it')
            },
            // 'pl': {
            //     label: useTranslation('lang.label', 'pl'),
            //     lang: useTranslation('lang.code', 'pl')
            // },
            root: {
                label: useTranslation('lang.label', 'en'),
                lang: useTranslation('lang.code', 'en')
            },
        },
        logo: {
            src: './src/assets/hardcover.svg'
        },
        sidebar: [
            {
                label: useTranslation('sidebar.api.title', 'en'),
                collapsed: true,
                items: [
                    {
                        label: useTranslation('sidebar.api.gettingStarted', 'en'),
                        slug: 'api/getting-started',
                        translations: {
                            es: useTranslation('sidebar.api.gettingStarted', 'es'),
                            fr: useTranslation('sidebar.api.gettingStarted', 'fr'),
                            it: useTranslation('sidebar.api.gettingStarted', 'it'),
                            pl: useTranslation('sidebar.api.gettingStarted', 'pl')
                        }
                    },
                    {
                        label: useTranslation('sidebar.api.guides', 'en'),
                        translations: {
                            es: useTranslation('sidebar.api.guides', 'es'),
                            fr: useTranslation('sidebar.api.guides', 'fr'),
                            it: useTranslation('sidebar.api.guides', 'it'),
                            pl: useTranslation('sidebar.api.guides', 'pl')
                        },
                        autogenerate: {directory: 'api/guides'},
                        collapsed: true,
                    },
                    {
                        label: useTranslation('sidebar.api.schemas', 'en'),
                        translations: {
                            es: useTranslation('sidebar.api.schemas', 'es'),
                            fr: useTranslation('sidebar.api.schemas', 'fr'),
                            it: useTranslation('sidebar.api.schemas', 'it'),
                            pl: useTranslation('sidebar.api.schemas', 'pl')
                        },
                        autogenerate: {directory: 'api/GraphQL/Schemas'},
                        collapsed: true,
                    }
                ]
            },
            {
                label: useTranslation('sidebar.contributing.title', 'en'),
                collapsed: true,
                autogenerate: {directory: 'contributing'},
                translations: {
                    es: useTranslation('sidebar.contributing.title', 'es'),
                    fr: useTranslation('sidebar.contributing.title', 'fr'),
                    it: useTranslation('sidebar.contributing.title', 'it'),
                    pl: useTranslation('sidebar.contributing.title', 'pl')
                }
            },
            {
                label: useTranslation('sidebar.librarians.title', 'en'),
                collapsed: true,
                items: [
                    {
                        label: useTranslation('sidebar.librarians.gettingStarted', 'en'),
                        slug: 'librarians/getting-started',
                    
                        translations: {
                            es: useTranslation('sidebar.librarians.gettingStarted', 'es'),
                            fr: useTranslation('sidebar.librarians.gettingStarted', 'fr'),
                            it: useTranslation('sidebar.librarians.gettingStarted', 'it'),
                            pl: useTranslation('sidebar.librarians.gettingStarted', 'pl')
                        }
                    },
                    // {
                    //     label: useTranslation('sidebar.librarians.editing', 'en'),
                    //     slug: 'librarians/editing',

                    //     translations: {
                    //         es: useTranslation('sidebar.librarians.editing', 'es'),
                    //         fr: useTranslation('sidebar.librarians.editing', 'fr'),
                    //         it: useTranslation('sidebar.librarians.editing', 'it'),
                    //         pl: useTranslation('sidebar.librarians.editing', 'pl')
                    //     }
                    // },
                    {
                        label: useTranslation('sidebar.librarians.faq', 'en'),
                        slug: 'librarians/faq',

                        translations: {
                            es: useTranslation('sidebar.librarians.faq', 'es'),
                            fr: useTranslation('sidebar.librarians.faq', 'fr'),
                            it: useTranslation('sidebar.librarians.faq', 'it'),
                            pl: useTranslation('sidebar.librarians.faq', 'pl')
                        }
                    },
                    {
                        label: useTranslation('sidebar.librarians.resources', 'en'),
                        autogenerate: {directory: 'librarians/Resources'},

                        translations: {
                            es: useTranslation('sidebar.librarians.resources', 'es'),
                            fr: useTranslation('sidebar.librarians.resources', 'fr'),
                            it: useTranslation('sidebar.librarians.resources', 'it'),
                            pl: useTranslation('sidebar.librarians.resources', 'pl')
                        }
                    },
                    {
                        label: useTranslation('sidebar.librarians.standards', 'en'),
                        autogenerate: {directory: 'librarians/Standards'},

                        translations: {
                            es: useTranslation('sidebar.librarians.standards', 'es'),
                            fr: useTranslation('sidebar.librarians.standards', 'fr'),
                            it: useTranslation('sidebar.librarians.standards', 'it'),
                            pl: useTranslation('sidebar.librarians.standards', 'pl')
                        }
                    }
                ],

                translations: {
                    es: useTranslation('sidebar.librarians.title', 'es'),
                    fr: useTranslation('sidebar.librarians.title', 'fr'),
                    it: useTranslation('sidebar.librarians.title', 'it'),
                    pl: useTranslation('sidebar.librarians.title', 'pl')
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
            en: useTranslation('site.title', 'en'),
        }
    }), tailwind({
        applyBaseStyles: false
    }), react()],
    site: URLS.DOCS,
    vite: {
        optimizeDeps: {
            include: []
        }
    }
});
