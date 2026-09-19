import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isFavorite: false });
    }

    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get('content_type');
    const contentId = searchParams.get('content_id');

    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .maybeSingle();

    return NextResponse.json({ isFavorite: !!existing });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to check favorite' }, { status: 500 });
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
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', content_type)
      .eq('content_id', content_id)
      .maybeSingle();

    let isFavorite = false;

    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id);
      isFavorite = false;
    } else {
      await supabase.from('favorites').insert({
        user_id: user.id,
        content_type,
        content_id,
      });
      isFavorite = true;

      // Dispatch notification to content creator
      try {
        const { resolveContentOwnerAndTitle, createNotification } = await import('@/lib/notifications');
        const { owner_id, title } = await resolveContentOwnerAndTitle(supabase, content_type, content_id);
        if (owner_id && owner_id !== user.id) {
          await createNotification(supabase, {
            recipient_id: owner_id,
            actor_id: user.id,
            action_type: 'favorite',
            content_type,
            content_id,
            content_title: title,
          });
        }
      } catch (notifyErr) {
        console.error('Failed to dispatch favorite notification:', notifyErr);
      }
    }

    return NextResponse.json({ isFavorite });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Favorite toggle failed' }, { status: 500 });
  }
}
