import starlightPlugin from '@astrojs/starlight-tailwind';

// Generated color palettes
const accent = { 200: '#b6c8f4', 600: '#3d5dda', 900: '#1d2d63', 950: '#172143' };
const gray = { 100: '#f6f6f8', 200: '#ededf2', 300: '#c1c1c7', 400: '#898b95', 500: '#565761', 700: '#363741', 800: '#25262f', 900: '#17181c' };


/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				accent,
				gray,
			},
		},
	},
	plugins: [starlightPlugin()],
};
