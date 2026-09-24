'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface ContentCarouselProps {
  title: string;
  badge?: string;
  href?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}

export function ContentCarousel({
  title,
  badge,
  href,
  icon: Icon = Zap,
  children,
  className = '',
}: ContentCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, children]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 300);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className={`relative w-full group/carousel ${className}`}>
      {/* Header with Title and Nav Controls */}
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#F4C95D] shrink-0" />
          <h2 className="text-[#F5F1E8] font-bold text-base sm:text-lg tracking-tight">
            {title}
          </h2>
          {badge && (
            <span className="text-[#7F8993] text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#151F28] border border-[#27313A]">
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {href && (
            <Link
              href={href}
              className="text-xs font-semibold text-[#F4C95D] hover:underline transition-colors mr-2 flex items-center gap-1"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Carousel Arrow Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                canScrollLeft
                  ? 'bg-[#151F28] border-[#27313A] text-[#F5F1E8] hover:border-[#F4C95D] hover:bg-[#111A22] shadow'
                  : 'bg-[#111A22] border-[#1C252D] text-[#59636D] opacity-40 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                canScrollRight
                  ? 'bg-[#151F28] border-[#27313A] text-[#F5F1E8] hover:border-[#F4C95D] hover:bg-[#111A22] shadow'
                  : 'bg-[#111A22] border-[#1C252D] text-[#59636D] opacity-40 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scrolling Track */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-3 pt-1 px-1 scroll-smooth scrollbar-none snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
    </div>
  );
}
