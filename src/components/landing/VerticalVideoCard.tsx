'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Play, Heart, CheckCircle2, Eye, Film } from 'lucide-react';
import { VideoItem } from '@/data/content';

interface VerticalVideoCardProps {
  video: VideoItem;
  onSelect?: (video: VideoItem) => void;
  accentBorderColor?: 'purple' | 'amber' | 'default';
}

export const VerticalVideoCard: React.FC<VerticalVideoCardProps> = ({
  video,
  onSelect,
  accentBorderColor = 'default',
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount] = useState(() => video.likes || '0');

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const getBorderClasses = () => {
    if (accentBorderColor === 'amber') {
      return 'border-[#F59E0B]/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]';
    }
    if (accentBorderColor === 'purple') {
      return 'border-[#8B5CF6]/80 shadow-[0_0_20px_rgba(139,92,246,0.3)]';
    }
    return 'border-white/10 hover:border-[#8B5CF6]/80 hover:shadow-lg hover:shadow-purple-950/50';
  };

  return (
    <div
      onClick={() => onSelect?.(video)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect?.(video);
        }
      }}
      className={`group relative flex-shrink-0 w-[200px] sm:w-[220px] md:w-[230px] lg:w-[240px] aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ease-out border bg-[#1E1B2E] select-none hover:scale-[1.02] ${getBorderClasses()}`}
    >
      {/* Dynamic Background Thumbnail from Supabase or programmatic fallback */}
      <div className="absolute inset-0 w-full h-full">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 200px, (max-width: 1024px) 230px, 240px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#161522] via-[#1E1B2E] to-[#25223A] p-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Film className="w-6 h-6 text-[#8B5CF6]" />
            </div>
            <span className="text-xs font-semibold text-gray-300 line-clamp-2 px-2">
              {video.title}
            </span>
            <span className="text-[10px] text-gray-500 uppercase font-bold mt-1">
              {video.category || 'Video'}
            </span>
          </div>
        )}
      </div>

      {/* Top Badges: Category & Duration */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
        {video.category && (
          <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white bg-black/60 backdrop-blur-md rounded-full border border-white/10">
            {video.category}
          </span>
        )}

        {video.duration && (
          <span className="px-2 py-0.5 text-[11px] font-medium text-gray-200 bg-black/60 backdrop-blur-md rounded-md border border-white/10 ml-auto">
            {video.duration}
          </span>
        )}
      </div>

      {/* Center Play Button Overlay (Reveals smoothly on hover) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-12 h-12 rounded-full bg-[#8B5CF6]/90 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg shadow-purple-950/60">
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </div>
      </div>

      {/* Like Button */}
      <button
        onClick={handleLike}
        aria-label="Like video"
        className="absolute top-11 right-3 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            isLiked ? 'fill-[#EC4899] text-[#EC4899]' : 'hover:text-[#EC4899]'
          }`}
        />
      </button>

      {/* Bottom Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

      {/* Dynamic Metadata Pinned Inside Thumbnail Bottom */}
      <div className="absolute bottom-0 inset-x-0 p-3.5 z-10 flex flex-col justify-end">
        {/* Title */}
        <h3 className="text-sm sm:text-base font-bold text-[#F9FAFB] line-clamp-1 group-hover:text-white transition-colors">
          {video.title}
        </h3>

        {/* Creator Info */}
        <div className="flex items-center gap-2 mt-2">
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/20 shrink-0 bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center">
            {video.creator.avatar ? (
              <Image
                src={video.creator.avatar}
                alt={video.creator.name}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-[10px] font-bold text-white uppercase">
                {(video.creator.name || 'C')[0]}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className="text-xs text-gray-300 font-medium truncate">
              {video.creator.handle || video.creator.name}
            </span>
            {video.creator.verified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
            )}
          </div>
        </div>

        {/* Views / Stats row */}
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-gray-400" />
            <span>{video.views} views</span>
          </div>
          {video.likes && (
            <span className="text-[10px] text-gray-400 font-medium">
              {isLiked ? 'Liked' : `${likesCount} likes`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
