import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { content_type, content_id, creator_id, event_type, duration_seconds } = body;

    if (!content_type || !content_id || !event_type) {
      return NextResponse.json({ error: 'Missing required event fields' }, { status: 400 });
    }

    // Insert analytics event
    await supabase.from('analytics_events').insert({
      user_id: user ? user.id : null,
      creator_id: creator_id || null,
      content_type,
      content_id,
      event_type,
      duration_seconds: duration_seconds || 0,
    });

    // If event is 'view', atomically increment counter on target table
    if (event_type === 'view') {
      if (content_type === 'video') {
        const { error: rpcErr } = await supabase.rpc('increment_video_views', { vid_id: content_id });
        if (rpcErr) {
          // Fallback if rpc is not yet executed
          const { data: v } = await supabase.from('videos').select('views_count').eq('id', content_id).single();
          if (v) {
            await supabase.from('videos').update({ views_count: (v.views_count || 0) + 1 }).eq('id', content_id);
          }
        }
      } else if (content_type === 'audio') {
        const { data: a } = await supabase.from('audios').select('views_count').eq('id', content_id).single();
        if (a) {
          await supabase.from('audios').update({ views_count: (a.views_count || 0) + 1 }).eq('id', content_id);
        }
      } else if (content_type === 'blog') {
        const { data: b } = await supabase.from('blogs').select('views_count').eq('id', content_id).single();
        if (b) {
          await supabase.from('blogs').update({ views_count: (b.views_count || 0) + 1 }).eq('id', content_id);
        }
      } else if (content_type === 'ad') {
        const { data: ad } = await supabase.from('advertiser_campaigns').select('impressions').eq('id', content_id).single();
        if (ad) {
          await supabase.from('advertiser_campaigns').update({ impressions: (ad.impressions || 0) + 1 }).eq('id', content_id);
        }
      }
    } else if (event_type === 'click' && content_type === 'ad') {
      const { data: ad } = await supabase.from('advertiser_campaigns').select('clicks').eq('id', content_id).single();
      if (ad) {
        await supabase.from('advertiser_campaigns').update({ clicks: (ad.clicks || 0) + 1 }).eq('id', content_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Analytics track failed' }, { status: 500 });
  }
}
