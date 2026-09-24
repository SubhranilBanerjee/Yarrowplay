'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Heart, Clock, FileText, Music, Film, Trash2, ExternalLink } from 'lucide-react';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { Video, AudioTrack, Blog, AdvertiserCampaign, ContentSeries } from '@/types/database';
import { SeriesCard } from '@/components/media/SeriesCard';

export type UnifiedMediaItem =
  | ({ type: 'series'; first_episode_id?: string; episode_count?: number } & ContentSeries)
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

  if (item.type === 'series') {
    return <SeriesCard series={item} />;
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ─── 1. ADVERTISER CAMPAIGN ────────────────────────────────────────────────
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
      <div className="group relative bg-transparent flex flex-col h-full">
        {/* Thumbnail area with ring-1 ring-white/10 */}
        <a
          href={item.target_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAdClick}
          className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#111A22] border border-[#27313A] block cursor-pointer"
        >
          {item.media_type === 'video' ? (
            <video
              src={item.media_url}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
            />
          ) : item.media_url ? (
            <Image
              src={item.media_url}
              alt={item.title}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#7F8993]">
              <Film className="w-8 h-8" />
            </div>
          )}

          {/* Sponsored badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-[#070B0F]/80 backdrop-blur-md border border-[#27313A] text-[#F5F1E8] text-[10px] font-medium px-2 py-0.5 rounded shadow-sm">
              Sponsored
            </span>
          </div>
        </a>

        {/* Metadata directly below image */}
        <div className="pt-2 flex flex-col flex-1 justify-between gap-1.5">
          <div>
            <a
              href={item.target_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="block"
            >
              <h3 className="text-[#F5F1E8] font-semibold text-sm line-clamp-1 group-hover:text-[#F4C95D] transition-colors">
                {item.title}
              </h3>
            </a>
            <p className="text-[#7F8993] text-xs line-clamp-1 mt-0.5">
              {advertiserName} · {item.headline || item.description}
            </p>
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#7F8993] truncate font-medium">
              Promoted
            </span>
            <a
              href={item.target_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="text-xs font-semibold px-3 py-1 bg-[#F4C95D] text-[#0B0F13] hover:bg-[#FFD978] rounded-md transition-all shadow-sm shrink-0 inline-flex items-center gap-1"
            >
              <span>{item.cta_label || 'Learn More'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── 2. AUDIO TRACK ────────────────────────────────────────────────────────
  if (item.type === 'audio') {
    return (
      <div
        onClick={() => playTrack(item, allAudioTracks)}
        className="group relative bg-transparent flex flex-col h-full cursor-pointer"
      >
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#111A22] border border-[#27313A]">
          {item.cover_url ? (
            <Image
              src={item.cover_url}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#7E9BB5] bg-[#111A22]">
              <Music className="w-10 h-10" />
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-[#070B0F]/80 backdrop-blur-md border border-[#27313A] text-[#F5F1E8] text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1.5 shadow-sm">
              <Music className="w-2.5 h-2.5 text-[#7E9BB5]" />
              Audio
            </span>
          </div>

          {/* Duration */}
          {item.duration_seconds > 0 && (
            <div className="absolute bottom-2.5 right-2.5 bg-[#070B0F]/85 backdrop-blur-md text-[#F5F1E8] text-[10px] font-medium px-1.5 py-0.5 rounded">
              {formatDuration(item.duration_seconds)}
            </div>
          )}

          {/* Play hover button */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
            <div className="w-11 h-11 rounded-full bg-[#F4C95D] text-[#0B0F13] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-200">
              <Play className="w-5 h-5 fill-[#0B0F13] text-[#0B0F13] ml-0.5" />
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
              className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/70 hover:bg-red-500 text-[#7F8993] hover:text-white backdrop-blur transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Metadata directly below image */}
        <div className="pt-2 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="text-[#F5F1E8] font-semibold text-sm line-clamp-1 group-hover:text-[#F4C95D] transition-colors">
              {item.title}
            </h3>
            <p className="text-[#7F8993] text-xs line-clamp-1 mt-0.5 font-normal">
              {item.artist_name || item.creator?.display_name || 'Artist'}
            </p>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs text-[#7F8993]">
            <span className="truncate">{item.genre || 'Music'}</span>
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-[#7F8993] group-hover:text-[#F4C95D] transition-colors" />
              <span>{item.likes_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── 3. BLOG POST ──────────────────────────────────────────────────────────
  if (item.type === 'blog') {
    return (
      <Link
        href={`/blogs/${item.id}`}
        className="group relative bg-transparent flex flex-col h-full cursor-pointer"
      >
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#111A22] border border-[#27313A]">
          {item.cover_url ? (
            <Image
              src={item.cover_url}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#7E9BB5] bg-[#111A22]">
              <FileText className="w-10 h-10" />
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-[#070B0F]/80 backdrop-blur-md border border-[#27313A] text-[#F5F1E8] text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1.5 shadow-sm">
              <FileText className="w-2.5 h-2.5 text-[#F4C95D]" />
              Blog
            </span>
          </div>

          {/* Read hover button */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
            <div className="w-11 h-11 rounded-full bg-[#F4C95D] text-[#0B0F13] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-200">
              <FileText className="w-5 h-5 text-[#0B0F13]" />
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
              title="Delete article"
              className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/70 hover:bg-red-500 text-[#7F8993] hover:text-white backdrop-blur transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Metadata directly below image */}
        <div className="pt-2 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="text-[#F5F1E8] font-semibold text-sm line-clamp-1 group-hover:text-[#F4C95D] transition-colors">
              {item.title}
            </h3>
            <p className="text-[#7F8993] text-xs line-clamp-1 mt-0.5 font-normal">
              {item.author?.display_name || 'Creator'}
            </p>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs text-[#7F8993]">
            <span className="truncate">{item.category || 'Article'}</span>
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-[#7F8993] group-hover:text-[#F4C95D] transition-colors" />
              <span>{item.likes_count || 0}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ─── 4. VIDEO (Default Minimalist Borderless Focus) ─────────────────────────
  return (
    <Link
      href={`/videos/${item.id}`}
      className="group relative bg-transparent flex flex-col h-full cursor-pointer"
    >
      {/* Thumbnail: rounded corners (rounded-xl) with subtle border */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#111A22] border border-[#27313A]">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#F4C95D] bg-[#111A22]">
            <Play className="w-10 h-10" />
          </div>
        )}

        {/* Video Type Badge (Top-Left) */}
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-[#070B0F]/80 backdrop-blur-md border border-[#27313A] text-[#F5F1E8] text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1.5 shadow-sm">
            <Play className="w-2.5 h-2.5 text-[#F4C95D] fill-current" />
            Video
          </span>
        </div>

        {/* Duration (Bottom-Right) */}
        {item.duration_seconds > 0 && (
          <div className="absolute bottom-2.5 right-2.5 bg-[#070B0F]/85 backdrop-blur-md text-[#F5F1E8] text-[10px] font-medium px-1.5 py-0.5 rounded">
            {formatDuration(item.duration_seconds)}
          </div>
        )}

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
            className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/70 hover:bg-red-500 text-[#7F8993] hover:text-white backdrop-blur transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Hover State: prominent centered Play icon */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-[#F4C95D] text-[#0B0F13] flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-200">
            <Play className="w-5 h-5 fill-[#0B0F13] text-[#0B0F13] ml-0.5" />
          </div>
        </div>
      </div>

      {/* Metadata directly below the image */}
      <div className="pt-2 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-[#F5F1E8] font-semibold text-sm line-clamp-1 group-hover:text-[#F4C95D] transition-colors">
            {item.title}
          </h3>
          <p className="text-[#7F8993] text-xs line-clamp-1 mt-0.5 font-normal">
            {item.creator?.display_name || 'Creator'}
          </p>
        </div>

        <div className="mt-1 flex items-center justify-between text-xs text-[#7F8993]">
          <span>{item.views_count || 0} views</span>
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-[#7F8993] group-hover:text-[#F4C95D] transition-colors" />
            <span>{item.likes_count || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
