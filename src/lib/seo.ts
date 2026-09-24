import { Blog, Video } from '@/types/database';

export const SITE_CONFIG = {
  name: 'Lighthouse Reels',
  legalName: 'Lighthouse Reels Entertainment',
  title: 'Lighthouse Reels - Premium Streaming, Short Reels & Creator Platform',
  description:
    'Lighthouse Reels is a premier entertainment and short-form streaming platform featuring cinematic short reels, serialized video drama, audio tracks, and exclusive creator stories.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://lighthousereels.com',
  ogImage: '/logo.png',
  twitterHandle: '@lighthousereels',
  locale: 'en_US',
};

/**
 * Strips markdown and HTML characters for clean search-engine snippets.
 */
export function stripMarkdownAndHtml(raw: string = ''): string {
  return raw
    .replace(/<[^>]*>/g, ' ') // Strip HTML tags
    .replace(/!\[.*?\]\(.*?\)/g, '') // Strip images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Keep link text
    .replace(/[#*`_~>[\]]/g, '') // Strip markdown symbols
    .replace(/\s+/g, ' ') // Collapse whitespaces
    .trim();
}

/**
 * Creates a clean, search-engine-friendly meta description excerpt.
 */
export function cleanExcerpt(raw: string = '', maxLength = 160): string {
  const clean = stripMarkdownAndHtml(raw);
  if (clean.length <= maxLength) return clean;
  const truncated = clean.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 50 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

/**
 * Calculates word count and estimated reading time for articles.
 */
export function estimateReadingTime(text: string = ''): {
  words: number;
  minutes: number;
  label: string;
} {
  const words = stripMarkdownAndHtml(text).split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return {
    words,
    minutes,
    label: `${minutes} min read`,
  };
}

/**
 * Generates an SEO-optimized URL slug from title.
 */
export function generateBlogSlug(title: string = ''): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * Generates Google-compliant Schema.org BlogPosting / Article JSON-LD structured data.
 */
export function generateBlogJsonLd(blog: Blog, baseUrl = SITE_CONFIG.url) {
  const authorName =
    blog.author?.display_name || blog.author?.username || 'Lighthouse Reels Creator';
  const postUrl = `${baseUrl}/blogs/${blog.id}`;
  const excerpt = cleanExcerpt(blog.body, 160);
  const imageUrl = blog.cover_url || `${baseUrl}/logo.png`;
  const { words } = estimateReadingTime(blog.body);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': postUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    headline: blog.title,
    description: excerpt,
    articleBody: stripMarkdownAndHtml(blog.body),
    wordCount: words,
    image: [imageUrl],
    datePublished: blog.published_at || new Date().toISOString(),
    dateModified: blog.published_at || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: authorName,
      url: blog.author?.username ? `${baseUrl}/profile/${blog.author.username}` : postUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    keywords: Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
    articleSection: blog.category || 'Entertainment',
    inLanguage: 'en-US',
  };
}

/**
 * Generates WebSite & Organization structured data for global discovery.
 */
export function generateWebsiteJsonLd(baseUrl = SITE_CONFIG.url) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: SITE_CONFIG.name,
        legalName: SITE_CONFIG.legalName,
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
        },
        sameAs: ['https://twitter.com/lighthousereels'],
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: SITE_CONFIG.name,
        description: SITE_CONFIG.description,
        publisher: {
          '@id': `${baseUrl}/#organization`,
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/explore?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: 'en-US',
      },
    ],
  };
}

/**
 * Generates VideoObject structured data for video detail indexing.
 */
export function generateVideoJsonLd(video: Video, baseUrl = SITE_CONFIG.url) {
  const videoUrl = `${baseUrl}/videos/${video.id}`;
  const creatorName =
    video.creator?.display_name || video.creator?.username || 'Lighthouse Reels Creator';

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: video.description || `${video.title} on Lighthouse Reels`,
    thumbnailUrl: [video.thumbnail_url || `${baseUrl}/logo.png`],
    uploadDate: video.created_at || new Date().toISOString(),
    duration: video.duration_seconds ? `PT${Math.floor(video.duration_seconds)}S` : undefined,
    contentUrl: video.video_url || undefined,
    embedUrl: videoUrl,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'WatchAction' },
      userInteractionCount: video.views_count || 0,
    },
    author: {
      '@type': 'Person',
      name: creatorName,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
  };
}
