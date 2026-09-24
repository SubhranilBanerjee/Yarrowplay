'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function GalaxyBackground() {
  const pathname = usePathname();

  // Display the subtle background on the landing page ('/')
  if (pathname !== '/') {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Subtle cinematic ambient background */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -15%, rgba(244, 201, 93, 0.04), transparent 75%),
            radial-gradient(ellipse 60% 40% at 85% 25%, rgba(126, 155, 181, 0.03), transparent 60%),
            radial-gradient(ellipse 70% 45% at 15% 75%, rgba(16, 24, 32, 0.6), transparent 65%),
            radial-gradient(circle at 50% 50%, #070B0F, #05080B 100%)
          `,
        }}
      />
      {/* Subtle cinematic mesh grid overlay */}
      <div
        className="absolute inset-0 w-full h-full opacity-15"
        style={{
          backgroundImage: `radial-gradient(rgba(245, 241, 232, 0.1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}
