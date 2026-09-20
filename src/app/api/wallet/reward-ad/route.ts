import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { REWARD_AD_COINS } from '@/data/coinPacks';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { campaign_id } = await req.json().catch(() => ({ campaign_id: null }));

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, coins_balance')
      .eq('id', user.id)
      .single();

    const currentBalance = profile?.coins_balance || 0;
    const newBalance = currentBalance + REWARD_AD_COINS;

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ coins_balance: newBalance })
      .eq('id', user.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount: REWARD_AD_COINS,
      type: 'reward_ad',
      description: 'Watched Rewarded Sponsor Ad',
      metadata: { campaign_id, coins: REWARD_AD_COINS },
    });

    return NextResponse.json({
      success: true,
      coins_earned: REWARD_AD_COINS,
      new_balance: newBalance,
      message: `Earned +${REWARD_AD_COINS} coins!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to claim ad reward' }, { status: 500 });
  }
}
