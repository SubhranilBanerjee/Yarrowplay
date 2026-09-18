'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Galaxy from '@/components/Galaxy';

export function GalaxyBackground() {
  const pathname = usePathname();

  // Display the galaxy background only on the landing page ('/')
  if (pathname !== '/') {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full overflow-hidden select-none"
      aria-hidden="true"
    >
      <Galaxy
        mouseRepulsion={true}
        mouseInteraction={true}
        density={1.9}
        glowIntensity={0.5}
        saturation={0.8}
        hueShift={260}
        twinkleIntensity={0.7}
        transparent={true}
      />
    </div>
  );
}
