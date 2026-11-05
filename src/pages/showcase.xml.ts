import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

import { buildShowcaseRss } from '@/lib/showcase-feed';

export const GET: APIRoute = async ({ site }) => {
  const entries = await getCollection('showcase');
  return new Response(buildShowcaseRss(entries.map((entry) => entry.data), site!.href), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
};
