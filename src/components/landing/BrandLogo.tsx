import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  className?: string;
}

export function BrandLogo({ href = '/', className = '' }: BrandLogoProps) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 group shrink-0 select-none ${className}`}>
      {/* Brand Mark: Stylized yellow/amber vector icon (#F59E0B to #EF4444 gradient) */}
      <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-[0_0_10px_rgba(245,158,11,0.4)] transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
          <defs>
            <linearGradient id="yarrow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
            <linearGradient id="yarrow-gradient-subtle" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
          {/* Stylized Y ribbon wings */}
          <path
            d="M8 6C8 6 12.5 12 18 17C23.5 12 28 6 28 6C28 6 23 15 19.8 19C19.8 19 19.8 28 19.8 30C19.8 30.8 19.2 31.5 18.4 31.5H17.6C16.8 31.5 16.2 30.8 16.2 30C16.2 28 16.2 19 16.2 19C13 15 8 6 8 6Z"
            fill="url(#yarrow-gradient)"
          />
          <path
            d="M10 7L18 16L26 7C24 13 19.5 18 19.5 18L18 19.5L16.5 18C16.5 18 12 13 10 7Z"
            fill="url(#yarrow-gradient-subtle)"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* Brand Text: White bold typography YARROWPLAY with #F9FAFB */}
      <span className="text-lg md:text-xl font-black tracking-tight text-[#F9FAFB] flex items-center">
        YARROWPLAY
      </span>
    </Link>
  );
}
