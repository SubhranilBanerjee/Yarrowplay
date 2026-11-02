-- =============================================================================
-- LIGHTHOUSE REELS / YARROWPLAY COMPETITION & VOTING SYSTEM MIGRATION
-- =============================================================================

-- 1. Competitions Table
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  season_number int default 1,
  prize_coins int default 50000,
  prize_cash_inr numeric default 50000,
  start_date timestamp with time zone default now(),
  end_date timestamp with time zone default (now() + interval '30 days'),
  status text default 'active' check (status in ('active', 'completed', 'upcoming')),
  winner_video_id uuid references public.videos(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Competition Entries Table
create table if not exists public.competition_entries (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  votes_count int default 0,
  created_at timestamp with time zone default now(),
  unique(competition_id, video_id)
);

-- 3. Competition Votes Table
create table if not exists public.competition_votes (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Indexes for lightning fast lookups & leaderboards
create index if not exists idx_comp_entries_comp_votes on public.competition_entries(competition_id, votes_count desc);
create index if not exists idx_comp_votes_user_comp on public.competition_votes(user_id, competition_id);
create index if not exists idx_comp_votes_video on public.competition_votes(video_id);

-- 4. Enable Row Level Security (RLS)
alter table public.competitions enable row level security;
alter table public.competition_entries enable row level security;
alter table public.competition_votes enable row level security;

-- Public read policies
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
    exists (
      select 1 from public.videos
      where videos.id = competition_entries.video_id
      and videos.creator_id = auth.uid()
    )
  );

-- Trigger to increment vote count on competition_entries
create or replace function public.handle_new_competition_vote()
returns trigger as $$
begin
  update public.competition_entries
  set votes_count = votes_count + 1
  where competition_id = new.competition_id and video_id = new.video_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_competition_vote on public.competition_votes;
create trigger on_new_competition_vote
  after insert on public.competition_votes
  for each row execute function public.handle_new_competition_vote();

-- 5. Seed default Active Season if none exists
insert into public.competitions (
  title,
  description,
  season_number,
  prize_coins,
  prize_cash_inr,
  start_date,
  end_date,
  status
)
select
  'Lighthouse Creator Championship • Season 4',
  'Vote for the most captivating vertical cinematic reel or episodic drama. Highest voted creator wins 50,000 Coins + ₹50,000 INR Cash & Verified Creator status!',
  4,
  50000,
  50000,
  now(),
  now() + interval '21 days',
  'active'
where not exists (select 1 from public.competitions where status = 'active');

