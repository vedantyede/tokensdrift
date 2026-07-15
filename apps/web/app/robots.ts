import type { MetadataRoute } from 'next';

// Reports auto-expire after 90 days (see lib/store.ts) and badges/install/
// setup are utility endpoints, not marketing content — none of them belong
// in search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/r/', '/badge/', '/install', '/setup/'],
    },
    sitemap: 'https://tokensdrift.com/sitemap.xml',
  };
}
