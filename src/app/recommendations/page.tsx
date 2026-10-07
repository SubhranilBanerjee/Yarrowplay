'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { EditableText, useSiteText } from '@/context/SiteTextContext';
import {
  Sparkles,
  Play,
  Film,
  Flame,
  Star,
  Clock,
  Compass,
  TrendingUp,
} from 'lucide-react';

interface Recommendation {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  cover_url?: string;
  duration?: number;
  total_episodes?: number;
  genre?: string;
  type: 'video' | 'series';
  recommendation_reason?: string;
  creator?: {
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

const CATEGORIES = ['All', 'Trending', 'Drama', 'Romance', 'Thriller', 'Action', 'Sci-Fi'];

export default function RecommendationsPage() {
  const { user } = useAuth();
  const { t } = useSiteText();
  const supabase = createClient();

  const [items, setItems] = useState<Recommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      setIsLoading(true);
      try {
        // 1. Try recommendations endpoint
        const res = await fetch(`/api/recommendations?limit=24${user ? `&user_id=${user.id}` : ''}`);
        if (res.ok) {
          const data = await res.json();
          if (data.recommendations && data.recommendations.length > 0) {
            setItems(
              data.recommendations.map((r: any) => ({
                id: r.id,
                title: r.title || 'Untitled Story',
                description: r.description,
                thumbnail_url: r.thumbnail_url || r.cover_url || '/images/lighthouse_bg.jpg',
                duration: r.duration,
                total_episodes: r.total_episodes || 1,
                genre: r.category || r.genre || 'Drama',
                type: r.total_episodes ? 'series' : 'video',
                recommendation_reason: r.reason || 'Recommended for you',
                creator: r.creator,
              }))
            );
            setIsLoading(false);
            return;
          }
        }

        // 2. Fallback to Supabase series and videos
        const { data: seriesData } = await supabase
          .from('series')
          .select('id, title, description, cover_url, genre, total_episodes, profiles:creator_id(display_name, username, avatar_url)')
          .limit(16);

        if (seriesData && seriesData.length > 0) {
          setItems(
            seriesData.map((s: any) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              thumbnail_url: s.cover_url || '/images/lighthouse_bg.jpg',
              total_episodes: s.total_episodes || 12,
              genre: s.genre || 'Drama',
              type: 'series',
              recommendation_reason: 'Top Pick for You',
              creator: s.profiles,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadRecommendations();
  }, [user, supabase]);

  const filteredItems = items.filter((item) => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Trending') return true;
    return item.genre?.toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[var(--lr-bg-primary,#090D12)] text-[var(--lr-text-primary,#F5F1E8)] px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-purple-900/40 via-indigo-950/30 to-[#0F1620] border border-purple-500/20 p-6 sm:p-10 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <EditableText
              id="recommendations.badge"
              defaultText="AI & Editorial Curations"
              label="Recommendations Badge"
            />
          </div>

          <EditableText
            id="recommendations.title"
            defaultText="Recommended For You"
            as="h1"
            className="text-2xl sm:text-4xl font-black text-white tracking-tight"
            label="Recommendations Page Heading"
          />

          <EditableText
            id="recommendations.subtitle"
            defaultText="Personalized vertical micro-dramas, viral reels, and exclusive creator releases calibrated to your tastes."
            as="p"
            className="text-xs sm:text-sm text-[#9AA7B4] leading-relaxed"
            label="Recommendations Subtitle"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-[#131B24] text-[#8E9CA8] hover:text-white hover:bg-[#1A2531] border border-[#202B37]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[9/14] rounded-2xl bg-[#131B24] border border-[#1E2936] animate-pulse"
            />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-5">
          {filteredItems.map((item) => (
            <Link
              key={item.id}
              href={item.type === 'series' ? `/search?q=${encodeURIComponent(item.title)}` : `/videos/${item.id}`}
              className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#111720] border border-[#1E2937] hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
            >
              {/* Poster 9:16 aspect */}
              <div className="relative aspect-[9/13] w-full overflow-hidden bg-[#151E28]">
                <Image
                  src={item.thumbnail_url || '/images/lighthouse_bg.jpg'}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090D12] via-transparent to-transparent opacity-90" />

                {/* Reason tag */}
                {item.recommendation_reason && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-purple-600/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider shadow">
                    {item.recommendation_reason}
                  </div>
                )}

                {/* Play button overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-black/30 backdrop-blur-[2px]">
                  <div className="w-11 h-11 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Bottom info inside thumbnail */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white/90">
                  <span className="font-semibold text-purple-300">{item.genre}</span>
                  {item.total_episodes ? (
                    <span className="bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-[10px]">
                      {item.total_episodes} eps
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Title & Creator */}
              <div className="p-3 space-y-1">
                <h3 className="text-xs sm:text-sm font-bold text-[#F5F1E8] truncate group-hover:text-purple-300 transition-colors">
                  {item.title}
                </h3>
                {item.creator?.display_name && (
                  <p className="text-[11px] text-[#7E8D9B] truncate">
                    by {item.creator.display_name}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-[#111720] border border-[#1E2937] space-y-3">
          <Compass className="w-10 h-10 text-purple-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No recommendations yet</h3>
          <p className="text-xs text-[#8E9CA8] max-w-sm mx-auto">
            Start watching more series and videos to let our engine discover personalized picks for you.
          </p>
        </div>
      )}
    </div>
  );
}
