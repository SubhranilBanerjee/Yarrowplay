-- =============================================================================
-- LIGHTHOUSE REELS / YARROWPLAY COMPETITION & VOTING SYSTEM MIGRATION
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yhtejnjrjqpzyowldhky/sql/new
-- =============================================================================

-- 1. Competition Themes Table
create table if not exists public.competition_themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  badge_emoji text default '🎬',
  tagline text,
  description text,
  banner_gradient text default 'from-[#2A0845] via-[#1B053A] to-[#0A0216]',
  rules jsonb default '[]'::jsonb,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- 2. Competitions Table
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  theme_id uuid references public.competition_themes(id) on delete set null,
  season_number int default 1,
  title text not null,
  description text,
  prize_cash_inr numeric default 50000,
  prize_coins int default 50000,
  duration_days int default 14,
  start_date timestamp with time zone default now(),
  end_date timestamp with time zone default (now() + interval '14 days'),
  status text default 'active' check (status in ('active', 'completed', 'upcoming')),
  theme_name text,
  theme_category text,
  theme_badge_emoji text,
  theme_gradient text,
  theme_description text,
  theme_rules jsonb default '[]'::jsonb,
  winner_video_id uuid references public.videos(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Competition Entries Table (Strictly explicit submissions only)
create table if not exists public.competition_entries (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  creator_id uuid references public.profiles(id) on delete cascade,
  votes_count int default 0,
  status text default 'approved' check (status in ('approved', 'pending', 'rejected')),
  created_at timestamp with time zone default now(),
  unique(competition_id, video_id)
);

-- 4. Competition Votes Table (Database-backed voting records)
create table if not exists public.competition_votes (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(competition_id, video_id, user_id)
);

-- Indexes for lightning fast lookups & leaderboards
create index if not exists idx_comp_entries_comp_votes on public.competition_entries(competition_id, votes_count desc);
create index if not exists idx_comp_votes_user_comp on public.competition_votes(user_id, competition_id);
create index if not exists idx_comp_votes_video on public.competition_votes(video_id);
create index if not exists idx_competitions_status on public.competitions(status);

-- 5. Enable Row Level Security (RLS)
alter table public.competition_themes enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_entries enable row level security;
alter table public.competition_votes enable row level security;

-- Public read policies
drop policy if exists "Competition themes are readable by all" on public.competition_themes;
create policy "Competition themes are readable by all" on public.competition_themes for select using (true);

drop policy if exists "Competitions are readable by all" on public.competitions;
create policy "Competitions are readable by all" on public.competitions for select using (true);

drop policy if exists "Competition entries are readable by all" on public.competition_entries;
create policy "Competition entries are readable by all" on public.competition_entries for select using (true);

drop policy if exists "Votes are readable by all" on public.competition_votes;
create policy "Votes are readable by all" on public.competition_votes for select using (true);

-- Insert policies
drop policy if exists "Authenticated users can vote" on public.competition_votes;
create policy "Authenticated users can vote" on public.competition_votes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Creators can enter their videos" on public.competition_entries;
create policy "Creators can enter their videos" on public.competition_entries
  for insert with check (
    auth.uid() = creator_id or
    exists (
      select 1 from public.videos
      where videos.id = competition_entries.video_id
      and videos.creator_id = auth.uid()
    )
  );

drop policy if exists "Admins can manage themes" on public.competition_themes;
create policy "Admins can manage themes" on public.competition_themes
  for all using (true) with check (true);

drop policy if exists "Admins can manage competitions" on public.competitions;
create policy "Admins can manage competitions" on public.competitions
  for all using (true) with check (true);

drop policy if exists "Admins can manage competition entries" on public.competition_entries;
create policy "Admins can manage competition entries" on public.competition_entries
  for all using (true) with check (true);

-- Trigger to increment vote count on competition_entries and videos
create or replace function public.handle_new_competition_vote()
returns trigger as $$
begin
  update public.competition_entries
  set votes_count = votes_count + 1
  where competition_id = new.competition_id and video_id = new.video_id;

  update public.videos
  set likes_count = coalesce(likes_count, 0) + 1
  where id = new.video_id;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_competition_vote on public.competition_votes;
create trigger on_new_competition_vote
  after insert on public.competition_votes
  for each row execute function public.handle_new_competition_vote();
