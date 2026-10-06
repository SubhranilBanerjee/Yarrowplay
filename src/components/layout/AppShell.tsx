'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNavbar } from '@/components/layout/MobileNavbar';
import { AudioPlayerBar } from '@/components/media/AudioPlayerBar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isStandalonePage =
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/register' ||
    pathname === '/login' ||
    pathname === '/forgot-password';

  if (isStandalonePage) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <>
      <Header />
      <div className="flex flex-1 min-h-[calc(100vh-61px)]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-28 md:pb-24 bg-transparent min-w-0">
          {children}
        </main>
      </div>
      <AudioPlayerBar />
      <MobileNavbar />
    </>
  );
}
