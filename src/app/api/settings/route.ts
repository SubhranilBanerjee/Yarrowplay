import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, pause_watch_history, role, vip_tier, vip_expires_at, display_name, username, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      settings: {
        pause_watch_history: Boolean(profile?.pause_watch_history),
        vip_tier: profile?.vip_tier || 'free',
        vip_expires_at: profile?.vip_expires_at || null,
        role: profile?.role || 'user',
        display_name: profile?.display_name || '',
        username: profile?.username || '',
        avatar_url: profile?.avatar_url || '',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const updates: Record<string, any> = {};

    if (typeof body.pause_watch_history === 'boolean') {
      updates.pause_watch_history = body.pause_watch_history;
    }
    if (typeof body.display_name === 'string') {
      updates.display_name = body.display_name.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid settings to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        pause_watch_history: Boolean(data?.pause_watch_history),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update settings' }, { status: 500 });
  }
}
