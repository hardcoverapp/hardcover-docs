import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  favicon: './src/assets/hardcover.svg',
  integrations: [starlight({
    customCss: ['./src/tailwind.css'],
    defaultLocale: 'root',
    editLink: {
      baseUrl: 'https://github.com/RevelryPlay/hardcover-doc/tree/main/'
    },
    locales: {
      'fr': {
        label: 'Français',
        lang: 'fr'
      },
      root: {
        label: 'English',
        lang: 'en'
      },
      'sp': {
        label: 'Español',
        lang: 'es'
      }
    },
    logo: {
      src: './src/assets/hardcover.svg'
    },
    sidebar: [{
        autogenerate: {
            directory: 'guides'
        },
      label: 'Guides',
      translations: {
        es: 'Guías',
        fr: 'Guides'
      }
    }, {
      autogenerate: {
        directory: 'api/GraphQL'
      },
      label: 'API Reference',
      translations: {
        es: 'Referencia de la API',
        fr: 'Référence de l\'API'
      }
    }],
    social: {
      discord: 'https://discord.gg/edGpYN8ym8',
      github: 'https://github.com/RevelryPlay/hardcover-doc',
      instagram: 'https://instagram.com/hardcover.app',
      mastodon: 'https://mastodon.hardcover.app/@hardcover'
    },
    title: {
      en: 'API Documentation',
      es: 'Documentación de la API',
      fr: 'Documentation de l\'API'
    }
  }), tailwind({
    applyBaseStyles: false
  }), react()],
  site: 'https://hardcover.revelryplay.com'
});