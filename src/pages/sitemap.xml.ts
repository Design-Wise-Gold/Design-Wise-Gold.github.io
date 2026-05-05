import { fetchPosts } from '../lib/blog';

export async function GET() {
  const posts = await fetchPosts();
  const baseUrl = 'https://wise.gold';
  
  const staticPages = [
    '',
    '/blog',
    '/privacy',
    '/terms',
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => {
    const url = `${baseUrl}${page}${page.endsWith('/') ? '' : '/'}`;
    return `
  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
  }).join('')}
  ${posts.map(post => {
    const url = `${baseUrl}${post.internalUrl}${post.internalUrl.endsWith('/') ? '' : '/'}`;
    return `
  <url>
    <loc>${url}</loc>
    <lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
