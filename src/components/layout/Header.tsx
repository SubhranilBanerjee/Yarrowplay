'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Bell,
  User as UserIcon,
  LogOut,
  Film,
  Music,
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
    <header className="sticky top-0 z-40 w-full bg-[var(--bg-primary)]/85 backdrop-blur-xl border-b border-[var(--glass-border)] px-4 md:px-8 py-2.5 transition-all">
      <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <Link href={user ? '/home' : '/'} className="flex items-center gap-3 shrink-0 group">
          <div className="relative w-8 h-8 md:w-9 md:h-9 filter drop-shadow-[0_0_8px_rgba(151,145,241,0.45)]">
            <Image
              src="/logo.png"
              alt="Yarrowplay"
              fill
              sizes="(max-width: 768px) 32px, 36px"
              className="object-contain transition-transform group-hover:scale-105"
              priority
            />
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center">
            YARROW<span className="theme-gradient-heading font-black">PLAY</span>
          </span>
        </Link>

        {/* Collapsed vs Expanded Header Content */}
        {isCollapsed ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#161522] hover:bg-[#1E1B2E] border border-[#2E2A45] hover:border-[#8B5CF6] text-xs font-semibold text-[#F9FAFB] transition-all shadow-sm cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-[var(--color-pink)]" />
              <span className="hidden sm:inline">Search &amp; Studio</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>
            {user ? (
              <NotificationDropdown />
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold text-[var(--text-secondary)] hover:text-white px-2.5 py-1 transition-colors"
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search videos, music, creators, blogs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#161522] text-[#F9FAFB] placeholder-[#9CA3AF] text-sm rounded-full pl-11 pr-4 py-2 border border-[#2E2A45] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/25 focus:bg-[#1E1B2E] transition-all"
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
                      className="hidden md:flex items-center gap-2 bg-[#EC4899]/15 border border-[#EC4899]/35 text-[#EC4899] hover:bg-[#EC4899] hover:text-white text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full transition-all shadow-sm hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                    >
                      <Film className="w-4 h-4" />
                      Creator Studio
                    </Link>
                  )}

                  {profile?.role === 'advertiser' && (
                    <Link
                      href="/advertiser"
                      className="hidden md:flex items-center gap-2 bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white text-xs md:text-sm font-semibold px-4 py-1.5 rounded-full transition-all shadow-sm hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]"
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
                      className="flex items-center gap-2 p-1 rounded-full bg-[#161522] border border-[#2E2A45] hover:border-[#8B5CF6] hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all cursor-pointer"
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
                        <div className="w-7 h-7 rounded-full bg-[var(--color-purple-bright)]/20 flex items-center justify-center text-[var(--color-pink)] text-xs font-bold">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-60 rounded-2xl theme-glass-card-static border border-[var(--glass-border)] shadow-2xl py-2 z-50 max-h-[calc(100vh-80px)] overflow-y-auto">
                        {/* User Profile Summary */}
                        <div className="px-4 py-2.5 border-b border-[var(--glass-border-subtle)]">
                          <p className="text-sm font-semibold text-white truncate">
                            {profile?.display_name || user.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[var(--color-purple-bright)]/20 text-[var(--color-pink)] border border-[var(--color-purple-bright)]/30">
                              {profile?.role || 'viewer'}
                            </span>
                          </div>
                        </div>

                        {/* Navigation Items (All Sidebar Pages) */}
                        <div className="py-1 text-sm text-[var(--text-secondary)]">
                          <Link
                            href={`/profile/${profile?.username || user.id}`}
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname.startsWith('/profile')
                                ? 'bg-[#8B5CF6]/15 text-white font-semibold'
                                : 'hover:bg-[var(--glass-surface-elevated)] hover:text-white'
                            }`}
                          >
                            <UserIcon className="w-4 h-4 text-[#8B5CF6]" />
                            <span>My Profile</span>
                          </Link>

                          <div className="my-1 border-t border-[var(--glass-border-subtle)]" />

                          {/* Main Sidebar Pages */}
                          <Link
                            href="/home"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname === '/home'
                                ? 'bg-[#8B5CF6]/15 text-white font-semibold'
                                : 'hover:bg-[var(--glass-surface-elevated)] hover:text-white'
                            }`}
                          >
                            <Home className="w-4 h-4 text-[#9CA3AF]" />
                            <span>Home</span>
                          </Link>

                          <Link
                            href="/explore"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname === '/explore'
                                ? 'bg-[#8B5CF6]/15 text-white font-semibold'
                                : 'hover:bg-[var(--glass-surface-elevated)] hover:text-white'
                            }`}
                          >
                            <Compass className="w-4 h-4 text-[#9CA3AF]" />
                            <span>Explore</span>
                          </Link>

                          <Link
                            href="/blogs"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname === '/blogs'
                                ? 'bg-[#8B5CF6]/15 text-white font-semibold'
                                : 'hover:bg-[var(--glass-surface-elevated)] hover:text-white'
                            }`}
                          >
                            <BookOpen className="w-4 h-4 text-[#9CA3AF]" />
                            <span>Blogs</span>
                          </Link>

                          {/* Creator / Studio Pages */}
                          {user && (
                            <>
                              <div className="my-1 border-t border-[var(--glass-border-subtle)]" />
                              <Link
                                href="/creator/studio"
                                onClick={() => setShowUserMenu(false)}
                                className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                                  pathname.startsWith('/creator/studio')
                                    ? 'bg-[#EC4899]/15 text-[#EC4899] font-semibold'
                                    : 'hover:bg-[var(--glass-surface-elevated)] hover:text-white text-[#EC4899]'
                                }`}
                              >
                                <Film className="w-4 h-4 text-[#EC4899]" />
                                <span>Creator Studio</span>
                              </Link>

                              <Link
                                href="/creator/analytics"
                                onClick={() => setShowUserMenu(false)}
                                className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                                  pathname.startsWith('/creator/analytics')
                                    ? 'bg-[#8B5CF6]/15 text-white font-semibold'
                                    : 'hover:bg-[var(--glass-surface-elevated)] hover:text-white'
                                }`}
                              >
                                <BarChart3 className="w-4 h-4 text-[#9CA3AF]" />
                                <span>Creator Analytics</span>
                              </Link>
                            </>
                          )}

                          {profile?.role === 'advertiser' && (
                            <>
                              <div className="my-1 border-t border-[var(--glass-border-subtle)]" />
                              <Link
                                href="/advertiser"
                                onClick={() => setShowUserMenu(false)}
                                className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                                  pathname.startsWith('/advertiser')
                                    ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] font-semibold'
                                    : 'hover:bg-[var(--glass-surface-elevated)] hover:text-white text-[#8B5CF6]'
                                }`}
                              >
                                <Megaphone className="w-4 h-4 text-[#8B5CF6]" />
                                <span>Advertiser Studio</span>
                              </Link>
                            </>
                          )}

                          <Link
                            href="/blog/studio"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname.startsWith('/blog/studio')
                                ? 'bg-[#8B5CF6]/15 text-white font-semibold'
                                : 'hover:bg-[var(--glass-surface-elevated)] hover:text-white'
                            }`}
                          >
                            <PenTool className="w-4 h-4 text-[#9CA3AF]" />
                            <span>Write Blog</span>
                          </Link>

                          <div className="my-1 border-t border-[var(--glass-border-subtle)]" />

                          {/* Personal Library Pages */}
                          <Link
                            href="/watchlist"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname.startsWith('/watchlist')
                                ? 'bg-[#8B5CF6]/15 text-white font-semibold'
                                : 'hover:bg-[var(--glass-surface-elevated)] hover:text-white'
                            }`}
                          >
                            <Bookmark className="w-4 h-4 text-[#9CA3AF]" />
                            <span>Watchlist</span>
                          </Link>

                          <Link
                            href="/favorites"
                            onClick={() => setShowUserMenu(false)}
                            className={`flex items-center gap-3 px-4 py-2 transition-colors ${
                              pathname.startsWith('/favorites')
                                ? 'bg-[#8B5CF6]/15 text-white font-semibold'
                                : 'hover:bg-[var(--glass-surface-elevated)] hover:text-white'
                            }`}
                          >
                            <Heart className="w-4 h-4 text-[#9CA3AF]" />
                            <span>Favorites</span>
                          </Link>
                        </div>

                        {/* Sign Out */}
                        <div className="pt-1 mt-1 border-t border-[var(--glass-border-subtle)]">
                          <button
                            type="button"
                            onClick={() => {
                              setShowUserMenu(false);
                              signOut();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--status-error)] hover:bg-[var(--glass-surface-elevated)] transition-colors cursor-pointer"
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
                    className="text-sm font-semibold text-[var(--text-secondary)] hover:text-white px-3 py-1.5 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-semibold theme-neon-button px-4 py-1.5 rounded-full transition-all"
                  >
                    Create Account
                  </Link>
                </div>
              )}

              {/* Collapse Header Trigger Button */}
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-1"
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
