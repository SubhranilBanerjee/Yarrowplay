'use client';

import React, { useRef, useState } from 'react';
import { SectionHeader } from './SectionHeader';
import { VerticalVideoCard } from './VerticalVideoCard';
import { VideoItem } from '@/data/content';

interface RecommendedSectionProps {
  items: VideoItem[];
  onSelectVideo?: (video: VideoItem) => void;
}

export const RecommendedSection: React.FC<RecommendedSectionProps> = ({
  items,
  onSelectVideo,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(
    items[2]?.id || items[0]?.id || null
  );

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -500 : 500;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleCardClick = (video: VideoItem) => {
    setSelectedVideoId(video.id);
    onSelectVideo?.(video);
  };

  return (
    <section className="w-full py-6">
      <SectionHeader
        title="Recommended for you"
        subtitle="Curated short video content based on your activity."
        showControls={true}
        onPrev={() => handleScroll('left')}
        onNext={() => handleScroll('right')}
      />

      {/* Horizontal Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 scrollbar-none scroll-smooth -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((video, index) => {
          // Provide amber highlight for 3rd card or selected card like in reference image
          let accent: 'purple' | 'amber' | 'default' = 'default';
          if (video.id === selectedVideoId) {
            accent = index === 2 ? 'amber' : 'purple';
          } else if (index === 2) {
            accent = 'amber';
          }

          return (
            <VerticalVideoCard
              key={video.id}
              video={video}
              accentBorderColor={accent}
              onSelect={handleCardClick}
            />
          );
        })}
      </div>
    </section>
  );
};
