import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { content_type, content_id, reaction_type } = await req.json();

    if (!content_type || !content_id || !reaction_type) {
      return NextResponse.json({ error: 'Missing reaction fields' }, { status: 400 });
    }

    // Check existing reaction
    const { data: existing } = await supabase
      .from('reactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('content_type', content_type)
      .eq('content_id', content_id)
      .maybeSingle();

    let userReaction: 'like' | 'dislike' | null = null;

    if (existing) {
      if (existing.reaction_type === reaction_type) {
        // Toggle off
        await supabase.from('reactions').delete().eq('id', existing.id);
        userReaction = null;
      } else {
        // Switch from like to dislike or vice-versa
        await supabase.from('reactions').update({ reaction_type }).eq('id', existing.id);
        userReaction = reaction_type;
      }
    } else {
      // Insert new reaction
      await supabase.from('reactions').insert({
        user_id: user.id,
        content_type,
        content_id,
        reaction_type,
      });
      userReaction = reaction_type;
    }

    // Recalculate counts
    const { count: likesCount } = await supabase
      .from('reactions')
      .select('*', { count: 'exact', head: true })
      .eq('content_type', content_type)
      .eq('content_id', content_id)
      .eq('reaction_type', 'like');

    const { count: dislikesCount } = await supabase
      .from('reactions')
      .select('*', { count: 'exact', head: true })
      .eq('content_type', content_type)
      .eq('content_id', content_id)
      .eq('reaction_type', 'dislike');

    // Update parent table counts
    const targetTable = content_type === 'video' ? 'videos' : content_type === 'audio' ? 'audios' : 'blogs';
    await supabase.from(targetTable).update({
      likes_count: likesCount || 0,
      dislikes_count: dislikesCount || 0,
    }).eq('id', content_id);

    return NextResponse.json({
      userReaction,
      likesCount: likesCount || 0,
      dislikesCount: dislikesCount || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Reaction failed' }, { status: 500 });
  }
}
