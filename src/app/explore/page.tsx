'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { MediaCard, UnifiedMediaItem } from '@/components/media/MediaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Compass, Film, Music, BookOpen, X } from 'lucide-react';

function ExploreContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const supabase = createClient();
  const [activeType, setActiveType] = useState<'all' | 'video' | 'audio' | 'blog'>('all');
  const [results, setResults] = useState<UnifiedMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const items: UnifiedMediaItem[] = [];
      const trimmed = query.trim();

      const promises: Promise<any>[] = [];

      // Search videos
      if (activeType === 'all' || activeType === 'video') {
        let vQuery = supabase
          .from('videos')
          .select('*, creator:profiles(*)')
          .eq('status', 'published')
          .eq('visibility', 'public');

        if (trimmed) {
          vQuery = vQuery.or(`title.ilike.%${trimmed}%,description.ilike.%${trimmed}%`);
        }

        promises.push(
          vQuery.limit(20).then(({ data }: any) => {
            (data || []).forEach((v: any) => items.push({ ...v, type: 'video' }));
          })
        );
      }

      // Search audio
      if (activeType === 'all' || activeType === 'audio') {
        let aQuery = supabase
          .from('audios')
          .select('*, creator:profiles(*)')
          .eq('status', 'published')
          .eq('visibility', 'public');

        if (trimmed) {
          aQuery = aQuery.or(`title.ilike.%${trimmed}%,artist_name.ilike.%${trimmed}%`);
        }

        promises.push(
          aQuery.limit(20).then(({ data }: any) => {
            (data || []).forEach((a: any) => items.push({ ...a, type: 'audio' }));
          })
        );
      }

      // Search blogs
      if (activeType === 'all' || activeType === 'blog') {
        let bQuery = supabase
          .from('blogs')
          .select('*, author:profiles(*)')
          .eq('status', 'published');

        if (trimmed) {
          bQuery = bQuery.or(`title.ilike.%${trimmed}%,body.ilike.%${trimmed}%`);
        }

        promises.push(
          bQuery.limit(20).then(({ data }: any) => {
            (data || []).forEach((b: any) => items.push({ ...b, type: 'blog' }));
          })
        );
      }

      // Search campaigns (included in 'all' results)
      if (activeType === 'all') {
        let cQuery = supabase
          .from('advertiser_campaigns')
          .select('*, advertiser:profiles(*)')
          .eq('status', 'active');

        if (trimmed) {
          cQuery = cQuery.or(`title.ilike.%${trimmed}%,headline.ilike.%${trimmed}%,description.ilike.%${trimmed}%`);
        }

        promises.push(
          cQuery.limit(20).then(({ data }: any) => {
            const nowMs = Date.now();
            (data || [])
              .filter((c: any) => !c.end_date || new Date(c.end_date).getTime() >= nowMs)
              .forEach((c: any) => items.push({ ...c, type: 'ad' }));
          })
        );
      }

      await Promise.all(promises);
      setResults(items);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [activeType, query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="max-w-3xl mb-8">
        <p className="text-[11px] font-extrabold tracking-[0.25em] text-[var(--color-magenta)] uppercase mb-2">
          Discover · Create · Share
        </p>
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
            Browse videos, audio tracks, creator blogs, and sponsored partner content.
          </p>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2.5 pb-8 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveType('all')}
          className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeType === 'all'
              ? 'theme-active-pill'
              : 'theme-inactive-pill'
          }`}
        >
          All Formats
        </button>

        <button
          onClick={() => setActiveType('video')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeType === 'video'
              ? 'theme-active-pill'
              : 'theme-inactive-pill'
          }`}
        >
          <Film className="w-4 h-4" />
          Videos
        </button>

        <button
          onClick={() => setActiveType('audio')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
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
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 ${
            activeType === 'blog'
              ? 'theme-active-pill'
              : 'theme-inactive-pill'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Blogs
        </button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#333336] rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No results found"
          description={`We couldn't find any content matching "${query || 'your filter'}". Try another category or search keyword.`}
          actionLabel="Clear Filter"
          actionHref="/explore"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {results.map((item) => (
            <MediaCard key={`${item.type}-${item.id}`} item={item} />
          ))}
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
          <div className="h-12 bg-[#333336] rounded-2xl w-full max-w-xl mx-auto animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-60 bg-[#333336] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
