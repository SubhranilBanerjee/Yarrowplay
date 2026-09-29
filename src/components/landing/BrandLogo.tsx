'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface BrandLogoProps {
  href?: string | null;
  className?: string;
  imageClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  priority?: boolean;
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', { w: number; h: number }> = {
  xs: { w: 32, h: 32 },
  sm: { w: 40, h: 40 },
  md: { w: 46, h: 46 },
  lg: { w: 84, h: 84 },
  xl: { w: 120, h: 120 },
};

/**
 * BrandLogo — Canonical Single Source of Truth for the Lighthouse Reels Brand Logo.
 * Displays the canonical brand image: /branding/lighthouse-reels-logo.png
 * (also mirrored to /logo.png).
 *
 * To change the logo across the entire application, simply replace:
 * public/branding/lighthouse-reels-logo.png (or public/logo.png)
 */
export function BrandLogo({
  href = '/',
  className = '',
  imageClassName = '',
  size = 'md',
  showText = false,
  priority = false,
}: BrandLogoProps) {
  const dimensions =
    typeof size === 'number'
      ? { w: size, h: size }
      : SIZE_MAP[size] || SIZE_MAP.md;

  const content = (
    <div
      className={`inline-flex items-center gap-2.5 sm:gap-3 group shrink-0 select-none ${className}`}
      data-testid="brand-logo"
    >
      {/* Canonical Logo Image (unoptimized ensures changes to public/ immediately appear without Next.js cache stalling) */}
      <div
        className="relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 filter drop-shadow-[0_2px_10px_rgba(244,201,93,0.3)]"
        style={{ width: `${dimensions.w}px`, height: `${dimensions.h}px` }}
      >
        <Image
          src="/branding/lighthouse-reels-logo.png"
          alt="Lighthouse Reels"
          width={dimensions.w}
          height={dimensions.h}
          priority={priority}
          unoptimized
          className={`w-full h-full object-contain ${imageClassName}`}
        />
      </div>

      {/* Optional Branded Text (disabled by default because the canonical image already features the official gold typography) */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-[13px] md:text-[15px] font-bold tracking-[0.16em] text-[var(--foreground,#F5F1E8)] uppercase font-serif transition-colors">
            LIGHTHOUSE
          </span>
          <span className="text-[10px] md:text-[11px] font-bold tracking-[0.34em] text-[#ECC979] dark:text-[#ECC979] uppercase mt-0.5 transition-colors">
            REELS
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

export default BrandLogo;
