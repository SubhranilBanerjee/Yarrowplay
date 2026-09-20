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
  id: 'weekly' | 'annual';
  name: string;
  duration_days: number;
  price_usd: number;
  price_inr: number;
  intro_price_inr?: number;
  benefits: string[];
}

export const VIP_TIERS: VIPTier[] = [
  {
    id: 'weekly',
    name: 'Weekly VIP Pass',
    duration_days: 7,
    price_usd: 5.99,
    price_inr: 199,
    intro_price_inr: 99,
    benefits: [
      'Unlimited episode unlocks',
      '100% Ad-Free experience',
      'Early access to new releases',
      'Exclusive Golden VIP badge',
    ],
  },
  {
    id: 'annual',
    name: 'Annual VIP Pass',
    duration_days: 365,
    price_usd: 49.99,
    price_inr: 1999,
    benefits: [
      '365 days of unlimited unlocks',
      'Save over 70% vs weekly pass',
      'Zero ads across entire app',
      'VIP priority server speed',
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
export const FREE_EPISODE_THRESHOLD = 5; // Episodes 1 to 5 are completely free
export const REWARD_AD_COINS = 2; // Coins earned per rewarded ad watched
