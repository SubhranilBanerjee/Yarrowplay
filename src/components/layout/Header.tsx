'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Search, Bell, User as UserIcon, LogOut, Film, Music, BookOpen, BarChart3, Megaphone } from 'lucide-react';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#2B2B2D]/95 backdrop-blur border-b border-[#454549] px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <Link href={user ? '/home' : '/'} className="flex items-center gap-3 shrink-0">
          <div className="relative w-8 h-8 md:w-9 md:h-9">
            <Image
              src="/logo.png"
              alt="Yarrowplay"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center">
            YARROW<span className="text-[#FF0080]">PLAY</span>
          </span>
        </Link>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#85858B]" />
            <input
              type="text"
              placeholder="Search videos, music, creators, blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#333336] text-white placeholder-[#85858B] text-sm rounded-full pl-10 pr-4 py-2 border border-[#454549] focus:outline-none focus:border-[#FF0080] transition-colors"
            />
          </div>
        </form>

        {/* User Navigation / Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {profile?.role === 'creator' && (
                <Link
                  href="/creator/studio"
                  className="hidden md:flex items-center gap-2 bg-[#FF0080] hover:bg-[#E00071] text-white text-xs md:text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  <Film className="w-4 h-4" />
                  Creator Studio
                </Link>
              )}

              {profile?.role === 'advertiser' && (
                <Link
                  href="/advertiser"
                  className="hidden md:flex items-center gap-2 bg-[#FF0080] hover:bg-[#E00071] text-white text-xs md:text-sm font-medium px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  <Megaphone className="w-4 h-4" />
                  Advertiser Studio
                </Link>
              )}

              {/* Notification button */}
              <button
                aria-label="Notifications"
                className="w-9 h-9 rounded-full bg-[#333336] border border-[#454549] flex items-center justify-center text-[#B8B8BD] hover:text-white transition-colors"
              >
                <Bell className="w-4 h-4" />
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-full bg-[#333336] border border-[#454549] hover:border-[#FF0080] transition-colors"
                >
                  {profile?.avatar_url ? (
                    <div className="relative w-7 h-7 rounded-full overflow-hidden">
                      <Image
                        src={profile.avatar_url}
                        alt="Avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#3A3A3E] flex items-center justify-center text-[#B8B8BD]">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#333336] border border-[#454549] shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#454549]">
                      <p className="text-sm font-semibold text-white truncate">
                        {profile?.display_name || user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#FF0080]/15 text-[#FF0080]">
                          {profile?.role || 'viewer'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1 text-sm text-[#B8B8BD]">
                      <Link
                        href={`/profile/${profile?.username || user.id}`}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-[#3A3A3E] hover:text-white"
                      >
                        <UserIcon className="w-4 h-4" />
                        My Profile
                      </Link>

                      {profile?.role === 'creator' && (
                        <>
                          <Link
                            href="/creator/studio"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-[#3A3A3E] hover:text-white text-[#FF0080]"
                          >
                            <Film className="w-4 h-4" />
                            Creator Studio
                          </Link>
                          <Link
                            href="/creator/analytics"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-[#3A3A3E] hover:text-white"
                          >
                            <BarChart3 className="w-4 h-4" />
                            Creator Analytics
                          </Link>
                        </>
                      )}

                      {profile?.role === 'advertiser' && (
                        <Link
                          href="/advertiser"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-[#3A3A3E] hover:text-white text-[#FF0080]"
                        >
                          <Megaphone className="w-4 h-4" />
                          Advertiser Studio
                        </Link>
                      )}

                      <Link
                        href="/blog/studio"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-[#3A3A3E] hover:text-white"
                      >
                        <BookOpen className="w-4 h-4" />
                        Write Blog
                      </Link>

                      <Link
                        href="/favorites"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-[#3A3A3E] hover:text-white"
                      >
                        Favorites
                      </Link>

                      <Link
                        href="/watchlist"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-[#3A3A3E] hover:text-white"
                      >
                        Watchlist
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-[#454549]">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#EF4444] hover:bg-[#3A3A3E] transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-white hover:text-[#FF0080] px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-[#FF0080] hover:bg-[#E00071] text-white px-4 py-2 rounded-xl transition-all"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
