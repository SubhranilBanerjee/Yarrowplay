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

    const { campaign_id, unlock_video_id } = await req.json().catch(() => ({ campaign_id: null, unlock_video_id: null }));

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
      description: unlock_video_id
        ? 'Watched Rewarded Ad to Unlock Episode'
        : 'Watched Rewarded Sponsor Ad',
      metadata: { campaign_id, unlock_video_id, coins: REWARD_AD_COINS },
    });

    // If an episode unlock was targeted
    let unlockedEpisode = false;
    if (unlock_video_id) {
      try {
        const { data: vid } = await supabase
          .from('videos')
          .select('series_id')
          .eq('id', unlock_video_id)
          .maybeSingle();

        await supabase.from('episode_unlocks').upsert({
          user_id: user.id,
          video_id: unlock_video_id,
          series_id: vid?.series_id || null,
          coins_spent: 0,
          unlock_type: 'ad_reward',
        });
        unlockedEpisode = true;
      } catch {}
    }

    return NextResponse.json({
      success: true,
      coins_earned: REWARD_AD_COINS,
      new_balance: newBalance,
      unlocked_episode: unlockedEpisode,
      video_id: unlock_video_id,
      message: unlockedEpisode
        ? `Episode unlocked! (+${REWARD_AD_COINS} bonus coins)`
        : `Earned +${REWARD_AD_COINS} coins!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to claim ad reward' }, { status: 500 });
  }
}
