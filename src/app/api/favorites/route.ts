import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    }

    return NextResponse.json({ isFavorite });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Favorite toggle failed' }, { status: 500 });
  }
}
