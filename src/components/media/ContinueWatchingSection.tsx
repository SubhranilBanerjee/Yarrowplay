'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, X, Clock, Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { WatchHistoryItem } from '@/types/database';

export function ContinueWatchingSection() {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    fetch('/api/watch-history?continue_watching=true&limit=15')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setItems(data.history || []);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleRemove = async (e: React.MouseEvent, videoId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic removal
    setItems((prev) => prev.filter((item) => item.video_id !== videoId));

    try {
      await fetch(`/api/watch-history?video_id=${videoId}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  };

  const handleScroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 320;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (!user || isLoading || items.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#F4C95D]/15 border border-[#F4C95D]/30">
            <Clock className="w-4 h-4 text-[#F4C95D]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#F5F1E8] tracking-tight">
              Continue Watching
            </h2>
            <p className="text-[11px] text-[#7F8993]">Pick up right where you left off</p>
          </div>
        </div>

        {items.length > 2 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleScroll('left')}
              title="Previous"
              className="w-7 h-7 rounded-full bg-[#151F28] hover:bg-[#111A22] text-[#B7BEC6] hover:text-[#F5F1E8] flex items-center justify-center transition-colors border border-[#27313A] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              title="Next"
              className="w-7 h-7 rounded-full bg-[#151F28] hover:bg-[#111A22] text-[#B7BEC6] hover:text-[#F5F1E8] flex items-center justify-center transition-colors border border-[#27313A] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory pt-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => {
          const video = item.video;
          if (!video) return null;

          const percent = item.progress_seconds && item.total_duration
            ? Math.min(100, Math.round((item.progress_seconds / item.total_duration) * 100))
            : 0;

          return (
            <div
              key={item.id}
              className="group relative w-60 sm:w-68 shrink-0 snap-start rounded-xl overflow-hidden bg-[#111A22] border border-white/[0.07] hover:border-[#F4C95D]/40 transition-all duration-300 hover:scale-[1.02] shadow-md"
            >
              {/* Thumbnail Container */}
              <Link href={`/videos/${video.id}?t=${Math.round(item.progress_seconds)}`} className="block relative aspect-video bg-[#0B1117]">
                {video.thumbnail_url ? (
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#151F28]">
                    <Film className="w-10 h-10 text-[#F4C95D] opacity-40" />
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={(e) => handleRemove(e, video.id)}
                  title="Remove from Continue Watching"
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/75 hover:bg-[#D96868] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 cursor-pointer shadow-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Center Hover Play Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F4C95D] text-[#0B0F13] shadow-md">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Progress bar attached to bottom of thumbnail */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#3B4650]">
                  <div
                    className="h-full bg-[#F4C95D]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </Link>

              {/* Card Meta */}
              <div className="p-3">
                {video.series && (
                  <p className="text-[10px] font-bold text-[#F4C95D] uppercase tracking-wider truncate mb-0.5">
                    {video.series.title}
                    {video.episode_number && ` · Ep ${video.episode_number}`}
                  </p>
                )}
                <h3 className="text-xs sm:text-sm font-semibold text-[#F5F1E8] truncate group-hover:text-[#F4C95D] transition-colors">
                  {video.title}
                </h3>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1C252D] text-[11px] text-[#7F8993]">
                  <span>{percent}% watched</span>
                  <Link
                    href={`/videos/${video.id}?t=${Math.round(item.progress_seconds)}`}
                    className="text-[#F4C95D] hover:underline font-semibold flex items-center gap-1"
                  >
                    Resume →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
