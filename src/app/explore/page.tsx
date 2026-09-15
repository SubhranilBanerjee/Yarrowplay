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
      <div className="max-w-2xl mx-auto text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {query ? `Results for "${query}"` : 'Discover On Yarrowplay'}
        </h1>
        {query ? (
          <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#333336] border border-[#454549] text-xs text-[#B8B8BD]">
            <span>Filter: <strong className="text-white">&ldquo;{query}&rdquo;</strong></span>
            <Link
              href="/explore"
              className="text-[#85858B] hover:text-[#FF0080] inline-flex items-center gap-0.5 ml-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-[#85858B] mt-1.5">
            Browse videos, audio tracks, creator blogs, and sponsored partner content.
          </p>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center gap-2 pb-8 overflow-x-auto">
        <button
          onClick={() => setActiveType('all')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeType === 'all'
              ? 'bg-[#FF0080] text-white shadow-md'
              : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
          }`}
        >
          All Formats
        </button>

        <button
          onClick={() => setActiveType('video')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeType === 'video'
              ? 'bg-[#FF0080] text-white shadow-md'
              : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
          }`}
        >
          <Film className="w-4 h-4" />
          Videos
        </button>

        <button
          onClick={() => setActiveType('audio')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeType === 'audio'
              ? 'bg-[#FF0080] text-white shadow-md'
              : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
          }`}
        >
          <Music className="w-4 h-4" />
          Audio
        </button>

        <button
          onClick={() => setActiveType('blog')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeType === 'blog'
              ? 'bg-[#FF0080] text-white shadow-md'
              : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
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
