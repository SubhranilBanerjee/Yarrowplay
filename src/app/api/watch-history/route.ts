import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/watch-history
// Query params: ?continue_watching=true&limit=20
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ history: [], continueWatching: [] });
    }

    const { searchParams } = new URL(req.url);
    const continueWatchingOnly = searchParams.get('continue_watching') === 'true';
    const limit = parseInt(searchParams.get('limit') || '30', 10);

    let query = supabase
      .from('watch_history')
      .select(
        'id, user_id, video_id, progress_seconds, total_duration, completed, last_watched_at, video:videos(*, creator:profiles(*), series:content_series(*))'
      )
      .eq('user_id', user.id)
      .order('last_watched_at', { ascending: false })
      .limit(limit);

    if (continueWatchingOnly) {
      query = query.eq('completed', false).gt('progress_seconds', 5);
    }

    const { data: rows, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Filter out items where the video might have been deleted
    const validRows = (rows || [])
      .filter((r: any) => r.video)
      .map((r: any) => {
        const dur = r.total_duration || r.video.duration_seconds || 1;
        const progress = r.progress_seconds || 0;
        const percent = Math.min(100, Math.round((progress / dur) * 100));

        return {
          id: r.id,
          video_id: r.video_id,
          progress_seconds: progress,
          total_duration: dur,
          completion_percentage: percent,
          completed: r.completed,
          last_watched_at: r.last_watched_at,
          video: r.video,
        };
      });

    return NextResponse.json({
      history: validRows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch watch history' }, { status: 500 });
  }
}

// POST /api/watch-history - Save or update playback progress
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, guest: true });
    }

    const { video_id, progress_seconds, total_duration, completed } = await req.json();

    if (!video_id) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
    }

    const progressSec = Math.max(0, Math.round(Number(progress_seconds) || 0));
    const totalSec = Math.max(0, Math.round(Number(total_duration) || 0));
    const isCompleted = completed || (totalSec > 0 && progressSec >= totalSec * 0.9);

    const { error } = await supabase.from('watch_history').upsert(
      {
        user_id: user.id,
        video_id,
        progress_seconds: progressSec,
        total_duration: totalSec,
        completed: isCompleted,
        last_watched_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,video_id',
      }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, completed: isCompleted });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update watch history' }, { status: 500 });
  }
}

// DELETE /api/watch-history?video_id=uuid OR ?clear_all=true
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('video_id');
    const clearAll = searchParams.get('clear_all') === 'true';

    if (clearAll) {
      const { error } = await supabase.from('watch_history').delete().eq('user_id', user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, message: 'All watch history cleared' });
    }

    if (videoId) {
      const { error } = await supabase
        .from('watch_history')
        .delete()
        .eq('user_id', user.id)
        .eq('video_id', videoId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, deletedVideoId: videoId });
    }

    return NextResponse.json({ error: 'Specify video_id or clear_all=true' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete from watch history' }, { status: 500 });
  }
}
