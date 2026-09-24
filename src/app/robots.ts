import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_CONFIG.url;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/creator/studio',
          '/creator/analytics',
          '/advertiser',
          '/profile/',
          '/history',
          '/favorites',
          '/watchlist',
          '/login',
          '/register',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/creator/studio',
          '/creator/analytics',
          '/advertiser',
          '/profile/',
          '/history',
          '/favorites',
          '/watchlist',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
