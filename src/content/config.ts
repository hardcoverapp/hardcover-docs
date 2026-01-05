import { defineCollection, z } from 'astro:content';
import { docsLoader} from "@astrojs/starlight/loaders";
import { docsSchema } from '@astrojs/starlight/schema';

const showcaseCollection = defineCollection({
	type: 'data',
	schema: z.object({
		name: z.string(),
		slug: z.string(),
		summary: z.string(),
		description: z.string(),
		author: z.object({
			name: z.string(),
			github: z.string().optional(),
			hardcover: z.string().optional(),
		}),
		links: z.array(z.object({
			label: z.string(),
			url: z.string().url(),
			type: z.enum(['website', 'github', 'store', 'docs', 'demo']),
		})),
		categories: z.array(z.string()).min(1),
		dateAdded: z.coerce.date(),
		dateUpdated: z.coerce.date(),
		screenshots: z.array(z.object({
			src: z.string(),
			alt: z.string(),
		})).optional(),
		tags: z.array(z.string()).optional(),
		featured: z.boolean().default(false),
		stats: z.object({
			githubStars: z.number().optional(),
		}).optional(),
	}),
});

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema()
	}),
	showcase: showcaseCollection,
};
