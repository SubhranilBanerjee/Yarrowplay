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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#2B2B2D]/95 backdrop-blur border-t border-[#454549] px-2 py-2">
      <div className="flex items-center justify-around">
        <Link
          href="/home"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            pathname === '/home' ? 'text-[#FF0080]' : 'text-[#85858B] hover:text-[#B8B8BD]'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link
          href="/explore"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            pathname === '/explore' ? 'text-[#FF0080]' : 'text-[#85858B] hover:text-[#B8B8BD]'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-medium">Explore</span>
        </Link>

        {profile?.role === 'creator' ? (
          <Link
            href="/creator/studio"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              pathname.startsWith('/creator/studio') ? 'text-[#FF0080]' : 'text-[#85858B] hover:text-[#B8B8BD]'
            }`}
          >
            <div className="p-1.5 rounded-full bg-[#FF0080] text-white -mt-3 shadow-lg">
              <Film className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-[#FF0080]">Studio</span>
          </Link>
        ) : profile?.role === 'advertiser' ? (
          <Link
            href="/advertiser"
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              pathname.startsWith('/advertiser') ? 'text-[#FF0080]' : 'text-[#85858B] hover:text-[#B8B8BD]'
            }`}
          >
            <div className="p-1.5 rounded-full bg-[#FF0080] text-white -mt-3 shadow-lg">
              <Megaphone className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-medium text-[#FF0080]">Studio</span>
          </Link>
        ) : null}

        <Link
          href="/blogs"
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            pathname.startsWith('/blogs') ? 'text-[#FF0080]' : 'text-[#85858B] hover:text-[#B8B8BD]'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium">Blogs</span>
        </Link>

        <Link
          href={user ? `/profile/${profile?.username || user.id}` : '/login'}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            pathname.startsWith('/profile') || pathname === '/login'
              ? 'text-[#FF0080]'
              : 'text-[#85858B] hover:text-[#B8B8BD]'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">{user ? 'Profile' : 'Sign In'}</span>
        </Link>
      </div>
    </nav>
  );
}
