'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Video } from '@/types/database';
import { Film, Play, Lock, Clock } from 'lucide-react';

function formatDuration(seconds?: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function VideoCarouselCard({ video }: { video: Video }) {
  return (
    <Link
      href={`/videos/${video.id}`}
      className="group shrink-0 snap-start w-[210px] sm:w-[250px] md:w-[270px] flex flex-col gap-2.5 transition-all"
    >
      {/* Thumbnail with 16:9 aspect ratio */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--glass-border)] group-hover:border-[var(--color-magenta)] shadow-lg group-hover:shadow-[0_0_20px_rgba(224,0,255,0.25)] transition-all">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-purple-bright)] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
            <Film className="w-8 h-8" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors" />

        {/* Duration badge */}
        {video.duration_seconds > 0 && (
          <div className="absolute top-2 left-2 bg-[var(--bg-primary)]/85 backdrop-blur-md border border-[var(--glass-border-subtle)] text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-[var(--color-pink)]" />
            {formatDuration(video.duration_seconds)}
          </div>
        )}

        {/* Series badge */}
        {video.series && (
          <div className="absolute bottom-2 left-2 bg-[var(--color-purple-bright)]/85 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
            Series
          </div>
        )}

        {/* Lock badge */}
        {video.is_locked && (
          <div className="absolute top-2 right-2 bg-[var(--bg-primary)]/85 backdrop-blur-md border border-[var(--glass-border)] p-1.5 rounded-md">
            <Lock className="w-3 h-3 text-[var(--color-pink)]" />
          </div>
        )}

        {/* Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-11 h-11 rounded-full theme-neon-button flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Meta details */}
      <div className="px-1 flex flex-col gap-1">
        <h3 className="text-white text-xs sm:text-sm font-bold line-clamp-2 leading-tight group-hover:text-[var(--color-pink)] transition-colors">
          {video.title}
        </h3>

        <div className="flex items-center gap-2 mt-0.5">
          <div className="relative w-5 h-5 rounded-full overflow-hidden bg-[var(--color-purple-bright)]/20 border border-[var(--glass-border-subtle)] shrink-0 flex items-center justify-center">
            {video.creator?.avatar_url ? (
              <Image src={video.creator.avatar_url} alt="" fill className="object-cover" />
            ) : (
              <span className="text-[8px] font-bold text-[var(--color-pink)]">
                {video.creator?.display_name?.[0] || 'C'}
              </span>
            )}
          </div>
          <span className="text-[var(--text-muted)] text-[11px] truncate font-medium">
            @{video.creator?.username || video.creator?.display_name || 'creator'}
          </span>
        </div>
      </div>
    </Link>
  );
}
