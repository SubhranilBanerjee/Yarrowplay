import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin =
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      user.email === 'admin@dramabox.stream' ||
      profile?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const roleFilter = searchParams.get('role') || 'all';
    const vipFilter = searchParams.get('vip') || 'all';
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    let query = supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, role, vip_tier, vip_expires_at, is_suspended, created_at, last_active_at, coin_balance')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (roleFilter !== 'all') {
      query = query.eq('role', roleFilter);
    }

    if (vipFilter === 'vip') {
      query = query.neq('vip_tier', 'free').not('vip_tier', 'is', null);
    } else if (vipFilter !== 'all') {
      query = query.eq('vip_tier', vipFilter);
    }

    if (search.trim()) {
      query = query.or(`username.ilike.%${search.trim()}%,display_name.ilike.%${search.trim()}%`);
    }

    const { data: profiles, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      users: profiles || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch CRM users' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin =
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      user.email === 'admin@dramabox.stream' ||
      profile?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, is_suspended, role, vip_tier } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (typeof is_suspended === 'boolean') {
      updates.is_suspended = is_suspended;
    }
    if (typeof role === 'string') {
      updates.role = role;
    }
    if (typeof vip_tier === 'string') {
      updates.vip_tier = vip_tier;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update user' }, { status: 500 });
  }
}
