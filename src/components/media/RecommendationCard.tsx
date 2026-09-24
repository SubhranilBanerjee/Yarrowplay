'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Play, Music, BookOpen, Clock, Heart } from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';

export interface RecommendationItem {
  id: string;
  contentType: 'video' | 'audio' | 'blog';
  score: number;
  reason: string;
  title: string;
  genre?: string | null;
  category?: string | null;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  likes_count?: number;
  views_count?: number;
  creator?: {
    id: string;
    display_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  } | null;
  rawItem?: any;
}

function formatDuration(seconds?: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function RecommendationCard({ item }: { item: RecommendationItem }) {
  const { playTrack } = useAudioPlayer();

  const isAudio = item.contentType === 'audio';
  const isBlog = item.contentType === 'blog';
  const targetHref = isBlog
    ? `/blogs/${item.id}`
    : isAudio
    ? '#'
    : `/videos/${item.id}`;

  const handleClick = (e: React.MouseEvent) => {
    if (isAudio && item.rawItem) {
      e.preventDefault();
      playTrack(item.rawItem, [item.rawItem]);
    }
  };

  return (
    <Link
      href={targetHref}
      onClick={handleClick}
      className="group shrink-0 snap-start w-[240px] sm:w-[270px] flex flex-col gap-2.5 transition-all cursor-pointer"
    >
      {/* Thumbnail container */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#111A22] border border-white/[0.07] group-hover:border-[#F4C95D]/40 transition-all">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 240px, 270px"
            className="object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111A22] to-[#151F28] text-[#F4C95D]">
            {isAudio ? <Music className="w-8 h-8" /> : isBlog ? <BookOpen className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </div>
        )}

        {/* Reason badge */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          <span className="bg-[#070B0F]/85 backdrop-blur-md border border-[#27313A] text-[#F4C95D] text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm truncate max-w-[75%]">
            <Sparkles className="w-3 h-3 shrink-0 text-[#F4C95D]" />
            <span className="truncate">{item.reason}</span>
          </span>

          {item.score > 0 && (
            <span className="bg-[#F4C95D] text-[#0B0F13] text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm shrink-0">
              {Math.min(item.score, 99)}% Match
            </span>
          )}
        </div>

        {/* Content type or duration */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="bg-[#070B0F]/85 backdrop-blur-sm text-[#B7BEC6] text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border border-[#27313A]">
            {item.contentType}
          </span>

          {item.duration_seconds && item.duration_seconds > 0 ? (
            <span className="bg-[#070B0F]/85 backdrop-blur-sm text-[#B7BEC6] text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 border border-[#27313A]">
              <Clock className="w-2.5 h-2.5 text-[#F4C95D]" />
              {formatDuration(item.duration_seconds)}
            </span>
          ) : (
            item.likes_count && item.likes_count > 0 ? (
              <span className="bg-[#070B0F]/85 backdrop-blur-sm text-[#B7BEC6] text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1 border border-[#27313A]">
                <Heart className="w-2.5 h-2.5 text-[#D96868] fill-[#D96868]" />
                {item.likes_count}
              </span>
            ) : null
          )}
        </div>

        {/* Play icon overlay on hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-[#F4C95D] text-[#0B0F13] flex items-center justify-center shadow-md transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info directly below image */}
      <div className="pt-1 flex items-start gap-2 px-0.5">
        {item.creator?.avatar_url ? (
          <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 mt-0.5 border border-[#27313A]">
            <Image src={item.creator.avatar_url} alt="" fill className="object-cover" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-[#151F28] text-[#F4C95D] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[#27313A]">
            {item.creator?.display_name?.[0] || 'C'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-semibold text-[#F5F1E8] truncate group-hover:text-[#F4C95D] transition-colors">
            {item.title}
          </h4>
          <p className="text-[11px] text-[#7F8993] truncate mt-0.5 font-normal">
            {item.creator?.display_name || item.creator?.username || 'Creator'}
            {item.genre && ` · ${item.genre}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
