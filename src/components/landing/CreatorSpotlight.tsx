'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { CreatorItem } from '@/data/content';
import { SectionHeader } from './SectionHeader';

interface CreatorSpotlightProps {
  creators: CreatorItem[];
  onCreatorClick?: (creator: CreatorItem) => void;
}

export const CreatorSpotlight: React.FC<CreatorSpotlightProps> = ({
  creators,
  onCreatorClick,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  if (!creators || creators.length === 0) {
    return null;
  }

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = Math.max(scrollContainerRef.current.clientWidth * 0.75, 280);
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="w-full py-6">
      <SectionHeader
        title="Creator Spotlight"
        subtitle="Connect with active creators and trendsetters on Yarrowplay."
        showControls={creators.length > 2}
        onPrev={() => handleScroll('left')}
        onNext={() => handleScroll('right')}
      />

      {/* Horizontally scrollable track of creators */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {creators.map((creator) => {
          const profileSlug = creator.handle?.replace(/^@/, '') || creator.id;
          const CardContent = (
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#161522]/80 hover:bg-[#1E1B2E] border border-white/5 hover:border-[#8B5CF6]/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-purple-950/30 hover:scale-[1.02] w-full">
              {/* Dynamic Avatar or Programmatic Monogram */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden shrink-0 ring-2 ring-white/10 group-hover:ring-[#8B5CF6]/80 transition-all bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white font-bold text-base sm:text-lg">
                {creator.avatar ? (
                  <Image
                    src={creator.avatar}
                    alt={creator.name}
                    fill
                    sizes="56px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span>{(creator.name || 'C')[0].toUpperCase()}</span>
                )}
              </div>

              {/* Creator Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white group-hover:text-[#A78BFA] transition-colors truncate">
                    {creator.name}
                  </span>
                  {creator.verified && (
                    <CheckCircle2 className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate font-normal">
                  {creator.followers || creator.handle}
                </p>
              </div>

              {/* Follow button icon */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                aria-label={`Follow ${creator.name}`}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#8B5CF6] text-gray-400 hover:text-white flex items-center justify-center transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              >
                <UserPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          );

          return (
            <div
              key={creator.id}
              className="w-[240px] sm:w-[270px] shrink-0 snap-start group"
            >
              {onCreatorClick ? (
                <div
                  onClick={() => onCreatorClick(creator)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onCreatorClick(creator);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {CardContent}
                </div>
              ) : (
                <Link href={`/profile/${profileSlug}`} className="block cursor-pointer">
                  {CardContent}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

