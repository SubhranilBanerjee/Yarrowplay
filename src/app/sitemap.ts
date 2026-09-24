import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SITE_CONFIG } from '@/lib/seo';

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url;
  const now = new Date();

  // Core static marketing and discovery pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/home`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return staticRoutes;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all published blogs for search indexing
    const { data: blogs } = await supabase
      .from('blogs')
      .select('id, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    const blogRoutes: MetadataRoute.Sitemap = (blogs || []).map((blog) => ({
      url: `${baseUrl}/blogs/${blog.id}`,
      lastModified: blog.published_at ? new Date(blog.published_at) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Fetch published videos for video indexing
    const { data: videos } = await supabase
      .from('videos')
      .select('id, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(200);

    const videoRoutes: MetadataRoute.Sitemap = (videos || []).map((vid) => ({
      url: `${baseUrl}/videos/${vid.id}`,
      lastModified: vid.updated_at ? new Date(vid.updated_at) : vid.created_at ? new Date(vid.created_at) : now,
      changeFrequency: 'weekly',
      priority: 0.75,
    }));

    return [...staticRoutes, ...blogRoutes, ...videoRoutes];
  } catch (err) {
    console.error('Error generating dynamic sitemap:', err);
    return staticRoutes;
  }
}
