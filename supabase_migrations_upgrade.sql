-- =============================================================================
-- Yarrowplay Major Upgrade Migration: Video Player, Subtitles, Nested Comments,
-- Watch History, Follow Creators, Creator Studio & Retention Analytics
-- =============================================================================

-- 1. SUBTITLE TRACKS TABLE
create table if not exists public.subtitle_tracks (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references public.videos(id) on delete cascade not null,
  language text not null,               -- e.g. 'en', 'es', 'hi', 'bn', 'fr'
  label text not null,                  -- e.g. 'English', 'Spanish', 'Hindi'
  source_url text not null,             -- WebVTT or SRT file URL
  format text not null default 'vtt',   -- 'vtt' or 'srt'
  default_track boolean default false,
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_subtitle_tracks_video on public.subtitle_tracks(video_id);
create index if not exists idx_subtitle_tracks_enabled on public.subtitle_tracks(video_id, enabled);

alter table public.subtitle_tracks enable row level security;

-- Everyone can view enabled subtitles for published videos
drop policy if exists "Public subtitle tracks are viewable by everyone" on public.subtitle_tracks;
create policy "Public subtitle tracks are viewable by everyone" on public.subtitle_tracks for select
  using (
    enabled = true and exists (
      select 1 from public.videos 
      where id = subtitle_tracks.video_id 
        and (status = 'published' and visibility = 'public' or creator_id = auth.uid())
    )
  );

-- Video creators can view and manage all subtitles for their videos
drop policy if exists "Creators can manage subtitles for their videos" on public.subtitle_tracks;
create policy "Creators can manage subtitles for their videos" on public.subtitle_tracks for all
  using (
    exists (
      select 1 from public.videos 
      where id = subtitle_tracks.video_id and creator_id = auth.uid()
    )
  );


-- 2. NESTED COMMENTS UPGRADE
-- Add parent_id for self-referential threading, moderation and reaction counters
alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete cascade;
alter table public.comments add column if not exists likes_count int default 0;
alter table public.comments add column if not exists dislikes_count int default 0;
alter table public.comments add column if not exists is_edited boolean default false;
alter table public.comments add column if not exists is_deleted boolean default false;
alter table public.comments add column if not exists updated_at timestamptz default now();

create index if not exists idx_comments_parent on public.comments(parent_id);
create index if not exists idx_comments_content_parent on public.comments(content_type, content_id, parent_id);

-- COMMENT REACTIONS TABLE
create table if not exists public.comment_reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  comment_id uuid references public.comments(id) on delete cascade not null,
  reaction_type text not null check (reaction_type in ('like', 'dislike')),
  created_at timestamptz default now(),
  constraint uq_user_comment_reaction unique (user_id, comment_id)
);

create index if not exists idx_comment_reactions_comment on public.comment_reactions(comment_id);
create index if not exists idx_comment_reactions_user on public.comment_reactions(user_id);

alter table public.comment_reactions enable row level security;

drop policy if exists "Comment reactions viewable by all" on public.comment_reactions;
create policy "Comment reactions viewable by all" on public.comment_reactions for select using (true);

drop policy if exists "Users manage their comment reactions" on public.comment_reactions;
create policy "Users manage their comment reactions" on public.comment_reactions for all
  using (auth.uid() = user_id);

-- COMMENT REPORTS TABLE
create table if not exists public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  comment_id uuid references public.comments(id) on delete cascade not null,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz default now()
);

create index if not exists idx_comment_reports_comment on public.comment_reports(comment_id);
alter table public.comment_reports enable row level security;

drop policy if exists "Users can submit comment reports" on public.comment_reports;
create policy "Users can submit comment reports" on public.comment_reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Reporters can view own reports" on public.comment_reports;
create policy "Reporters can view own reports" on public.comment_reports for select
  using (auth.uid() = reporter_id);


-- 3. WATCH HISTORY & CONTINUE WATCHING ENHANCEMENTS
-- Ensure proper indexes exist on watch_history
create index if not exists idx_watch_history_user_last_watched on public.watch_history(user_id, last_watched_at desc);
create index if not exists idx_watch_history_user_completed on public.watch_history(user_id, completed);


-- 4. CREATOR FOLLOWS TABLE
create table if not exists public.creator_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid references public.profiles(id) on delete cascade not null,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  constraint uq_follower_creator unique (follower_id, creator_id),
  constraint chk_no_self_follow check (follower_id <> creator_id)
);

create index if not exists idx_creator_follows_creator on public.creator_follows(creator_id);
create index if not exists idx_creator_follows_follower on public.creator_follows(follower_id);

alter table public.creator_follows enable row level security;

drop policy if exists "Follows are viewable by everyone" on public.creator_follows;
create policy "Follows are viewable by everyone" on public.creator_follows for select using (true);

drop policy if exists "Users can follow creators" on public.creator_follows;
create policy "Users can follow creators" on public.creator_follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow creators" on public.creator_follows;
create policy "Users can unfollow creators" on public.creator_follows for delete
  using (auth.uid() = follower_id);


-- 5. HELPER ATOMIC RPC FUNCTIONS (View increment & Reaction counters)
create or replace function public.increment_video_views(vid_id uuid)
returns void as $$
begin
  update public.videos
  set views_count = coalesce(views_count, 0) + 1
  where id = vid_id;
end;
$$ language plpgsql security definer;

create or replace function public.toggle_comment_like(target_comment_id uuid, target_user_id uuid)
returns json as $$
declare
  existing_reaction text;
  new_reaction text := null;
  cur_likes int;
  cur_dislikes int;
begin
  select reaction_type into existing_reaction
  from public.comment_reactions
  where comment_id = target_comment_id and user_id = target_user_id;

  if existing_reaction = 'like' then
    delete from public.comment_reactions
    where comment_id = target_comment_id and user_id = target_user_id;
    new_reaction := null;
  elsif existing_reaction = 'dislike' then
    update public.comment_reactions
    set reaction_type = 'like', created_at = now()
    where comment_id = target_comment_id and user_id = target_user_id;
    new_reaction := 'like';
  else
    insert into public.comment_reactions (user_id, comment_id, reaction_type)
    values (target_user_id, target_comment_id, 'like');
    new_reaction := 'like';
  end if;

  -- Recompute likes/dislikes
  select count(*) filter (where reaction_type = 'like'),
         count(*) filter (where reaction_type = 'dislike')
  into cur_likes, cur_dislikes
  from public.comment_reactions
  where comment_id = target_comment_id;

  update public.comments
  set likes_count = cur_likes,
      dislikes_count = cur_dislikes
  where id = target_comment_id;

  return json_build_object(
    'userReaction', new_reaction,
    'likesCount', cur_likes,
    'dislikesCount', cur_dislikes
  );
end;
$$ language plpgsql security definer;
