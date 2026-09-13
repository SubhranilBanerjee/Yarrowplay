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
    let audioId = searchParams.get('id');

    if (!audioId) {
      try {
        const body = await req.json();
        audioId = body?.id;
      } catch {
        // body may be empty
      }
    }

    if (!audioId) {
      return NextResponse.json({ error: 'Audio ID is required' }, { status: 400 });
    }

    // 1. Fetch audio to verify ownership
    const { data: audio, error: fetchErr } = await supabase
      .from('audios')
      .select('id, creator_id, album_id, audio_public_id, cover_public_id')
      .eq('id', audioId)
      .single();

    if (fetchErr || !audio) {
      return NextResponse.json({ error: 'Audio track not found' }, { status: 404 });
    }

    const isAdmin =
      user.email === process.env.ADMIN_EMAIL ||
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (audio.creator_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the original creator or an admin can delete this audio track' },
        { status: 403 }
      );
    }

    // 2. Clean up associated dependencies
    await Promise.allSettled([
      supabase.from('reactions').delete().eq('content_type', 'audio').eq('content_id', audioId),
      supabase.from('comments').delete().eq('content_type', 'audio').eq('content_id', audioId),
      supabase.from('favorites').delete().eq('content_type', 'audio').eq('content_id', audioId),
      supabase.from('watchlists').delete().eq('audio_id', audioId),
    ]);

    // 3. Delete the audio row permanently
    const { error: deleteErr } = await supabase
      .from('audios')
      .delete()
      .eq('id', audioId);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, deletedId: audioId });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete audio track' }, { status: 500 });
  }
}
