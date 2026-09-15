import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      video_id,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !video_id) {
      return NextResponse.json({ error: 'Missing payment verification fields' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret || keySecret.includes('REPLACE_ME')) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 503 });
    }

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Fetch video price for record
    const { data: video } = await supabase
      .from('videos')
      .select('price_inr')
      .eq('id', video_id)
      .single();

    // Record the purchase
    const { error: insertError } = await supabase
      .from('video_purchases')
      .upsert({
        user_id: user.id,
        video_id,
        razorpay_order_id,
        razorpay_payment_id,
        amount_inr: video?.price_inr ?? 0,
        status: 'paid',
      }, { onConflict: 'user_id,video_id' });

    if (insertError) {
      console.error('Purchase insert error:', insertError);
      return NextResponse.json({ error: 'Failed to record purchase' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Payment verified and access granted.' });
  } catch (err: any) {
    console.error('verify-payment error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
