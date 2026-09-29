import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isWatchlisted: false, series: [], videos: [], audios: [] });
    }

    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get('content_type');
    const contentId = searchParams.get('content_id');

    // Single item check
    if (contentType && contentId) {
      if (contentType === 'series') {
        let isWatchlisted = false;
        try {
          const { data } = await supabase
            .from('watchlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('series_id', contentId)
            .maybeSingle();
          if (data) isWatchlisted = true;
        } catch {}

        if (!isWatchlisted) {
          const { data: fav } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('content_type', 'series')
            .eq('content_id', contentId)
            .maybeSingle();
          if (fav) isWatchlisted = true;
        }

        return NextResponse.json({ isWatchlisted });
      } else if (contentType === 'video') {
        const { data } = await supabase
          .from('watchlists')
          .select('id')
          .eq('user_id', user.id)
          .eq('video_id', contentId)
          .maybeSingle();

        return NextResponse.json({ isWatchlisted: !!data });
      } else if (contentType === 'audio') {
        let isWatchlisted = false;
        try {
          const { data } = await supabase
            .from('watchlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('audio_id', contentId)
            .maybeSingle();
          if (data) isWatchlisted = true;
        } catch {}

        if (!isWatchlisted) {
          const { data: fav } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('content_type', 'audio')
            .eq('content_id', contentId)
            .maybeSingle();
          if (fav) isWatchlisted = true;
        }

        return NextResponse.json({ isWatchlisted });
      }
    }

    // Full watchlist query
    // 1. Videos
    const { data: videoItems } = await supabase
      .from('watchlists')
      .select('*, video:videos(*, creator:profiles(*), series:content_series(*, creator:profiles(*)))')
      .eq('user_id', user.id)
      .not('video_id', 'is', null)
      .order('created_at', { ascending: false });

    // 2. Series (from watchlists.series_id and favorites where content_type = 'series')
    let seriesItems: any[] = [];
    try {
      const { data: seriesList } = await supabase
        .from('watchlists')
        .select('*, series:content_series(*, creator:profiles(*))')
        .eq('user_id', user.id)
        .not('series_id', 'is', null)
        .order('created_at', { ascending: false });

      if (seriesList) {
        seriesItems = seriesList.map((w: any) => w.series).filter(Boolean);
      }
    } catch {}

    // Also check favorites for any saved series
    try {
      const { data: favSeries } = await supabase
        .from('favorites')
        .select('content_id')
        .eq('user_id', user.id)
        .eq('content_type', 'series');

      if (favSeries && favSeries.length > 0) {
        const favIds = favSeries.map((f: any) => f.content_id);
        const { data: resolvedSeries } = await supabase
          .from('content_series')
          .select('*, creator:profiles(*)')
          .in('id', favIds);

        if (resolvedSeries) {
          const existingIds = new Set(seriesItems.map((s: any) => s.id));
          for (const s of resolvedSeries) {
            if (!existingIds.has(s.id)) {
              seriesItems.push(s);
            }
          }
        }
      }
    } catch {}

    // 3. Audio
    let audioItems: any[] = [];
    try {
      const { data: audios } = await supabase
        .from('watchlists')
        .select('*, audio:audios(*, creator:profiles(*))')
        .eq('user_id', user.id)
        .not('audio_id', 'is', null)
        .order('created_at', { ascending: false });

      if (audios) {
        audioItems = audios.map((w: any) => w.audio).filter(Boolean);
      }
    } catch {}

    return NextResponse.json({
      series: seriesItems,
      videos: (videoItems || []).map((w: any) => w.video).filter(Boolean),
      audios: audioItems,
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

    const body = await req.json();
    const contentType = body.content_type || (body.series_id ? 'series' : body.video_id ? 'video' : 'audio');
    const contentId = body.content_id || body.series_id || body.video_id || body.audio_id;

    if (!contentId) {
      return NextResponse.json({ error: 'Missing content_id or series_id' }, { status: 400 });
    }

    // A. SERIES WATCHLIST TOGGLE
    if (contentType === 'series') {
      let existingId: string | null = null;
      let usedTable: 'watchlists' | 'favorites' = 'watchlists';

      try {
        const { data: existing } = await supabase
          .from('watchlists')
          .select('id')
          .eq('user_id', user.id)
          .eq('series_id', contentId)
          .maybeSingle();

        if (existing) {
          existingId = existing.id;
          usedTable = 'watchlists';
        }
      } catch {}

      if (!existingId) {
        const { data: existingFav } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('content_type', 'series')
          .eq('content_id', contentId)
          .maybeSingle();

        if (existingFav) {
          existingId = existingFav.id;
          usedTable = 'favorites';
        }
      }

      if (existingId) {
        // Delete from table
        if (usedTable === 'watchlists') {
          await supabase.from('watchlists').delete().eq('id', existingId);
        } else {
          await supabase.from('favorites').delete().eq('id', existingId);
        }
        return NextResponse.json({ isWatchlisted: false });
      } else {
        // Insert into watchlists (or fallback favorites)
        let inserted = false;
        try {
          const { error: insErr } = await supabase.from('watchlists').insert({
            user_id: user.id,
            series_id: contentId,
          });
          if (!insErr) inserted = true;
        } catch {}

        if (!inserted) {
          await supabase.from('favorites').upsert(
            {
              user_id: user.id,
              content_type: 'series',
              content_id: contentId,
            },
            { onConflict: 'user_id,content_type,content_id' }
          );
        }

        return NextResponse.json({ isWatchlisted: true });
      }
    }

    // B. VIDEO WATCHLIST TOGGLE
    if (contentType === 'video') {
      const { data: existing } = await supabase
        .from('watchlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('video_id', contentId)
        .maybeSingle();

      if (existing) {
        await supabase.from('watchlists').delete().eq('id', existing.id);
        return NextResponse.json({ isWatchlisted: false });
      } else {
        const { error } = await supabase.from('watchlists').insert({
          user_id: user.id,
          video_id: contentId,
        });
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ isWatchlisted: true });
      }
    }

    // C. AUDIO WATCHLIST TOGGLE
    if (contentType === 'audio') {
      let existingId: string | null = null;
      let usedTable: 'watchlists' | 'favorites' = 'watchlists';

      try {
        const { data: existing } = await supabase
          .from('watchlists')
          .select('id')
          .eq('user_id', user.id)
          .eq('audio_id', contentId)
          .maybeSingle();

        if (existing) {
          existingId = existing.id;
          usedTable = 'watchlists';
        }
      } catch {}

      if (!existingId) {
        const { data: existingFav } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('content_type', 'audio')
          .eq('content_id', contentId)
          .maybeSingle();

        if (existingFav) {
          existingId = existingFav.id;
          usedTable = 'favorites';
        }
      }

      if (existingId) {
        if (usedTable === 'watchlists') {
          await supabase.from('watchlists').delete().eq('id', existingId);
        } else {
          await supabase.from('favorites').delete().eq('id', existingId);
        }
        return NextResponse.json({ isWatchlisted: false });
      } else {
        let inserted = false;
        try {
          const { error: insErr } = await supabase.from('watchlists').insert({
            user_id: user.id,
            audio_id: contentId,
          });
          if (!insErr) inserted = true;
        } catch {}

        if (!inserted) {
          await supabase.from('favorites').upsert(
            {
              user_id: user.id,
              content_type: 'audio',
              content_id: contentId,
            },
            { onConflict: 'user_id,content_type,content_id' }
          );
        }
        return NextResponse.json({ isWatchlisted: true });
      }
    }

    return NextResponse.json({ error: 'Invalid content_type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Watchlist toggle failed' }, { status: 500 });
  }
}
