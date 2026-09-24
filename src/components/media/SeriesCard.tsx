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
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#111A22] border border-[#27313A] group-hover:border-[#F4C95D]/30 transition-all duration-300 shadow-sm">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={series.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 group-hover:brightness-95 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#111A22] text-[#F4C95D]">
            <Film className="w-12 h-12 opacity-80" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070B0F]/85 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          {/* Series Pill */}
          <span className="bg-[#070B0F]/85 backdrop-blur-md border border-[#27313A] text-[#F5F1E8] text-[10px] font-bold px-2.5 py-0.5 rounded flex items-center gap-1.5 shadow-sm">
            <Layers className="w-3 h-3 text-[#F4C95D]" />
            <span className="tracking-wider uppercase">Series</span>
          </span>

          {/* Episode Count */}
          {episodesCount > 0 && (
            <span className="bg-[#F4C95D] text-[#0B0F13] text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
              {episodesCount} {episodesCount === 1 ? 'Ep' : 'Eps'}
            </span>
          )}
        </div>

        {/* Center Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none scale-90 group-hover:scale-100">
          <div className="w-11 h-11 rounded-full bg-[#F4C95D] text-[#0B0F13] flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 fill-[#0B0F13] ml-0.5" />
          </div>
        </div>

        {/* Bottom Bar inside Thumbnail for quick metadata */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-[#B7BEC6]">
          {series.category ? (
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#F4C95D] bg-[#070B0F]/80 backdrop-blur-sm px-2 py-0.5 rounded border border-[#27313A]">
              {series.category}
            </span>
          ) : <span />}

          <span className="text-[10px] font-medium text-[#B7BEC6] bg-[#070B0F]/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
            Watch Now
          </span>
        </div>
      </div>

      {/* Info Below Card */}
      <div className="pt-2.5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-[#F5F1E8] font-bold text-sm line-clamp-1 group-hover:text-[#F4C95D] transition-colors">
            {series.title}
          </h3>
          <p className="text-[#7F8993] text-xs line-clamp-1 mt-0.5 font-normal">
            {series.creator?.display_name || series.creator?.username || 'Creator'}
            {series.description ? ` · ${series.description}` : ''}
          </p>
        </div>
      </div>
    </Link>
  );
}
