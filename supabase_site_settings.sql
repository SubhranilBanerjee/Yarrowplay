-- Migration: Create site_settings table for dynamic site text & CMS
-- Run this in Supabase SQL Editor if you want database persistence across all client sessions

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to site_settings (for visitors to see live copy)
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Allow authenticated users / service role full write access
DROP POLICY IF EXISTS "Admin write site_settings" ON public.site_settings;
CREATE POLICY "Admin write site_settings"
  ON public.site_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);
