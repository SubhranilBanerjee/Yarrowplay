'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Play,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  MoreVertical,
  Clock,
  Film,
  X,
  Share2,
  Heart,
  Eye,
  Bookmark,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface ReelItem {
  id: string;
  title: string;
  creatorName: string;
  creatorAvatar: string;
  creatorHandle: string;
  thumbnailUrl: string;
  videoUrl?: string;
  duration: string;
  views: string;
  genre: string;
}

interface SeriesShowcaseItem {
  id: string;
  title: string;
  genre: string;
  seasons: string;
  thumbnailUrl: string;
  badge?: string;
  description?: string;
  year?: string;
}

interface CreatorShowcaseItem {
  id: string;
  name: string;
  handle: string;
  followers: string;
  avatarUrl: string;
  isFollowing?: boolean;
}

interface BlogShowcaseItem {
  id: string;
  title: string;
  date: string;
  readTime: string;
  thumbnailUrl: string;
  slug: string;
}

interface ContinueWatchingItem {
  id: string;
  title: string;
  episode: string;
  timeLeft: string;
  progressPercent: number;
  thumbnailUrl: string;
  videoId?: string;
}

// ─── Curated Base Data Matching The Reference Picture ───────────────────────────

const INITIAL_HERO_SLIDES = [
  {
    id: 'distant-shore',
    eyebrow: 'Original Series',
    title: 'The Distant Shore',
    tagline: 'Some places change you forever.',
    imageUrl: '/images/hero_distant_shore.jpg',
    genre: 'Drama',
    seriesId: 'distant-shore',
  },
  {
    id: 'city-lights',
    eyebrow: 'Original Series',
    title: 'City Lights',
    tagline: 'Two souls collide against the glow of a sleepless city.',
    imageUrl: '/images/series_city_lights.jpg',
    genre: 'Drama',
    seriesId: 'city-lights',
  },
  {
    id: 'parallel-lives',
    eyebrow: 'Original Series',
    title: 'Parallel Lives',
    tagline: 'Destiny separated by oceans and decades of silence.',
    imageUrl: '/images/series_parallel_lives.jpg',
    genre: 'Romance',
    seriesId: 'parallel-lives',
  },
  {
    id: 'midnight-drive',
    eyebrow: 'Original Series',
    title: 'Midnight Drive',
    tagline: 'When neon reflections hide dangerous secrets.',
    imageUrl: '/images/series_midnight_drive.jpg',
    genre: 'Action',
    seriesId: 'midnight-drive',
  },
  {
    id: 'island-life',
    eyebrow: 'Original Series',
    title: 'Island Life',
    tagline: 'Uncharted coasts where every sunrise tells a story.',
    imageUrl: '/images/series_island_life.jpg',
    genre: 'Travel',
    seriesId: 'island-life',
  },
];

const INITIAL_REELS: ReelItem[] = [
  {
    id: 'reel-1',
    title: 'A Day in Kolkata',
    creatorName: 'Maya Sen',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    creatorHandle: '@mayasen',
    thumbnailUrl: '/images/reel_kolkata.jpg',
    duration: '00:32',
    views: '1.2M',
    genre: 'Travel',
  },
  {
    id: 'reel-2',
    title: 'City Nights',
    creatorName: 'Arjun Malik',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    creatorHandle: '@arjunmalik',
    thumbnailUrl: '/images/reel_city_nights.jpg',
    duration: '00:48',
    views: '853K',
    genre: 'Lifestyle',
  },
  {
    id: 'reel-3',
    title: 'Hidden Shores',
    creatorName: 'TravelTales',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    creatorHandle: '@traveltales',
    thumbnailUrl: '/images/reel_hidden_shores.jpg',
    duration: '00:26',
    views: '2.1M',
    genre: 'Travel',
  },
  {
    id: 'reel-4',
    title: 'Whispers',
    creatorName: 'Ananya Verma',
    creatorAvatar: '/images/avatar_ananya.jpg',
    creatorHandle: '@ananyav',
    thumbnailUrl: '/images/reel_whispers.jpg',
    duration: '00:59',
    views: '980K',
    genre: 'Drama',
  },
  {
    id: 'reel-5',
    title: 'The Last Light',
    creatorName: 'Rohan Mehta',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    creatorHandle: '@rohanframes',
    thumbnailUrl: '/images/reel_last_light.jpg',
    duration: '00:31',
    views: '1.4M',
    genre: 'Romance',
  },
  {
    id: 'reel-6',
    title: 'Parallel Streets',
    creatorName: 'Kavya Nair',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    creatorHandle: '@kavyanair',
    thumbnailUrl: '/images/reel_parallel_streets.jpg',
    duration: '00:40',
    views: '720K',
    genre: 'Action',
  },
];

const INITIAL_SERIES: SeriesShowcaseItem[] = [
  {
    id: 'series-city-lights',
    title: 'City Lights',
    genre: 'Drama',
    seasons: '1 Season',
    badge: 'New Episode',
    thumbnailUrl: '/images/series_city_lights.jpg',
    year: '2024',
  },
  {
    id: 'series-parallel-lives',
    title: 'Parallel Lives',
    genre: 'Romance',
    seasons: '1 Season',
    thumbnailUrl: '/images/series_parallel_lives.jpg',
    year: '2024',
  },
  {
    id: 'series-midnight-drive',
    title: 'Midnight Drive',
    genre: 'Thriller',
    seasons: '1 Season',
    thumbnailUrl: '/images/series_midnight_drive.jpg',
    year: '2024',
  },
  {
    id: 'series-island-life',
    title: 'Island Life',
    genre: 'Travel',
    seasons: '1 Season',
    thumbnailUrl: '/images/series_island_life.jpg',
    year: '2024',
  },
  {
    id: 'series-the-crew',
    title: 'The Crew',
    genre: 'Comedy',
    seasons: '1 Season',
    thumbnailUrl: '/images/series_the_crew.jpg',
    year: '2024',
  },
];

const INITIAL_RECOMMENDED = [
  {
    id: 'rec-1',
    title: 'Before the Rain',
    genre: 'Drama',
    year: '2024',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'rec-2',
    title: 'The Last Train',
    genre: 'Romance',
    year: '2024',
    thumbnailUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=500&auto=format&fit=crop&q=80',
  },
  {
    id: 'rec-3',
    title: 'Neon Streets',
    genre: 'Thriller',
    year: '2024',
    thumbnailUrl: '/images/series_midnight_drive.jpg',
  },
];

const INITIAL_CREATORS: CreatorShowcaseItem[] = [
  {
    id: 'c-ananya',
    name: 'Ananya Verma',
    handle: '@ananyav',
    followers: '1.2M followers',
    avatarUrl: '/images/avatar_ananya.jpg',
    isFollowing: false,
  },
  {
    id: 'c-rohan',
    name: 'Rohan Mehta',
    handle: '@rohanframes',
    followers: '980K followers',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    isFollowing: false,
  },
  {
    id: 'c-kavya',
    name: 'Kavya Nair',
    handle: '@kavyanair',
    followers: '750K followers',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    isFollowing: false,
  },
];

const INITIAL_BLOGS: BlogShowcaseItem[] = [
  {
    id: 'b-1',
    title: '5 Tips for Creating Better Short Films',
    date: 'Mar 12, 2024',
    readTime: '6 min read',
    thumbnailUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&auto=format&fit=crop&q=80',
    slug: '5-tips-for-creating-better-short-films',
  },
  {
    id: 'b-2',
    title: 'Hidden Cafés in Coastal Towns',
    date: 'Mar 8, 2024',
    readTime: '4 min read',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=80',
    slug: 'hidden-cafes-in-coastal-towns',
  },
  {
    id: 'b-3',
    title: 'The Art of Visual Storytelling',
    date: 'Mar 1, 2024',
    readTime: '7 min read',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=500&auto=format&fit=crop&q=80',
    slug: 'the-art-of-visual-storytelling',
  },
];

const INITIAL_CONTINUE_WATCHING: ContinueWatchingItem[] = [
  {
    id: 'cw-1',
    title: 'City Lights',
    episode: 'S1 • E3',
    timeLeft: '12 min left',
    progressPercent: 62,
    thumbnailUrl: '/images/series_city_lights.jpg',
  },
  {
    id: 'cw-2',
    title: 'Parallel Lives',
    episode: 'S1 • E1',
    timeLeft: '28 min left',
    progressPercent: 35,
    thumbnailUrl: '/images/series_parallel_lives.jpg',
  },
];

const GENRE_TABS = [
  { id: 'all', label: 'All', emoji: '' },
  { id: 'drama', label: 'Drama', emoji: '🎭' },
  { id: 'romance', label: 'Romance', emoji: '❤️' },
  { id: 'action', label: 'Action', emoji: '⚡' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'lifestyle', label: 'Lifestyle', emoji: '☕' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'comedy', label: 'Comedy', emoji: '😄' },
  { id: 'documentary', label: 'Documentary', emoji: '📄' },
];

export function LighthouseHomeView() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  // State
  const [activeGenre, setActiveGenre] = useState('all');
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroSlides, setHeroSlides] = useState(INITIAL_HERO_SLIDES);
  const [reels, setReels] = useState<ReelItem[]>(INITIAL_REELS);
  const [seriesList, setSeriesList] = useState<SeriesShowcaseItem[]>(INITIAL_SERIES);
  const [recommended, setRecommended] = useState(INITIAL_RECOMMENDED);
  const [creators, setCreators] = useState<CreatorShowcaseItem[]>(INITIAL_CREATORS);
  const [blogs, setBlogs] = useState<BlogShowcaseItem[]>(INITIAL_BLOGS);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>(INITIAL_CONTINUE_WATCHING);
  const [myListIds, setMyListIds] = useState<Set<string>>(new Set());
  const [activeVideoModal, setActiveVideoModal] = useState<ReelItem | null>(null);

  // ─── Live Dynamic Data Fetching from Supabase ─────────────────────────────
  useEffect(() => {
    async function loadDynamicData() {
      try {
        const [
          { data: dbVideos },
          { data: dbSeries },
          { data: dbBlogs },
          { data: dbProfiles },
          { data: dbWatchHistory },
        ] = await Promise.all([
          supabase
            .from('videos')
            .select('*, creator:profiles(*)')
            .eq('status', 'published')
            .order('views_count', { ascending: false })
            .limit(20),
          supabase
            .from('content_series')
            .select('*, creator:profiles(*), episodes:videos(*)')
            .order('created_at', { ascending: false })
            .limit(15),
          supabase
            .from('blogs')
            .select('*, author:profiles(*)')
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(10),
          supabase
            .from('profiles')
            .select('*')
            .eq('role', 'creator')
            .limit(10),
          user
            ? supabase
                .from('watch_history')
                .select('*, video:videos(*)')
                .eq('user_id', user.id)
                .order('last_watched_at', { ascending: false })
                .limit(5)
            : Promise.resolve({ data: null }),
        ]);

        // Merge real Supabase videos into Reels if available
        if (dbVideos && dbVideos.length > 0) {
          const mappedDbReels: ReelItem[] = dbVideos.map((v: any) => ({
            id: v.id,
            title: v.title || 'Untitled Reel',
            creatorName: v.creator?.display_name || v.creator?.username || 'Creator',
            creatorAvatar:
              v.creator?.avatar_url ||
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            creatorHandle: v.creator?.username ? `@${v.creator.username}` : '@creator',
            thumbnailUrl: v.thumbnail_url || '/images/reel_kolkata.jpg',
            videoUrl: v.video_url,
            duration: v.duration_seconds
              ? `00:${String(Math.min(59, v.duration_seconds)).padStart(2, '0')}`
              : '00:30',
            views: v.views_count
              ? v.views_count >= 1000000
                ? `${(v.views_count / 1000000).toFixed(1)}M`
                : v.views_count >= 1000
                ? `${(v.views_count / 1000).toFixed(0)}K`
                : `${v.views_count}`
              : '1.2M',
            genre: v.category || v.genre || 'Drama',
          }));

          // Merge without losing original 6 showcase items
          const existingIds = new Set(INITIAL_REELS.map((r) => r.id));
          const uniqueDb = mappedDbReels.filter((r) => !existingIds.has(r.id));
          setReels([...INITIAL_REELS, ...uniqueDb]);
        }

        // Merge real Supabase series if available
        if (dbSeries && dbSeries.length > 0) {
          const mappedDbSeries: SeriesShowcaseItem[] = dbSeries.map((s: any) => ({
            id: s.id,
            title: s.title || 'Original Series',
            genre: s.category || 'Drama',
            seasons: `${s.total_episodes || (s.episodes ? s.episodes.length : 1)} Episode${
              (s.total_episodes || (s.episodes ? s.episodes.length : 1)) > 1 ? 's' : ''
            }`,
            thumbnailUrl: s.cover_url || '/images/series_city_lights.jpg',
            badge: s.total_episodes ? 'Popular' : undefined,
            year: new Date(s.created_at || Date.now()).getFullYear().toString(),
          }));

          const existingSeriesTitles = new Set(INITIAL_SERIES.map((s) => s.title.toLowerCase()));
          const newSeries = mappedDbSeries.filter(
            (s) => !existingSeriesTitles.has(s.title.toLowerCase())
          );
          setSeriesList([...INITIAL_SERIES, ...newSeries]);
        }

        // Merge real Supabase blogs if available
        if (dbBlogs && dbBlogs.length > 0) {
          const mappedBlogs: BlogShowcaseItem[] = dbBlogs.map((b: any) => ({
            id: b.id,
            title: b.title,
            date: new Date(b.published_at || b.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            readTime: '5 min read',
            thumbnailUrl: b.cover_url || INITIAL_BLOGS[0].thumbnailUrl,
            slug: b.slug || b.id,
          }));
          setBlogs([...mappedBlogs, ...INITIAL_BLOGS.slice(mappedBlogs.length)]);
        }

        // Merge real Supabase creators
        if (dbProfiles && dbProfiles.length > 0) {
          const mappedCreators: CreatorShowcaseItem[] = dbProfiles.map((p: any) => ({
            id: p.id,
            name: p.display_name || p.username || 'Creator',
            handle: p.username ? `@${p.username}` : `@${p.id.slice(0, 6)}`,
            followers: `${Math.floor(Math.random() * 500 + 500)}K followers`,
            avatarUrl:
              p.avatar_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            isFollowing: false,
          }));

          const existingHandles = new Set(INITIAL_CREATORS.map((c) => c.handle));
          const uniqueCreators = mappedCreators.filter((c) => !existingHandles.has(c.handle));
          if (uniqueCreators.length > 0) {
            setCreators([...INITIAL_CREATORS.slice(0, 2), uniqueCreators[0]]);
          }
        }

        // Live watch history
        if (dbWatchHistory && dbWatchHistory.length > 0) {
          const mappedHistory: ContinueWatchingItem[] = dbWatchHistory.map((h: any) => {
            const v = h.video || {};
            const total = h.total_duration || 600;
            const progress = h.progress_seconds || 0;
            const percent = Math.min(100, Math.round((progress / total) * 100));
            const minLeft = Math.max(1, Math.round((total - progress) / 60));

            return {
              id: h.id,
              title: v.title || 'Continue Watching',
              episode: v.episode_number ? `S1 • E${v.episode_number}` : 'S1 • E1',
              timeLeft: `${minLeft} min left`,
              progressPercent: percent || 40,
              thumbnailUrl: v.thumbnail_url || '/images/series_city_lights.jpg',
              videoId: v.id,
            };
          });
          setContinueWatching([...mappedHistory, ...INITIAL_CONTINUE_WATCHING].slice(0, 2));
        }
      } catch (err) {
        console.error('Error loading dynamic homepage data:', err);
      }
    }

    loadDynamicData();
  }, [user]);

  // Load user's watchlist
  useEffect(() => {
    async function loadWatchlist() {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('watchlist')
          .select('video_id')
          .eq('user_id', user.id);
        if (data) {
          setMyListIds(new Set(data.map((d: any) => d.video_id).filter(Boolean)));
        }
      } catch {}
    }
    loadWatchlist();
  }, [user]);

  // Handlers
  const handleToggleMyList = async (id: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    const newSet = new Set(myListIds);
    if (newSet.has(id)) {
      newSet.delete(id);
      setMyListIds(newSet);
      try {
        await supabase.from('watchlist').delete().match({ user_id: user.id, video_id: id });
      } catch {}
    } else {
      newSet.add(id);
      setMyListIds(newSet);
      try {
        await supabase.from('watchlist').insert({ user_id: user.id, video_id: id });
      } catch {}
    }
  };

  const handleToggleFollow = async (creatorId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    setCreators((prev) =>
      prev.map((c) => (c.id === creatorId ? { ...c, isFollowing: !c.isFollowing } : c))
    );
  };

  const nextHero = () => {
    setHeroIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const prevHero = () => {
    setHeroIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Filter content based on active tab
  const filteredReels =
    activeGenre === 'all'
      ? reels
      : reels.filter(
          (r) => r.genre.toLowerCase() === activeGenre || activeGenre.includes(r.genre.toLowerCase())
        );

  const filteredSeries =
    activeGenre === 'all'
      ? seriesList
      : seriesList.filter(
          (s) => s.genre.toLowerCase() === activeGenre || activeGenre.includes(s.genre.toLowerCase())
        );

  const currentHero = heroSlides[heroIndex] || heroSlides[0];

  return (
    <div className="w-full min-h-screen bg-[#090D12] text-[#F5F1E8] px-4 md:px-6 lg:px-7 py-5">
      <div className="w-full flex flex-col xl:flex-row gap-6 lg:gap-7 items-start">
        {/* ─── Main Feed (Center Section) ─────────────────────────────────── */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* 1. Hero Carousel Banner */}
          <div className="relative w-full rounded-2xl overflow-hidden bg-[#11171E] border border-[#1E2732] shadow-2xl h-[340px] sm:h-[400px] md:h-[450px] lg:h-[480px] group select-none">
            {/* Background Image with smooth transitions */}
            <div className="absolute inset-0">
              <Image
                src={currentHero.imageUrl}
                alt={currentHero.title}
                fill
                priority
                className="object-cover object-center transition-all duration-700 ease-out group-hover:scale-105"
              />
              {/* Cinematic Vignette Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#090D12] via-[#090D12]/45 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#090D12]/95 via-[#090D12]/50 to-transparent w-full md:w-3/4" />
            </div>

            {/* Left Chevron Button */}
            <button
              type="button"
              onClick={prevHero}
              aria-label="Previous slide"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/45 hover:bg-black/80 backdrop-blur-sm border border-white/10 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Chevron Button */}
            <button
              type="button"
              onClick={nextHero}
              aria-label="Next slide"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/45 hover:bg-black/80 backdrop-blur-sm border border-white/10 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Hero Content Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 sm:p-8 md:p-10 max-w-2xl">
              {/* Eyebrow */}
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#ECC979] mb-1.5 uppercase font-sans">
                {currentHero.eyebrow}
              </span>

              {/* Title in Elegant Serif Font matching screenshot */}
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal tracking-tight text-[#F5F1E8] leading-[1.08] drop-shadow-sm">
                {currentHero.title}
              </h1>

              {/* Tagline */}
              <p className="text-xs sm:text-sm md:text-[15px] text-[#C6D2DC] font-normal mt-2.5 max-w-lg leading-relaxed drop-shadow">
                {currentHero.tagline}
              </p>

              {/* Call to Actions */}
              <div className="flex items-center gap-3 mt-5 sm:mt-6">
                <button
                  type="button"
                  onClick={() => router.push(`/explore?type=series`)}
                  className="flex items-center gap-2 bg-[#ECC979] hover:bg-[#F4C95D] active:scale-95 text-[#101418] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-lg shadow-black/40 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-[#101418]" />
                  <span>Watch Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleMyList(currentHero.id)}
                  className="flex items-center gap-2 bg-[#121820]/75 hover:bg-[#16202C] active:scale-95 backdrop-blur-md border border-white/20 hover:border-white/40 text-[#F5F1E8] font-medium text-xs sm:text-sm px-5 py-2.5 rounded-full transition-all cursor-pointer"
                >
                  {myListIds.has(currentHero.id) ? (
                    <>
                      <Check className="w-4 h-4 text-[#ECC979]" />
                      <span>Added to List</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>My List</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Pagination Dots at Bottom matching picture */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setHeroIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    heroIndex === idx
                      ? 'w-5 h-1.5 bg-[#F5F1E8]'
                      : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 2. Genre / Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {GENRE_TABS.map((tab) => {
              const isActive = activeGenre === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveGenre(tab.id)}
                  className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#ECC979] text-[#101418] shadow-sm font-bold'
                      : 'bg-[#121820] hover:bg-[#18212B] border border-[#212A34] text-[#A6B2BE] hover:text-[#F5F1E8]'
                  }`}
                >
                  {tab.emoji && <span className="text-xs">{tab.emoji}</span>}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3. Trending Reels Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Link
                href="/explore?type=shorts"
                className="group flex items-center gap-1.5 text-base sm:text-lg font-bold text-[#F5F1E8] hover:text-[#ECC979] transition-colors"
              >
                <span>Trending Reels</span>
                <ChevronRight className="w-4 h-4 text-[#8C98A5] group-hover:text-[#ECC979] transition-colors" />
              </Link>
              <Link
                href="/explore?type=shorts"
                className="text-xs text-[#8C98A5] hover:text-[#ECC979] flex items-center gap-1 font-medium transition-colors"
              >
                <span>See All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 6 Vertical Reel Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
              {filteredReels.slice(0, 6).map((reel) => (
                <div
                  key={reel.id}
                  onClick={() => setActiveVideoModal(reel)}
                  className="group flex flex-col cursor-pointer"
                >
                  {/* Portrait Thumbnail Container (9:16 aspect ratio) */}
                  <div className="relative aspect-[9/15] w-full rounded-xl overflow-hidden bg-[#11171E] border border-[#1E2732] group-hover:border-[#ECC979]/50 transition-all shadow-md">
                    <Image
                      src={reel.thumbnailUrl}
                      alt={reel.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay for bottom text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />

                    {/* Top Right Duration Badge matching screenshot */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <span className="bg-black/60 backdrop-blur-sm text-[10px] text-[#F5F1E8] px-2 py-0.5 rounded-md font-mono font-medium">
                        {reel.duration}
                      </span>
                    </div>

                    {/* Bottom Overlay: Views count + Three Dots */}
                    <div className="absolute bottom-2 left-2.5 right-2.5 z-10 flex items-center justify-between text-white/95">
                      <div className="flex items-center gap-1 text-[11px] font-semibold drop-shadow">
                        <Play className="w-3 h-3 fill-current" />
                        <span>{reel.views}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="text-white/80 hover:text-white p-0.5 transition-colors"
                        aria-label="More options"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Below Thumbnail Info */}
                  <div className="mt-2 min-w-0">
                    <h3 className="text-xs sm:text-[13px] font-semibold text-[#F5F1E8] truncate group-hover:text-[#ECC979] transition-colors leading-tight">
                      {reel.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 bg-[#1D252E]">
                        <Image
                          src={reel.creatorAvatar}
                          alt={reel.creatorName}
                          fill
                          sizes="16px"
                          className="object-cover"
                        />
                      </div>
                      <span className="text-[11px] text-[#86929F] truncate">
                        {reel.creatorName}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Popular Series Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Link
                href="/explore?type=series"
                className="group flex items-center gap-1.5 text-base sm:text-lg font-bold text-[#F5F1E8] hover:text-[#ECC979] transition-colors"
              >
                <span>Popular Series</span>
                <ChevronRight className="w-4 h-4 text-[#8C98A5] group-hover:text-[#ECC979] transition-colors" />
              </Link>
              <Link
                href="/explore?type=series"
                className="text-xs text-[#8C98A5] hover:text-[#ECC979] flex items-center gap-1 font-medium transition-colors"
              >
                <span>See All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 5 Landscape Series Cards Grid (16:9) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {filteredSeries.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/explore?type=series`}
                  className="group flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#11171E] border border-[#1E2732] group-hover:border-[#ECC979]/50 transition-all shadow-md">
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* New Episode Badge matching picture */}
                    {item.badge && (
                      <div className="absolute bottom-2.5 right-2.5 z-10">
                        <span className="bg-[#ECC979] text-[#101418] text-[9px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                          {item.badge}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Below Card Info */}
                  <div className="mt-2 min-w-0">
                    <h3 className="text-xs sm:text-[13px] font-bold text-[#F5F1E8] truncate group-hover:text-[#ECC979] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#86929F] mt-0.5 truncate">
                      {item.genre} • {item.seasons}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Right Rail (Sidebar Column) ─────────────────────────────────── */}
        <div className="w-full xl:w-[285px] 2xl:w-[305px] shrink-0 space-y-6 pt-1 xl:pt-0">
          {/* Section 1: Continue Watching */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#F5F1E8]">Continue Watching</span>
              <Link
                href="/history"
                className="text-xs text-[#8C98A5] hover:text-[#ECC979] flex items-center gap-1 font-medium transition-colors"
              >
                <span>See All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {continueWatching.map((item) => (
                <Link
                  key={item.id}
                  href="/history"
                  className="flex items-center gap-3 p-1.5 rounded-xl bg-[#11171E] hover:bg-[#151D26] border border-[#1E2732] hover:border-[#2C3846] transition-all group"
                >
                  {/* Thumbnail with Play Icon & Progress Bar */}
                  <div className="relative w-24 h-14 rounded-lg overflow-hidden shrink-0 bg-[#151D26]">
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      fill
                      sizes="96px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white">
                        <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                      </div>
                    </div>
                    {/* Bottom Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                      <div
                        className="h-full bg-[#ECC979]"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="text-xs font-bold text-[#F5F1E8] truncate group-hover:text-[#ECC979] transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-[#86929F] mt-1">
                      <span>{item.episode}</span>
                      <span>{item.timeLeft}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Section 2: Recommended for You */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#F5F1E8]">Recommended for You</span>
            </div>

            <div className="space-y-2.5">
              {recommended.map((item) => (
                <Link
                  key={item.id}
                  href="/explore?type=series"
                  className="flex items-center gap-3 p-1.5 rounded-xl bg-[#11171E] hover:bg-[#151D26] border border-[#1E2732] hover:border-[#2C3846] transition-all group"
                >
                  <div className="relative w-20 h-13 rounded-lg overflow-hidden shrink-0 bg-[#151D26]">
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="text-xs font-bold text-[#F5F1E8] truncate group-hover:text-[#ECC979] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#86929F] mt-0.5">
                      {item.genre} • {item.year}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Section 3: Top Creators */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#F5F1E8]">Top Creators</span>
              <Link
                href="/explore?type=creators"
                className="text-xs text-[#8C98A5] hover:text-[#ECC979] flex items-center gap-1 font-medium transition-colors"
              >
                <span>See All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {creators.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-[#11171E] border border-[#1E2732]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-[#1D252E]">
                      <Image
                        src={c.avatarUrl}
                        alt={c.name}
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#F5F1E8] truncate leading-tight">
                        {c.name}
                      </h4>
                      <p className="text-[10px] text-[#86929F] truncate mt-0.5">
                        {c.handle}
                      </p>
                      <p className="text-[10px] text-[#717E8C] truncate">
                        {c.followers}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFollow(c.id)}
                    className={`shrink-0 text-[11px] font-semibold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                      c.isFollowing
                        ? 'bg-[#ECC979] text-[#101418] font-bold'
                        : 'border border-[#323D49] hover:border-[#ECC979] text-[#F5F1E8] hover:text-[#ECC979]'
                    }`}
                  >
                    {c.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Latest Blogs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#F5F1E8]">Latest Blogs</span>
              <Link
                href="/blogs"
                className="text-xs text-[#8C98A5] hover:text-[#ECC979] flex items-center gap-1 font-medium transition-colors"
              >
                <span>See All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {blogs.map((b) => (
                <Link
                  key={b.id}
                  href={`/blogs/${b.slug}`}
                  className="flex items-center gap-3 p-1.5 rounded-xl bg-[#11171E] hover:bg-[#151D26] border border-[#1E2732] hover:border-[#2C3846] transition-all group"
                >
                  <div className="relative w-16 h-13 rounded-lg overflow-hidden shrink-0 bg-[#151D26]">
                    <Image
                      src={b.thumbnailUrl}
                      alt={b.title}
                      fill
                      sizes="64px"
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="text-xs font-semibold text-[#F5F1E8] line-clamp-2 group-hover:text-[#ECC979] transition-colors leading-snug">
                      {b.title}
                    </h4>
                    <p className="text-[10px] text-[#86929F] mt-1">
                      {b.date} • {b.readTime}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Interactive Video Reel Modal ─────────────────────────────────── */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="relative w-full max-w-sm sm:max-w-md bg-[#11171E] border border-[#232D38] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setActiveVideoModal(null)}
              className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Video Preview Canvas */}
            <div className="relative aspect-[9/15] w-full bg-black overflow-hidden">
              <Image
                src={activeVideoModal.thumbnailUrl}
                alt={activeVideoModal.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

              {/* Center Play Button */}
              <Link
                href={`/explore?type=shorts`}
                className="absolute inset-0 flex items-center justify-center group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-[#ECC979] group-hover:scale-110 text-[#101418] flex items-center justify-center shadow-2xl transition-transform">
                  <Play className="w-7 h-7 fill-current ml-1" />
                </div>
              </Link>

              {/* Bottom Info in Modal */}
              <div className="absolute bottom-4 left-4 right-4 z-20">
                <span className="text-[10px] font-bold text-[#ECC979] uppercase tracking-wider">
                  {activeVideoModal.genre} Reel
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {activeVideoModal.title}
                </h3>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-xs text-white/80">
                  <div className="flex items-center gap-2">
                    <div className="relative w-5 h-5 rounded-full overflow-hidden">
                      <Image
                        src={activeVideoModal.creatorAvatar}
                        alt={activeVideoModal.creatorName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span>{activeVideoModal.creatorName}</span>
                  </div>
                  <span className="text-white/60 font-mono">{activeVideoModal.duration}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
