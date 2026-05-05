import type { APIRoute } from 'astro';
import { fetchPosts } from '../../lib/blog';

/**
 * GET /api/blog
 * Returns the parsed WiseGold Medium RSS feed as JSON.
 * Uses the shared fetchPosts() from lib/blog.ts (in-memory cache, 10 min TTL).
 * Returns 503 on failure instead of a silent empty 200.
 */
export const GET: APIRoute = async () => {
  try {
    const posts = await fetchPosts();

    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // CDN/proxy cache hint — actual server caching is handled in lib/blog.ts
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[/api/blog] Failed to fetch RSS feed:', error);

    return new Response(
      JSON.stringify({ error: 'Failed to load blog posts. Please try again later.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};