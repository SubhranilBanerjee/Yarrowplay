-- Yarrowplay Complete PostgreSQL Database Schema for Supabase
-- Run this in Supabase SQL Editor: https://yhtejnjrjqpzyowldhky.supabase.co/

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS & TYPES
do $$ begin
  create type user_role as enum ('viewer', 'creator', 'advertiser');
exception
  when duplicate_object then null;
end $$;

-- 3. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  username text unique,
  display_name text,
  role text not null check (role in ('viewer', 'creator', 'advertiser')) default 'viewer',
  sub_role text check (sub_role in ('Professional', 'Student', 'Hobbyist')),
  company_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Migration: add sub_role if table already exists
alter table public.profiles add column if not exists sub_role text check (sub_role in ('Professional', 'Student', 'Hobbyist'));

-- Trigger to create public.profiles row automatically when auth.users is created
create or replace function public.handle_new_user()
returns trigger as $$
declare
  raw_role text;
  raw_name text;
  raw_company text;
  raw_sub_role text;
  generated_username text;
begin
  raw_role := coalesce(new.raw_user_meta_data->>'role', 'viewer');
  raw_name := coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  raw_company := new.raw_user_meta_data->>'company_name';
  raw_sub_role := new.raw_user_meta_data->>'sub_role';
  generated_username := lower(regexp_replace(raw_name, '[^a-zA-Z0-9]', '', 'g')) || '_' || substr(new.id::text, 1, 6);

  insert into public.profiles (id, email, username, display_name, role, sub_role, company_name)
  values (new.id, new.email, generated_username, raw_name, raw_role, raw_sub_role, raw_company)
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(profiles.display_name, excluded.display_name),
    role = coalesce(profiles.role, excluded.role),
    sub_role = coalesce(profiles.sub_role, excluded.sub_role),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. CONTENT SERIES TABLE
create table if not exists public.content_series (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text not null,
  category text,
  tags text[] default '{}',
  cover_url text,
  cover_public_id text,
  total_episodes int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. VIDEOS TABLE
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  series_id uuid references public.content_series(id) on delete set null,
  episode_number int,
  title text not null,
  description text not null,
  summary text,
  category text,
  genre text,
  tags text[] default '{}',
  video_url text not null,
  video_public_id text,
  thumbnail_url text,
  thumbnail_public_id text,
  duration_seconds numeric default 0,
  visibility text check (visibility in ('public', 'unlisted', 'draft')) default 'public',
  status text check (status in ('processing', 'published', 'archived', 'draft')) default 'published',
  is_locked boolean default false,
  price_inr numeric default 0,
  views_count int default 0,
  likes_count int default 0,
  dislikes_count int default 0,
  shares_count int default 0,
  comments_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Migrations: add is_locked / price_inr if table already exists
alter table public.videos add column if not exists is_locked boolean default false;
alter table public.videos add column if not exists price_inr numeric default 0;

-- 5b. VIDEO PURCHASES TABLE (Razorpay)
create table if not exists public.video_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  razorpay_order_id text,
  razorpay_payment_id text,
  amount_inr numeric not null,
  status text check (status in ('pending', 'paid', 'failed')) default 'paid',
  created_at timestamptz default now(),
  constraint uq_user_video_purchase unique (user_id, video_id)
);

alter table public.video_purchases enable row level security;

drop policy if exists "Users see own purchases" on public.video_purchases;
create policy "Users see own purchases" on public.video_purchases for select
  using (auth.uid() = user_id);

drop policy if exists "Service inserts purchases" on public.video_purchases;
create policy "Service inserts purchases" on public.video_purchases for insert
  with check (auth.uid() = user_id);

create index if not exists idx_video_purchases_user on public.video_purchases(user_id);
create index if not exists idx_video_purchases_video on public.video_purchases(video_id);

-- 6. AUDIO ALBUMS TABLE
create table if not exists public.audio_albums (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  artist_name text not null,
  genre text,
  description text,
  cover_url text,
  cover_public_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. AUDIOS TABLE
create table if not exists public.audios (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  album_id uuid references public.audio_albums(id) on delete set null,
  track_number int,
  title text not null,
  artist_name text not null,
  genre text,
  description text,
  audio_url text not null,
  audio_public_id text,
  cover_url text,
  cover_public_id text,
  lyrics text,
  duration_seconds numeric default 0,
  visibility text check (visibility in ('public', 'draft')) default 'public',
  status text check (status in ('published', 'draft')) default 'published',
  views_count int default 0,
  likes_count int default 0,
  dislikes_count int default 0,
  shares_count int default 0,
  created_at timestamptz default now()
);

-- 8. BLOGS TABLE
create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  slug text unique not null,
  cover_url text,
  cover_public_id text,
  body text not null,
  category text,
  tags text[] default '{}',
  status text check (status in ('draft', 'published')) default 'published',
  published_at timestamptz default now(),
  views_count int default 0,
  likes_count int default 0,
  dislikes_count int default 0,
  shares_count int default 0,
  comments_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. REACTIONS TABLE (Likes/Dislikes - exclusive per user per content item)
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content_type text not null check (content_type in ('video', 'audio', 'blog')),
  content_id uuid not null,
  reaction_type text not null check (reaction_type in ('like', 'dislike')),
  created_at timestamptz default now(),
  constraint uq_user_content_reaction unique (user_id, content_type, content_id)
);

-- 10. FAVORITES TABLE
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content_type text not null check (content_type in ('video', 'audio', 'blog')),
  content_id uuid not null,
  created_at timestamptz default now(),
  constraint uq_user_content_favorite unique (user_id, content_type, content_id)
);

-- 11. WATCHLIST TABLE
create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade,
  audio_id uuid references public.audios(id) on delete cascade,
  created_at timestamptz default now()
);

-- Migrations if watchlists table already existed:
-- alter table public.watchlists alter column video_id drop not null;
-- alter table public.watchlists add column if not exists audio_id uuid references public.audios(id) on delete cascade;
-- create unique index if not exists uq_user_watchlist_audio on public.watchlists (user_id, audio_id) where audio_id is not null;
-- create unique index if not exists uq_user_watchlist_video on public.watchlists (user_id, video_id) where video_id is not null;

-- 12. COMMENTS TABLE
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content_type text not null check (content_type in ('video', 'audio', 'blog')),
  content_id uuid not null,
  timestamp_seconds numeric,
  content text not null,
  created_at timestamptz default now()
);

-- 13. WATCH HISTORY
create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  progress_seconds numeric default 0,
  total_duration numeric default 0,
  completed boolean default false,
  last_watched_at timestamptz default now(),
  constraint uq_user_watch_video unique (user_id, video_id)
);

-- 14. VIDEO BOOSTS
create table if not exists public.video_boosts (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references public.videos(id) on delete cascade not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('active', 'expired', 'cancelled')) default 'active',
  start_date timestamptz default now(),
  end_date timestamptz not null,
  budget numeric default 0,
  priority int default 1,
  created_at timestamptz default now()
);

-- 15. ADVERTISER CAMPAIGNS
create table if not exists public.advertiser_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  media_type text check (media_type in ('image', 'video')) default 'image',
  media_url text not null,
  media_public_id text,
  target_url text not null,
  headline text not null,
  cta_label text default 'Learn More',
  status text check (status in ('active', 'paused', 'completed')) default 'active',
  impressions int default 0,
  clicks int default 0,
  start_date timestamptz default now(),
  end_date timestamptz not null,
  created_at timestamptz default now()
);

-- 16. ANALYTICS EVENTS TABLE
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  creator_id uuid references public.profiles(id) on delete set null,
  content_type text not null check (content_type in ('video', 'audio', 'blog', 'ad')),
  content_id uuid not null,
  event_type text not null check (event_type in ('view', 'watch_time', 'like', 'share', 'comment', 'click')),
  duration_seconds numeric default 0,
  created_at timestamptz default now()
);

-- 17. CREATOR EARNINGS TABLE
create table if not exists public.creator_earnings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.profiles(id) on delete cascade not null,
  content_id uuid not null,
  amount numeric not null default 0,
  currency varchar(10) default 'USD',
  source varchar(50) default 'views',
  status varchar(20) default 'pending',
  created_at timestamptz default now()
);

-- 18. INDEXES FOR PERFORMANCE
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_videos_creator on public.videos(creator_id);
create index if not exists idx_videos_series on public.videos(series_id);
create index if not exists idx_videos_visibility_status on public.videos(visibility, status);
create index if not exists idx_audios_creator on public.audios(creator_id);
create index if not exists idx_audios_album on public.audios(album_id);
create index if not exists idx_blogs_author on public.blogs(author_id);
create index if not exists idx_blogs_status on public.blogs(status);
create index if not exists idx_reactions_content on public.reactions(content_type, content_id);
create index if not exists idx_comments_content on public.comments(content_type, content_id);
create index if not exists idx_video_boosts_active on public.video_boosts(status, start_date, end_date);
create index if not exists idx_advertiser_campaigns_active on public.advertiser_campaigns(status, start_date, end_date);
create index if not exists idx_analytics_events_creator on public.analytics_events(creator_id, created_at);

-- 19. ROW LEVEL SECURITY (RLS) POLICIES

alter table public.profiles enable row level security;
alter table public.content_series enable row level security;
alter table public.videos enable row level security;
alter table public.audio_albums enable row level security;
alter table public.audios enable row level security;
alter table public.blogs enable row level security;
alter table public.reactions enable row level security;
alter table public.favorites enable row level security;
alter table public.watchlists enable row level security;
alter table public.comments enable row level security;
alter table public.watch_history enable row level security;
alter table public.video_boosts enable row level security;
alter table public.advertiser_campaigns enable row level security;
alter table public.analytics_events enable row level security;
alter table public.creator_earnings enable row level security;

-- PROFILES RLS
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- VIDEOS & SERIES RLS
drop policy if exists "Public videos are viewable by everyone" on public.videos;
create policy "Public videos are viewable by everyone" on public.videos for select
  using (status = 'published' and visibility = 'public' or auth.uid() = creator_id);

drop policy if exists "Creators can manage their videos" on public.videos;
create policy "Creators can manage their videos" on public.videos for all
  using (auth.uid() = creator_id);

drop policy if exists "Series viewable by everyone" on public.content_series;
create policy "Series viewable by everyone" on public.content_series for select using (true);

drop policy if exists "Creators manage series" on public.content_series;
create policy "Creators manage series" on public.content_series for all
  using (auth.uid() = creator_id);

-- AUDIO RLS
drop policy if exists "Public audios viewable by everyone" on public.audios;
create policy "Public audios viewable by everyone" on public.audios for select
  using (status = 'published' and visibility = 'public' or auth.uid() = creator_id);

drop policy if exists "Creators manage audios" on public.audios for all
  using (auth.uid() = creator_id);

drop policy if exists "Audio albums viewable by everyone" on public.audio_albums;
create policy "Audio albums viewable by everyone" on public.audio_albums for select using (true);

drop policy if exists "Creators manage albums" on public.audio_albums;
create policy "Creators manage albums" on public.audio_albums for all
  using (auth.uid() = creator_id);

-- BLOGS RLS
drop policy if exists "Published blogs viewable by everyone" on public.blogs;
create policy "Published blogs viewable by everyone" on public.blogs for select
  using (status = 'published' or auth.uid() = author_id);

drop policy if exists "Users can manage their own blogs" on public.blogs;
create policy "Users can manage their own blogs" on public.blogs for all
  using (auth.uid() = author_id);

-- SOCIAL INTERACTIONS RLS
drop policy if exists "Reactions viewable by all" on public.reactions;
create policy "Reactions viewable by all" on public.reactions for select using (true);

drop policy if exists "Users manage their reactions" on public.reactions;
create policy "Users manage their reactions" on public.reactions for all
  using (auth.uid() = user_id);

drop policy if exists "Favorites viewable by owner" on public.favorites;
create policy "Favorites viewable by owner" on public.favorites for all
  using (auth.uid() = user_id);

drop policy if exists "Watchlists viewable by owner" on public.watchlists;
create policy "Watchlists viewable by owner" on public.watchlists for all
  using (auth.uid() = user_id);

drop policy if exists "Comments viewable by all" on public.comments;
create policy "Comments viewable by all" on public.comments for select using (true);

drop policy if exists "Users manage their comments" on public.comments;
drop policy if exists "Users insert comments" on public.comments;
create policy "Users insert comments" on public.comments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own comments" on public.comments;
create policy "Users update own comments" on public.comments for update
  using (auth.uid() = user_id);

drop policy if exists "Users and content creators delete comments" on public.comments;
create policy "Users and content creators delete comments" on public.comments for delete
  using (
    auth.uid() = user_id
    or (content_type = 'video' and exists (select 1 from public.videos where id = comments.content_id and creator_id = auth.uid()))
    or (content_type = 'audio' and exists (select 1 from public.audios where id = comments.content_id and creator_id = auth.uid()))
    or (content_type = 'blog' and exists (select 1 from public.blogs where id = comments.content_id and author_id = auth.uid()))
  );

drop policy if exists "Watch history viewable by owner" on public.watch_history;
create policy "Watch history viewable by owner" on public.watch_history for all
  using (auth.uid() = user_id);

-- BOOSTS & CAMPAIGNS RLS
drop policy if exists "Boosts viewable by all" on public.video_boosts;
create policy "Boosts viewable by all" on public.video_boosts for select using (true);

drop policy if exists "Creators manage boosts" on public.video_boosts;
create policy "Creators manage boosts" on public.video_boosts for all
  using (auth.uid() = creator_id);

drop policy if exists "Active campaigns viewable by all" on public.advertiser_campaigns;
create policy "Active campaigns viewable by all" on public.advertiser_campaigns for select
  using (status = 'active' or auth.uid() = advertiser_id);

drop policy if exists "Advertisers manage campaigns" on public.advertiser_campaigns;
create policy "Advertisers manage campaigns" on public.advertiser_campaigns for all
  using (auth.uid() = advertiser_id);

-- ANALYTICS RLS
drop policy if exists "Anyone can record analytics events" on public.analytics_events;
create policy "Anyone can record analytics events" on public.analytics_events for insert with check (true);

drop policy if exists "Creators read own analytics" on public.analytics_events;
create policy "Creators read own analytics" on public.analytics_events for select
  using (auth.uid() = creator_id);

drop policy if exists "Creators read own earnings" on public.creator_earnings;
create policy "Creators read own earnings" on public.creator_earnings for select
  using (auth.uid() = creator_id);

-- 20. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  actor_id uuid references public.profiles(id) on delete cascade not null,
  action_type text not null check (action_type in ('like', 'dislike', 'comment', 'favorite', 'system')),
  content_type text check (content_type in ('video', 'audio', 'blog')),
  content_id uuid,
  content_title text,
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_recipient on public.notifications(recipient_id, is_read, created_at desc);
create index if not exists idx_notifications_actor on public.notifications(actor_id);

alter table public.notifications enable row level security;

drop policy if exists "Recipients can view own notifications" on public.notifications;
create policy "Recipients can view own notifications" on public.notifications for select
  using (auth.uid() = recipient_id);

drop policy if exists "Recipients can update own notifications" on public.notifications;
create policy "Recipients can update own notifications" on public.notifications for update
  using (auth.uid() = recipient_id);

drop policy if exists "Recipients can delete own notifications" on public.notifications;
create policy "Recipients can delete own notifications" on public.notifications for delete
  using (auth.uid() = recipient_id);

drop policy if exists "Authenticated users can insert notifications" on public.notifications;
create policy "Authenticated users can insert notifications" on public.notifications for insert
  with check (auth.uid() = actor_id);

-- -----------------------------------------------------------------------------
-- 13. DRAMABOX / REELSHORT MONETIZATION SYSTEM: COIN WALLET, REWARDS & UNLOCKS
-- -----------------------------------------------------------------------------

-- Add wallet and VIP columns to profiles
alter table public.profiles add column if not exists coins_balance int default 50;
alter table public.profiles add column if not exists vip_tier text check (vip_tier in ('none', 'weekly', 'monthly', 'annual')) default 'none';
alter table public.profiles add column if not exists vip_expires_at timestamptz;
alter table public.profiles add column if not exists last_check_in_date date;
alter table public.profiles add column if not exists check_in_streak int default 0;

-- Coin Transactions table
create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount int not null,
  type text check (type in ('purchase', 'reward_ad', 'daily_check_in', 'episode_unlock', 'bonus')) not null,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_coin_transactions_user on public.coin_transactions(user_id, created_at desc);
alter table public.coin_transactions enable row level security;

drop policy if exists "Users view own coin transactions" on public.coin_transactions;
create policy "Users view own coin transactions" on public.coin_transactions for select
  using (auth.uid() = user_id);

-- Episode Unlocks table
create table if not exists public.episode_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  series_id uuid references public.content_series(id) on delete cascade,
  coins_spent int default 0,
  created_at timestamptz default now(),
  constraint uq_user_video_unlock unique (user_id, video_id)
);

create index if not exists idx_episode_unlocks_user on public.episode_unlocks(user_id, video_id);
alter table public.episode_unlocks enable row level security;

drop policy if exists "Users view own episode unlocks" on public.episode_unlocks;
create policy "Users view own episode unlocks" on public.episode_unlocks for select
  using (auth.uid() = user_id);


