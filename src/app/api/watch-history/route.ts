import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, guest: true });
    }

    const { video_id, progress_seconds, total_duration, completed } = await req.json();

    if (!video_id) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
    }

    await supabase.from('watch_history').upsert({
      user_id: user.id,
      video_id,
      progress_seconds: progress_seconds || 0,
      total_duration: total_duration || 0,
      completed: completed || false,
      last_watched_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,video_id'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update watch history' }, { status: 500 });
  }
}
