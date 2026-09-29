'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { SeriesCard } from '@/components/media/SeriesCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ContentSeries, Video, AudioTrack, Blog } from '@/types/database';
import {
  Search,
  Tv,
  Film,
  FileText,
  Music,
  X,
  Sparkles,
  ArrowRight,
  Clock,
  Play,
} from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get('q') || '';

  const supabase = createClient();
  const [searchInput, setSearchInput] = useState(queryParam);
  const [activeFilter, setActiveFilter] = useState<'all' | 'series' | 'videos' | 'blogs' | 'audio'>('all');

  const [seriesResults, setSeriesResults] = useState<any[]>([]);
  const [videoResults, setVideoResults] = useState<Video[]>([]);
  const [blogResults, setBlogResults] = useState<Blog[]>([]);
  const [audioResults, setAudioResults] = useState<AudioTrack[]>([]);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync search input with URL param
  useEffect(() => {
    setSearchInput(queryParam);
  }, [queryParam]);

  // Load recent searches
  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetch('/api/search-history');
        if (res.ok) {
          const data = await res.json();
          if (data.searches && Array.isArray(data.searches)) {
            setRecentSearches(data.searches.map((s: any) => s.query));
          }
        }
      } catch {}
    }
    loadRecent();
  }, []);

  // Fetch search results whenever queryParam or activeFilter changes
  useEffect(() => {
    const trimmed = queryParam.trim();
    if (!trimmed) {
      setSeriesResults([]);
      setVideoResults([]);
      setBlogResults([]);
      setAudioResults([]);
      return;
    }

    setIsLoading(true);

    // Save search query asynchronously to search history
    fetch('/api/search-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: trimmed }),
    }).catch(() => {});

    async function executeSearch() {
      try {
        const promises: Promise<any>[] = [];

        // 1. Search Series
        if (activeFilter === 'all' || activeFilter === 'series') {
          promises.push(
            supabase
              .from('content_series')
              .select('*, creator:profiles(*), episodes:videos(id, episode_number, thumbnail_url, duration_seconds, views_count, is_locked)')
              .or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%,category.ilike.%${trimmed}%`)
              .order('created_at', { ascending: false })
              .limit(20)
              .then(({ data }: any) => {
                const mapped = (data || []).map((s: any) => {
                  const episodes = s.episodes || [];
                  const sorted = [...episodes].sort(
                    (a: any, b: any) => (a.episode_number || 0) - (b.episode_number || 0)
                  );
                  return {
                    ...s,
                    first_episode_id: sorted[0]?.id || s.id,
                    episode_count: episodes.length || s.total_episodes || 1,
                  };
                });
                setSeriesResults(mapped);
              })
          );
        } else {
          setSeriesResults([]);
        }

        // 2. Search Videos / Reels
        if (activeFilter === 'all' || activeFilter === 'videos') {
          promises.push(
            supabase
              .from('videos')
              .select('*, creator:profiles(*), series:content_series(*)')
              .eq('status', 'published')
              .eq('visibility', 'public')
              .or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%,category.ilike.%${trimmed}%,genre.ilike.%${trimmed}%`)
              .order('views_count', { ascending: false })
              .limit(20)
              .then(({ data }: any) => {
                setVideoResults((data as Video[]) || []);
              })
          );
        } else {
          setVideoResults([]);
        }

        // 3. Search Blogs
        if (activeFilter === 'all' || activeFilter === 'blogs') {
          promises.push(
            supabase
              .from('blogs')
              .select('*, author:profiles(*)')
              .eq('status', 'published')
              .or(`title.ilike.%${trimmed}%,body.ilike.%${trimmed}%,category.ilike.%${trimmed}%`)
              .order('published_at', { ascending: false })
              .limit(20)
              .then(({ data }: any) => {
                setBlogResults((data as Blog[]) || []);
              })
          );
        } else {
          setBlogResults([]);
        }

        // 4. Search Audio
        if (activeFilter === 'all' || activeFilter === 'audio') {
          promises.push(
            supabase
              .from('audios')
              .select('*, creator:profiles(*)')
              .eq('status', 'published')
              .eq('visibility', 'public')
              .or(`title.ilike.%${trimmed}%,artist_name.ilike.%${trimmed}%,genre.ilike.%${trimmed}%`)
              .order('views_count', { ascending: false })
              .limit(20)
              .then(({ data }: any) => {
                setAudioResults((data as AudioTrack[]) || []);
              })
          );
        } else {
          setAudioResults([]);
        }

        await Promise.allSettled(promises);
      } catch (err) {
        console.error('Search query error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    executeSearch();
  }, [queryParam, activeFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleSelectRecent = (q: string) => {
    setSearchInput(q);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const totalResults =
    seriesResults.length + videoResults.length + blogResults.length + audioResults.length;

  return (
    <div className="w-full min-h-screen bg-[var(--lr-bg-primary,#070B0F)] text-[var(--lr-text-primary,#F5F1E8)] px-4 sm:px-6 lg:px-8 py-6">
      {/* Search Header Form */}
      <div className="max-w-3xl mx-auto mb-8">
        <form onSubmit={handleSubmit} className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--lr-text-muted,#7E8B99)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search series, short reels, creators, blogs..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-[var(--lr-bg-surface,#111A22)] border border-[var(--lr-border-primary,#27313A)] hover:border-[#ECC979]/50 focus:border-[#ECC979] text-[var(--lr-text-primary,#F5F1E8)] placeholder-[var(--lr-text-muted,#7E8B99)] text-base rounded-2xl pl-12 pr-12 py-3.5 shadow-xl transition-all outline-none"
            autoFocus
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                router.push('/search');
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--lr-text-muted,#7E8B99)] hover:text-[var(--lr-text-primary,#F5F1E8)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'series', label: 'Series', icon: Tv },
            { id: 'videos', label: 'Reels & Videos', icon: Film },
            { id: 'blogs', label: 'Blogs', icon: FileText },
            { id: 'audio', label: 'Audio', icon: Music },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#ECC979] text-[#101418] shadow-sm font-bold'
                    : 'bg-[var(--lr-bg-surface,#111A22)] text-[var(--lr-text-secondary,#9AA7B4)] border border-[var(--lr-border-primary,#27313A)] hover:bg-[var(--lr-bg-elevated,#151F28)] hover:text-[var(--lr-text-primary,#F5F1E8)]'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Recent Searches (when query is empty) */}
        {!queryParam && recentSearches.length > 0 && (
          <div className="mt-8 p-5 rounded-2xl bg-[var(--lr-bg-surface,#111A22)] border border-[var(--lr-border-primary,#27313A)]">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--lr-text-muted,#7E8B99)] uppercase tracking-wider mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>Recent Searches</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 10).map((term, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectRecent(term)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--lr-bg-elevated,#151F28)] hover:bg-[#ECC979]/15 border border-[var(--lr-border-subtle,#1C252D)] hover:border-[#ECC979]/40 text-xs text-[var(--lr-text-secondary,#B7BEC6)] hover:text-[#ECC979] transition-all cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Container */}
      {isLoading ? (
        <div className="max-w-6xl mx-auto py-12 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#ECC979] border-t-transparent animate-spin mb-3" />
          <p className="text-sm text-[var(--lr-text-secondary,#9AA7B4)]">Searching Lighthouse Reels...</p>
        </div>
      ) : queryParam && totalResults === 0 ? (
        <div className="max-w-md mx-auto my-12">
          <EmptyState
            icon={Search}
            title={`No results found for "${queryParam}"`}
            description="Try searching for another series title, creator name, genre, or keyword."
            actionLabel="Return Home"
            actionHref="/home"
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Series Results */}
          {seriesResults.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-[var(--lr-text-primary,#F5F1E8)] mb-4">
                <Tv className="w-5 h-5 text-[#ECC979]" />
                <h2>Series ({seriesResults.length})</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {seriesResults.map((s) => (
                  <SeriesCard
                    key={s.id}
                    series={s}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Videos Results */}
          {videoResults.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-[var(--lr-text-primary,#F5F1E8)] mb-4">
                <Film className="w-5 h-5 text-[#ECC979]" />
                <h2>Short Reels & Episodes ({videoResults.length})</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {videoResults.map((v) => (
                  <Link
                    key={v.id}
                    href={`/videos/${v.id}`}
                    className="group relative aspect-[9/15] rounded-xl overflow-hidden bg-[var(--lr-bg-surface,#111A22)] border border-[var(--lr-border-primary,#27313A)] hover:border-[#ECC979]/50 transition-all flex flex-col justify-end p-2.5 shadow-md"
                  >
                    <Image
                      src={v.thumbnail_url || '/images/series_city_lights.jpg'}
                      alt={v.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="relative z-10">
                      <span className="text-[10px] text-[#ECC979] font-mono">
                        {v.episode_number ? `Ep. ${v.episode_number}` : 'Reel'}
                      </span>
                      <h3 className="text-xs font-bold text-white truncate group-hover:text-[#ECC979] transition-colors">
                        {v.title}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-white/80 mt-0.5">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{v.views_count || 0} views</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Blogs Results */}
          {blogResults.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-[var(--lr-text-primary,#F5F1E8)] mb-4">
                <FileText className="w-5 h-5 text-[#ECC979]" />
                <h2>Blog Articles ({blogResults.length})</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {blogResults.map((b) => (
                  <Link
                    key={b.id}
                    href={`/blogs/${b.id}`}
                    className="group rounded-2xl bg-[var(--lr-bg-surface,#111A22)] border border-[var(--lr-border-primary,#27313A)] hover:border-[#ECC979]/40 p-4 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {b.cover_url && (
                        <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden mb-3">
                          <Image src={b.cover_url} alt={b.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      )}
                      <span className="text-[11px] font-semibold text-[#ECC979] uppercase">
                        {b.category || 'Article'}
                      </span>
                      <h3 className="text-sm font-bold text-[var(--lr-text-primary,#F5F1E8)] group-hover:text-[#ECC979] transition-colors mt-1 line-clamp-2">
                        {b.title}
                      </h3>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-[var(--lr-text-muted,#7E8B99)] pt-2 border-t border-[var(--lr-border-subtle,#1C252D)]">
                      <span>{b.author?.display_name || 'Author'}</span>
                      <span className="flex items-center gap-1 group-hover:text-[#ECC979] transition-colors">
                        Read <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Audio Results */}
          {audioResults.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-[var(--lr-text-primary,#F5F1E8)] mb-4">
                <Music className="w-5 h-5 text-[#ECC979]" />
                <h2>Audio Tracks ({audioResults.length})</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {audioResults.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--lr-bg-surface,#111A22)] border border-[var(--lr-border-primary,#27313A)]"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#16202A]">
                      <Image
                        src={a.cover_url || '/images/series_midnight_drive.jpg'}
                        alt={a.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[var(--lr-text-primary,#F5F1E8)] truncate">{a.title}</h4>
                      <p className="text-[11px] text-[var(--lr-text-secondary,#9AA7B4)] truncate">{a.artist_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen py-16 flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#ECC979] border-t-transparent animate-spin mb-3" />
          <p className="text-sm text-[var(--lr-text-secondary,#9AA7B4)]">Loading Search...</p>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
