'use client';

import React from 'react';
import Image from 'next/image';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { CreatorItem } from '@/data/content';

interface CreatorSpotlightProps {
  creators: CreatorItem[];
  onCreatorClick?: (creator: CreatorItem) => void;
}

export const CreatorSpotlight: React.FC<CreatorSpotlightProps> = ({
  creators,
  onCreatorClick,
}) => {
  if (!creators || creators.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-6">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Creator Spotlight
        </h2>
        <p className="text-sm text-gray-400 mt-1 font-normal">
          Connect with active creators and trendsetters on Yarrowplay.
        </p>
      </div>

      {/* Dynamic Grid / Row of Creators from Supabase */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {creators.map((creator) => (
          <div
            key={creator.id}
            onClick={() => onCreatorClick?.(creator)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onCreatorClick?.(creator);
              }
            }}
            className="group flex items-center gap-3.5 p-3 rounded-2xl bg-[#161522]/60 hover:bg-[#1E1B2E] border border-white/5 hover:border-[#8B5CF6]/50 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-purple-950/30 hover:scale-[1.02]"
          >
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
              onClick={(e) => {
                e.stopPropagation();
              }}
              aria-label={`Follow ${creator.name}`}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#8B5CF6] text-gray-400 hover:text-white flex items-center justify-center transition-colors shrink-0 opacity-0 group-hover:opacity-100"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
