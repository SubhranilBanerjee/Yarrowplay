-- =============================================================================
-- LIGHTHOUSE REELS - SEED DYNAMIC CONTENT MIGRATION SCRIPT
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- It populates real dynamic series and episodes into `content_series` and `videos`
-- =============================================================================

DO $$
DECLARE
  v_creator_id uuid;
  v_series1_id uuid := '11111111-1111-1111-1111-111111111111';
  v_series2_id uuid := '22222222-2222-2222-2222-222222222222';
  v_series3_id uuid := '33333333-3333-3333-3333-333333333333';
  v_series4_id uuid := '44444444-4444-4444-4444-444444444444';
BEGIN
  -- 1. Identify or fallback to existing creator profile
  SELECT id INTO v_creator_id FROM public.profiles WHERE role IN ('creator', 'admin') LIMIT 1;
  IF v_creator_id IS NULL THEN
    SELECT id INTO v_creator_id FROM public.profiles LIMIT 1;
  END IF;

  IF v_creator_id IS NULL THEN
    RAISE NOTICE 'No profile found. Please register at least one user before running this seed script.';
    RETURN;
  END IF;

  -- 2. INSERT SERIES 1: Whispers in the Dark (Drama)
  INSERT INTO public.content_series (
    id, creator_id, title, description, category, tags, cover_url, total_episodes, created_at, updated_at
  ) VALUES (
    v_series1_id,
    v_creator_id,
    'Whispers in the Dark',
    'In a high-stakes metropolis governed by shadow syndicates, an ambitious investigative journalist stumbles into a classified corporate conspiracy. With every layer she uncovers, the boundaries between ally and adversary blur, forcing her to choose between survival and the truth.',
    'Drama',
    ARRAY['Mystery', 'High Stakes', 'Noir', 'Conspiracy', 'Original'],
    '/images/reel_whispers.jpg',
    6,
    now() - interval '4 days',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    cover_url = EXCLUDED.cover_url,
    total_episodes = EXCLUDED.total_episodes;

  -- 3. INSERT SERIES 2: Kolkata Mon Amour (Romance)
  INSERT INTO public.content_series (
    id, creator_id, title, description, category, tags, cover_url, total_episodes, created_at, updated_at
  ) VALUES (
    v_series2_id,
    v_creator_id,
    'Kolkata Mon Amour',
    'Set against the vintage yellow cabs and neon trams of misty Kolkata, two strangers with conflicting dreams cross paths during an autumn monsoon. A story of fleeting encounters, soulful melodies, and timeless destiny.',
    'Romance',
    ARRAY['Romance', 'Heartfelt', 'City of Joy', 'Destiny', 'Poetry'],
    '/images/reel_kolkata.jpg',
    6,
    now() - interval '3 days',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    cover_url = EXCLUDED.cover_url,
    total_episodes = EXCLUDED.total_episodes;

  -- 4. INSERT SERIES 3: The Route 9 Mystery (Thriller)
  INSERT INTO public.content_series (
    id, creator_id, title, description, category, tags, cover_url, total_episodes, created_at, updated_at
  ) VALUES (
    v_series3_id,
    v_creator_id,
    'The Route 9 Mystery',
    'Every midnight, an abandoned highway outside the city transmits an untraceable radio signal. When a lone driver investigates a phantom vehicle broken down at mile marker 44, a pulse-pounding game of cat-and-mouse begins.',
    'Thriller',
    ARRAY['Suspense', 'Midnight', 'Highway', 'Psychological', 'Adrenaline'],
    '/images/series_midnight_drive.jpg',
    6,
    now() - interval '2 days',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    cover_url = EXCLUDED.cover_url,
    total_episodes = EXCLUDED.total_episodes;

  -- 5. INSERT SERIES 4: Parallel Streets (Action)
  INSERT INTO public.content_series (
    id, creator_id, title, description, category, tags, cover_url, total_episodes, created_at, updated_at
  ) VALUES (
    v_series4_id,
    v_creator_id,
    'Parallel Streets',
    'An elite underground racing crew uncovers an illegal surveillance grid embedded in the city streetlights. With high-octane chases, ruthless enforcers, and neon drift showdowns, they fight to reclaim the asphalt.',
    'Action',
    ARRAY['Action', 'Street Racing', 'Velocity', 'Heist', 'Neon Drifts'],
    '/images/reel_parallel_streets.jpg',
    6,
    now() - interval '1 day',
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    cover_url = EXCLUDED.cover_url,
    total_episodes = EXCLUDED.total_episodes;

  -- 6. INSERT EPISODES FOR SERIES 1 (Whispers in the Dark)
  INSERT INTO public.videos (
    id, creator_id, series_id, episode_number, title, description, category, video_url, thumbnail_url,
    duration_seconds, visibility, status, views_count, likes_count, is_locked, price_inr, created_at
  ) VALUES
  (
    'a1111111-1111-1111-1111-111111111111', v_creator_id, v_series1_id, 1,
    'Pilot: Midnight Cipher', 'An encrypted flash drive arrives at the newsdesk bearing signatures thought to have disappeared years ago.',
    'Drama', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    '/images/reel_whispers.jpg', 84, 'public', 'published', 14200, 1820, false, 0, now() - interval '4 days'
  ),
  (
    'a1111111-1111-1111-1111-111111111112', v_creator_id, v_series1_id, 2,
    'Chapter 2: The Red Herring', 'Following an unlisted frequency leads directly to an abandoned textile warehouse.',
    'Drama', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    '/images/hero_distant_shore.jpg', 130, 'public', 'published', 11300, 1420, false, 0, now() - interval '4 days'
  ),
  (
    'a1111111-1111-1111-1111-111111111113', v_creator_id, v_series1_id, 3,
    'Chapter 3: Classified Ledger', 'A secret boardroom recording exposes the syndicate mastermind.',
    'Drama', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    '/images/reel_whispers.jpg', 105, 'public', 'published', 9800, 1150, false, 0, now() - interval '3 days'
  ),
  (
    'a1111111-1111-1111-1111-111111111114', v_creator_id, v_series1_id, 4,
    'Chapter 4: The Informant Trap', 'Trusting the wrong insider puts both operatives in severe jeopardy.',
    'Drama', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    '/images/hero_distant_shore.jpg', 95, 'public', 'published', 8400, 980, false, 0, now() - interval '3 days'
  ),
  (
    'a1111111-1111-1111-1111-111111111115', v_creator_id, v_series1_id, 5,
    'Chapter 5: Blackout Hour', 'The city electrical grid goes dark just as the proof is ready for broadcast.',
    'Drama', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    '/images/reel_whispers.jpg', 110, 'public', 'published', 7200, 890, false, 0, now() - interval '2 days'
  ),
  (
    'a1111111-1111-1111-1111-111111111116', v_creator_id, v_series1_id, 6,
    'Finale: Daylight Exposure', 'The climactic rooftop confrontation where the ultimate truth is broadcast live.',
    'Drama', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    '/images/hero_distant_shore.jpg', 140, 'public', 'published', 6100, 780, true, 10, now() - interval '2 days'
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    video_url = EXCLUDED.video_url,
    thumbnail_url = EXCLUDED.thumbnail_url,
    duration_seconds = EXCLUDED.duration_seconds,
    status = EXCLUDED.status;

  -- 7. INSERT EPISODES FOR SERIES 2 (Kolkata Mon Amour)
  INSERT INTO public.videos (
    id, creator_id, series_id, episode_number, title, description, category, video_url, thumbnail_url,
    duration_seconds, visibility, status, views_count, likes_count, is_locked, price_inr, created_at
  ) VALUES
  (
    'b2222222-2222-2222-2222-222222222221', v_creator_id, v_series2_id, 1,
    'Episode 1: Monsoon Melody', 'A sudden downpour under the Victoria Memorial brings two strangers under one shared umbrella.',
    'Romance', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    '/images/reel_kolkata.jpg', 118, 'public', 'published', 28000, 3100, false, 0, now() - interval '3 days'
  ),
  (
    'b2222222-2222-2222-2222-222222222222', v_creator_id, v_series2_id, 2,
    'Episode 2: The Tram Ride', 'Conversations on Tram Route 25 reveal unshared artistic aspirations.',
    'Romance', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    '/images/series_parallel_lives.jpg', 125, 'public', 'published', 22000, 2400, false, 0, now() - interval '3 days'
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    video_url = EXCLUDED.video_url,
    thumbnail_url = EXCLUDED.thumbnail_url,
    duration_seconds = EXCLUDED.duration_seconds,
    status = EXCLUDED.status;

  -- 8. INSERT EPISODES FOR SERIES 3 (The Route 9 Mystery)
  INSERT INTO public.videos (
    id, creator_id, series_id, episode_number, title, description, category, video_url, thumbnail_url,
    duration_seconds, visibility, status, views_count, likes_count, is_locked, price_inr, created_at
  ) VALUES
  (
    'c3333333-3333-3333-3333-333333333331', v_creator_id, v_series3_id, 1,
    'Part 1: Mile Marker 44', 'Driving into the fog after midnight, the car radio catches static that speaks his name.',
    'Thriller', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    '/images/series_midnight_drive.jpg', 105, 'public', 'published', 18400, 2100, false, 0, now() - interval '2 days'
  ),
  (
    'c3333333-3333-3333-3333-333333333332', v_creator_id, v_series3_id, 2,
    'Part 2: The Phantom Sedan', 'Taillights ahead flicker and vanish as the road loops back on itself.',
    'Thriller', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    '/images/reel_city_nights.jpg', 98, 'public', 'published', 15200, 1800, false, 0, now() - interval '2 days'
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    video_url = EXCLUDED.video_url,
    thumbnail_url = EXCLUDED.thumbnail_url,
    duration_seconds = EXCLUDED.duration_seconds,
    status = EXCLUDED.status;

  -- 9. INSERT EPISODES FOR SERIES 4 (Parallel Streets)
  INSERT INTO public.videos (
    id, creator_id, series_id, episode_number, title, description, category, video_url, thumbnail_url,
    duration_seconds, visibility, status, views_count, likes_count, is_locked, price_inr, created_at
  ) VALUES
  (
    'd4444444-4444-4444-4444-444444444441', v_creator_id, v_series4_id, 1,
    'Ignition 01: High RPM', 'A midnight sprint down the coastal expressway reveals modified enforcer drones overhead.',
    'Action', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    '/images/reel_parallel_streets.jpg', 90, 'public', 'published', 19800, 2500, false, 0, now() - interval '1 day'
  ),
  (
    'd4444444-4444-4444-4444-444444444442', v_creator_id, v_series4_id, 2,
    'Ignition 02: Neon Drifts', 'Outrunning interception teams through the subterranean shipping docks.',
    'Action', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    '/images/series_the_crew.jpg', 110, 'public', 'published', 16700, 2100, false, 0, now() - interval '1 day'
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    video_url = EXCLUDED.video_url,
    thumbnail_url = EXCLUDED.thumbnail_url,
    duration_seconds = EXCLUDED.duration_seconds,
    status = EXCLUDED.status;

  RAISE NOTICE 'Dynamic series and episodes successfully seeded for creator %', v_creator_id;
END $$;

