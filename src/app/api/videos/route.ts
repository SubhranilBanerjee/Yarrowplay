import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let videoId = searchParams.get('id');

    if (!videoId) {
      try {
        const body = await req.json();
        videoId = body?.id;
      } catch {
        // body may be empty
      }
    }

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // 1. Fetch video to verify ownership
    const { data: video, error: fetchErr } = await supabase
      .from('videos')
      .select('id, creator_id, series_id, video_public_id, thumbnail_public_id')
      .eq('id', videoId)
      .single();

    if (fetchErr || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Check if user is creator or platform admin
    const isAdmin =
      user.email === process.env.ADMIN_EMAIL ||
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (video.creator_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the original creator or an admin can delete this video' },
        { status: 403 }
      );
    }

    // 2. Clean up associated dependencies
    await Promise.allSettled([
      supabase.from('reactions').delete().eq('content_type', 'video').eq('content_id', videoId),
      supabase.from('comments').delete().eq('content_type', 'video').eq('content_id', videoId),
      supabase.from('favorites').delete().eq('content_type', 'video').eq('content_id', videoId),
      supabase.from('watchlists').delete().eq('video_id', videoId),
      supabase.from('watch_history').delete().eq('video_id', videoId),
      supabase.from('video_boosts').delete().eq('video_id', videoId),
    ]);

    // 3. Delete the video record permanently
    const { error: deleteErr } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 400 });
    }

    // 4. Recalibrate series episode count if belonging to a series
    if (video.series_id) {
      const { count } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('series_id', video.series_id);

      await supabase
        .from('content_series')
        .update({ total_episodes: count || 0, updated_at: new Date().toISOString() })
        .eq('id', video.series_id);
    }

    return NextResponse.json({ success: true, deletedId: videoId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete video' }, { status: 500 });
  }
}
