import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  site: 'https://hardcover.revelryplay.com',
  favicon: './src/assets/hardcover.svg',
  integrations: [starlight({

    defaultLocale: 'root',
    locales: {
      'fr': {
        label: 'Français',
        lang: 'fr'
      },
      'sp': {
        label: 'Español',
        lang: 'es'
      },
      root: {
        label: 'English',
        lang: 'en'
      }
    },

    logo: {
      src: './src/assets/hardcover.svg'
    },
    title: {
      en: 'API Documentation',
      fr: 'Documentation de l\'API',
      es: 'Documentación de la API'
    },
    social: {
      github: 'https://github.com/RevelryPlay/hardcover-doc',
      discord: 'https://discord.gg/edGpYN8ym8',
      mastodon: 'https://mastodon.hardcover.app/@hardcover',
      instagram: 'https://instagram.com/hardcover.app'
    },
    sidebar: [{
      label: 'Guides',
      translations: {
        fr: 'Guides',
        es: 'Guías'
      },
      items: [
        // Each item here is one entry in the navigation menu.
        {
          label: 'Example Request',
          slug: 'guides/example',
          translations: {
            fr: 'Exemple de demande',
            es: 'Ejemplo de solicitud'
          },
        },
      ]
    }, {
      label: 'API Reference',
      translations: {
        fr: 'Référence de l\'API',
        es: 'Referencia de la API'
      },
      autogenerate: {
        directory: 'api/GraphQL'
      }
    }],
    customCss: ['./src/tailwind.css']
  }), tailwind({
    applyBaseStyles: false
  }), react()]
});