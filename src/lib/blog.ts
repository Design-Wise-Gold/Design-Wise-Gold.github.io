/**
 * src/lib/blog.ts
 * Shared blog logic — RSS fetching, in-memory caching, parsing.
 * Imported directly by blog.astro and blog/[slug].astro to avoid the
 * double-HTTP round-trip that the old fetch('/api/blog') pattern caused.
 */
import Parser from 'rss-parser';

// ─── Types ───────────────────────────────────────────────────────────────────

type MediumItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  'content:encoded'?: string;
};

export type Post = {
  title: string;
  slug: string;
  url: string;          // canonical Medium URL
  internalUrl: string;  // /blog/[slug]
  image: string | null;
  excerpt: string;
  content: string;      // sanitized HTML for full-page render
  date: string;         // ISO / RFC 2822 string from RSS pubDate
};

// ─── Parser ──────────────────────────────────────────────────────────────────

const parser: Parser<{}, MediumItem> = new Parser();

// ─── HTML helpers ─────────────────────────────────────────────────────────────

const stripHtml = (html: string): string =>
  html
    .replace(/<figure[\s\S]*?<\/figure>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Remove dangerous HTML while preserving article structure.
 * Strips scripts, iframes, embeds and all inline event handlers.
 */
export const sanitizeHtml = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');

/**
 * Boilerplate / metadata patterns found in Medium RSS content.
 * Paragraphs matching these are skipped when building the excerpt.
 */
const META_PATTERNS =
  /^(coverage period|published|updated|tags?:|source:|via |http|wisegold capital partners|nothing in this pub|this is not financial|disclaimer|all rights reserved)/i;

/**
 * Build a multi-paragraph excerpt up to `maxLen` characters.
 * Skips boilerplate paragraphs to guarantee meaningful content.
 */
const getExcerpt = (html: string, maxLen = 400): string => {
  const matches = [...html.matchAll(/<p>(.*?)<\/p>/gs)];
  const paragraphs: string[] = [];
  let total = 0;

  for (const match of matches) {
    const text = stripHtml(match[1]).trim();
    if (text.length < 60 || META_PATTERNS.test(text)) continue;

    if (total + text.length > maxLen) {
      // If we have nothing yet, include a truncated version of this paragraph
      if (paragraphs.length === 0) {
        paragraphs.push(text.substring(0, maxLen) + '...');
      }
      break;
    }
    paragraphs.push(text);
    total += text.length;
  }

  return paragraphs.join(' ') || stripHtml(html).substring(0, maxLen);
};

/**
 * Recover the full article title from `<h1>` in the content HTML.
 * Medium sometimes truncates RSS titles with "…" — this fixes that.
 * Uses h1 only to avoid picking up section subheadings.
 */
const getFullTitle = (html: string): string | null => {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  if (h1Match) {
    const text = stripHtml(h1Match[1]).trim();
    if (text.length > 5) return text;
  }
  return null;
};

/**
 * Find the first meaningful image in HTML, skipping tracking pixels.
 * Also normalises &amp; → & so URLs are valid for use in <img src>.
 */
const getFirstImage = (html: string): string | null => {
  const imgs = [...html.matchAll(/<img[^>]+src="([^">]+)"/g)];
  const found = imgs.find(m => {
    const src = m[1];
    return (
      src &&
      !src.includes('stat?') &&
      !src.includes('pixel') &&
      src.length > 30
    );
  });
  return found ? found[1].replaceAll('&amp;', '&') : null;
};

/**
 * Derive a URL-safe slug from the Medium article URL.
 * Medium URLs: https://medium.com/@user/article-title-abc123
 */
const slugFromUrl = (url: string): string => {
  try {
    const path = new URL(url).pathname;
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? 'post';
  } catch {
    return url.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  }
};

// ─── In-memory cache ─────────────────────────────────────────────────────────

let _cache: { posts: Post[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch and parse the WiseGold Medium RSS feed.
 * Results are cached in memory for 10 minutes.
 * Falls back to stale cache data on network errors rather than throwing.
 */
export async function fetchPosts(): Promise<Post[]> {
  // Serve from cache while still valid
  if (_cache && Date.now() < _cache.expiresAt) {
    return _cache.posts;
  }

  // Timeout via Promise.race (rss-parser doesn't natively support AbortSignal)
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('RSS fetch timeout after 8s')), 8000)
  );

  try {
    const feed = await Promise.race([
      parser.parseURL('https://medium.com/@wisegold/feed'),
      timeout,
    ]);

    const posts: Post[] = (feed.items || []).map(item => {
      const content = item['content:encoded'] ?? '';
      const url     = item.link ?? '#';
      const slug    = slugFromUrl(url);

      let title = (item.title ?? '').replace(/<[^>]+>/g, '').trim();
      if (title.endsWith('...') || title.endsWith('\u2026')) {
        title = getFullTitle(content) ?? title;
      }

      return {
        title,
        slug,
        url,
        internalUrl: `/blog/${slug}`,
        image:       getFirstImage(content),
        excerpt:     getExcerpt(content),
        content:     sanitizeHtml(content),
        date:        item.pubDate ?? '',
      };
    });

    posts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Update cache
    _cache = { posts, expiresAt: Date.now() + CACHE_TTL_MS };
    return posts;

  } catch (err) {
    // On error: return stale cache data if available, otherwise rethrow
    if (_cache) {
      console.warn('[blog.ts] RSS fetch failed, serving stale cache:', err);
      return _cache.posts;
    }
    throw err;
  }
}

/**
 * Look up a single post by its slug.
 * Returns null if not found.
 */
export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const posts = await fetchPosts();
  return posts.find(p => p.slug === slug) ?? null;
}
