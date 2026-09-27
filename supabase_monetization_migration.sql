-- =============================================================================
-- DRAMABOX-STYLE MONETIZATION MIGRATION FOR SUPABASE
-- Yarrowplay / Lighthouse Reels
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- =============================================================================

-- 1. ADD WALLET & VIP FIELDS TO PROFILES TABLE
alter table public.profiles add column if not exists coins_balance int default 50;
alter table public.profiles add column if not exists vip_tier text check (vip_tier in ('none', 'weekly', 'monthly', 'annual')) default 'none';
alter table public.profiles add column if not exists vip_expires_at timestamptz;
alter table public.profiles add column if not exists last_check_in_date date;
alter table public.profiles add column if not exists check_in_streak int default 0;

-- Backfill existing profiles with welcome 50 coins if balance is null
update public.profiles
set coins_balance = 50
where coins_balance is null;


-- 2. COIN TRANSACTIONS TABLE (LEDGER)
create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount int not null,
  type text check (type in ('purchase', 'reward_ad', 'daily_check_in', 'episode_unlock', 'bonus', 'promo_redemption', 'vip_subscription', 'refund')) not null,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_coin_transactions_user on public.coin_transactions(user_id, created_at desc);
create index if not exists idx_coin_transactions_type on public.coin_transactions(user_id, type);

alter table public.coin_transactions enable row level security;

drop policy if exists "Users view own coin transactions" on public.coin_transactions;
create policy "Users view own coin transactions" on public.coin_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert coin transactions" on public.coin_transactions;
create policy "Users insert coin transactions" on public.coin_transactions for insert
  with check (auth.uid() = user_id);


-- 3. EPISODE UNLOCKS TABLE
create table if not exists public.episode_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  series_id uuid references public.content_series(id) on delete cascade,
  coins_spent int default 0,
  unlock_type text default 'coins' check (unlock_type in ('coins', 'vip', 'ad_reward', 'free_promo')),
  created_at timestamptz default now(),
  constraint uq_user_video_unlock unique (user_id, video_id)
);

create index if not exists idx_episode_unlocks_user_vid on public.episode_unlocks(user_id, video_id);
create index if not exists idx_episode_unlocks_user_series on public.episode_unlocks(user_id, series_id);

alter table public.episode_unlocks enable row level security;

drop policy if exists "Users view own episode unlocks" on public.episode_unlocks;
create policy "Users view own episode unlocks" on public.episode_unlocks for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert episode unlocks" on public.episode_unlocks;
create policy "Users insert episode unlocks" on public.episode_unlocks for insert
  with check (auth.uid() = user_id);


-- 4. CONFIGURABLE COIN PACKAGES TABLE
create table if not exists public.coin_packages (
  id text primary key,
  coins int not null,
  bonus_coins int default 0,
  price_usd numeric not null,
  price_inr numeric not null,
  tag text,
  popular boolean default false,
  best_value boolean default false,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.coin_packages enable row level security;

drop policy if exists "Coin packages viewable by everyone" on public.coin_packages;
create policy "Coin packages viewable by everyone" on public.coin_packages for select
  using (is_active = true);

-- Seed default coin packages
insert into public.coin_packages (id, coins, bonus_coins, price_usd, price_inr, tag, popular, best_value, sort_order)
values
  ('pack_60', 60, 0, 0.99, 89, 'Starter', false, false, 1),
  ('pack_200', 200, 20, 2.99, 249, '+10% Bonus', false, false, 2),
  ('pack_450', 450, 50, 5.99, 499, 'MOST POPULAR', true, false, 3),
  ('pack_1000', 1000, 150, 11.99, 999, '+15% Bonus', false, false, 4),
  ('pack_1800', 1800, 300, 19.99, 1699, 'BEST VALUE', false, true, 5)
on conflict (id) do update set
  coins = excluded.coins,
  bonus_coins = excluded.bonus_coins,
  price_usd = excluded.price_usd,
  price_inr = excluded.price_inr,
  tag = excluded.tag,
  popular = excluded.popular,
  best_value = excluded.best_value,
  sort_order = excluded.sort_order;


-- 5. PROMOTIONS & COUPONS TABLE
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text,
  reward_type text check (reward_type in ('coins', 'vip_days', 'discount_percent')) not null,
  reward_value int not null,
  max_uses int default 1000,
  times_used int default 0,
  valid_until timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.promotions enable row level security;

drop policy if exists "Active promotions viewable by all" on public.promotions;
create policy "Active promotions viewable by all" on public.promotions for select
  using (is_active = true);

-- Seed initial promotions
insert into public.promotions (code, title, description, reward_type, reward_value, is_active)
values
  ('WELCOME50', '50 Free Welcome Coins', 'Instant 50 free coins for all new viewers!', 'coins', 50, true),
  ('DRAMABOX', '100 Coins Launch Special', 'Unlock up to 10 cliffhanger episodes for free!', 'coins', 100, true),
  ('VIPFREE', '3 Days VIP Pass Free', 'Enjoy 3 days of unlimited ad-free short series streaming!', 'vip_days', 3, true)
on conflict (code) do update set
  title = excluded.title,
  description = excluded.description,
  reward_type = excluded.reward_type,
  reward_value = excluded.reward_value,
  is_active = excluded.is_active;


-- 6. USER PROMO REDEMPTIONS TABLE (Prevents double claiming)
create table if not exists public.user_promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  promo_code text not null,
  reward_type text not null,
  reward_value int not null,
  created_at timestamptz default now(),
  constraint uq_user_promo unique (user_id, promo_code)
);

create index if not exists idx_user_promo_user on public.user_promo_redemptions(user_id, promo_code);

alter table public.user_promo_redemptions enable row level security;

drop policy if exists "Users view own promo redemptions" on public.user_promo_redemptions;
create policy "Users view own promo redemptions" on public.user_promo_redemptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own promo redemptions" on public.user_promo_redemptions;
create policy "Users insert own promo redemptions" on public.user_promo_redemptions for insert
  with check (auth.uid() = user_id);


-- 7. HELPER RPC FUNCTIONS
create or replace function public.increment_promo_usage(p_code text)
returns void as $$
begin
  update public.promotions
  set times_used = coalesce(times_used, 0) + 1
  where code = upper(p_code);
end;
$$ language plpgsql security definer;
