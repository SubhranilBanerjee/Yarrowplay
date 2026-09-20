import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        coins_balance: 0,
        vip_tier: 'none',
        is_vip: false,
        check_in_streak: 0,
        can_check_in: false,
        transactions: [],
      });
    }

    // Fetch profile wallet info
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, coins_balance, vip_tier, vip_expires_at, last_check_in_date, check_in_streak')
      .eq('id', user.id)
      .single();

    let coinsBalance = profile?.coins_balance ?? 50; // Welcome gift of 50 coins
    const vipTier = profile?.vip_tier || 'none';
    const vipExpiresAt = profile?.vip_expires_at;

    const isVIP =
      vipTier !== 'none' &&
      vipExpiresAt &&
      new Date(vipExpiresAt).getTime() > Date.now();

    // Check-in calculation
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = profile?.last_check_in_date;
    const canCheckIn = lastDate !== todayStr;
    const checkInStreak = profile?.check_in_streak || 0;

    // If profile had no coins_balance set, persist the welcome 50 coins
    if (profile && profile.coins_balance === null) {
      await supabase
        .from('profiles')
        .update({ coins_balance: 50 })
        .eq('id', user.id);
    }

    // Fetch recent 10 coin transactions
    const { data: transactions } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      authenticated: true,
      coins_balance: coinsBalance,
      vip_tier: vipTier,
      vip_expires_at: vipExpiresAt,
      is_vip: !!isVIP,
      check_in_streak: checkInStreak,
      can_check_in: canCheckIn,
      last_check_in_date: lastDate,
      transactions: transactions || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}
