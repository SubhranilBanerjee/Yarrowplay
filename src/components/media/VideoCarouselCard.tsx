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
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#161522] ring-1 ring-white/10 transition-all">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8B5CF6] bg-gradient-to-br from-[#161522] to-[#1E1B2E]">
            <Film className="w-8 h-8" />
          </div>
        )}

        {/* Duration badge */}
        {video.duration_seconds > 0 && (
          <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-[#EC4899]" />
            {formatDuration(video.duration_seconds)}
          </div>
        )}

        {/* Series badge */}
        {video.series && (
          <div className="absolute bottom-2 left-2 bg-[#7C3AED]/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            Series
          </div>
        )}

        {/* Lock badge */}
        {video.is_locked && (
          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md p-1.5 rounded">
            <Lock className="w-3 h-3 text-[#EC4899]" />
          </div>
        )}

        {/* Play Button on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-[#8B5CF6]/90 text-white flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.6)] transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Meta details */}
      <div className="pt-1 flex flex-col gap-0.5">
        <h3 className="text-[#F9FAFB] text-xs sm:text-sm font-semibold line-clamp-1 leading-tight group-hover:text-[#A855F7] transition-colors">
          {video.title}
        </h3>

        <div className="flex items-center gap-2 mt-0.5">
          <div className="relative w-4 h-4 rounded-full overflow-hidden bg-[#8B5CF6]/20 shrink-0 flex items-center justify-center">
            {video.creator?.avatar_url ? (
              <Image src={video.creator.avatar_url} alt="" fill className="object-cover" />
            ) : (
              <span className="text-[8px] font-bold text-[#A855F7]">
                {video.creator?.display_name?.[0] || 'C'}
              </span>
            )}
          </div>
          <span className="text-[#9CA3AF] text-[11px] truncate font-normal">
            @{video.creator?.username || video.creator?.display_name || 'creator'}
          </span>
        </div>
      </div>
    </Link>
  );
}
