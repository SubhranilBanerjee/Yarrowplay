-- ==============================================================================
-- YARROWPLAY / LIGHTHOUSE ADMIN RLS FIX SCRIPT
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/yhtejnjrjqpzyowldhky/sql/new
-- ==============================================================================

-- 1. Enable Delete and Update on public.videos (For single delete, delete all, and status changes)
drop policy if exists "Allow delete on videos" on public.videos;
create policy "Allow delete on videos" on public.videos for delete using (true);

drop policy if exists "Allow update on videos" on public.videos;
create policy "Allow update on videos" on public.videos for update using (true);

-- 2. Enable Delete and Update on public.content_series (For delete series and delete all series)
drop policy if exists "Allow delete on content_series" on public.content_series;
create policy "Allow delete on content_series" on public.content_series for delete using (true);

drop policy if exists "Allow update on content_series" on public.content_series;
create policy "Allow update on content_series" on public.content_series for update using (true);

-- 3. Enable Cascade Purge Deletes on dependent tables
drop policy if exists "Allow delete on comments" on public.comments;
create policy "Allow delete on comments" on public.comments for delete using (true);

drop policy if exists "Allow delete on reactions" on public.reactions;
create policy "Allow delete on reactions" on public.reactions for delete using (true);

drop policy if exists "Allow delete on watch_history" on public.watch_history;
create policy "Allow delete on watch_history" on public.watch_history for delete using (true);

drop policy if exists "Allow delete on watchlists" on public.watchlists;
create policy "Allow delete on watchlists" on public.watchlists for delete using (true);

-- 4. Enable Delete and Update on public.profiles (For CRM user deletion and balance edits)
drop policy if exists "Allow delete on profiles" on public.profiles;
create policy "Allow delete on profiles" on public.profiles for delete using (true);

drop policy if exists "Allow update on profiles" on public.profiles;
create policy "Allow update on profiles" on public.profiles for update using (true);
