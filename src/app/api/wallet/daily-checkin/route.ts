import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DAILY_STREAK_REWARDS } from '@/data/coinPacks';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('id, coins_balance, last_check_in_date, check_in_streak')
      .eq('id', user.id)
      .single();

    if (profErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const lastCheckIn = profile.last_check_in_date;

    if (lastCheckIn === todayStr) {
      return NextResponse.json(
        { error: 'You have already claimed today\'s check-in bonus.' },
        { status: 400 }
      );
    }

    // Determine streak
    let currentStreak = profile.check_in_streak || 0;
    if (lastCheckIn) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastCheckIn === yesterdayStr) {
        currentStreak = (currentStreak % 7) + 1;
      } else {
        // Streak broken, reset to 1
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    const rewardIndex = Math.min(Math.max(currentStreak - 1, 0), DAILY_STREAK_REWARDS.length - 1);
    const coinsEarned = DAILY_STREAK_REWARDS[rewardIndex]?.coins || 5;

    const newBalance = (profile.coins_balance || 0) + coinsEarned;

    // Update profile
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        coins_balance: newBalance,
        last_check_in_date: todayStr,
        check_in_streak: currentStreak,
      })
      .eq('id', user.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Insert coin transaction
    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount: coinsEarned,
      type: 'daily_check_in',
      description: `Day ${currentStreak} Daily Check-in Streak`,
      metadata: { streak: currentStreak, coins: coinsEarned },
    });

    return NextResponse.json({
      success: true,
      coins_earned: coinsEarned,
      new_balance: newBalance,
      current_streak: currentStreak,
      message: `Claimed +${coinsEarned} coins for Day ${currentStreak}!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Check-in failed' }, { status: 500 });
  }
}
