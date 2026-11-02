'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import { BrandLogo } from '@/components/landing/BrandLogo';
import {
  Film,
  Sparkles,
  ChevronLeft,
  Search,
  Star,
  Play,
  Layers,
  ArrowRight,
  PlusCircle,
  Eye,
} from 'lucide-react';

interface SeriesItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  cover_url: string;
  total_episodes: number;
  creator?: {
    display_name?: string;
    username?: string;
  };
}

const CATEGORIES = [
  'All',
  'Drama',
  'Romance',
  'Thriller',
  'Action',
  'Sci-Fi',
  'Comedy',
];

export default function SeriesCatalogPage() {
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSeries() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('content_series')
          .select(`
            id,
            title,
            description,
            category,
            tags,
            cover_url,
            total_episodes,
            created_at,
            creator:profiles(display_name, username),
            episodes:videos(id)
          `)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          const formatted: SeriesItem[] = data.map((s: any) => ({
            id: s.id,
            title: s.title || 'Untitled Series',
            description: s.description || 'Exclusive episodic micro-drama.',
            category: s.category || 'Drama',
            tags: s.tags || [],
            cover_url: s.cover_url || '/images/reel_whispers.jpg',
            total_episodes: s.total_episodes || s.episodes?.length || 1,
            creator: s.creator,
          }));
          setSeriesList(formatted);
        } else {
          setSeriesList([]);
        }
      } catch (err) {
        console.error('Failed to load series catalog:', err);
        setSeriesList([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSeries();
  }, [supabase]);

  // Filter series based on Category & Search
  const filteredSeries = seriesList.filter((s) => {
    const matchesCat =
      selectedCategory === 'All' ||
      s.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !searchQuery.trim() ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.creator?.display_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 relative selection:bg-purple-600 selection:text-white ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#080214] text-white'
      }`}
    >
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 px-4 sm:px-8 py-3.5 backdrop-blur-xl border-b border-purple-500/15 bg-slate-950/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/home')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30 text-xs font-semibold text-white/90 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Home</span>
            </button>
            <BrandLogo href="/home" showText={true} />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/creator/studio"
              className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Series</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="relative z-10 py-12 px-4 sm:px-8 max-w-7xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-600/20 text-purple-300 border border-purple-500/30">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Original Micro-Series Directory</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
          Explore All Series
        </h1>
        <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl mx-auto leading-relaxed">
          Bite-sized episodic dramas, pulse-pounding thrillers, and passionate romances formatted exclusively for vertical mobile cinema.
        </p>

        {/* Search Input Bar */}
        <div className="max-w-md mx-auto pt-4">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by series title, creator, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-full bg-white/5 border border-purple-500/30 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-400 backdrop-blur-md shadow-lg"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/35 scale-105'
                  : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Series Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-purple-500/30 border-t-purple-600 animate-spin" />
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="text-center py-20 p-8 rounded-3xl bg-white/5 border border-white/10 max-w-md mx-auto space-y-3">
            <Film className="w-12 h-12 text-purple-400 mx-auto" />
            <h3 className="font-bold text-lg text-white">No Series Found</h3>
            <p className="text-xs text-purple-200/70">
              Try adjusting your category filter or search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredSeries.map((item) => (
              <Link
                key={item.id}
                href={`/series/${item.id}`}
                className="group relative rounded-3xl overflow-hidden border border-purple-500/25 bg-[#120728] aspect-[9/15] flex flex-col justify-between p-4 transition-all duration-300 hover:scale-[1.03] hover:border-purple-400 shadow-2xl"
              >
                {/* Cover Art */}
                <Image
                  src={item.cover_url}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-108 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 pointer-events-none" />

                {/* Top Badge: Category & Episodes */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20">
                    {item.total_episodes} Episodes
                  </span>
                </div>

                {/* Center Hover Play Indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-115 group-hover:bg-purple-600 transition-all opacity-0 group-hover:opacity-100 duration-300">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Bottom Details */}
                <div className="relative z-10 space-y-1.5 text-white">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-bold text-white text-[11px]">4.9</span>
                    <span className="text-purple-300 text-[10px]">• Original</span>
                  </div>

                  <h3 className="font-bold text-base line-clamp-1 group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-purple-200/80 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-white/10 text-[11px] text-purple-300">
                    <span>{item.creator?.display_name || 'Studio'}</span>
                    <span className="font-bold text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>View Series</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

