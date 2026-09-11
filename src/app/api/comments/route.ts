import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get('content_type');
    const contentId = searchParams.get('content_id');

    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'Missing content_type or content_id' }, { status: 400 });
    }

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*, user:profiles(id, display_name, username, avatar_url, role)')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ comments: comments || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { content_type, content_id, content, timestamp_seconds } = await req.json();

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
        timestamp_seconds: timestamp_seconds || null,
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

    return NextResponse.json({ comment });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to post comment' }, { status: 500 });
  }
}
