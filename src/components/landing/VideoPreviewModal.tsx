'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Play, Heart, Share2, CheckCircle2, Eye, Clock, Film } from 'lucide-react';
import { VideoItem } from '@/data/content';

interface VideoPreviewModalProps {
  video: VideoItem | null;
  onClose: () => void;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  video,
  onClose,
}) => {
  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#161522] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-purple-950/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Canvas / Thumbnail */}
        <div className="relative aspect-[9/14] sm:aspect-[9/12] w-full bg-[#1E1B2E] overflow-hidden group">
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#161522] via-[#1E1B2E] to-[#2E2A45] p-6 text-center">
              <Film className="w-16 h-16 text-[#8B5CF6]/50 mb-3" />
              <p className="text-white font-bold text-lg">{video.title}</p>
            </div>
          )}

          {/* Center Play Button Overlay */}
          <Link
            href={`/videos/${video.id}`}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#8B5CF6]/90 hover:bg-[#7C3AED] text-white flex items-center justify-center shadow-xl shadow-purple-950/80 cursor-pointer hover:scale-110 transition-transform">
              <Play className="w-7 h-7 fill-current ml-1" />
            </div>
          </Link>

          {video.category && (
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white bg-black/60 backdrop-blur-md rounded-full border border-white/10">
                {video.category}
              </span>
            </div>
          )}

          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#161522] via-[#161522]/80 to-transparent p-6 pt-12">
            <h3 className="text-xl font-bold text-white mb-2">{video.title}</h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#8B5CF6]/50 bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center">
                  {video.creator.avatar ? (
                    <Image
                      src={video.creator.avatar}
                      alt={video.creator.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-xs uppercase">
                      {(video.creator.name || 'C')[0]}
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-white">
                      {video.creator.name}
                    </span>
                    {video.creator.verified && (
                      <CheckCircle2 className="w-4 h-4 text-[#8B5CF6]" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{video.creator.handle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  aria-label="Like"
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <Heart className="w-4 h-4 hover:text-[#EC4899]" />
                </button>
                <button
                  aria-label="Share"
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {video.views} views
              </span>
              {video.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {video.duration}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
