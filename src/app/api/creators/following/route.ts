import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/creators/following
// Returns creators followed by user and their recently published videos
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ following: [], feed: [] });
    }

    // 1. Get IDs of creators user is following
    const { data: followRows, error: fErr } = await supabase
      .from('creator_follows')
      .select('creator_id, created_at, creator:profiles(*)')
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false });

    if (fErr || !followRows || followRows.length === 0) {
      return NextResponse.json({ following: [], feed: [] });
    }

    const creatorIds = followRows.map((r: any) => r.creator_id);

    // 2. Fetch recent videos from these creators
    const { data: recentVideos } = await supabase
      .from('videos')
      .select('*, creator:profiles(*), series:content_series(*)')
      .in('creator_id', creatorIds)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(30);

    return NextResponse.json({
      following: followRows.map((r: any) => ({
        creator: r.creator,
        followed_at: r.created_at,
      })),
      feed: recentVideos || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch following feed' }, { status: 500 });
  }
}
