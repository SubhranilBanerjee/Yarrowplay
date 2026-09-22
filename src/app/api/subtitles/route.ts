import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/subtitles?video_id=uuid
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('video_id');

    if (!videoId) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    const { data: tracks, error } = await supabase
      .from('subtitle_tracks')
      .select('*')
      .eq('video_id', videoId)
      .eq('enabled', true)
      .order('default_track', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      // If table does not exist or error, return empty list safely
      return NextResponse.json({ tracks: [] });
    }

    return NextResponse.json({ tracks: tracks || [] });
  } catch {
    return NextResponse.json({ tracks: [] });
  }
}

// POST /api/subtitles - Upload or link a subtitle track
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { video_id, language, label, source_url, format = 'vtt', default_track = false } = body;

    if (!video_id || !language || !label || !source_url) {
      return NextResponse.json({ error: 'Missing required subtitle fields' }, { status: 400 });
    }

    // Verify creator owns this video or is admin
    const { data: video } = await supabase
      .from('videos')
      .select('creator_id')
      .eq('id', video_id)
      .single();

    const isAdmin =
      user.email === process.env.ADMIN_EMAIL ||
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (!video || (video.creator_id !== user.id && !isAdmin)) {
      return NextResponse.json({ error: 'Unauthorized to add subtitles to this video' }, { status: 403 });
    }

    // If default_track is true, unset default on other tracks for this video
    if (default_track) {
      await supabase
        .from('subtitle_tracks')
        .update({ default_track: false })
        .eq('video_id', video_id);
    }

    const { data: track, error } = await supabase
      .from('subtitle_tracks')
      .insert({
        video_id,
        language: language.toLowerCase().trim(),
        label: label.trim(),
        source_url: source_url.trim(),
        format,
        default_track: !!default_track,
        enabled: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ track }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save subtitle track' }, { status: 500 });
  }
}

// PATCH /api/subtitles - Toggle enabled / set default / update label
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { id, enabled, default_track, label } = body;

    if (!id) {
      return NextResponse.json({ error: 'Track id is required' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('subtitle_tracks')
      .select('*, video:videos(creator_id)')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Subtitle track not found' }, { status: 404 });
    }

    const isAdmin =
      user.email === process.env.ADMIN_EMAIL ||
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (existing.video?.creator_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof enabled === 'boolean') updates.enabled = enabled;
    if (typeof default_track === 'boolean') {
      updates.default_track = default_track;
      if (default_track) {
        await supabase
          .from('subtitle_tracks')
          .update({ default_track: false })
          .eq('video_id', existing.video_id);
      }
    }
    if (label) updates.label = label.trim();

    const { data: updated, error } = await supabase
      .from('subtitle_tracks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ track: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update subtitle' }, { status: 500 });
  }
}

// DELETE /api/subtitles?id=uuid
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Subtitle id is required' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('subtitle_tracks')
      .select('*, video:videos(creator_id)')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Subtitle track not found' }, { status: 404 });
    }

    const isAdmin =
      user.email === process.env.ADMIN_EMAIL ||
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (existing.video?.creator_id !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error: delErr } = await supabase.from('subtitle_tracks').delete().eq('id', id);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete subtitle' }, { status: 500 });
  }
}
