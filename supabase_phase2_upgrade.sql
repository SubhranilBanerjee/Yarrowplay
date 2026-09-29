-- =============================================================================
-- Lighthouse Reels Comprehensive Phase Upgrade Migration
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- =============================================================================

-- 1. ADD 'is_must_see' TO CONTENT TABLES
alter table public.content_series add column if not exists is_must_see boolean default false;
alter table public.videos add column if not exists is_must_see boolean default false;
alter table public.blogs add column if not exists is_must_see boolean default false;

create index if not exists idx_content_series_must_see on public.content_series(is_must_see) where is_must_see = true;
create index if not exists idx_videos_must_see on public.videos(is_must_see) where is_must_see = true;
create index if not exists idx_blogs_must_see on public.blogs(is_must_see) where is_must_see = true;

-- 2. ADD USER PREFERENCES & CRM FIELDS TO PROFILES
alter table public.profiles add column if not exists pause_watch_history boolean default false;
alter table public.profiles add column if not exists is_suspended boolean default false;
alter table public.profiles add column if not exists last_active_at timestamptz default now();

-- 3. ENHANCE WATCHLISTS TO SUPPORT SERIES
alter table public.watchlists add column if not exists series_id uuid references public.content_series(id) on delete cascade;
create index if not exists idx_watchlists_series on public.watchlists(user_id, series_id) where series_id is not null;

-- Ensure unique watchlist entry per user per series/video/audio
create unique index if not exists uq_user_watchlist_series on public.watchlists (user_id, series_id) where series_id is not null;
create unique index if not exists uq_user_watchlist_video on public.watchlists (user_id, video_id) where video_id is not null;

-- 4. SEARCH HISTORY TABLE
create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  query text not null,
  created_at timestamptz default now()
);

create index if not exists idx_search_history_user on public.search_history(user_id, created_at desc);

alter table public.search_history enable row level security;

drop policy if exists "Users view own search history" on public.search_history;
create policy "Users view own search history" on public.search_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own search history" on public.search_history;
create policy "Users insert own search history" on public.search_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own search history" on public.search_history;
create policy "Users delete own search history" on public.search_history for delete
  using (auth.uid() = user_id);

-- 5. ADMIN POLICIES FOR MUST SEE MANAGEMENT
-- Admins can update is_must_see on content_series, videos, blogs
drop policy if exists "Admins can update series must_see" on public.content_series;
create policy "Admins can update series must_see" on public.content_series for update
  using (
    auth.uid() = creator_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and (role = 'admin' or email = current_setting('request.jwt.claim.email', true))
    )
  );

-- 6. RPC HELPER: INCREMENT VIEW SAFELY
create or replace function public.record_content_view(p_video_id uuid, p_user_id uuid default null)
returns void as $$
begin
  update public.videos
  set views_count = coalesce(views_count, 0) + 1
  where id = p_video_id;

  -- Record event in analytics_events
  insert into public.analytics_events (user_id, content_type, content_id, event_type)
  values (p_user_id, 'video', p_video_id, 'view');
end;
$$ language plpgsql security definer;
