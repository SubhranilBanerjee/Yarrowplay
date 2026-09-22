import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get('content_type');
    const contentId = searchParams.get('content_id');
    const sort = searchParams.get('sort') || 'newest'; // 'newest' | 'top'

    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'Missing content_type or content_id' }, { status: 400 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch comments
    let query = supabase
      .from('comments')
      .select('*, user:profiles(id, display_name, username, avatar_url, role)')
      .eq('content_type', contentType)
      .eq('content_id', contentId);

    if (sort === 'top') {
      query = query.order('likes_count', { ascending: false }).order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: rawComments, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fetch user reactions if logged in
    let userReactionMap = new Map<string, 'like' | 'dislike'>();
    if (user && rawComments && rawComments.length > 0) {
      const commentIds = rawComments.map((c: any) => c.id);
      const { data: reactions } = await supabase
        .from('comment_reactions')
        .select('comment_id, reaction_type')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);

      (reactions || []).forEach((r: any) => {
        userReactionMap.set(r.comment_id, r.reaction_type as 'like' | 'dislike');
      });
    }

    // Build threaded nested comment tree
    const commentMap = new Map<string, any>();
    const rootComments: any[] = [];

    (rawComments || []).forEach((c: any) => {
      const commentItem = {
        ...c,
        likes_count: c.likes_count || 0,
        dislikes_count: c.dislikes_count || 0,
        user_reaction: userReactionMap.get(c.id) || null,
        replies: [],
        reply_count: 0,
      };
      commentMap.set(c.id, commentItem);
    });

    // Link parent and child replies
    (rawComments || []).forEach((c: any) => {
      const item = commentMap.get(c.id);
      if (c.parent_id && commentMap.has(c.parent_id)) {
        const parent = commentMap.get(c.parent_id);
        parent.replies.push(item);
        parent.reply_count = (parent.reply_count || 0) + 1;
      } else {
        rootComments.push(item);
      }
    });

    // Sort replies chronologically (oldest first for natural conversation flow)
    const sortReplies = (comment: any) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        comment.replies.forEach(sortReplies);
      }
    };
    rootComments.forEach(sortReplies);

    return NextResponse.json({
      comments: rootComments,
      totalCount: rawComments?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { content_type, content_id, content, parent_id, timestamp_seconds } = await req.json();

    if (!content_type || !content_id || !content || !content.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        content_type,
        content_id,
        content: content.trim(),
        parent_id: parent_id || null,
        timestamp_seconds: timestamp_seconds || null,
        likes_count: 0,
        dislikes_count: 0,
        is_edited: false,
        is_deleted: false,
      })
      .select('*, user:profiles(id, display_name, username, avatar_url, role)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Increment comments count on target table
    const targetTable = content_type === 'video' ? 'videos' : content_type === 'audio' ? 'audios' : 'blogs';
    const { data: current } = await supabase.from(targetTable).select('comments_count').eq('id', content_id).single();
    if (current) {
      await supabase.from(targetTable).update({ comments_count: (current.comments_count || 0) + 1 }).eq('id', content_id);
    }

    // Send activity notification to parent comment author OR content creator
    try {
      const { resolveContentOwnerAndTitle, createNotification } = await import('@/lib/notifications');
      let recipientId: string | null = null;
      let notifTitle = 'comment';

      if (parent_id) {
        // Replying to another comment
        const { data: parentComm } = await supabase.from('comments').select('user_id').eq('id', parent_id).single();
        if (parentComm && parentComm.user_id !== user.id) {
          recipientId = parentComm.user_id;
          notifTitle = 'Replied to your comment';
        }
      }

      if (!recipientId) {
        const { owner_id, title } = await resolveContentOwnerAndTitle(supabase, content_type, content_id);
        if (owner_id && owner_id !== user.id) {
          recipientId = owner_id;
          notifTitle = title || 'your post';
        }
      }

      if (recipientId) {
        await createNotification(supabase, {
          recipient_id: recipientId,
          actor_id: user.id,
          action_type: 'comment',
          content_type,
          content_id,
          content_title: notifTitle,
          message: comment?.content || content.trim(),
        });
      }
    } catch (notifyErr) {
      console.error('Failed to dispatch comment notification:', notifyErr);
    }

    return NextResponse.json({
      comment: {
        ...comment,
        replies: [],
        reply_count: 0,
        user_reaction: null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to post comment' }, { status: 500 });
  }
}

// PATCH - Edit own comment
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id, content } = await req.json();

    if (!id || !content || !content.trim()) {
      return NextResponse.json({ error: 'Comment id and updated content required' }, { status: 400 });
    }

    const { data: existing } = await supabase.from('comments').select('user_id, is_deleted').eq('id', id).single();

    if (!existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own comment' }, { status: 403 });
    }

    if (existing.is_deleted) {
      return NextResponse.json({ error: 'Cannot edit a deleted comment' }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from('comments')
      .update({
        content: content.trim(),
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, user:profiles(id, display_name, username, avatar_url, role)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ comment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to edit comment' }, { status: 500 });
  }
}

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
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // 1. Fetch comment to verify ownership and target content
    const { data: comment, error: fetchErr } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (fetchErr || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const isAdmin =
      user.email === process.env.ADMIN_EMAIL ||
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    let isAuthorized = comment.user_id === user.id || isAdmin;

    // 2. If not comment author or admin, check if user is the content creator
    if (!isAuthorized) {
      if (comment.content_type === 'video') {
        const { data: video } = await supabase
          .from('videos')
          .select('creator_id')
          .eq('id', comment.content_id)
          .single();
        if (video && video.creator_id === user.id) isAuthorized = true;
      } else if (comment.content_type === 'audio') {
        const { data: audio } = await supabase
          .from('audios')
          .select('creator_id')
          .eq('id', comment.content_id)
          .single();
        if (audio && audio.creator_id === user.id) isAuthorized = true;
      } else if (comment.content_type === 'blog') {
        const { data: blog } = await supabase
          .from('blogs')
          .select('author_id')
          .eq('id', comment.content_id)
          .single();
        if (blog && blog.author_id === user.id) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'You are not authorized to delete this comment' },
        { status: 403 }
      );
    }

    // Check if this comment has replies
    const { count: childCount } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', commentId);

    if (childCount && childCount > 0) {
      // Soft-delete to preserve reply chain
      await supabase
        .from('comments')
        .update({
          content: '[This comment was deleted by user]',
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId);
    } else {
      // Hard delete leaf comment
      await supabase.from('comments').delete().eq('id', commentId);
    }

    // Decrement comments count on target table
    const targetTable = comment.content_type === 'video' ? 'videos' : comment.content_type === 'audio' ? 'audios' : 'blogs';
    const { data: current } = await supabase.from(targetTable).select('comments_count').eq('id', comment.content_id).single();
    if (current && (current.comments_count || 0) > 0) {
      await supabase.from(targetTable).update({
        comments_count: Math.max(0, (current.comments_count || 1) - 1),
      }).eq('id', comment.content_id);
    }

    return NextResponse.json({ success: true, deletedId: commentId, softDeleted: (childCount || 0) > 0 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete comment' }, { status: 500 });
  }
}
