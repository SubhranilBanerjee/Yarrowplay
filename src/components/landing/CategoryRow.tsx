'use client';

import React, { useRef } from 'react';
import { SectionHeader } from './SectionHeader';
import { VerticalVideoCard } from './VerticalVideoCard';
import { VideoItem } from '@/data/content';

interface CategoryRowProps {
  categoryName: string;
  subtitle?: string;
  viewAllHref?: string;
  items: VideoItem[];
  onSelectVideo?: (video: VideoItem) => void;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  categoryName,
  subtitle,
  viewAllHref,
  items,
  onSelectVideo,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -480 : 480;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="w-full py-6">
      <SectionHeader
        title={categoryName}
        subtitle={subtitle}
        viewAllHref={viewAllHref}
        showControls={items.length > 3}
        onPrev={() => handleScroll('left')}
        onNext={() => handleScroll('right')}
      />

      {/* Horizontal Scroll Area */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 scrollbar-none scroll-smooth -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((video, index) => (
          <VerticalVideoCard
            key={video.id || `${categoryName}-${index}`}
            video={video}
            onSelect={onSelectVideo}
          />
        ))}
      </div>
    </section>
  );
};
