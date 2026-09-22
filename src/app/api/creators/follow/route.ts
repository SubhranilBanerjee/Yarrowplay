import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/creators/follow?creator_id=uuid
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creator_id');

    if (!creatorId) {
      return NextResponse.json({ error: 'creator_id is required' }, { status: 400 });
    }

    // Count total followers for this creator
    const { count: followersCount } = await supabase
      .from('creator_follows')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId);

    let isFollowing = false;
    if (user) {
      const { data: followRow } = await supabase
        .from('creator_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('creator_id', creatorId)
        .maybeSingle();

      isFollowing = !!followRow;
    }

    return NextResponse.json({
      creator_id: creatorId,
      isFollowing,
      followersCount: followersCount || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to get follow status' }, { status: 500 });
  }
}

// POST /api/creators/follow - Toggle follow / unfollow
// Body: { creator_id: uuid }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { creator_id } = await req.json();

    if (!creator_id) {
      return NextResponse.json({ error: 'creator_id is required' }, { status: 400 });
    }

    if (user.id === creator_id) {
      return NextResponse.json({ error: 'You cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('creator_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('creator_id', creator_id)
      .maybeSingle();

    let isFollowing = false;

    if (existing) {
      // Unfollow
      await supabase.from('creator_follows').delete().eq('id', existing.id);
      isFollowing = false;
    } else {
      // Follow
      const { error: insErr } = await supabase.from('creator_follows').insert({
        follower_id: user.id,
        creator_id,
      });

      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 400 });
      }
      isFollowing = true;

      // Dispatch notification to creator
      try {
        const { createNotification } = await import('@/lib/notifications');
        const { data: followerProfile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', user.id)
          .single();

        const followerName = followerProfile?.display_name || followerProfile?.username || 'Someone';

        await createNotification(supabase, {
          recipient_id: creator_id,
          actor_id: user.id,
          action_type: 'system',
          content_title: 'New Follower',
          message: `${followerName} started following you!`,
        });
      } catch (notifyErr) {
        console.error('Failed to notify creator of follow:', notifyErr);
      }
    }

    // Recompute total followers count
    const { count: followersCount } = await supabase
      .from('creator_follows')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creator_id);

    return NextResponse.json({
      success: true,
      isFollowing,
      followersCount: followersCount || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to toggle follow' }, { status: 500 });
  }
}
