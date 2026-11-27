'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { HeroLighthouseBackground } from '@/components/landing/HeroLighthouseBackground';

export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 relative selection:bg-purple-600 selection:text-white overflow-x-hidden ${
        isLight ? 'bg-white text-slate-900' : 'bg-[#070314] text-white'
      }`}
    >
      {/* Shared Full-Page Violet Lighthouse & Physics Light Beam Backdrop */}
      <HeroLighthouseBackground isLight={isLight} />

      {/* Admin Content Layer */}
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
}
