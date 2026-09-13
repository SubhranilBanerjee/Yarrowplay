import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let blogId = searchParams.get('id');

    if (!blogId) {
      try {
        const body = await req.json();
        blogId = body?.id;
      } catch {
        // body may be empty
      }
    }

    if (!blogId) {
      return NextResponse.json({ error: 'Blog ID is required' }, { status: 400 });
    }

    // 1. Fetch blog to verify author ownership
    const { data: blog, error: fetchErr } = await supabase
      .from('blogs')
      .select('id, author_id, cover_public_id')
      .eq('id', blogId)
      .single();

    if (fetchErr || !blog) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const isAdmin =
      user.email === process.env.ADMIN_EMAIL ||
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (blog.author_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the original author or an admin can delete this blog post' },
        { status: 403 }
      );
    }

    // 2. Clean up associated dependencies
    await Promise.allSettled([
      supabase.from('reactions').delete().eq('content_type', 'blog').eq('content_id', blogId),
      supabase.from('comments').delete().eq('content_type', 'blog').eq('content_id', blogId),
      supabase.from('favorites').delete().eq('content_type', 'blog').eq('content_id', blogId),
    ]);

    // 3. Delete the blog post permanently
    const { error: deleteErr } = await supabase
      .from('blogs')
      .delete()
      .eq('id', blogId);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, deletedId: blogId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete blog post' }, { status: 500 });
  }
}
