import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { video_id } = await req.json();
    if (!video_id) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    // Fetch video to get price
    const { data: video, error: vidError } = await supabase
      .from('videos')
      .select('id, title, is_locked, price_inr')
      .eq('id', video_id)
      .single();

    if (vidError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (!video.is_locked || !video.price_inr || video.price_inr <= 0) {
      return NextResponse.json({ error: 'This video is not available for purchase' }, { status: 400 });
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
      return NextResponse.json({ error: 'Already purchased' }, { status: 409 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes('REPLACE_ME')) {
      return NextResponse.json({ error: 'Payment gateway not configured. Please add Razorpay keys to .env.local.' }, { status: 503 });
    }

    // Amount in paise (Razorpay uses smallest currency unit)
    const amountPaise = Math.round(video.price_inr * 100);

    // Create Razorpay order via REST API
    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `yp_${video_id.slice(0, 8)}_${Date.now()}`,
        notes: {
          video_id,
          user_id: user.id,
          video_title: video.title,
        },
      }),
    });

    if (!razorpayRes.ok) {
      const errBody = await razorpayRes.json().catch(() => ({}));
      console.error('Razorpay create order error:', errBody);
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 502 });
    }

    const order = await razorpayRes.json();

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      video_title: video.title,
      key_id: keyId,
    });
  } catch (err: any) {
    console.error('create-order error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
