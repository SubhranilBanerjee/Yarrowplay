import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COIN_PACKS, VIP_TIERS } from '@/data/coinPacks';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { pack_id, vip_tier_id } = await req.json();

    // 1. Handling Coin Pack Purchase
    if (pack_id) {
      const pack = COIN_PACKS.find((p) => p.id === pack_id);
      if (!pack) {
        return NextResponse.json({ error: 'Invalid coin pack' }, { status: 400 });
      }

      const totalCoins = pack.coins + pack.bonus_coins;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, coins_balance')
        .eq('id', user.id)
        .single();

      const currentBalance = profile?.coins_balance || 0;
      const newBalance = currentBalance + totalCoins;

      const { error: updErr } = await supabase
        .from('profiles')
        .update({ coins_balance: newBalance })
        .eq('id', user.id);

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }

      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: totalCoins,
        type: 'purchase',
        description: `Purchased ${pack.coins} Coins (+${pack.bonus_coins} Bonus)`,
        metadata: {
          pack_id: pack.id,
          price_usd: pack.price_usd,
          price_inr: pack.price_inr,
          coins: totalCoins,
        },
      });

      return NextResponse.json({
        success: true,
        coins_added: totalCoins,
        new_balance: newBalance,
        message: `Successfully purchased ${totalCoins} coins!`,
      });
    }

    // 2. Handling VIP Pass Purchase
    if (vip_tier_id) {
      const vip = VIP_TIERS.find((v) => v.id === vip_tier_id);
      if (!vip) {
        return NextResponse.json({ error: 'Invalid VIP tier' }, { status: 400 });
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + vip.duration_days * 24 * 60 * 60 * 1000);

      const { error: updErr } = await supabase
        .from('profiles')
        .update({
          vip_tier: vip.id,
          vip_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }

      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: 0,
        type: 'purchase',
        description: `Activated ${vip.name} (${vip.duration_days} days)`,
        metadata: {
          vip_tier: vip.id,
          price_usd: vip.price_usd,
          price_inr: vip.price_inr,
          expires_at: expiresAt.toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        vip_tier: vip.id,
        vip_expires_at: expiresAt.toISOString(),
        message: `${vip.name} activated! Enjoy unlimited streaming.`,
      });
    }

    return NextResponse.json({ error: 'Please provide pack_id or vip_tier_id' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Transaction failed' }, { status: 500 });
  }
}
