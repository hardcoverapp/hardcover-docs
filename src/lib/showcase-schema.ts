import { z } from 'astro/zod';

import { CATEGORIES, CONNECTIONS, FEATURES, FORMATS, PLATFORMS } from '../components/showcase/types';

// Kept out of content.config.ts so tests can import it without astro:content.
export const showcaseSchema = z.object({
	name: z.string(),
	slug: z.string(),
	summary: z.string(),
	description: z.string(),
	author: z.object({
		name: z.string(),
		github: z.string().optional(),
		hardcover: z.string().optional(),
	}).refine((author) => author.github || author.hardcover, {
		message: 'author needs a github or hardcover username',
	}),
	links: z.array(z.object({
		label: z.string(),
		url: z.url(),
		type: z.enum(['website', 'github', 'store', 'docs', 'demo']),
	})),
	categories: z.array(z.enum(CATEGORIES)).min(1),
	platforms: z.array(z.enum(PLATFORMS)).default([]),
	formats: z.array(z.enum(FORMATS)).default([]),
	features: z.array(z.enum(FEATURES)).min(1),
	connects: z.array(z.enum(CONNECTIONS)).default([]).refine(
		(connects) => connects.length === 0 || connects.includes('api') !== connects.includes('sdk'),
		{ message: 'connects needs exactly one of api or sdk' },
	),
	dateAdded: z.coerce.date(),
	dateUpdated: z.coerce.date(),
	screenshots: z.array(z.object({
		src: z.string(),
		alt: z.string(),
		origin: z.union([
			z.enum(['top', 'center', 'bottom']),
			z.string().regex(/^(100|[1-9]?\d)%$/),
		]).optional(),
	})).optional(),
	tags: z.array(z.string()).optional(),
	featured: z.boolean().default(false),
	picks: z.array(z.object({
		month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'month must be YYYY-MM'),
		by: z.string(),
		why: z.string().min(1).max(500),
	})).default([]),
	stats: z.object({
		githubStars: z.number().optional(),
		lastPushed: z.string().optional(),
		starsUpdated: z.string().optional(),
	}).optional(),
});
