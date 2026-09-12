import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isWatchlisted: false, items: [] });
    }

    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get('content_type');
    const contentId = searchParams.get('content_id');

    // Single item check
    if (contentType && contentId) {
      if (contentType === 'video') {
        const { data } = await supabase
          .from('watchlists')
          .select('id')
          .eq('user_id', user.id)
          .eq('video_id', contentId)
          .maybeSingle();

        return NextResponse.json({ isWatchlisted: !!data });
      } else if (contentType === 'audio') {
        try {
          const { data, error } = await supabase
            .from('watchlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('audio_id', contentId)
            .maybeSingle();

          if (!error) {
            return NextResponse.json({ isWatchlisted: !!data });
          }
        } catch {
          // Column may not exist yet in live DB
        }

        // Fallback check in favorites if audio_id column is pending migration
        const { data: fav } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('content_type', 'audio')
          .eq('content_id', contentId)
          .maybeSingle();

        return NextResponse.json({ isWatchlisted: !!fav });
      }
    }

    // Full watchlist query
    const { data: videoItems } = await supabase
      .from('watchlists')
      .select('*, video:videos(*, creator:profiles(*))')
      .eq('user_id', user.id)
      .not('video_id', 'is', null)
      .order('created_at', { ascending: false });

    let audioItems: any[] = [];
    try {
      const { data: audios, error } = await supabase
        .from('watchlists')
        .select('*, audio:audios(*, creator:profiles(*))')
        .eq('user_id', user.id)
        .not('audio_id', 'is', null)
        .order('created_at', { ascending: false });

      if (!error && audios) {
        audioItems = audios;
      }
    } catch {
      // Column audio_id might not exist yet
    }

    return NextResponse.json({
      videos: (videoItems || []).map((w: any) => w.video).filter(Boolean),
      audios: audioItems.map((w: any) => w.audio).filter(Boolean),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch watchlist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { content_type, content_id } = await req.json();

    if (!content_type || !content_id) {
      return NextResponse.json({ error: 'Missing content_type or content_id' }, { status: 400 });
    }

    if (content_type === 'video') {
      const { data: existing } = await supabase
        .from('watchlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('video_id', content_id)
        .maybeSingle();

      let isWatchlisted = false;

      if (existing) {
        await supabase.from('watchlists').delete().eq('id', existing.id);
        isWatchlisted = false;
      } else {
        const { error } = await supabase.from('watchlists').insert({
          user_id: user.id,
          video_id: content_id,
        });
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        isWatchlisted = true;
      }

      return NextResponse.json({ isWatchlisted });
    }

    if (content_type === 'audio') {
      // First attempt: insert/delete using watchlists.audio_id
      try {
        const { data: existing, error: findErr } = await supabase
          .from('watchlists')
          .select('id')
          .eq('user_id', user.id)
          .eq('audio_id', content_id)
          .maybeSingle();

        if (!findErr) {
          let isWatchlisted = false;
          if (existing) {
            await supabase.from('watchlists').delete().eq('id', existing.id);
            isWatchlisted = false;
          } else {
            const { error: insErr } = await supabase.from('watchlists').insert({
              user_id: user.id,
              audio_id: content_id,
            });
            if (!insErr) {
              return NextResponse.json({ isWatchlisted: true });
            }
          }
          return NextResponse.json({ isWatchlisted });
        }
      } catch {
        // Fallback below if column is not yet present
      }

      // Fallback: save to favorites table so audio bookmarking is never broken
      const { data: existingFav } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_type', 'audio')
        .eq('content_id', content_id)
        .maybeSingle();

      let isWatchlisted = false;
      if (existingFav) {
        await supabase.from('favorites').delete().eq('id', existingFav.id);
        isWatchlisted = false;
      } else {
        await supabase.from('favorites').insert({
          user_id: user.id,
          content_type: 'audio',
          content_id,
        });
        isWatchlisted = true;
      }

      return NextResponse.json({ isWatchlisted });
    }

    return NextResponse.json({ error: 'Invalid content_type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Watchlist toggle failed' }, { status: 500 });
  }
}
