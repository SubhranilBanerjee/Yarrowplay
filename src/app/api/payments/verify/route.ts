import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { COIN_PACKS, VIP_TIERS } from '@/data/coinPacks';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      pack_id,
      vip_tier_id,
      video_id,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret || keySecret.includes('REPLACE_ME')) {
      return NextResponse.json({ error: 'Payment gateway secret not configured' }, { status: 503 });
    }

    // 1. Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature. Verification failed.' }, { status: 400 });
    }

    // 2. FULFILLMENT BASED ON PURCHASE TYPE

    // A. COIN PACK PURCHASE
    if (pack_id) {
      let pack: any = null;
      try {
        const { data: dbPack } = await supabase
          .from('coin_packages')
          .select('*')
          .eq('id', pack_id)
          .maybeSingle();

        if (dbPack) {
          pack = {
            id: dbPack.id,
            coins: Number(dbPack.coins),
            bonus_coins: Number(dbPack.bonus_coins || 0),
            price_inr: Number(dbPack.price_inr),
          };
        }
      } catch {}

      if (!pack) {
        pack = COIN_PACKS.find((p) => p.id === pack_id);
      }

      if (!pack) {
        return NextResponse.json({ error: 'Coin pack not found' }, { status: 400 });
      }

      const totalCoins = pack.coins + (pack.bonus_coins || 0);

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

      try {
        await supabase.from('coin_transactions').insert({
          user_id: user.id,
          amount: totalCoins,
          type: 'purchase',
          description: `Purchased ${pack.coins} Coins (+${pack.bonus_coins || 0} Bonus) via Razorpay`,
          metadata: {
            pack_id: pack.id,
            razorpay_order_id,
            razorpay_payment_id,
            price_inr: pack.price_inr,
            coins: totalCoins,
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        type: 'coin_pack',
        coins_added: totalCoins,
        new_balance: newBalance,
        message: `Payment successful! Added ${totalCoins} coins to your wallet.`,
      });
    }

    // B. VIP PASS PURCHASE
    if (vip_tier_id) {
      const vip = VIP_TIERS.find((v) => v.id === vip_tier_id);
      if (!vip) {
        return NextResponse.json({ error: 'Invalid VIP tier' }, { status: 400 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('vip_expires_at')
        .eq('id', user.id)
        .single();

      const baseDate =
        profile?.vip_expires_at && new Date(profile.vip_expires_at).getTime() > Date.now()
          ? new Date(profile.vip_expires_at)
          : new Date();

      const newExpiresAt = new Date(baseDate.getTime() + vip.duration_days * 24 * 60 * 60 * 1000);

      const { error: updErr } = await supabase
        .from('profiles')
        .update({
          vip_tier: vip.id,
          vip_expires_at: newExpiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }

      try {
        await supabase.from('coin_transactions').insert({
          user_id: user.id,
          amount: 0,
          type: 'vip_subscription',
          description: `Activated ${vip.name} (${vip.duration_days} days) via Razorpay`,
          metadata: {
            vip_tier: vip.id,
            razorpay_order_id,
            razorpay_payment_id,
            price_inr: vip.intro_price_inr || vip.price_inr,
            expires_at: newExpiresAt.toISOString(),
          },
        });
      } catch {}

      return NextResponse.json({
        success: true,
        type: 'vip_pass',
        vip_tier: vip.id,
        vip_expires_at: newExpiresAt.toISOString(),
        message: `👑 ${vip.name} activated! Enjoy unlimited ad-free series.`,
      });
    }

    // C. VIDEO / EPISODE PURCHASE
    if (video_id) {
      const { data: video } = await supabase
        .from('videos')
        .select('id, price_inr, series_id, episode_number')
        .eq('id', video_id)
        .single();

      // Upsert video_purchases record
      await supabase
        .from('video_purchases')
        .upsert(
          {
            user_id: user.id,
            video_id,
            razorpay_order_id,
            razorpay_payment_id,
            amount_inr: video?.price_inr || 19,
            status: 'paid',
          },
          { onConflict: 'user_id,video_id' }
        );

      // Also record in episode_unlocks
      try {
        await supabase.from('episode_unlocks').upsert(
          {
            user_id: user.id,
            video_id,
            series_id: video?.series_id || null,
            coins_spent: 0,
            unlock_type: 'paid',
          },
          { onConflict: 'user_id,video_id' }
        );
      } catch {}

      return NextResponse.json({
        success: true,
        type: 'video_purchase',
        video_id,
        message: 'Payment verified and episode unlocked successfully.',
      });
    }

    return NextResponse.json({ error: 'No item specified for fulfillment' }, { status: 400 });
  } catch (err: any) {
    console.error('verify-payment error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
