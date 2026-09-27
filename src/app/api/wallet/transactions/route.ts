import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get('type') || 'all'; // 'all' | 'earned' | 'spent'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = supabase
      .from('coin_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filterType === 'earned') {
      query = query.gt('amount', 0);
    } else if (filterType === 'spent') {
      query = query.lt('amount', 0);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: transactions, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also get current coins balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('coins_balance, vip_tier, vip_expires_at')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      total_count: count || 0,
      coins_balance: profile?.coins_balance || 0,
      vip_tier: profile?.vip_tier || 'none',
      is_vip:
        profile?.vip_tier &&
        profile.vip_tier !== 'none' &&
        profile?.vip_expires_at &&
        new Date(profile.vip_expires_at).getTime() > Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch transaction history' },
      { status: 500 }
    );
  }
}
