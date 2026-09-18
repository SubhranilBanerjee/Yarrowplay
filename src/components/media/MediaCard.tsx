'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Heart, Clock, FileText, Music, Film, Trash2, ExternalLink } from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { Video, AudioTrack, Blog, AdvertiserCampaign } from '@/types/database';

export type UnifiedMediaItem =
  | ({ type: 'video' } & Video)
  | ({ type: 'audio' } & AudioTrack)
  | ({ type: 'blog' } & Blog)
  | ({ type: 'ad' } & AdvertiserCampaign);

interface MediaCardProps {
  item: UnifiedMediaItem;
  allAudioTracks?: AudioTrack[];
  onDelete?: () => void;
}

export function MediaCard({ item, allAudioTracks, onDelete }: MediaCardProps) {
  const { playTrack } = useAudioPlayer();

  useEffect(() => {
    if (item.type === 'ad' && item.id) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'ad',
          content_id: item.id,
          event_type: 'view',
        }),
      }).catch(() => {});
    }
  }, [item.id, item.type]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle ADVERTISER CAMPAIGN
  if (item.type === 'ad') {
    const handleAdClick = () => {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'ad',
          content_id: item.id,
          event_type: 'click',
        }),
      }).catch(() => {});
    };

    const advertiserName =
      item.advertiser?.company_name ||
      item.advertiser?.display_name ||
      item.advertiser?.username ||
      'Sponsored Partner';

    return (
      <div className="group relative theme-glass-card theme-glow-frame rounded-2xl overflow-hidden flex flex-col h-full">
        {/* Thumbnail area: square on mobile */}
        <a
          href={item.target_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAdClick}
          className="relative aspect-square sm:aspect-video w-full bg-[var(--bg-secondary)] overflow-hidden block cursor-pointer"
        >
          {item.media_type === 'video' ? (
            <video
              src={item.media_url}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : item.media_url ? (
            <Image
              src={item.media_url}
              alt={item.title}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
              <Film className="w-8 h-8" />
            </div>
          )}
        </a>

        {/* Ad Details */}
        <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
          <div>
            <a
              href={item.target_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="block group/title"
            >
              <h3 className="text-white font-semibold text-sm line-clamp-1 group-hover/title:text-[var(--color-pink)] transition-colors">
                {item.title}
              </h3>
            </a>
            <p className="text-[var(--text-secondary)] text-xs line-clamp-2 mt-1 leading-relaxed">
              {item.headline || item.description}
            </p>
          </div>

          <div className="pt-2 border-t border-[var(--glass-border-subtle)] flex items-center justify-between gap-2">
            <span className="text-[11px] text-[var(--text-muted)] truncate font-medium">
              {advertiserName}
            </span>
            <a
              href={item.target_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="text-xs font-semibold px-3 py-1.5 theme-neon-button rounded-xl transition-all shadow-sm shrink-0 inline-flex items-center gap-1.5 active:scale-95"
            >
              <span>{item.cta_label || 'Learn More'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Handle AUDIO
  if (item.type === 'audio') {
    return (
      <div
        onClick={() => playTrack(item, allAudioTracks)}
        className="group relative theme-glass-card theme-glow-frame rounded-2xl overflow-hidden flex flex-col h-full cursor-pointer"
      >
        <div className="relative aspect-square w-full bg-[var(--bg-secondary)] overflow-hidden">
          {item.cover_url ? (
            <Image
              src={item.cover_url}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-purple-bright)] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
              <Music className="w-12 h-12" />
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-2.5 left-2.5 bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--glass-border)] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Music className="w-3 h-3 text-[var(--color-pink)]" />
            Audio
          </div>

          {/* Duration */}
          {item.duration_seconds > 0 && (
            <div className="absolute bottom-2.5 right-2.5 bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--glass-border-subtle)] text-[var(--text-secondary)] text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(item.duration_seconds)}
            </div>
          )}

          {/* Play hover button */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full theme-neon-button flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Delete action */}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              title="Delete audio"
              className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/70 hover:bg-[var(--status-error)] text-[var(--text-muted)] hover:text-white backdrop-blur transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="p-3.5 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm line-clamp-1 group-hover:text-[var(--color-pink)] transition-colors">
              {item.title}
            </h3>
            <p className="text-[var(--text-secondary)] text-xs line-clamp-1 mt-1 font-normal">
              {item.artist_name || item.creator?.display_name}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-[var(--glass-border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="truncate">{item.genre || 'Music'}</span>
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-[var(--color-pink)]" />
              <span>{item.likes_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle BLOG
  if (item.type === 'blog') {
    return (
      <Link
        href={`/blogs/${item.id}`}
        className="group relative theme-glass-card theme-glow-frame rounded-2xl overflow-hidden flex flex-col h-full"
      >
        <div className="relative aspect-square sm:aspect-video w-full bg-[var(--bg-secondary)] overflow-hidden">
          {item.cover_url ? (
            <Image
              src={item.cover_url}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-purple-bright)] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
              <FileText className="w-10 h-10" />
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-2.5 left-2.5 bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--glass-border)] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <FileText className="w-3 h-3 text-[var(--color-pink)]" />
            Blog
          </div>

          {/* Delete action */}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              title="Delete article"
              className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/70 hover:bg-[var(--status-error)] text-[var(--text-muted)] hover:text-white backdrop-blur transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="p-3.5 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-[var(--color-pink)] transition-colors">
              {item.title}
            </h3>
            <p className="text-[var(--text-secondary)] text-xs line-clamp-2 mt-1 leading-relaxed">
              {item.body.replace(/[#*`_]/g, '')}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-[var(--glass-border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="truncate">{item.author?.display_name || 'Creator'}</span>
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-[var(--color-pink)]" />
              <span>{item.likes_count || 0}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Handle VIDEO
  return (
    <Link
      href={`/videos/${item.id}`}
      className="group relative theme-glass-card theme-glow-frame rounded-2xl overflow-hidden flex flex-col h-full"
    >
      <div className="relative aspect-square sm:aspect-video w-full bg-[var(--bg-secondary)] overflow-hidden">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-purple-bright)] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
            <Play className="w-10 h-10" />
          </div>
        )}

        {/* Video Type Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--glass-border)] text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Play className="w-2.5 h-2.5 text-[var(--color-pink)] fill-current" />
            Video
          </span>
        </div>

        {/* Delete action */}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            title="Delete video"
            className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/70 hover:bg-[var(--status-error)] text-[var(--text-muted)] hover:text-white backdrop-blur transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Duration */}
        {item.duration_seconds > 0 && (
          <div className="absolute bottom-2.5 right-2.5 bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--glass-border-subtle)] text-[var(--text-secondary)] text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(item.duration_seconds)}
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full theme-neon-button flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-white font-semibold text-sm line-clamp-1 group-hover:text-[var(--color-pink)] transition-colors">
            {item.title}
          </h3>
          <p className="text-[var(--text-secondary)] text-xs line-clamp-1 mt-1 font-normal">
            {item.creator?.display_name || 'Creator'}
          </p>
        </div>

        <div className="mt-3 pt-2 border-t border-[var(--glass-border-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>{item.views_count || 0} views</span>
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-[var(--color-pink)]" />
            <span>{item.likes_count || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
