'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  User as UserIcon,
  LogOut,
  Film,
  BookOpen,
  BarChart3,
  Megaphone,
  Home,
  Compass,
  Bookmark,
  Heart,
  PenTool,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Image from 'next/image';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A1016]/95 backdrop-blur-xl border-b border-[#27313A] px-4 md:px-8 py-2.5 transition-all">
      <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <Link href={user ? '/home' : '/'} className="flex items-center gap-3 shrink-0 group">
          <div className="relative w-8 h-8 md:w-9 md:h-9 flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(244,201,93,0.35)] transition-transform group-hover:scale-105">
            <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 md:w-8 md:h-8">
              <defs>
                <linearGradient id="header-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFD978" />
                  <stop offset="50%" stopColor="#F4C95D" />
                  <stop offset="100%" stopColor="#C99A32" />
                </linearGradient>
                <linearGradient id="header-beam-gradient" x1="0%" y1="50%" x2="100%" y2="50%">
                  <stop offset="0%" stopColor="#F4C95D" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#FFD978" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              <path d="M15 8L21 8L23 28H13L15 8Z" fill="url(#header-gold-gradient)" />
              <circle cx="18" cy="7" r="3" fill="#F5F1E8" />
              <path d="M18 7L32 3L28 14Z" fill="url(#header-beam-gradient)" />
              <rect x="11" y="28" width="14" height="2.5" rx="1" fill="#C99A32" />
            </svg>
          </div>
          <span className="text-lg md:text-xl font-black tracking-tight text-[#F5F1E8] flex items-center">
            LIGHTHOUSE <span className="text-[#F4C95D] ml-1.5 font-black">REELS</span>
          </span>
        </Link>

        {/* Collapsed vs Expanded Header Content */}
        {isCollapsed ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#141D26] hover:bg-[#151F28] border border-[#27313A] hover:border-[#F4C95D] text-xs font-semibold text-[#F5F1E8] transition-all shadow-sm cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[#F4C95D]" />
              <span className="hidden sm:inline">Search &amp; Studio</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#7F8993]" />
            </button>
            {user ? (
              <NotificationDropdown />
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold text-[#B7BEC6] hover:text-[#F5F1E8] px-2.5 py-1 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between gap-3 sm:gap-4">
            {/* Global Search Bar */}
            <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xl mx-2 sm:mx-4">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B7BEC6]" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search videos, series, creators, blogs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141D26] text-[#F5F1E8] placeholder-[#7F8993] text-sm rounded-lg pl-11 pr-4 py-2 border border-[#27313A] focus:outline-none focus:border-[#F4C95D] focus:bg-[#151F28] transition-all"
                />
              </div>
            </form>

            {/* User Navigation / Actions */}
            <div className="flex items-center gap-2.5">
              {user ? (
                <>
                  {profile?.role === 'creator' && (
                    <Link
                      href="/creator/studio"
                      className="hidden md:flex items-center gap-2 bg-[#151F28] border border-[#27313A] text-[#F4C95D] hover:bg-[#F4C95D] hover:text-[#0B0F13] text-xs md:text-sm font-semibold px-4 py-1.5 rounded-lg transition-all shadow-sm"
                    >
                      <Film className="w-4 h-4" />
                      Creator Studio
                    </Link>
                  )}

                  {profile?.role === 'advertiser' && (
                    <Link
                      href="/advertiser"
                      className="hidden md:flex items-center gap-2 bg-[#151F28] border border-[#27313A] text-[#7E9BB5] hover:bg-[#7E9BB5] hover:text-[#0B0F13] text-xs md:text-sm font-semibold px-4 py-1.5 rounded-lg transition-all shadow-sm"
                    >
                      <Megaphone className="w-4 h-4" />
                      Advertiser Studio
                    </Link>
                  )}

                  {/* Notifications */}
                  <NotificationDropdown />

                  {/* User Dropdown */}
                  <div ref={userMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 p-1 rounded-full bg-[#141D26] border border-[#27313A] hover:border-[#F4C95D] transition-all cursor-pointer"
                    >
                      {profile?.avatar_url ? (
                        <div className="relative w-7 h-7 rounded-full overflow-hidden">
                          <Image
                            src={profile.avatar_url}
                            alt="Avatar"
                            fill
                            sizes="28px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#151F28] flex items-center justify-center text-[#F4C95D] text-xs font-bold">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-60 rounded-xl bg-[#101820] border border-[#27313A] shadow-2xl py-2 z-50 max-h-[calc(100vh-80px)] overflow-y-auto">
                        {/* User Profile Summary */}
                        <div className="px-4 py-2.5 border-b border-[#1C252D]">
                          <p className="text-sm font-semibold text-[#F5F1E8] truncate">
                            {profile?.display_name || user.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#F4C95D]/15 text-[#F4C95D] border border-[#F4C95D]/30">
                              {profile?.role || 'viewer'}
                            </span>
                          </div>
                        </div>

                        {/* Navigation Items (All Sidebar Pages) */}
                        <div className="py-1 text-sm text-[#B7BEC6]">
                          <Link
                            href={`/profile/${profile?.username || user.id}`}
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname.startsWith('/profile')
                                ? 'bg-[#F4C95D]/12 text-[#F5F1E8] font-semibold'
                                : 'hover:bg-[#151F28] hover:text-[#F5F1E8]'
                            }`}
                          >
                            <UserIcon className="w-4 h-4 text-[#F4C95D]" />
                            <span>My Profile</span>
                          </Link>

                          <div className="my-1 border-t border-[#1C252D]" />

                          {/* Main Sidebar Pages */}
                          <Link
                            href="/home"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname === '/home'
                                ? 'bg-[#F4C95D]/12 text-[#F5F1E8] font-semibold'
                                : 'hover:bg-[#151F28] hover:text-[#F5F1E8]'
                            }`}
                          >
                            <Home className="w-4 h-4 text-[#9AA5AF]" />
                            <span>Home</span>
                          </Link>

                          <Link
                            href="/explore"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname === '/explore'
                                ? 'bg-[#F4C95D]/12 text-[#F5F1E8] font-semibold'
                                : 'hover:bg-[#151F28] hover:text-[#F5F1E8]'
                            }`}
                          >
                            <Compass className="w-4 h-4 text-[#9AA5AF]" />
                            <span>Explore</span>
                          </Link>

                          <Link
                            href="/blogs"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname === '/blogs'
                                ? 'bg-[#F4C95D]/12 text-[#F5F1E8] font-semibold'
                                : 'hover:bg-[#151F28] hover:text-[#F5F1E8]'
                            }`}
                          >
                            <BookOpen className="w-4 h-4 text-[#9AA5AF]" />
                            <span>Blogs</span>
                          </Link>

                          {/* Creator / Studio Pages */}
                          {user && (
                            <>
                              <div className="my-1 border-t border-[#1C252D]" />
                              <Link
                                href="/creator/studio"
                                onClick={() => setShowUserMenu(false)}
                                className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                                  pathname.startsWith('/creator/studio')
                                    ? 'bg-[#F4C95D]/12 text-[#F4C95D] font-semibold'
                                    : 'hover:bg-[#151F28] hover:text-[#F5F1E8] text-[#F4C95D]'
                                }`}
                              >
                                <Film className="w-4 h-4 text-[#F4C95D]" />
                                <span>Creator Studio</span>
                              </Link>

                              <Link
                                href="/creator/analytics"
                                onClick={() => setShowUserMenu(false)}
                                className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                                  pathname.startsWith('/creator/analytics')
                                    ? 'bg-[#F4C95D]/12 text-[#F5F1E8] font-semibold'
                                    : 'hover:bg-[#151F28] hover:text-[#F5F1E8]'
                                }`}
                              >
                                <BarChart3 className="w-4 h-4 text-[#7E9BB5]" />
                                <span>Creator Analytics</span>
                              </Link>
                            </>
                          )}

                          {profile?.role === 'advertiser' && (
                            <>
                              <div className="my-1 border-t border-[#1C252D]" />
                              <Link
                                href="/advertiser"
                                onClick={() => setShowUserMenu(false)}
                                className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                                  pathname.startsWith('/advertiser')
                                    ? 'bg-[#F4C95D]/12 text-[#7E9BB5] font-semibold'
                                    : 'hover:bg-[#151F28] hover:text-[#F5F1E8] text-[#7E9BB5]'
                                }`}
                              >
                                <Megaphone className="w-4 h-4 text-[#7E9BB5]" />
                                <span>Advertiser Studio</span>
                              </Link>
                            </>
                          )}

                          <Link
                            href="/blog/studio"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname.startsWith('/blog/studio')
                                ? 'bg-[#F4C95D]/12 text-[#F5F1E8] font-semibold'
                                : 'hover:bg-[#151F28] hover:text-[#F5F1E8]'
                            }`}
                          >
                            <PenTool className="w-4 h-4 text-[#9AA5AF]" />
                            <span>Write Blog</span>
                          </Link>

                          <div className="my-1 border-t border-[#1C252D]" />

                          {/* Personal Library Pages */}
                          <Link
                            href="/watchlist"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname.startsWith('/watchlist')
                                ? 'bg-[#F4C95D]/12 text-[#F5F1E8] font-semibold'
                                : 'hover:bg-[#151F28] hover:text-[#F5F1E8]'
                            }`}
                          >
                            <Bookmark className="w-4 h-4 text-[#9AA5AF]" />
                            <span>Watchlist</span>
                          </Link>

                          <Link
                            href="/favorites"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname.startsWith('/favorites')
                                ? 'bg-[#F4C95D]/12 text-[#F5F1E8] font-semibold'
                                : 'hover:bg-[#151F28] hover:text-[#F5F1E8]'
                            }`}
                          >
                            <Heart className="w-4 h-4 text-[#9AA5AF]" />
                            <span>Favorites</span>
                          </Link>
                        </div>

                        {/* Sign Out */}
                        <div className="pt-1 mt-1 border-t border-[#1C252D]">
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              signOut();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#D96868] hover:bg-[#151F28] transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
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
                    className="text-sm font-semibold text-[#B7BEC6] hover:text-[#F5F1E8] px-3 py-1.5 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-semibold theme-neon-button px-4 py-1.5 rounded-lg transition-all"
                  >
                    Create Account
                  </Link>
                </div>
              )}

              {/* Collapse Header Trigger Button */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-lg text-[#7F8993] hover:text-[#F5F1E8] hover:bg-white/5 transition-colors cursor-pointer shrink-0 ml-1"
                title="Collapse Header"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
