import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COIN_PACKS, VIP_TIERS, DEFAULT_PROMOTIONS } from '@/data/coinPacks';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Fetch configurable coin packages from Supabase
    let coinPackages = COIN_PACKS;
    try {
      const { data: dbPacks, error: packErr } = await supabase
        .from('coin_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!packErr && dbPacks && dbPacks.length > 0) {
        coinPackages = dbPacks.map((p) => ({
          id: p.id,
          coins: Number(p.coins),
          bonus_coins: Number(p.bonus_coins || 0),
          price_usd: Number(p.price_usd),
          price_inr: Number(p.price_inr),
          popular: !!p.popular,
          best_value: !!p.best_value,
          tag: p.tag || undefined,
        }));
      }
    } catch {
      // Fallback to COIN_PACKS if table does not exist yet
    }

    // 2. Fetch promotions
    let promotions = DEFAULT_PROMOTIONS;
    try {
      const { data: dbPromos, error: promoErr } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!promoErr && dbPromos && dbPromos.length > 0) {
        promotions = dbPromos;
      }
    } catch {
      // Fallback to DEFAULT_PROMOTIONS
    }

    return NextResponse.json({
      success: true,
      packages: coinPackages,
      vip_tiers: VIP_TIERS,
      promotions,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      packages: COIN_PACKS,
      vip_tiers: VIP_TIERS,
      promotions: DEFAULT_PROMOTIONS,
    });
  }
}
