// Generates a sitemap.xml covering the app's static, publicly indexable routes.
// Dynamic routes (individual stories, profiles, products, etc.) aren't included here —
// a proper implementation would query the API at build time to enumerate them; this
// covers the static shell and is the honest scope for a client-only SPA without SSR.
// Usage: node scripts/generateSitemap.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.SITE_URL || 'https://prernanode.app';

const STATIC_ROUTES = [
  ['/', '1.0', 'daily'],
  ['/feed', '0.9', 'hourly'],
  ['/skills', '0.8', 'daily'],
  ['/marketplace', '0.8', 'daily'],
  ['/businesses', '0.7', 'daily'],
  ['/communities', '0.7', 'daily'],
  ['/events', '0.7', 'daily'],
  ['/opportunities', '0.7', 'daily'],
  ['/collaborations', '0.6', 'daily'],
  ['/trending', '0.7', 'hourly'],
  ['/login', '0.3', 'monthly'],
  ['/register', '0.3', 'monthly'],
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${STATIC_ROUTES.map(
  ([route, priority, freq]) => `  <url>
    <loc>${BASE_URL}${route}</loc>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`
).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'sitemap.xml'), xml);
console.log('sitemap.xml generated with', STATIC_ROUTES.length, 'routes');
