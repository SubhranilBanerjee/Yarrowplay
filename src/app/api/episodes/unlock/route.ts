import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FREE_EPISODE_THRESHOLD, EPISODE_UNLOCK_COINS } from '@/data/coinPacks';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('video_id');

    if (!videoId) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    // 1. Fetch video metadata
    const { data: video, error: vErr } = await supabase
      .from('videos')
      .select('id, creator_id, series_id, episode_number, is_locked, price_inr')
      .eq('id', videoId)
      .single();

    if (vErr || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const epNum = video.episode_number || 1;

    // DramaBox rule: First 5 episodes are completely free!
    if (epNum <= FREE_EPISODE_THRESHOLD) {
      return NextResponse.json({
        is_unlocked: true,
        is_free_tier: true,
        cost_coins: 0,
        episode_number: epNum,
      });
    }

    // Check user auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        is_unlocked: false,
        is_free_tier: false,
        cost_coins: EPISODE_UNLOCK_COINS,
        episode_number: epNum,
        requires_auth: true,
      });
    }

    // If user is the creator
    if (user.id === video.creator_id) {
      return NextResponse.json({
        is_unlocked: true,
        is_creator: true,
        cost_coins: 0,
        episode_number: epNum,
      });
    }

    // Check VIP status
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, coins_balance, vip_tier, vip_expires_at')
      .eq('id', user.id)
      .single();

    const isVIP =
      profile?.vip_tier &&
      profile.vip_tier !== 'none' &&
      profile.vip_expires_at &&
      new Date(profile.vip_expires_at).getTime() > Date.now();

    if (isVIP) {
      return NextResponse.json({
        is_unlocked: true,
        is_vip: true,
        cost_coins: 0,
        episode_number: epNum,
      });
    }

    // Check existing unlock in episode_unlocks or video_purchases
    const [{ data: unlock }, { data: purchase }] = await Promise.all([
      supabase
        .from('episode_unlocks')
        .select('id')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .maybeSingle(),
      supabase
        .from('video_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .maybeSingle(),
    ]);

    if (unlock || purchase) {
      return NextResponse.json({
        is_unlocked: true,
        cost_coins: 0,
        episode_number: epNum,
      });
    }

    return NextResponse.json({
      is_unlocked: false,
      is_free_tier: false,
      cost_coins: EPISODE_UNLOCK_COINS,
      episode_number: epNum,
      coins_balance: profile?.coins_balance || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to check unlock status' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { video_id } = await req.json();

    if (!video_id) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    // 1. Fetch video info
    const { data: video, error: vErr } = await supabase
      .from('videos')
      .select('id, creator_id, series_id, episode_number, title')
      .eq('id', video_id)
      .single();

    if (vErr || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const epNum = video.episode_number || 1;

    // If free tier episode, automatically unlocked
    if (epNum <= FREE_EPISODE_THRESHOLD) {
      return NextResponse.json({
        success: true,
        is_unlocked: true,
        message: 'Episode is free!',
      });
    }

    // 2. Fetch profile
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id, coins_balance, vip_tier, vip_expires_at')
      .eq('id', user.id)
      .single();

    if (pErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // VIP bypass
    const isVIP =
      profile.vip_tier &&
      profile.vip_tier !== 'none' &&
      profile.vip_expires_at &&
      new Date(profile.vip_expires_at).getTime() > Date.now();

    if (isVIP) {
      return NextResponse.json({
        success: true,
        is_unlocked: true,
        is_vip: true,
        message: 'VIP Pass active. Episode unlocked!',
      });
    }

    // Check if already unlocked
    const { data: existingUnlock } = await supabase
      .from('episode_unlocks')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_id', video_id)
      .maybeSingle();

    if (existingUnlock) {
      return NextResponse.json({
        success: true,
        is_unlocked: true,
        message: 'Episode already unlocked!',
        new_balance: profile.coins_balance,
      });
    }

    const balance = profile.coins_balance ?? 0;
    if (balance < EPISODE_UNLOCK_COINS) {
      return NextResponse.json(
        {
          error: 'INSUFFICIENT_COINS',
          required: EPISODE_UNLOCK_COINS,
          balance,
          message: `You need ${EPISODE_UNLOCK_COINS} coins to unlock this episode. Current balance: ${balance} coins.`,
        },
        { status: 402 }
      );
    }

    const newBalance = balance - EPISODE_UNLOCK_COINS;

    // Deduct coins from profile
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ coins_balance: newBalance })
      .eq('id', user.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Insert unlock record
    await supabase.from('episode_unlocks').insert({
      user_id: user.id,
      video_id,
      series_id: video.series_id,
      coins_spent: EPISODE_UNLOCK_COINS,
    });

    // Record transaction
    await supabase.from('coin_transactions').insert({
      user_id: user.id,
      amount: -EPISODE_UNLOCK_COINS,
      type: 'episode_unlock',
      description: `Unlocked Episode ${epNum}: ${video.title}`,
      metadata: { video_id, series_id: video.series_id, episode_number: epNum },
    });

    return NextResponse.json({
      success: true,
      is_unlocked: true,
      new_balance: newBalance,
      coins_spent: EPISODE_UNLOCK_COINS,
      message: `Episode ${epNum} unlocked successfully!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to unlock episode' }, { status: 500 });
  }
}
