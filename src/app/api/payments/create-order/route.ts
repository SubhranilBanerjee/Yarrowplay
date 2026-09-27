import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COIN_PACKS, VIP_TIERS } from '@/data/coinPacks';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes('REPLACE_ME')) {
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please add Razorpay keys to .env.local.' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { pack_id, vip_tier_id, video_id } = body;

    let amountPaise = 0;
    let title = '';
    let description = '';
    let notes: Record<string, any> = { user_id: user.id };

    // 1. COIN PACK PURCHASE
    if (pack_id) {
      let pack: any = null;
      try {
        const { data: dbPack } = await supabase
          .from('coin_packages')
          .select('*')
          .eq('id', pack_id)
          .eq('is_active', true)
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
        return NextResponse.json({ error: 'Invalid coin pack selected' }, { status: 400 });
      }

      const totalCoins = pack.coins + (pack.bonus_coins || 0);
      amountPaise = Math.round(pack.price_inr * 100);
      title = `🪙 ${totalCoins} DramaBox Coins`;
      description = `Purchase ${pack.coins} Coins (+${pack.bonus_coins || 0} Bonus)`;
      notes = {
        type: 'coin_pack',
        pack_id: pack.id,
        coins: totalCoins,
        user_id: user.id,
        amount_inr: pack.price_inr,
      };
    }
    // 2. VIP PASS PURCHASE
    else if (vip_tier_id) {
      const vip = VIP_TIERS.find((v) => v.id === vip_tier_id);
      if (!vip) {
        return NextResponse.json({ error: 'Invalid VIP tier selected' }, { status: 400 });
      }

      const priceInr = vip.intro_price_inr || vip.price_inr;
      amountPaise = Math.round(priceInr * 100);
      title = `👑 ${vip.name}`;
      description = `${vip.duration_days} Days Unlimited Ad-Free Access`;
      notes = {
        type: 'vip_pass',
        vip_tier_id: vip.id,
        duration_days: vip.duration_days,
        user_id: user.id,
        amount_inr: priceInr,
      };
    }
    // 3. INDIVIDUAL VIDEO / EPISODE PURCHASE
    else if (video_id) {
      const { data: video, error: vidError } = await supabase
        .from('videos')
        .select('id, title, is_locked, price_inr, episode_number')
        .eq('id', video_id)
        .single();

      if (vidError || !video) {
        return NextResponse.json({ error: 'Video not found' }, { status: 404 });
      }

      // Check if user already purchased
      const { data: existingPurchase } = await supabase
        .from('video_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('video_id', video_id)
        .eq('status', 'paid')
        .maybeSingle();

      if (existingPurchase) {
        return NextResponse.json({ error: 'Already purchased this episode' }, { status: 409 });
      }

      const priceInr = Number(video.price_inr) > 0 ? Number(video.price_inr) : 19;
      amountPaise = Math.round(priceInr * 100);
      title = video.title;
      description = `Unlock Episode ${video.episode_number || ''}`;
      notes = {
        type: 'video_purchase',
        video_id,
        user_id: user.id,
        amount_inr: priceInr,
      };
    } else {
      return NextResponse.json(
        { error: 'Please specify pack_id, vip_tier_id, or video_id' },
        { status: 400 }
      );
    }

    // Create Razorpay order via REST API
    const receiptId = `yp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: receiptId,
        notes,
      }),
    });

    if (!razorpayRes.ok) {
      const errBody = await razorpayRes.json().catch(() => ({}));
      console.error('Razorpay create order error:', errBody);
      return NextResponse.json(
        { error: errBody?.error?.description || 'Failed to create Razorpay payment order' },
        { status: 502 }
      );
    }

    const order = await razorpayRes.json();

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      title,
      description,
      key_id: keyId,
      notes,
    });
  } catch (err: any) {
    console.error('create-order error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
