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
          className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#161522] ring-1 ring-white/10 block cursor-pointer"
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
            <div className="w-full h-full flex items-center justify-center text-[#9CA3AF]">
              <Film className="w-8 h-8" />
            </div>
          )}

          {/* Sponsored badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
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
              <h3 className="text-[#F9FAFB] font-semibold text-sm line-clamp-1 group-hover:text-[#EC4899] transition-colors">
                {item.title}
              </h3>
            </a>
            <p className="text-[#9CA3AF] text-xs line-clamp-1 mt-0.5">
              {advertiserName} · {item.headline || item.description}
            </p>
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#9CA3AF] truncate font-medium">
              Promoted
            </span>
            <a
              href={item.target_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAdClick}
              className="text-xs font-semibold px-3 py-1 bg-[#EC4899]/15 border border-[#EC4899]/30 text-[#EC4899] hover:bg-[#EC4899] hover:text-white rounded-full transition-all shadow-sm shrink-0 inline-flex items-center gap-1"
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
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#161522] ring-1 ring-white/10">
          {item.cover_url ? (
            <Image
              src={item.cover_url}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#8B5CF6] bg-gradient-to-br from-[#161522] to-[#1E1B2E]">
              <Music className="w-10 h-10" />
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-sm">
              <Music className="w-2.5 h-2.5 text-[#EC4899]" />
              Audio
            </span>
          </div>

          {/* Duration */}
          {item.duration_seconds > 0 && (
            <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md text-[#9CA3AF] text-[10px] font-medium px-1.5 py-0.5 rounded">
              {formatDuration(item.duration_seconds)}
            </div>
          )}

          {/* Play hover button */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/90 text-white flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.6)] transform group-hover:scale-110 transition-transform duration-200">
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
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
              className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/70 hover:bg-red-500 text-[#9CA3AF] hover:text-white backdrop-blur transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Metadata directly below image */}
        <div className="pt-2 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="text-[#F9FAFB] font-semibold text-sm line-clamp-1 group-hover:text-[#A855F7] transition-colors">
              {item.title}
            </h3>
            <p className="text-[#9CA3AF] text-xs line-clamp-1 mt-0.5 font-normal">
              {item.artist_name || item.creator?.display_name || 'Artist'}
            </p>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs text-[#9CA3AF]">
            <span className="truncate">{item.genre || 'Music'}</span>
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#EC4899] transition-colors" />
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
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#161522] ring-1 ring-white/10">
          {item.cover_url ? (
            <Image
              src={item.cover_url}
              alt={item.title}
              fill
              className="object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#8B5CF6] bg-gradient-to-br from-[#161522] to-[#1E1B2E]">
              <FileText className="w-10 h-10" />
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-sm">
              <FileText className="w-2.5 h-2.5 text-[#EC4899]" />
              Blog
            </span>
          </div>

          {/* Read hover button */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/90 text-white flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.6)] transform group-hover:scale-110 transition-transform duration-200">
              <FileText className="w-5 h-5 text-white" />
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
              className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/70 hover:bg-red-500 text-[#9CA3AF] hover:text-white backdrop-blur transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Metadata directly below image */}
        <div className="pt-2 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="text-[#F9FAFB] font-semibold text-sm line-clamp-1 group-hover:text-[#A855F7] transition-colors">
              {item.title}
            </h3>
            <p className="text-[#9CA3AF] text-xs line-clamp-1 mt-0.5 font-normal">
              {item.author?.display_name || 'Creator'}
            </p>
          </div>

          <div className="mt-1 flex items-center justify-between text-xs text-[#9CA3AF]">
            <span className="truncate">{item.category || 'Article'}</span>
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#EC4899] transition-colors" />
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
      {/* Thumbnail: rounded corners (rounded-xl) with ring-1 ring-white/10 */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#161522] ring-1 ring-white/10">
        {item.thumbnail_url ? (
          <Image
            src={item.thumbnail_url}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8B5CF6] bg-gradient-to-br from-[#161522] to-[#1E1B2E]">
            <Play className="w-10 h-10" />
          </div>
        )}

        {/* Video Type Badge (Top-Left) */}
        <div className="absolute top-2.5 left-2.5">
          <span className="bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-sm">
            <Play className="w-2.5 h-2.5 text-[#EC4899] fill-current" />
            Video
          </span>
        </div>

        {/* Duration (Bottom-Right) */}
        {item.duration_seconds > 0 && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md text-[#9CA3AF] text-[10px] font-medium px-1.5 py-0.5 rounded">
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
            className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/70 hover:bg-red-500 text-[#9CA3AF] hover:text-white backdrop-blur transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Hover State: prominent centered Play icon */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/90 text-white flex items-center justify-center shadow-[0_0_25px_rgba(139,92,246,0.6)] transform group-hover:scale-110 transition-transform duration-200">
            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Metadata directly below the image */}
      <div className="pt-2 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-[#F9FAFB] font-semibold text-sm line-clamp-1 group-hover:text-[#A855F7] transition-colors">
            {item.title}
          </h3>
          <p className="text-[#9CA3AF] text-xs line-clamp-1 mt-0.5 font-normal">
            {item.creator?.display_name || 'Creator'}
          </p>
        </div>

        <div className="mt-1 flex items-center justify-between text-xs text-[#9CA3AF]">
          <span>{item.views_count || 0} views</span>
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#EC4899] transition-colors" />
            <span>{item.likes_count || 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
