import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
	site: 'https://hardcover.revelryplay.com',
	integrations: [
		starlight({
			logo: {
				src: './src/assets/hardcover.svg'
			},
			title: 'API Documentation',
			social: {
				github: 'https://github.com/withastro/starlight',
			},
			sidebar: [
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Example Request', slug: 'guides/example' },
					],
				},
				{
					label: 'API Reference',
					autogenerate: { directory: 'api/GraphQL' },
				},
			],
			customCss: ['./src/tailwind.css'],
		}),
		tailwind({ applyBaseStyles: false }),
	],
});
