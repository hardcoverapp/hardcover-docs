import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader} from "@astrojs/starlight/loaders";
import { docsSchema } from '@astrojs/starlight/schema';

import { showcaseSchema } from './lib/showcase-schema';

const showcaseCollection = defineCollection({
	loader: glob({ pattern: '**/*.yaml', base: './src/content/showcase' }),
	schema: showcaseSchema,
});

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema()
	}),
	showcase: showcaseCollection,
};
