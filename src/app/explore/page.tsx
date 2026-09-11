'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MediaCard, UnifiedMediaItem } from '@/components/media/MediaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search, Compass, Film, Music, BookOpen } from 'lucide-react';

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const supabase = createClient();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [activeType, setActiveType] = useState<'all' | 'video' | 'audio' | 'blog'>('all');
  const [results, setResults] = useState<UnifiedMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const items: UnifiedMediaItem[] = [];

      // Search videos
      if (activeType === 'all' || activeType === 'video') {
        let vQuery = supabase
          .from('videos')
          .select('*, creator:profiles(*)')
          .eq('status', 'published')
          .eq('visibility', 'public');

        if (searchTerm.trim()) {
          vQuery = vQuery.or(`title.ilike.%${searchTerm.trim()}%,description.ilike.%${searchTerm.trim()}%`);
        }

        const { data: vids } = await vQuery.limit(20);
        (vids || []).forEach((v) => items.push({ ...v, type: 'video' }));
      }

      // Search audio
      if (activeType === 'all' || activeType === 'audio') {
        let aQuery = supabase
          .from('audios')
          .select('*, creator:profiles(*)')
          .eq('status', 'published')
          .eq('visibility', 'public');

        if (searchTerm.trim()) {
          aQuery = aQuery.or(`title.ilike.%${searchTerm.trim()}%,artist_name.ilike.%${searchTerm.trim()}%`);
        }

        const { data: auds } = await aQuery.limit(20);
        (auds || []).forEach((a) => items.push({ ...a, type: 'audio' }));
      }

      // Search blogs
      if (activeType === 'all' || activeType === 'blog') {
        let bQuery = supabase
          .from('blogs')
          .select('*, author:profiles(*)')
          .eq('status', 'published');

        if (searchTerm.trim()) {
          bQuery = bQuery.or(`title.ilike.%${searchTerm.trim()}%,body.ilike.%${searchTerm.trim()}%`);
        }

        const { data: blgs } = await bQuery.limit(20);
        (blgs || []).forEach((b) => items.push({ ...b, type: 'blog' }));
      }

      setResults(items);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [activeType, initialQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
          Discover On Yarrowplay
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="relative w-full"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#85858B]" />
          <input
            type="text"
            placeholder="Search by title, artist, genre, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#333336] text-white placeholder-[#85858B] text-sm rounded-2xl pl-12 pr-4 py-3.5 border border-[#454549] focus:outline-none focus:border-[#FF0080] transition-colors shadow-lg"
          />
        </form>
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
          description={`We couldn't find any content matching "${searchTerm || 'your query'}". Try another search keyword.`}
          actionLabel="Clear Search"
          onAction={() => {
            setSearchTerm('');
            setActiveType('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
