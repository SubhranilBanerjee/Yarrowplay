'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { MediaCard, UnifiedMediaItem } from '@/components/media/MediaCard';
import { SeriesCard } from '@/components/media/SeriesCard';
import { ContentCarousel } from '@/components/media/ContentCarousel';
import { EmptyState } from '@/components/ui/EmptyState';
import { ContentSeries, AudioTrack, Blog, AdvertiserCampaign } from '@/types/database';
import {
  Compass,
  Layers,
  Music,
  BookOpen,
  X,
  Sparkles,
  Flame,
  Radio,
  Tag,
  Megaphone,
} from 'lucide-react';

type SeriesItem = ContentSeries & {
  type: 'series';
  first_episode_id?: string;
  episode_count?: number;
};

type AudioItem = AudioTrack & { type: 'audio' };
type BlogItem = Blog & { type: 'blog' };
type AdItem = AdvertiserCampaign & { type: 'ad' };

function ExploreContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const supabase = createClient();
  const [activeType, setActiveType] = useState<'all' | 'series' | 'audio' | 'blog'>('all');

  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [audioList, setAudioList] = useState<AudioItem[]>([]);
  const [blogList, setBlogList] = useState<BlogItem[]>([]);
  const [campaignList, setCampaignList] = useState<AdItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const trimmed = query.trim();
      const promises: Promise<any>[] = [];

      // 1. Fetch Series (Only series, never individual episodes)
      if (activeType === 'all' || activeType === 'series') {
        let sQuery = supabase
          .from('content_series')
          .select('*, creator:profiles(*), episodes:videos(id, episode_number, thumbnail_url, duration_seconds, views_count, is_locked)')
          .order('created_at', { ascending: false });

        if (trimmed) {
          sQuery = sQuery.or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%,category.ilike.%${trimmed}%`);
        }

        promises.push(
          sQuery.limit(50).then(({ data, error }: any) => {
            if (error) throw error;
            const mapped: SeriesItem[] = (data || []).map((s: any) => {
              const episodes = s.episodes || [];
              const sorted = [...episodes].sort(
                (a: any, b: any) => (a.episode_number || 0) - (b.episode_number || 0)
              );
              return {
                ...s,
                type: 'series' as const,
                first_episode_id: sorted[0]?.id || s.id,
                episode_count: episodes.length || s.total_episodes || 1,
              };
            });
            setSeriesList(mapped);
          })
        );
      } else {
        setSeriesList([]);
      }

      // 2. Fetch Audio Tracks
      if (activeType === 'all' || activeType === 'audio') {
        let aQuery = supabase
          .from('audios')
          .select('*, creator:profiles(*)')
          .eq('status', 'published')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false });

        if (trimmed) {
          aQuery = aQuery.or(`title.ilike.%${trimmed}%,artist_name.ilike.%${trimmed}%,genre.ilike.%${trimmed}%`);
        }

        promises.push(
          aQuery.limit(50).then(({ data, error }: any) => {
            if (error) throw error;
            const mapped: AudioItem[] = (data || []).map((a: any) => ({
              ...a,
              type: 'audio' as const,
            }));
            setAudioList(mapped);
          })
        );
      } else {
        setAudioList([]);
      }

      // 3. Fetch Blogs
      if (activeType === 'all' || activeType === 'blog') {
        let bQuery = supabase
          .from('blogs')
          .select('*, author:profiles(*)')
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        if (trimmed) {
          bQuery = bQuery.or(`title.ilike.%${trimmed}%,body.ilike.%${trimmed}%,category.ilike.%${trimmed}%`);
        }

        promises.push(
          bQuery.limit(30).then(({ data, error }: any) => {
            if (error) throw error;
            const mapped: BlogItem[] = (data || []).map((b: any) => ({
              ...b,
              type: 'blog' as const,
            }));
            setBlogList(mapped);
          })
        );
      } else {
        setBlogList([]);
      }

      // 4. Fetch Campaigns (ads in 'all' view)
      if (activeType === 'all') {
        let cQuery = supabase
          .from('advertiser_campaigns')
          .select('*, advertiser:profiles(*)')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (trimmed) {
          cQuery = cQuery.or(`title.ilike.%${trimmed}%,headline.ilike.%${trimmed}%,description.ilike.%${trimmed}%`);
        }

        promises.push(
          cQuery.limit(10).then(({ data }: any) => {
            const nowMs = Date.now();
            const mapped: AdItem[] = (data || [])
              .filter((c: any) => !c.end_date || new Date(c.end_date).getTime() >= nowMs)
              .map((c: any) => ({ ...c, type: 'ad' as const }));
            setCampaignList(mapped);
          })
        );
      } else {
        setCampaignList([]);
      }

      await Promise.all(promises);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeType, query]);

  // Group Series by Category
  const seriesByCategory = useMemo(() => {
    const map = new Map<string, SeriesItem[]>();
    for (const s of seriesList) {
      const cat = s.category?.trim() || 'Featured Series';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return Array.from(map.entries());
  }, [seriesList]);

  // Group Audio by Genre
  const audioByGenre = useMemo(() => {
    const map = new Map<string, AudioItem[]>();
    for (const a of audioList) {
      const genre = a.genre?.trim() || 'Featured Audio';
      if (!map.has(genre)) map.set(genre, []);
      map.get(genre)!.push(a);
    }
    return Array.from(map.entries());
  }, [audioList]);

  // Group Blogs by Category
  const blogsByCategory = useMemo(() => {
    const map = new Map<string, BlogItem[]>();
    for (const b of blogList) {
      const cat = b.category?.trim() || 'Stories & Articles';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(b);
    }
    return Array.from(map.entries());
  }, [blogList]);

  const totalResultsCount =
    seriesList.length + audioList.length + blogList.length + campaignList.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header (Without 'Discover · Create · Share') */}
      <div className="max-w-3xl mb-8">
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white flex items-center gap-3 flex-wrap">
          <span>Discover On</span>
          <span className="theme-gradient-heading">Yarrowplay</span>
        </h1>
        {query ? (
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--glass-surface)] border border-[var(--glass-border)] text-xs text-[var(--text-secondary)]">
            <span>Filter: <strong className="text-white">&ldquo;{query}&rdquo;</strong></span>
            <Link
              href="/explore"
              className="text-[var(--text-muted)] hover:text-[var(--color-pink)] inline-flex items-center gap-0.5 ml-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </Link>
          </div>
        ) : (
          <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2 font-normal max-w-xl">
            Stream full video series, music collections, creator stories, and partner releases.
          </p>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2.5 pb-8 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveType('all')}
          className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeType === 'all'
              ? 'theme-active-pill'
              : 'theme-inactive-pill'
          }`}
        >
          All Formats
        </button>

        <button
          onClick={() => setActiveType('series')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeType === 'series'
              ? 'theme-active-pill'
              : 'theme-inactive-pill'
          }`}
        >
          <Layers className="w-4 h-4" />
          Series
        </button>

        <button
          onClick={() => setActiveType('audio')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeType === 'audio'
              ? 'theme-active-pill'
              : 'theme-inactive-pill'
          }`}
        >
          <Music className="w-4 h-4" />
          Audio
        </button>

        <button
          onClick={() => setActiveType('blog')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
            activeType === 'blog'
              ? 'theme-active-pill'
              : 'theme-inactive-pill'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Blogs
        </button>
      </div>

      {/* ── Content Presentation ── */}
      {isLoading ? (
        <div className="space-y-8 animate-pulse">
          <div className="h-6 w-48 bg-[#161522] rounded-lg mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-video bg-[#161522] rounded-2xl ring-1 ring-white/5" />
            ))}
          </div>
          <div className="h-6 w-48 bg-[#161522] rounded-lg mt-8 mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-video bg-[#161522] rounded-2xl ring-1 ring-white/5" />
            ))}
          </div>
        </div>
      ) : totalResultsCount === 0 ? (
        <EmptyState
          icon={Compass}
          title="No results found"
          description={`We couldn't find any content matching "${query || 'your filter'}". Try searching another category or title.`}
          actionLabel="Clear Filter"
          actionHref="/explore"
        />
      ) : query.trim() ? (
        /* ── Search Mode: Categorized Results ── */
        <div className="space-y-10">
          {seriesList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-5 h-5 text-[#EC4899]" />
                <h2 className="text-xl font-bold text-white">Series ({seriesList.length})</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {seriesList.map((series) => (
                  <SeriesCard key={series.id} series={series} />
                ))}
              </div>
            </div>
          )}

          {audioList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-5 h-5 text-[#8B5CF6]" />
                <h2 className="text-xl font-bold text-white">Audio Tracks ({audioList.length})</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {audioList.map((track) => (
                  <MediaCard key={track.id} item={track} allAudioTracks={audioList} />
                ))}
              </div>
            </div>
          )}

          {blogList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-[#EC4899]" />
                <h2 className="text-xl font-bold text-white">Blogs & Articles ({blogList.length})</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {blogList.map((blog) => (
                  <MediaCard key={blog.id} item={blog} />
                ))}
              </div>
            </div>
          )}

          {campaignList.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Megaphone className="w-5 h-5 text-[#8B5CF6]" />
                <h2 className="text-xl font-bold text-white">Sponsored Releases ({campaignList.length})</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {campaignList.map((ad) => (
                  <MediaCard key={ad.id} item={ad} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Netflix-Style Horizontal Rows Divided by Types & Categories ── */
        <div className="space-y-12">
          {/* 1. TOP SPOTLIGHT SERIES */}
          {seriesList.length > 0 && (
            <ContentCarousel
              title="Trending Series"
              badge="MUST WATCH"
              icon={Flame}
            >
              {seriesList.map((series) => (
                <div key={series.id} className="w-64 sm:w-72 shrink-0 snap-start">
                  <SeriesCard series={series} />
                </div>
              ))}
            </ContentCarousel>
          )}

          {/* 2. SERIES DIVIDED BY CATEGORIES (Netflix Rows) */}
          {seriesByCategory.map(([categoryName, seriesInCat]) => (
            <ContentCarousel
              key={categoryName}
              title={`${categoryName} Series`}
              badge={`${seriesInCat.length} ${seriesInCat.length === 1 ? 'SHOW' : 'SHOWS'}`}
              icon={Layers}
            >
              {seriesInCat.map((series) => (
                <div key={series.id} className="w-64 sm:w-72 shrink-0 snap-start">
                  <SeriesCard series={series} />
                </div>
              ))}
            </ContentCarousel>
          ))}

          {/* 3. AUDIO TRACKS DIVIDED BY GENRE */}
          {(activeType === 'all' || activeType === 'audio') &&
            audioByGenre.map(([genreName, tracksInGenre]) => (
              <ContentCarousel
                key={genreName}
                title={`${genreName} Tracks`}
                badge={`${tracksInGenre.length} TRACKS`}
                icon={Radio}
              >
                {tracksInGenre.map((track) => (
                  <div key={track.id} className="w-56 sm:w-64 shrink-0 snap-start">
                    <MediaCard item={track} allAudioTracks={audioList} />
                  </div>
                ))}
              </ContentCarousel>
            ))}

          {/* 4. BLOG ARTICLES DIVIDED BY CATEGORY */}
          {(activeType === 'all' || activeType === 'blog') &&
            blogsByCategory.map(([catName, blogsInCat]) => (
              <ContentCarousel
                key={catName}
                title={`${catName} Blogs`}
                badge="READS"
                icon={BookOpen}
              >
                {blogsInCat.map((blog) => (
                  <div key={blog.id} className="w-64 sm:w-72 shrink-0 snap-start">
                    <MediaCard item={blog} />
                  </div>
                ))}
              </ContentCarousel>
            ))}

          {/* 5. SPONSORED PARTNER CONTENT */}
          {activeType === 'all' && campaignList.length > 0 && (
            <ContentCarousel
              title="Featured Partner Drops"
              badge="SPONSORED"
              icon={Sparkles}
            >
              {campaignList.map((ad) => (
                <div key={ad.id} className="w-64 sm:w-72 shrink-0 snap-start">
                  <MediaCard item={ad} />
                </div>
              ))}
            </ContentCarousel>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="h-12 bg-[#161522] rounded-2xl w-full max-w-xl mx-auto animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-60 bg-[#161522] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
