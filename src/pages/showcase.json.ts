import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

import { buildShowcaseJson } from '@/lib/showcase-feed';

export const GET: APIRoute = async ({ site }) => {
  const entries = await getCollection('showcase');
  const feed = buildShowcaseJson(entries.map((entry) => entry.data), site!.href);
  return new Response(JSON.stringify(feed, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
