import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SITE_CONFIG, cleanExcerpt } from '@/lib/seo';

export const revalidate = 1800; // Revalidate every 30 minutes

export async function GET() {
  const baseUrl = SITE_CONFIG.url;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new NextResponse('Supabase configuration missing', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: blogs } = await supabase
      .from('blogs')
      .select('id, title, slug, body, category, published_at, cover_url, author:profiles(display_name, username)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    const itemsXml = (blogs || [])
      .map((blog) => {
        const url = `${baseUrl}/blogs/${blog.id}`;
        const pubDate = new Date(blog.published_at).toUTCString();
        const author = (blog.author as any)?.display_name || (blog.author as any)?.username || 'Lighthouse Reels';
        const description = cleanExcerpt(blog.body, 300);

        return `
    <item>
      <title><![CDATA[${blog.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${author}</author>
      <category>${blog.category || 'Entertainment'}</category>
      <description><![CDATA[${description}]]></description>
      ${blog.cover_url ? `<enclosure url="${blog.cover_url}" type="image/jpeg" />` : ''}
    </item>`;
      })
      .join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_CONFIG.name}</title>
    <link>${baseUrl}</link>
    <description>${SITE_CONFIG.description}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 's-maxage=1800, stale-while-revalidate',
      },
    });
  } catch (err: any) {
    return new NextResponse(`Error generating feed: ${err.message}`, { status: 500 });
  }
}
