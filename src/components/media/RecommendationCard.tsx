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
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--glass-border)] group-hover:border-[var(--color-magenta)]/60 group-hover:shadow-[0_0_20px_rgba(152,71,180,0.3)] transition-all">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 240px, 270px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)] text-[var(--color-pink)]">
            {isAudio ? <Music className="w-8 h-8" /> : isBlog ? <BookOpen className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Reason badge */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          <span className="bg-[var(--bg-primary)]/85 backdrop-blur-md border border-[var(--color-purple-bright)]/40 text-[var(--color-pink)] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm truncate max-w-[75%]">
            <Sparkles className="w-3 h-3 shrink-0 text-[var(--color-magenta)]" />
            <span className="truncate">{item.reason}</span>
          </span>

          {item.score > 0 && (
            <span className="bg-[var(--color-purple-bright)]/90 backdrop-blur-md text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-sm shrink-0">
              {Math.min(item.score, 99)}% Match
            </span>
          )}
        </div>

        {/* Content type or duration */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="bg-black/60 backdrop-blur-sm text-white/90 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded">
            {item.contentType}
          </span>

          {item.duration_seconds && item.duration_seconds > 0 ? (
            <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-[var(--color-pink)]" />
              {formatDuration(item.duration_seconds)}
            </span>
          ) : (
            item.likes_count && item.likes_count > 0 ? (
              <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                <Heart className="w-2.5 h-2.5 text-pink-400 fill-pink-400" />
                {item.likes_count}
              </span>
            ) : null
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2.5 px-0.5">
        {item.creator?.avatar_url ? (
          <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 mt-0.5 border border-[var(--glass-border)]">
            <Image src={item.creator.avatar_url} alt="" fill className="object-cover" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-[var(--color-purple-bright)]/20 text-[var(--color-pink)] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[var(--glass-border)]">
            {item.creator?.display_name?.[0] || 'C'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[var(--color-pink)] transition-colors">
            {item.title}
          </h4>
          <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
            {item.creator?.display_name || item.creator?.username || 'Creator'}
            {item.genre && ` · ${item.genre}`}
          </p>
        </div>
      </div>
    </Link>
  );
}
