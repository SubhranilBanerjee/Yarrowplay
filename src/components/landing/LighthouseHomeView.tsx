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
  X,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toggleWatchlist } from '@/lib/watchlist';

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface HeroSlide {
  id: string;
  eyebrow: string;
  title: string;
  tagline: string;
  imageUrl: string;
  genre: string;
  seriesId?: string;
  firstEpisodeId?: string;
}

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
  firstEpisodeId?: string;
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

interface RecommendedItem {
  id: string;
  title: string;
  genre: string;
  year: string;
  thumbnailUrl: string;
  href?: string;
}

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

  // State - only real dynamic content from Supabase
  const [isLoading, setIsLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState('all');
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [seriesList, setSeriesList] = useState<SeriesShowcaseItem[]>([]);
  const [recommended, setRecommended] = useState<RecommendedItem[]>([]);
  const [creators, setCreators] = useState<CreatorShowcaseItem[]>([]);
  const [blogs, setBlogs] = useState<BlogShowcaseItem[]>([]);
  const [mustSeeItems, setMustSeeItems] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);
  const [myListIds, setMyListIds] = useState<Set<string>>(new Set());
  const [activeVideoModal, setActiveVideoModal] = useState<ReelItem | null>(null);

  // ─── Live Dynamic Data Fetching from Supabase ─────────────────────────────
  useEffect(() => {
    async function loadDynamicData() {
      setIsLoading(true);
      try {
        const [
          { data: dbVideos },
          { data: dbSeries },
          { data: dbBlogs },
          { data: dbProfiles },
          { data: dbFollows },
          { data: dbWatchHistory },
          { data: dbMustSeeSeries },
          { data: dbMustSeeVideos },
        ] = await Promise.all([
          supabase
            .from('videos')
            .select('*, creator:profiles(*)')
            .eq('status', 'published')
            .order('views_count', { ascending: false })
            .limit(24),
          supabase
            .from('content_series')
            .select('*, creator:profiles(*), episodes:videos(id, episode_number, thumbnail_url, duration_seconds, views_count)')
            .order('created_at', { ascending: false })
            .limit(15),
          supabase
            .from('blogs')
            .select('*, author:profiles(*)')
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(6),
          supabase
            .from('profiles')
            .select('*')
            .eq('role', 'creator')
            .limit(10),
          supabase
            .from('creator_follows')
            .select('creator_id, follower_id'),
          user
            ? supabase
                .from('watch_history')
                .select('*, video:videos(*)')
                .eq('user_id', user.id)
                .order('last_watched_at', { ascending: false })
                .limit(5)
            : Promise.resolve({ data: null }),
          supabase
            .from('content_series')
            .select('*, creator:profiles(*), episodes:videos(id, episode_number, thumbnail_url, duration_seconds, views_count)')
            .eq('is_must_see', true)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('videos')
            .select('*, creator:profiles(*)')
            .eq('is_must_see', true)
            .eq('status', 'published')
            .order('views_count', { ascending: false })
            .limit(10),
        ]);

        // 1. Dynamic Hero Slides
        if (dbSeries && dbSeries.length > 0) {
          const dynamicHero: HeroSlide[] = dbSeries
            .filter((s: any) => s.cover_url || (s.episodes && s.episodes.length > 0))
            .slice(0, 5)
            .map((s: any) => {
              const firstEp =
                s.episodes?.find((e: any) => e.episode_number === 1) || s.episodes?.[0];
              return {
                id: s.id,
                eyebrow: 'Original Series',
                title: s.title || 'Original Series',
                tagline:
                  s.description ||
                  `Experience the best of ${s.category || 'drama'} on Yarrowplay.`,
                imageUrl:
                  s.cover_url ||
                  firstEp?.thumbnail_url ||
                  '/images/series_city_lights.jpg',
                genre: s.category || 'Drama',
                seriesId: s.id,
                firstEpisodeId: firstEp?.id || s.id,
              };
            });

          setHeroSlides(dynamicHero);
        } else {
          setHeroSlides([]);
        }

        // 2. Dynamic Trending Reels
        if (dbVideos && dbVideos.length > 0) {
          const mappedDbReels: ReelItem[] = dbVideos.map((v: any) => {
            const durSec = v.duration_seconds || 0;
            const minStr = Math.floor(durSec / 60).toString().padStart(2, '0');
            const secStr = (durSec % 60).toString().padStart(2, '0');
            const durationDisplay = durSec > 0 ? `${minStr}:${secStr}` : '00:30';

            const vc = v.views_count || 0;
            const viewsDisplay =
              vc >= 1000000
                ? `${(vc / 1000000).toFixed(1)}M`
                : vc >= 1000
                ? `${(vc / 1000).toFixed(0)}K`
                : `${vc}`;

            return {
              id: v.id,
              title: v.title || 'Untitled Reel',
              creatorName: v.creator?.display_name || v.creator?.username || 'Creator',
              creatorAvatar: v.creator?.avatar_url || '',
              creatorHandle: v.creator?.username ? `@${v.creator.username}` : '@creator',
              thumbnailUrl: v.thumbnail_url || '/images/reel_kolkata.jpg',
              videoUrl: v.video_url,
              duration: durationDisplay,
              views: viewsDisplay,
              genre: v.category || v.genre || 'Drama',
            };
          });

          setReels(mappedDbReels);
        } else {
          setReels([]);
        }

        // 3. Dynamic Popular Series
        if (dbSeries && dbSeries.length > 0) {
          const mappedDbSeries: SeriesShowcaseItem[] = dbSeries.map((s: any) => {
            const epCount = s.episodes?.length || s.total_episodes || 1;
            const firstEp =
              s.episodes?.find((e: any) => e.episode_number === 1) || s.episodes?.[0];
            return {
              id: s.id,
              title: s.title || 'Original Series',
              genre: s.category || 'Drama',
              seasons: `${epCount} Episode${epCount > 1 ? 's' : ''}`,
              thumbnailUrl:
                s.cover_url ||
                firstEp?.thumbnail_url ||
                '/images/series_city_lights.jpg',
              badge: epCount > 1 ? `${epCount} Episodes` : 'Popular',
              year: new Date(s.created_at || Date.now()).getFullYear().toString(),
              firstEpisodeId: firstEp?.id || s.id,
            };
          });

          setSeriesList(mappedDbSeries);
        } else {
          setSeriesList([]);
        }

        // 4. Dynamic Recommended Content
        const mappedRec: RecommendedItem[] = [];
        if (dbSeries && dbSeries.length > 0) {
          const seriesRec = dbSeries
            .filter((s: any) => s.cover_url || (s.episodes && s.episodes.length > 0))
            .slice(0, 4)
            .map((s: any) => {
              const firstEp = s.episodes?.[0];
              return {
                id: s.id,
                title: s.title || 'Recommended',
                genre: s.category || 'Drama',
                year: new Date(s.created_at || Date.now()).getFullYear().toString(),
                thumbnailUrl:
                  s.cover_url ||
                  firstEp?.thumbnail_url ||
                  '/images/series_midnight_drive.jpg',
                href: `/videos/${firstEp?.id || s.id}`,
              };
            });
          mappedRec.push(...seriesRec);
        }
        if (mappedRec.length < 3 && dbVideos && dbVideos.length > 0) {
          const existingIds = new Set(mappedRec.map((r) => r.id));
          const addl = dbVideos
            .filter((v: any) => !existingIds.has(v.id))
            .slice(0, 3 - mappedRec.length)
            .map((v: any) => ({
              id: v.id,
              title: v.title || 'Featured Video',
              genre: v.category || v.genre || 'Drama',
              year: new Date(v.created_at || Date.now()).getFullYear().toString(),
              thumbnailUrl: v.thumbnail_url || '/images/series_midnight_drive.jpg',
              href: `/videos/${v.id}`,
            }));
          mappedRec.push(...addl);
        }
        setRecommended(mappedRec);

        // 5. Dynamic Creators from profiles
        if (dbProfiles && dbProfiles.length > 0) {
          const mappedCreators: CreatorShowcaseItem[] = dbProfiles.map((p: any) => {
            const followCount = (dbFollows || []).filter(
              (f: any) => f.creator_id === p.id
            ).length;
            const isUserFollowing = user
              ? (dbFollows || []).some(
                  (f: any) => f.creator_id === p.id && f.follower_id === user.id
                )
              : false;

            return {
              id: p.id,
              name: p.display_name || p.username || 'Creator',
              handle: p.username ? `@${p.username}` : `@${p.id.slice(0, 6)}`,
              followers: `${followCount} follower${followCount === 1 ? '' : 's'}`,
              avatarUrl: p.avatar_url || '',
              isFollowing: isUserFollowing,
            };
          });

          setCreators(mappedCreators);
        } else {
          setCreators([]);
        }

        // 6. Dynamic Blogs
        if (dbBlogs && dbBlogs.length > 0) {
          const mappedBlogs: BlogShowcaseItem[] = dbBlogs.map((b: any) => ({
            id: b.id,
            title: b.title,
            date: new Date(b.published_at || b.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            readTime: `${Math.max(1, Math.ceil((b.body?.length || 500) / 500))} min read`,
            thumbnailUrl: b.cover_url || '/images/series_city_lights.jpg',
            slug: b.slug || b.id,
          }));
          setBlogs(mappedBlogs);
        } else {
          setBlogs([]);
        }

        // 7. Dynamic Watch History
        if (dbWatchHistory && dbWatchHistory.length > 0) {
          const mappedHistory: ContinueWatchingItem[] = dbWatchHistory
            .filter((h: any) => h.video)
            .map((h: any) => {
              const v = h.video || {};
              const total = h.total_duration || v.duration_seconds || 600;
              const progress = h.progress_seconds || 0;
              const percent = Math.min(100, Math.round((progress / total) * 100));
              const minLeft = Math.max(1, Math.round((total - progress) / 60));

              return {
                id: h.id,
                title: v.title || 'Untitled Video',
                episode: v.episode_number ? `S1 • E${v.episode_number}` : 'Episode 1',
                timeLeft: `${minLeft} min left`,
                progressPercent: percent || 10,
                thumbnailUrl: v.thumbnail_url || '/images/series_city_lights.jpg',
                videoId: v.id,
              };
            });
          setContinueWatching(mappedHistory);
        } else {
          setContinueWatching([]);
        }

        // 8. Dynamic Must-See Content (Admin controlled)
        const mappedMustSee: any[] = [];
        if (dbMustSeeSeries && dbMustSeeSeries.length > 0) {
          dbMustSeeSeries.forEach((s: any) => {
            const epCount = s.episodes?.length || s.total_episodes || 1;
            const firstEp =
              s.episodes?.find((e: any) => e.episode_number === 1) || s.episodes?.[0];
            mappedMustSee.push({
              id: s.id,
              type: 'series' as const,
              title: s.title || 'Original Series',
              genre: s.category || 'Drama',
              thumbnailUrl:
                s.cover_url || firstEp?.thumbnail_url || '/images/series_city_lights.jpg',
              badge: 'Must See Series',
              href: `/videos/${firstEp?.id || s.id}`,
              description: s.description || 'Critically acclaimed lighthouse original series.',
              episodesCount: epCount,
            });
          });
        }
        if (dbMustSeeVideos && dbMustSeeVideos.length > 0) {
          dbMustSeeVideos.forEach((v: any) => {
            mappedMustSee.push({
              id: v.id,
              type: 'video' as const,
              title: v.title || 'Must-See Video',
              genre: v.category || v.genre || 'Drama',
              thumbnailUrl: v.thumbnail_url || '/images/reel_kolkata.jpg',
              badge: 'Must See',
              href: `/videos/${v.id}`,
              description: v.description || 'Editor-picked must-see reel.',
              duration: v.duration_seconds ? `${Math.floor(v.duration_seconds / 60)}m` : 'Reel',
            });
          });
        }
        setMustSeeItems(mappedMustSee);
      } catch (err) {
        console.error('Error loading dynamic homepage data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDynamicData();
  }, [user]);

  // Load user's watchlist across series and videos
  useEffect(() => {
    async function loadWatchlist() {
      if (!user) return;
      try {
        const res = await fetch('/api/watchlist');
        if (res.ok) {
          const json = await res.json();
          const nextSet = new Set<string>();
          (json.series || []).forEach((s: any) => nextSet.add(s.id));
          (json.videos || []).forEach((v: any) => nextSet.add(v.id));
          (json.audios || []).forEach((a: any) => nextSet.add(a.id));
          setMyListIds(nextSet);
        }
      } catch (err) {
        console.error('Failed to load watchlist:', err);
      }
    }
    loadWatchlist();
  }, [user]);

  // Handlers
  const handleToggleMyList = async (id: string, type: 'series' | 'video' = 'series') => {
    if (!user) {
      router.push('/login');
      return;
    }
    const isCurrentlyIn = myListIds.has(id);
    const newSet = new Set(myListIds);
    if (isCurrentlyIn) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setMyListIds(newSet);

    try {
      const isNowIn = await toggleWatchlist(type, id);
      setMyListIds((prev) => {
        const updated = new Set(prev);
        if (isNowIn) {
          updated.add(id);
        } else {
          updated.delete(id);
        }
        return updated;
      });
    } catch (err) {
      console.error('Error toggling watchlist:', err);
      // Revert on error
      setMyListIds(myListIds);
    }
  };

  const handleToggleFollow = async (creatorId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Optimistic toggle
    setCreators((prev) =>
      prev.map((c) => {
        if (c.id === creatorId) {
          const nextFollowing = !c.isFollowing;
          const currentCountMatch = c.followers.match(/\d+/);
          const currentCount = currentCountMatch ? parseInt(currentCountMatch[0], 10) : 0;
          const newCount = nextFollowing ? currentCount + 1 : Math.max(0, currentCount - 1);
          return {
            ...c,
            isFollowing: nextFollowing,
            followers: `${newCount} follower${newCount === 1 ? '' : 's'}`,
          };
        }
        return c;
      })
    );

    try {
      const res = await fetch('/api/creators/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: creatorId }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreators((prev) =>
          prev.map((c) =>
            c.id === creatorId
              ? {
                  ...c,
                  isFollowing: data.isFollowing,
                  followers: `${data.followersCount} follower${data.followersCount === 1 ? '' : 's'}`,
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const nextHero = () => {
    if (heroSlides.length === 0) return;
    setHeroIndex((prev) => (prev + 1) % heroSlides.length);
  };

  const prevHero = () => {
    if (heroSlides.length === 0) return;
    setHeroIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Filter dynamic content based on active genre tab
  const filteredReels =
    activeGenre === 'all'
      ? reels
      : reels.filter((r) => {
          const g = r.genre.toLowerCase();
          const target = activeGenre.toLowerCase();
          return g === target || g.includes(target) || target.includes(g);
        });

  const filteredSeries =
    activeGenre === 'all'
      ? seriesList
      : seriesList.filter((s) => {
          const g = s.genre.toLowerCase();
          const target = activeGenre.toLowerCase();
          return g === target || g.includes(target) || target.includes(g);
        });

  const currentHero = heroSlides[heroIndex] || heroSlides[0];

  return (
    <div className="w-full min-h-screen bg-[#090D12] text-[#F5F1E8] px-3 sm:px-4 md:px-6 lg:px-7 py-4 sm:py-5 pb-24 md:pb-12">
      <div className="w-full flex flex-col xl:flex-row gap-5 lg:gap-7 items-start">
        {/* ─── Main Feed (Center Section) ─────────────────────────────────── */}
        <div className="flex-1 min-w-0 w-full space-y-5 sm:space-y-6">
          {/* 1. Hero Carousel Banner */}
          {isLoading && heroSlides.length === 0 ? (
            <div className="relative w-full rounded-2xl overflow-hidden bg-[#11171E] border border-[#1E2732] h-[280px] xs:h-[320px] sm:h-[380px] md:h-[430px] lg:h-[480px] animate-pulse flex flex-col justify-end p-4 xs:p-5 sm:p-7 md:p-10">
              <div className="w-24 h-3 bg-white/10 rounded mb-2" />
              <div className="w-64 h-8 bg-white/10 rounded mb-3" />
              <div className="w-96 max-w-full h-4 bg-white/10 rounded mb-5" />
              <div className="flex gap-3">
                <div className="w-28 h-9 bg-white/10 rounded-full" />
                <div className="w-28 h-9 bg-white/10 rounded-full" />
              </div>
            </div>
          ) : currentHero ? (
            <div className="relative w-full rounded-2xl overflow-hidden bg-[#11171E] border border-[#1E2732] shadow-2xl h-[280px] xs:h-[320px] sm:h-[380px] md:h-[430px] lg:h-[480px] group select-none">
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#090D12] via-[#090D12]/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#090D12]/95 via-[#090D12]/60 to-transparent w-full sm:w-4/5 md:w-3/4" />
              </div>

              {/* Left Chevron Button */}
              {heroSlides.length > 1 && (
                <button
                  type="button"
                  onClick={prevHero}
                  aria-label="Previous slide"
                  className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/45 hover:bg-black/80 backdrop-blur-sm border border-white/10 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Right Chevron Button */}
              {heroSlides.length > 1 && (
                <button
                  type="button"
                  onClick={nextHero}
                  aria-label="Next slide"
                  className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/45 hover:bg-black/80 backdrop-blur-sm border border-white/10 text-white/90 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Hero Content Overlay */}
              <div className="absolute inset-0 z-10 flex flex-col justify-end p-4 xs:p-5 sm:p-7 md:p-10 max-w-xl md:max-w-2xl">
                {/* Eyebrow */}
                <span className="text-[11px] sm:text-xs md:text-sm font-semibold tracking-wide text-[#ECC979] mb-1 uppercase font-sans">
                  {currentHero.eyebrow}
                </span>

                {/* Title in Elegant Serif Font */}
                <h1 className="font-serif text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal tracking-tight text-[#F5F1E8] leading-[1.08] drop-shadow-sm line-clamp-2 sm:line-clamp-none">
                  {currentHero.title}
                </h1>

                {/* Tagline */}
                <p className="text-xs sm:text-sm md:text-[15px] text-[#C6D2DC] font-normal mt-1.5 sm:mt-2.5 max-w-lg leading-relaxed drop-shadow line-clamp-2">
                  {currentHero.tagline}
                </p>

                {/* Call to Actions */}
                <div className="flex items-center gap-2.5 sm:gap-3 mt-4 sm:mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentHero.firstEpisodeId) {
                        router.push(`/videos/${currentHero.firstEpisodeId}`);
                      } else {
                        router.push('/search?type=series');
                      }
                    }}
                    className="btn-primary flex items-center gap-1.5 sm:gap-2 text-white font-bold text-xs sm:text-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-lg transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white" />
                    <span>Watch Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleMyList(currentHero.id)}
                    className="btn-secondary flex items-center gap-1.5 sm:gap-2 text-white font-medium text-xs sm:text-sm px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-full transition-all cursor-pointer"
                  >
                    {myListIds.has(currentHero.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#A855F7]" />
                        <span>Added to List</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                        <span>My List</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Pagination Dots at Bottom */}
              {heroSlides.length > 1 && (
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
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
              )}
            </div>
          ) : null}

          {/* 2. Genre / Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth">
            {GENRE_TABS.map((tab) => {
              const isActive = activeGenre === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveGenre(tab.id)}
                  className={`shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? 'btn-primary text-white font-bold shadow-md'
                      : 'bg-[#121820] hover:bg-[#18212B] border border-[#212A34] text-[#A6B2BE] hover:text-[#F5F1E8]'
                  }`}
                >
                  {tab.emoji && <span className="text-xs">{tab.emoji}</span>}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3. Must See Section (Admin Controlled) */}
          {mustSeeItems.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-[#ECC979]/20 text-[#ECC979]">
                    <Sparkles className="w-3.5 h-3.5 fill-[#ECC979]" />
                  </div>
                  <h2 className="text-sm sm:text-base md:text-lg font-bold text-[#F5F1E8]">
                    Must See
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#ECC979] bg-[#ECC979]/10 border border-[#ECC979]/30 px-2 py-0.5 rounded-full">
                    Admin Picks
                  </span>
                </div>
              </div>

              {/* Responsive grid for Must See */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {mustSeeItems.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="group relative flex flex-col rounded-xl overflow-hidden bg-[#11171E] border border-[#ECC979]/40 hover:border-[#ECC979] transition-all p-3 shadow-md hover:shadow-[#ECC979]/5"
                  >
                    <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-[#16202C]">
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-2 left-2 z-10">
                        <span className="bg-[#ECC979] text-[#101418] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded shadow">
                          ★ Must See
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2 z-10">
                        <span className="bg-black/70 backdrop-blur-sm text-[#F5F1E8] text-[10px] font-medium px-2 py-0.5 rounded">
                          {item.type === 'series' ? `${item.episodesCount} Episodes` : item.duration}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-[#F5F1E8] group-hover:text-[#ECC979] transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-[#86929F] mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5">
                        <span className="text-[10px] text-[#ECC979] font-semibold">{item.genre}</span>
                        <div className="flex items-center gap-1 text-[11px] text-[#F5F1E8] group-hover:text-[#ECC979] font-medium">
                          <span>Watch</span>
                          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 4. Trending Reels Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Link
                href="/search?type=shorts"
                className="group flex items-center gap-1.5 text-sm sm:text-base md:text-lg font-bold text-[#F5F1E8] hover:text-[#ECC979] transition-colors"
              >
                <span>Trending Reels</span>
                <ChevronRight className="w-4 h-4 text-[#8C98A5] group-hover:text-[#ECC979] transition-colors" />
              </Link>
              <Link
                href="/search?type=shorts"
                className="text-xs text-[#8C98A5] hover:text-[#ECC979] flex items-center gap-1 font-medium transition-colors"
              >
                <span>See All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Dynamic Reel Cards Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col animate-pulse">
                    <div className="aspect-[9/15] w-full rounded-xl bg-[#11171E] border border-[#1E2732]" />
                    <div className="w-3/4 h-3 bg-white/10 rounded mt-2" />
                    <div className="w-1/2 h-2.5 bg-white/10 rounded mt-1.5" />
                  </div>
                ))}
              </div>
            ) : filteredReels.length === 0 ? (
              <div className="py-8 px-4 rounded-xl bg-[#11171E] border border-[#1E2732] text-center">
                <p className="text-xs text-[#86929F]">No reels available in this category yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
                {filteredReels.slice(0, 6).map((reel) => (
                  <div
                    key={reel.id}
                    onClick={() => setActiveVideoModal(reel)}
                    className="group flex flex-col cursor-pointer"
                  >
                    <div className="relative aspect-[9/15] w-full rounded-xl overflow-hidden bg-[#11171E] border border-[#1E2732] group-hover:border-[#ECC979]/50 transition-all shadow-md">
                      <Image
                        src={reel.thumbnailUrl}
                        alt={reel.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />

                      {/* Top Right Duration Badge */}
                      <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10">
                        <span className="bg-black/60 backdrop-blur-sm text-[9px] sm:text-[10px] text-[#F5F1E8] px-1.5 sm:px-2 py-0.5 rounded-md font-mono font-medium">
                          {reel.duration}
                        </span>
                      </div>

                      {/* Bottom Overlay: Views count + Three Dots */}
                      <div className="absolute bottom-2 left-2 right-2 sm:left-2.5 sm:right-2.5 z-10 flex items-center justify-between text-white/95">
                        <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold drop-shadow">
                          <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
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

                    <div className="mt-2 min-w-0">
                      <h3 className="text-xs sm:text-[13px] font-semibold text-[#F5F1E8] truncate group-hover:text-[#ECC979] transition-colors leading-tight">
                        {reel.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 bg-[#1D252E] flex items-center justify-center">
                          {reel.creatorAvatar ? (
                            <Image
                              src={reel.creatorAvatar}
                              alt={reel.creatorName}
                              fill
                              sizes="16px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-[8px] font-bold text-[#ECC979]">
                              {reel.creatorName?.[0]?.toUpperCase() || 'C'}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-[#86929F] truncate">
                          {reel.creatorName}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Popular Series Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Link
                href="/search?type=series"
                className="group flex items-center gap-1.5 text-sm sm:text-base md:text-lg font-bold text-[#F5F1E8] hover:text-[#ECC979] transition-colors"
              >
                <span>Popular Series</span>
                <ChevronRight className="w-4 h-4 text-[#8C98A5] group-hover:text-[#ECC979] transition-colors" />
              </Link>
              <Link
                href="/search?type=series"
                className="text-xs text-[#8C98A5] hover:text-[#ECC979] flex items-center gap-1 font-medium transition-colors"
              >
                <span>See All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Dynamic Landscape Series Cards Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex flex-col animate-pulse">
                    <div className="aspect-[16/9] w-full rounded-xl bg-[#11171E] border border-[#1E2732]" />
                    <div className="w-3/4 h-3 bg-white/10 rounded mt-2" />
                    <div className="w-1/2 h-2.5 bg-white/10 rounded mt-1" />
                  </div>
                ))}
              </div>
            ) : filteredSeries.length === 0 ? (
              <div className="py-8 px-4 rounded-xl bg-[#11171E] border border-[#1E2732] text-center">
                <p className="text-xs text-[#86929F]">No series available in this category yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
                {filteredSeries.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={item.firstEpisodeId ? `/videos/${item.firstEpisodeId}` : `/search?type=series`}
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

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                      {item.badge && (
                        <div className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 z-10">
                          <span className="bg-[#ECC979] text-[#101418] text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md shadow-sm">
                            {item.badge}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-1.5 sm:mt-2 min-w-0">
                      <h3 className="text-xs sm:text-[13px] font-bold text-[#F5F1E8] truncate group-hover:text-[#ECC979] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-[#86929F] mt-0.5 truncate">
                        {item.genre} • {item.seasons}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── Right Rail (Desktop Sidebar & Responsive Mobile/Tablet Section) ─ */}
        <div className="w-full xl:w-[285px] 2xl:w-[305px] shrink-0 space-y-6 pt-3 xl:pt-0">
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

            {isLoading ? (
              <div className="space-y-2">
                <div className="h-16 rounded-xl bg-[#11171E] border border-[#1E2732] animate-pulse" />
                <div className="h-16 rounded-xl bg-[#11171E] border border-[#1E2732] animate-pulse" />
              </div>
            ) : continueWatching.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5">
                {continueWatching.map((item) => (
                  <Link
                    key={item.id}
                    href={item.videoId ? `/videos/${item.videoId}` : '/history'}
                    className="flex items-center gap-3 p-1.5 rounded-xl bg-[#11171E] hover:bg-[#151D26] border border-[#1E2732] hover:border-[#2C3846] transition-all group"
                  >
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
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                        <div
                          className="h-full bg-[#ECC979]"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      <h4 className="text-xs font-bold text-[#F5F1E8] truncate group-hover:text-[#ECC979] transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#86929F] mt-1">
                        <span>{item.episode}</span>
                        <span>{item.timeLeft}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#11171E] border border-[#1E2732] text-center">
                <p className="text-xs text-[#86929F]">
                  {user ? 'No watch history yet' : 'Sign in to track your watch history'}
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Recommended for You */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#F5F1E8]">Recommended for You</span>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <div className="h-16 rounded-xl bg-[#11171E] border border-[#1E2732] animate-pulse" />
                <div className="h-16 rounded-xl bg-[#11171E] border border-[#1E2732] animate-pulse" />
              </div>
            ) : recommended.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-2.5">
                {recommended.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href || '/search?type=series'}
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
                      <p className="text-[10px] sm:text-[11px] text-[#86929F] mt-0.5">
                        {item.genre} • {item.year}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#11171E] border border-[#1E2732] text-center">
                <p className="text-xs text-[#86929F]">No recommendations available</p>
              </div>
            )}
          </div>

          {/* Section 3: Top Creators */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#F5F1E8]">Top Creators</span>
              <Link
                href="/following"
                className="text-xs text-[#8C98A5] hover:text-[#ECC979] flex items-center gap-1 font-medium transition-colors"
              >
                <span>See All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <div className="h-14 rounded-xl bg-[#11171E] border border-[#1E2732] animate-pulse" />
                <div className="h-14 rounded-xl bg-[#11171E] border border-[#1E2732] animate-pulse" />
              </div>
            ) : creators.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-1 gap-2.5">
                {creators.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-[#11171E] border border-[#1E2732]"
                  >
                    <Link
                      href={`/profile/${c.handle.replace('@', '')}`}
                      className="flex items-center gap-2.5 min-w-0 group cursor-pointer"
                    >
                      <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 bg-[#1D252E] flex items-center justify-center">
                        {c.avatarUrl ? (
                          <Image
                            src={c.avatarUrl}
                            alt={c.name}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-[#ECC979]">
                            {c.name?.[0]?.toUpperCase() || 'C'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#F5F1E8] truncate leading-tight group-hover:text-[#ECC979] transition-colors">
                          {c.name}
                        </h4>
                        <p className="text-[10px] text-[#86929F] truncate mt-0.5">
                          {c.handle}
                        </p>
                        <p className="text-[10px] text-[#717E8C] truncate">
                          {c.followers}
                        </p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleFollow(c.id)}
                      className={`shrink-0 text-[11px] font-semibold px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                        c.isFollowing
                          ? 'btn-secondary text-white font-semibold'
                          : 'btn-primary text-white font-bold shadow-md'
                      }`}
                    >
                      {c.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#11171E] border border-[#1E2732] text-center">
                <p className="text-xs text-[#86929F]">No creators found</p>
              </div>
            )}
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

            {isLoading ? (
              <div className="space-y-2">
                <div className="h-16 rounded-xl bg-[#11171E] border border-[#1E2732] animate-pulse" />
                <div className="h-16 rounded-xl bg-[#11171E] border border-[#1E2732] animate-pulse" />
              </div>
            ) : blogs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-1 gap-2.5">
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
            ) : (
              <div className="p-3.5 rounded-xl bg-[#11171E] border border-[#1E2732] text-center">
                <p className="text-xs text-[#86929F]">No articles published yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Interactive Video Reel Modal ─────────────────────────────────── */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="relative w-full max-w-xs sm:max-w-sm md:max-w-md bg-[#11171E] border border-[#232D38] rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
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
                href={`/videos/${activeVideoModal.id}`}
                className="absolute inset-0 flex items-center justify-center group cursor-pointer"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#ECC979] group-hover:scale-110 text-[#101418] flex items-center justify-center shadow-2xl transition-transform">
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-1" />
                </div>
              </Link>

              {/* Bottom Info in Modal */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20">
                <span className="text-[10px] font-bold text-[#ECC979] uppercase tracking-wider">
                  {activeVideoModal.genre} Reel
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 line-clamp-1">
                  {activeVideoModal.title}
                </h3>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-xs text-white/80">
                  <div className="flex items-center gap-2">
                    <div className="relative w-5 h-5 rounded-full overflow-hidden bg-[#1D252E] flex items-center justify-center">
                      {activeVideoModal.creatorAvatar ? (
                        <Image
                          src={activeVideoModal.creatorAvatar}
                          alt={activeVideoModal.creatorName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-[9px] font-bold text-[#ECC979]">
                          {activeVideoModal.creatorName?.[0]?.toUpperCase() || 'C'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs truncate max-w-[120px]">
                      {activeVideoModal.creatorName}
                    </span>
                  </div>
                  <span className="text-white/60 font-mono text-[11px]">
                    {activeVideoModal.duration}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
