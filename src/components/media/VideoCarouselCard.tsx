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
      className="group shrink-0 snap-start w-[210px] sm:w-[250px] md:w-[270px] flex flex-col gap-2 transition-all cursor-pointer"
    >
      {/* Thumbnail with 16:9 aspect ratio */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#111A22] border border-white/[0.07] group-hover:border-[#F4C95D]/40 transition-all">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#F4C95D] bg-gradient-to-br from-[#111A22] to-[#151F28]">
            <Film className="w-8 h-8" />
          </div>
        )}

        {/* Duration badge */}
        {video.duration_seconds > 0 && (
          <div className="absolute top-2 left-2 bg-[#070B0F]/85 backdrop-blur-md text-[#F5F1E8] text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border border-[#27313A]">
            <Clock className="w-2.5 h-2.5 text-[#F4C95D]" />
            {formatDuration(video.duration_seconds)}
          </div>
        )}

        {/* Series badge */}
        {video.series && (
          <div className="absolute bottom-2 left-2 bg-[#F4C95D] text-[#0B0F13] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow">
            Series
          </div>
        )}

        {/* Lock badge */}
        {video.is_locked && (
          <div className="absolute top-2 right-2 bg-[#070B0F]/85 backdrop-blur-md p-1.5 rounded border border-[#27313A]">
            <Lock className="w-3 h-3 text-[#F4C95D]" />
          </div>
        )}

        {/* Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-[#F4C95D] text-[#0B0F13] flex items-center justify-center shadow-md transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Meta details */}
      <div className="pt-1 flex flex-col gap-0.5">
        <h3 className="text-[#F5F1E8] text-xs sm:text-sm font-semibold line-clamp-1 leading-tight group-hover:text-[#F4C95D] transition-colors">
          {video.title}
        </h3>

        <div className="flex items-center gap-2 mt-0.5">
          <div className="relative w-4 h-4 rounded-full overflow-hidden bg-[#151F28] border border-[#27313A] shrink-0 flex items-center justify-center">
            {video.creator?.avatar_url ? (
              <Image src={video.creator.avatar_url} alt="" fill className="object-cover" />
            ) : (
              <span className="text-[8px] font-bold text-[#F4C95D]">
                {video.creator?.display_name?.[0] || 'C'}
              </span>
            )}
          </div>
          <span className="text-[#7F8993] text-[11px] truncate font-normal">
            @{video.creator?.username || video.creator?.display_name || 'creator'}
          </span>
        </div>
      </div>
    </Link>
  );
}
