import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_PROMOTIONS } from '@/data/coinPacks';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Check if user already redeemed this promo
    try {
      const { data: existingRedemption } = await supabase
        .from('user_promo_redemptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('promo_code', cleanCode)
        .maybeSingle();

      if (existingRedemption) {
        return NextResponse.json(
          { error: 'You have already redeemed this promo code.' },
          { status: 400 }
        );
      }
    } catch {
      // Table may not exist yet or first run
    }

    // 2. Fetch promo details from DB or fallback
    let promo = null;
    try {
      const { data: dbPromo } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', cleanCode)
        .eq('is_active', true)
        .maybeSingle();

      if (dbPromo) {
        promo = dbPromo;
      }
    } catch {
      // Fallback
    }

    if (!promo) {
      promo = DEFAULT_PROMOTIONS.find((p) => p.code.toUpperCase() === cleanCode);
    }

    if (!promo) {
      return NextResponse.json(
        { error: 'Invalid or expired promotional code.' },
        { status: 404 }
      );
    }

    // 3. Fetch user profile
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('id, coins_balance, vip_tier, vip_expires_at')
      .eq('id', user.id)
      .single();

    if (profErr || !profile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 });
    }

    let message = '';
    let newBalance = profile.coins_balance || 0;
    let newVipTier = profile.vip_tier || 'none';
    let newVipExpires = profile.vip_expires_at;

    if (promo.reward_type === 'coins') {
      const coinsAwarded = Number(promo.reward_value);
      newBalance += coinsAwarded;

      await supabase
        .from('profiles')
        .update({ coins_balance: newBalance })
        .eq('id', user.id);

      try {
        await supabase.from('coin_transactions').insert({
          user_id: user.id,
          amount: coinsAwarded,
          type: 'bonus',
          description: `Promo Code '${cleanCode}' Redeemed (+${coinsAwarded} Coins)`,
          metadata: { promo_code: cleanCode, reward_type: 'coins', reward_value: coinsAwarded },
        });
      } catch {}

      message = `🎉 Promo applied! +${coinsAwarded} bonus coins added to your wallet.`;
    } else if (promo.reward_type === 'vip_days') {
      const days = Number(promo.reward_value);
      const baseDate =
        profile.vip_expires_at && new Date(profile.vip_expires_at).getTime() > Date.now()
          ? new Date(profile.vip_expires_at)
          : new Date();

      const newDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
      newVipTier = 'weekly';
      newVipExpires = newDate.toISOString();

      await supabase
        .from('profiles')
        .update({
          vip_tier: newVipTier,
          vip_expires_at: newVipExpires,
        })
        .eq('id', user.id);

      try {
        await supabase.from('coin_transactions').insert({
          user_id: user.id,
          amount: 0,
          type: 'bonus',
          description: `VIP Promo Code '${cleanCode}' Activated (${days} Days VIP)`,
          metadata: { promo_code: cleanCode, reward_type: 'vip_days', days },
        });
      } catch {}

      message = `👑 VIP Access Activated! You have ${days} days of unlimited streaming.`;
    } else {
      return NextResponse.json({ error: 'Unsupported promotion reward type' }, { status: 400 });
    }

    // 4. Record redemption
    try {
      await supabase.from('user_promo_redemptions').insert({
        user_id: user.id,
        promo_code: cleanCode,
        reward_type: promo.reward_type,
        reward_value: promo.reward_value,
      });

      // Increment times_used if in DB
      try {
        await supabase.rpc('increment_promo_usage', { p_code: cleanCode });
      } catch {}
    } catch {}

    return NextResponse.json({
      success: true,
      promo_code: cleanCode,
      reward_type: promo.reward_type,
      reward_value: promo.reward_value,
      new_balance: newBalance,
      vip_tier: newVipTier,
      vip_expires_at: newVipExpires,
      message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to redeem promo code' },
      { status: 500 }
    );
  }
}
