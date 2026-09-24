import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Blog } from '@/types/database';
import { generateBlogJsonLd, cleanExcerpt, SITE_CONFIG } from '@/lib/seo';
import BlogReaderClient from './BlogReaderClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getBlog(idOrSlug: string): Promise<Blog | null> {
  const supabase = await createClient();
  
  // Try querying by ID first, or by slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  
  let query = supabase
    .from('blogs')
    .select('*, author:profiles(*)');

  if (isUuid) {
    query = query.eq('id', idOrSlug);
  } else {
    query = query.eq('slug', idOrSlug);
  }

  const { data, error } = await query.maybeSingle();

  if (error || !data) {
    // Fallback: search both
    const { data: fallbackData } = await supabase
      .from('blogs')
      .select('*, author:profiles(*)')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .maybeSingle();
    return (fallbackData as Blog) || null;
  }

  return (data as Blog) || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const blog = await getBlog(id);

  if (!blog) {
    return {
      title: 'Article Not Found | Lighthouse Reels',
      description: 'The requested article could not be found on Lighthouse Reels.',
      robots: { index: false, follow: false },
    };
  }

  const title = `${blog.title} | Lighthouse Reels`;
  const description = cleanExcerpt(blog.body, 160) || `Read "${blog.title}" on Lighthouse Reels.`;
  const url = `${SITE_CONFIG.url}/blogs/${blog.id}`;
  const images = blog.cover_url
    ? [
        {
          url: blog.cover_url,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ]
    : [
        {
          url: `${SITE_CONFIG.url}/icon.png`,
          width: 512,
          height: 512,
          alt: 'Lighthouse Reels',
        },
      ];

  return {
    title,
    description,
    keywords: blog.tags && blog.tags.length > 0 ? blog.tags : ['Lighthouse Reels', 'Blog', 'Creator Story', 'Short Film'],
    authors: [{ name: blog.author?.display_name || 'Lighthouse Creator' }],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      siteName: SITE_CONFIG.name,
      publishedTime: blog.published_at || blog.created_at,
      modifiedTime: blog.updated_at || blog.published_at || blog.created_at,
      authors: [blog.author?.display_name || 'Lighthouse Creator'],
      tags: blog.tags || [],
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: blog.cover_url ? [blog.cover_url] : [`${SITE_CONFIG.url}/icon.png`],
      creator: SITE_CONFIG.twitterHandle,
    },
  };
}

export default async function BlogPage({ params }: PageProps) {
  const { id } = await params;
  const blog = await getBlog(id);

  const jsonLd = blog ? generateBlogJsonLd(blog) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogReaderClient initialBlog={blog} blogId={id} />
    </>
  );
}
