import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin =
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      user.email === 'admin@dramabox.stream' ||
      profile?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Find all videos with duration > 120 seconds (2 minutes)
    const { data: longVideos, error } = await supabase
      .from('videos')
      .select('id, title, duration_seconds, views_count, status, created_at, video_url, thumbnail_url, creator:profiles(id, display_name, username)')
      .gt('duration_seconds', 120)
      .order('duration_seconds', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      longEpisodes: longVideos || [],
      count: longVideos?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch episode review data' }, { status: 500 });
  }
}
