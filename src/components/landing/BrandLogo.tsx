import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  href?: string;
  className?: string;
}

export function BrandLogo({ href = '/', className = '' }: BrandLogoProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 group shrink-0 select-none ${className}`}
    >
      {/* Golden Lighthouse Icon */}
      <div className="relative w-8 h-9 flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(236,201,121,0.35)] transition-transform duration-300 group-hover:scale-105">
        <svg
          viewBox="0 0 40 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-9"
        >
          <defs>
            <linearGradient id="logo-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF0C2" />
              <stop offset="40%" stopColor="#ECC979" />
              <stop offset="80%" stopColor="#D4A745" />
              <stop offset="100%" stopColor="#9C731A" />
            </linearGradient>
            <linearGradient id="logo-glow" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#FFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ECC979" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Roof finial and dome */}
          <path d="M20 2L20 6" stroke="url(#logo-gold)" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 12C14 8 16 6 20 6C24 6 26 8 26 12Z" fill="url(#logo-gold)" />

          {/* Lantern room with glow */}
          <rect x="15" y="12" width="10" height="7" rx="1" fill="#151A20" stroke="url(#logo-gold)" strokeWidth="1.5" />
          <rect x="18" y="14" width="4" height="4" rx="0.5" fill="url(#logo-glow)" />

          {/* Balcony / Gallery Railing */}
          <rect x="11" y="19" width="18" height="2.5" rx="1" fill="url(#logo-gold)" />

          {/* Tower main shaft (tapered) */}
          <path d="M13 21.5L10 40H30L27 21.5H13Z" fill="url(#logo-gold)" />

          {/* Tower window cutouts */}
          <rect x="18.5" y="24" width="3" height="4" rx="1" fill="#0D1217" />
          <rect x="18" y="31" width="4" height="5" rx="1" fill="#0D1217" />

          {/* Foundation stepped base */}
          <rect x="8" y="40" width="24" height="3" rx="1" fill="url(#logo-gold)" />
          <rect x="6" y="43" width="28" height="3" rx="1" fill="#B88A2D" />
        </svg>
      </div>

      {/* Brand Text: LIGHTHOUSE over REELS */}
      <div className="flex flex-col leading-none">
        <span className="text-[13px] md:text-[15px] font-bold tracking-[0.16em] text-[#F5F1E8] uppercase font-serif">
          LIGHTHOUSE
        </span>
        <span className="text-[10px] md:text-[11px] font-semibold tracking-[0.34em] text-[#ECC979] uppercase mt-0.5">
          REELS
        </span>
      </div>
    </Link>
  );
}
