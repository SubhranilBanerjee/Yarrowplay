'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, Compass, Film, BookOpen, User, Megaphone } from 'lucide-react';

export function MobileNavbar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-primary)]/90 backdrop-blur-xl border-t border-[var(--glass-border)] px-2 py-2">
      <div className="flex items-center justify-around">
        <Link
          href="/home"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            pathname === '/home' ? 'text-[var(--color-pink)] drop-shadow-[0_0_8px_rgba(255,32,217,0.5)]' : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>

        <Link
          href="/explore"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            pathname === '/explore' ? 'text-[var(--color-pink)] drop-shadow-[0_0_8px_rgba(255,32,217,0.5)]' : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Explore</span>
        </Link>

        {profile?.role === 'advertiser' ? (
          <Link
            href="/advertiser"
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              pathname.startsWith('/advertiser') ? 'text-[var(--color-pink)]' : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <div className="p-2 rounded-full theme-neon-button -mt-3 shadow-lg">
              <Megaphone className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-[var(--color-pink)]">Studio</span>
          </Link>
        ) : (
          <Link
            href="/creator/studio"
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              pathname.startsWith('/creator/studio') ? 'text-[var(--color-pink)]' : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <div className="p-2 rounded-full theme-neon-button -mt-3 shadow-lg">
              <Film className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-[var(--color-pink)]">Studio</span>
          </Link>
        )}

        <Link
          href="/blogs"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            pathname.startsWith('/blogs') ? 'text-[var(--color-pink)] drop-shadow-[0_0_8px_rgba(255,32,217,0.5)]' : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Blogs</span>
        </Link>

        <Link
          href={user ? `/profile/${profile?.username || user.id}` : '/login'}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            pathname.startsWith('/profile') || pathname === '/login'
              ? 'text-[var(--color-pink)] drop-shadow-[0_0_8px_rgba(255,32,217,0.5)]'
              : 'text-[var(--text-muted)] hover:text-white'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{user ? 'Profile' : 'Sign In'}</span>
        </Link>
      </div>
    </nav>
  );
}
