'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function GalaxyBackground() {
  const pathname = usePathname();

  // Display the static background on the landing page ('/')
  if (pathname !== '/') {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Static cosmic background */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -15%, rgba(139, 92, 246, 0.22), transparent 75%),
            radial-gradient(ellipse 60% 40% at 85% 25%, rgba(236, 72, 153, 0.14), transparent 60%),
            radial-gradient(ellipse 70% 45% at 15% 75%, rgba(124, 58, 237, 0.16), transparent 65%),
            radial-gradient(circle at 50% 50%, rgba(15, 14, 23, 0.95), #0B0A12 100%)
          `,
        }}
      />
      {/* Subtle cosmic grid & static stardust overlay */}
      <div
        className="absolute inset-0 w-full h-full opacity-35"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}
