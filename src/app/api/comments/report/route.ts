import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/comments/report
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { comment_id, reason, details } = await req.json();

    if (!comment_id || !reason) {
      return NextResponse.json({ error: 'comment_id and reason are required' }, { status: 400 });
    }

    const { error } = await supabase.from('comment_reports').insert({
      reporter_id: user.id,
      comment_id,
      reason,
      details: details?.trim() || null,
      status: 'pending',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Report submitted for review.' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to submit report' }, { status: 500 });
  }
}
