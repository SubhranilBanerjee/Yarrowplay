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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A1016]/95 backdrop-blur-xl border-t border-[#1C252D] px-2 py-2">
      <div className="flex items-center justify-around">
        <Link
          href="/home"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
            pathname === '/home' ? 'text-[#F4C95D]' : 'text-[#B7BEC6] hover:text-[#F5F1E8]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>

        <Link
          href="/explore"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
            pathname === '/explore' ? 'text-[#F4C95D]' : 'text-[#B7BEC6] hover:text-[#F5F1E8]'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Explore</span>
        </Link>

        {profile?.role === 'advertiser' ? (
          <Link
            href="/advertiser"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
              pathname.startsWith('/advertiser') ? 'text-[#F4C95D]' : 'text-[#B7BEC6] hover:text-[#F5F1E8]'
            }`}
          >
            <div className="p-2 rounded-full bg-[#F4C95D] text-[#0B0F13] -mt-3 shadow-md">
              <Megaphone className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-[#F4C95D]">Studio</span>
          </Link>
        ) : (
          <Link
            href="/creator/studio"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
              pathname.startsWith('/creator/studio') ? 'text-[#F4C95D]' : 'text-[#B7BEC6] hover:text-[#F5F1E8]'
            }`}
          >
            <div className="p-2 rounded-full bg-[#F4C95D] text-[#0B0F13] -mt-3 shadow-md">
              <Film className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-[#F4C95D]">Studio</span>
          </Link>
        )}

        <Link
          href="/blogs"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
            pathname.startsWith('/blogs') ? 'text-[#F4C95D]' : 'text-[#B7BEC6] hover:text-[#F5F1E8]'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Blogs</span>
        </Link>

        <Link
          href={user ? `/profile/${profile?.username || user.id}` : '/login'}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
            pathname.startsWith('/profile') || pathname === '/login'
              ? 'text-[#F4C95D]'
              : 'text-[#B7BEC6] hover:text-[#F5F1E8]'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold">{user ? 'Profile' : 'Sign In'}</span>
        </Link>
      </div>
    </nav>
  );
}
