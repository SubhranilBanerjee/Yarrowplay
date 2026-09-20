'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Layers, Film } from 'lucide-react';
import { ContentSeries } from '@/types/database';

export interface SeriesCardProps {
  series: ContentSeries & {
    first_episode_id?: string;
    episode_count?: number;
  };
  className?: string;
}

export function SeriesCard({ series, className = '' }: SeriesCardProps) {
  const episodesCount =
    series.episode_count ??
    (series.episodes ? series.episodes.length : 0) ??
    series.total_episodes ??
    1;

  // Determine first episode ID
  const firstEpisodeId =
    series.first_episode_id ||
    (series.episodes && series.episodes.length > 0
      ? [...series.episodes].sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0))[0]?.id
      : series.id);

  const coverUrl =
    series.cover_url ||
    series.episodes?.[0]?.thumbnail_url ||
    null;

  return (
    <Link
      href={`/videos/${firstEpisodeId}`}
      className={`group relative bg-transparent flex flex-col h-full cursor-pointer select-none ${className}`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#161522] border border-[#2E2A45] group-hover:border-[#8B5CF6]/80 transition-all duration-300 shadow-md group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_25px_rgba(139,92,246,0.35)]">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={series.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 group-hover:brightness-95 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#161522] via-[#1E1B2E] to-[#12111A] text-[#8B5CF6]">
            <Film className="w-12 h-12 opacity-80" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {/* Series Pill */}
          <span className="bg-black/80 backdrop-blur-md border border-white/15 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-lg shadow-black/50">
            <Layers className="w-3 h-3 text-[#EC4899]" />
            <span className="tracking-wider uppercase">Series</span>
          </span>

          {/* Episode Count */}
          {episodesCount > 0 && (
            <span className="bg-[#8B5CF6]/85 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md">
              {episodesCount} {episodesCount === 1 ? 'Ep' : 'Eps'}
            </span>
          )}
        </div>

        {/* Center Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100">
          <div className="w-12 h-12 rounded-full theme-neon-button text-white flex items-center justify-center shadow-[0_0_25px_rgba(236,72,153,0.7)]">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Bottom Bar inside Thumbnail for quick metadata */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-gray-300">
          {series.category ? (
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#EC4899] bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md border border-white/10">
              {series.category}
            </span>
          ) : <span />}

          <span className="text-[10px] font-medium text-gray-300 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
            Watch Now
          </span>
        </div>
      </div>

      {/* Info Below Card */}
      <div className="pt-2.5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-white font-bold text-sm line-clamp-1 group-hover:text-[#A855F7] transition-colors">
            {series.title}
          </h3>
          <p className="text-[#9CA3AF] text-xs line-clamp-1 mt-0.5 font-normal">
            {series.creator?.display_name || series.creator?.username || 'Creator'}
            {series.description ? ` · ${series.description}` : ''}
          </p>
        </div>
      </div>
    </Link>
  );
}
