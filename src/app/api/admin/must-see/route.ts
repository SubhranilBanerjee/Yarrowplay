import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function isUserAdmin(email?: string | null, role?: string): boolean {
  if (!email) return false;
  return (
    email === process.env.ADMIN_EMAIL ||
    email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    email === 'admin@dramabox.stream' ||
    role === 'admin'
  );
}

// GET /api/admin/must-see - List content for must-see management
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = user
      ? await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      : { data: null };

    const isAdmin = isUserAdmin(user?.email, profile?.role);

    // If not admin, return only currently marked must-see items for public display
    if (!isAdmin) {
      const [seriesRes, videosRes, blogsRes] = await Promise.all([
        supabase
          .from('content_series')
          .select('*, creator:profiles(*), episodes:videos(id, episode_number, thumbnail_url, duration_seconds, views_count, is_locked)')
          .eq('is_must_see', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('videos')
          .select('*, creator:profiles(*), series:content_series(*)')
          .eq('is_must_see', true)
          .eq('status', 'published')
          .order('views_count', { ascending: false }),
        supabase
          .from('blogs')
          .select('*, author:profiles(*)')
          .eq('is_must_see', true)
          .eq('status', 'published')
          .order('published_at', { ascending: false }),
      ]);

      return NextResponse.json({
        series: seriesRes.data || [],
        videos: videosRes.data || [],
        blogs: blogsRes.data || [],
        isAdmin: false,
      });
    }

    // Admin view: list marked items + recent items available to mark
    const [allSeries, allVideos, allBlogs] = await Promise.all([
      supabase
        .from('content_series')
        .select('id, title, category, cover_url, is_must_see, created_at, creator:profiles(display_name)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('videos')
        .select('id, title, thumbnail_url, is_must_see, views_count, duration_seconds, status, created_at, creator:profiles(display_name)')
        .eq('status', 'published')
        .order('views_count', { ascending: false })
        .limit(50),
      supabase
        .from('blogs')
        .select('id, title, cover_url, is_must_see, category, status, published_at, author:profiles(display_name)')
        .order('published_at', { ascending: false })
        .limit(50),
    ]);

    return NextResponse.json({
      series: allSeries.data || [],
      videos: allVideos.data || [],
      blogs: allBlogs.data || [],
      isAdmin: true,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch must-see content' }, { status: 500 });
  }
}

// POST /api/admin/must-see - Toggle must-see flag on a content item
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!isUserAdmin(user.email, profile?.role)) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 });
    }

    const { content_type, content_id, is_must_see } = await req.json();

    if (!content_type || !content_id) {
      return NextResponse.json({ error: 'content_type and content_id are required' }, { status: 400 });
    }

    const table =
      content_type === 'series'
        ? 'content_series'
        : content_type === 'video'
        ? 'videos'
        : 'blogs';

    const { data, error } = await supabase
      .from(table)
      .update({ is_must_see: Boolean(is_must_see) })
      .eq('id', content_id)
      .select('id, is_must_see')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      content_type,
      content_id,
      is_must_see: data.is_must_see,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to toggle must-see' }, { status: 500 });
  }
}
