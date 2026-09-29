export interface CoinPack {
  id: string;
  coins: number;
  bonus_coins: number;
  price_usd: number;
  price_inr: number;
  popular?: boolean;
  best_value?: boolean;
  tag?: string;
}

export const COIN_PACKS: CoinPack[] = [
  {
    id: 'pack_60',
    coins: 60,
    bonus_coins: 0,
    price_usd: 0.99,
    price_inr: 89,
    tag: 'Starter',
  },
  {
    id: 'pack_200',
    coins: 200,
    bonus_coins: 20,
    price_usd: 2.99,
    price_inr: 249,
    tag: '+10% Bonus',
  },
  {
    id: 'pack_450',
    coins: 450,
    bonus_coins: 50,
    price_usd: 5.99,
    price_inr: 499,
    popular: true,
    tag: 'MOST POPULAR',
  },
  {
    id: 'pack_1000',
    coins: 1000,
    bonus_coins: 150,
    price_usd: 11.99,
    price_inr: 999,
    tag: '+15% Bonus',
  },
  {
    id: 'pack_1800',
    coins: 1800,
    bonus_coins: 300,
    price_usd: 19.99,
    price_inr: 1699,
    best_value: true,
    tag: 'BEST VALUE',
  },
];

export interface VIPTier {
  id: 'weekly' | 'monthly' | 'yearly' | 'annual';
  name: string;
  duration_days: number;
  price_usd: number;
  price_inr: number;
  intro_price_inr?: number;
  billing_frequency: string;
  popular?: boolean;
  best_value?: boolean;
  benefits: string[];
}

export const VIP_TIERS: VIPTier[] = [
  {
    id: 'weekly',
    name: 'Weekly Pass',
    duration_days: 7,
    price_usd: 5.99,
    price_inr: 199,
    intro_price_inr: 99,
    billing_frequency: 'Billed every 7 days',
    benefits: [
      'Unlimited episode unlocks',
      '100% Ad-Free experience',
      'Early access to new releases',
      'Exclusive Golden VIP badge',
    ],
  },
  {
    id: 'monthly',
    name: 'Monthly Pass',
    duration_days: 30,
    price_usd: 14.99,
    price_inr: 599,
    intro_price_inr: 499,
    billing_frequency: 'Billed monthly',
    popular: true,
    benefits: [
      '30 days of unlimited unlocks',
      '100% Ad-Free streaming',
      'All original series & shorts',
      'HD & 4K cinematic quality',
      'Priority streaming bandwidth',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly Pass',
    duration_days: 365,
    price_usd: 49.99,
    price_inr: 1999,
    intro_price_inr: 1499,
    billing_frequency: 'Billed annually',
    best_value: true,
    benefits: [
      '365 days of unlimited unlocks',
      'Save over 70% vs weekly pass',
      'Zero ads across entire platform',
      'Full offline downloads access',
      'Exclusive VIP community badge',
    ],
  },
  {
    id: 'annual',
    name: 'Annual Pass',
    duration_days: 365,
    price_usd: 49.99,
    price_inr: 1999,
    intro_price_inr: 1499,
    billing_frequency: 'Billed annually',
    benefits: [
      '365 days of unlimited unlocks',
      'Save over 70% vs weekly pass',
      'Zero ads across entire platform',
    ],
  },
];

export const DAILY_STREAK_REWARDS = [
  { day: 1, coins: 5, label: 'Day 1' },
  { day: 2, coins: 10, label: 'Day 2' },
  { day: 3, coins: 15, label: 'Day 3' },
  { day: 4, coins: 20, label: 'Day 4' },
  { day: 5, coins: 25, label: 'Day 5' },
  { day: 6, coins: 35, label: 'Day 6' },
  { day: 7, coins: 50, label: 'Day 7', mystery: true },
];

export const EPISODE_UNLOCK_COINS = 10;
export const FREE_EPISODE_THRESHOLD = 2; // Episodes 1 and 2 are completely free (DramaBox model)
export const REWARD_AD_COINS = 2; // Coins earned per rewarded ad watched

export interface Promotion {
  id: string;
  code: string;
  title: string;
  description?: string;
  reward_type: 'coins' | 'vip_days' | 'discount_percent';
  reward_value: number;
  max_uses?: number;
  times_used?: number;
  valid_until?: string | null;
  is_active: boolean;
}

export const DEFAULT_PROMOTIONS: Promotion[] = [
  {
    id: 'promo_welcome50',
    code: 'WELCOME50',
    title: '50 Free Coins',
    description: 'Welcome gift for short drama lovers! Claim 50 free coins immediately.',
    reward_type: 'coins',
    reward_value: 50,
    is_active: true,
  },
  {
    id: 'promo_dramabox',
    code: 'DRAMABOX',
    title: '100 Mega Coins Bonus',
    description: 'Exclusive DramaBox launch promo. Unlock up to 10 cliffhanger episodes!',
    reward_type: 'coins',
    reward_value: 100,
    is_active: true,
  },
  {
    id: 'promo_vipfree',
    code: 'VIPFREE',
    title: '3-Day VIP Pass',
    description: 'Binge without limits. Enjoy 3 days of unlimited ad-free short series.',
    reward_type: 'vip_days',
    reward_value: 3,
    is_active: true,
  },
];

