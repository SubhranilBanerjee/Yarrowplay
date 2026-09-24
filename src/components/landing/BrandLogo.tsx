import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  className?: string;
}

export function BrandLogo({ href = '/', className = '' }: BrandLogoProps) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 group shrink-0 select-none ${className}`}>
      {/* Brand Mark: Sophisticated geometric beam / reel crest */}
      <div className="relative w-8 h-8 flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(244,201,93,0.3)] transition-transform duration-300 group-hover:scale-105">
        <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
          <defs>
            <linearGradient id="lr-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFD978" />
              <stop offset="45%" stopColor="#F4C95D" />
              <stop offset="100%" stopColor="#C99A32" />
            </linearGradient>
            <linearGradient id="lr-beam-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#F4C95D" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FFD978" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {/* Subtle stylized tower / reel projector shape */}
          <path
            d="M15 8L21 8L23 28H13L15 8Z"
            fill="url(#lr-gold-gradient)"
          />
          {/* Lantern dome / lens */}
          <circle cx="18" cy="7" r="3" fill="#F5F1E8" />
          {/* Subtle light beacon flares */}
          <path
            d="M18 7L32 3L28 14Z"
            fill="url(#lr-beam-gradient)"
          />
          {/* Base pedestal line */}
          <rect x="11" y="28" width="14" height="2.5" rx="1" fill="#C99A32" />
        </svg>
      </div>

      {/* Brand Text: Warm Ivory & Gold */}
      <span className="text-lg md:text-xl font-black tracking-tight text-[#F5F1E8] flex items-center">
        LIGHTHOUSE <span className="text-[#F4C95D] ml-1.5 font-black">REELS</span>
      </span>
    </Link>
  );
}
