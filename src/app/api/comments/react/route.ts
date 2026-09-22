import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/comments/react
// Body: { comment_id: uuid, reaction_type: 'like' | 'dislike' }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { comment_id, reaction_type } = await req.json();

    if (!comment_id || !reaction_type || !['like', 'dislike'].includes(reaction_type)) {
      return NextResponse.json({ error: 'Valid comment_id and reaction_type are required' }, { status: 400 });
    }

    // Check existing reaction
    const { data: existing } = await supabase
      .from('comment_reactions')
      .select('id, reaction_type')
      .eq('user_id', user.id)
      .eq('comment_id', comment_id)
      .maybeSingle();

    let newReaction: 'like' | 'dislike' | null = null;

    if (existing) {
      if (existing.reaction_type === reaction_type) {
        // Toggle off
        await supabase.from('comment_reactions').delete().eq('id', existing.id);
        newReaction = null;
      } else {
        // Switch reaction
        await supabase
          .from('comment_reactions')
          .update({ reaction_type })
          .eq('id', existing.id);
        newReaction = reaction_type;
      }
    } else {
      // Insert new reaction
      await supabase.from('comment_reactions').insert({
        user_id: user.id,
        comment_id,
        reaction_type,
      });
      newReaction = reaction_type;
    }

    // Recompute comment like / dislike counts
    const [{ count: likesCount }, { count: dislikesCount }] = await Promise.all([
      supabase
        .from('comment_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', comment_id)
        .eq('reaction_type', 'like'),
      supabase
        .from('comment_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('comment_id', comment_id)
        .eq('reaction_type', 'dislike'),
    ]);

    // Update on comment record
    await supabase
      .from('comments')
      .update({
        likes_count: likesCount || 0,
        dislikes_count: dislikesCount || 0,
      })
      .eq('id', comment_id);

    return NextResponse.json({
      success: true,
      userReaction: newReaction,
      likesCount: likesCount || 0,
      dislikesCount: dislikesCount || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to react to comment' }, { status: 500 });
  }
}
