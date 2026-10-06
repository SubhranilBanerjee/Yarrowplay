-- Fix for Google OAuth user registration: allow users to insert their own profile and sync metadata
-- Run this in your Supabase SQL Editor if you experience RLS permission errors on profile insertion:

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Ensure handle_new_user trigger extracts full_name correctly from Google metadata
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
  raw_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'display_name',
    split_part(new.email, '@', 1)
  );
  raw_company := new.raw_user_meta_data->>'company_name';
  raw_sub_role := new.raw_user_meta_data->>'sub_role';
  generated_username := lower(regexp_replace(raw_name, '[^a-zA-Z0-9]', '', 'g')) || '_' || substr(new.id::text, 1, 6);

  insert into public.profiles (id, email, username, display_name, role, sub_role, company_name, avatar_url)
  values (
    new.id,
    new.email,
    generated_username,
    raw_name,
    raw_role,
    raw_sub_role,
    raw_company,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(profiles.display_name, excluded.display_name),
    avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url),
    role = coalesce(profiles.role, excluded.role),
    sub_role = coalesce(profiles.sub_role, excluded.sub_role),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;
