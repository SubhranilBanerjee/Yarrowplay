'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { Search, Bell, User as UserIcon, LogOut, Film, Music, BookOpen, BarChart3, Megaphone, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const showSidebarToggle = pathname !== '/';

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--bg-primary)]/85 backdrop-blur-xl border-b border-[var(--glass-border)] px-4 md:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo, Brand & Sidebar Toggle */}
        <div className="flex items-center gap-2">
          {showSidebarToggle && (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#161522] border border-transparent hover:border-[#2E2A45] transition-all cursor-pointer mr-1"
            >
              {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
          )}

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
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xl mx-4">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search videos, music, creators, blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#161522] text-[#F9FAFB] placeholder-[#9CA3AF] text-sm rounded-full pl-11 pr-4 py-2.5 border border-[#2E2A45] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/25 focus:bg-[#1E1B2E] transition-all"
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
                  className="hidden md:flex items-center gap-2 bg-[#EC4899]/15 border border-[#EC4899]/35 text-[#EC4899] hover:bg-[#EC4899] hover:text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                >
                  <Film className="w-4 h-4" />
                  Creator Studio
                </Link>
              )}

              {profile?.role === 'advertiser' && (
                <Link
                  href="/advertiser"
                  className="hidden md:flex items-center gap-2 bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-[0_0_15px_rgba(139,92,246,0.4)]"
                >
                  <Megaphone className="w-4 h-4" />
                  Advertiser Studio
                </Link>
              )}

              {/* Notifications */}
              <NotificationDropdown />

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-full bg-[#161522] border border-[#2E2A45] hover:border-[#8B5CF6] hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all"
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
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl theme-glass-card-static border border-[var(--glass-border)] shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-[var(--glass-border-subtle)]">
                      <p className="text-sm font-semibold text-white truncate">
                        {profile?.display_name || user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[var(--color-purple-bright)]/20 text-[var(--color-pink)] border border-[var(--color-purple-bright)]/30">
                          {profile?.role || 'viewer'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1 text-sm text-[var(--text-secondary)]">
                      <Link
                        href={`/profile/${profile?.username || user.id}`}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--glass-surface-elevated)] hover:text-white"
                      >
                        <UserIcon className="w-4 h-4" />
                        My Profile
                      </Link>

                      {profile?.role === 'creator' && (
                        <>
                          <Link
                            href="/creator/studio"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--glass-surface-elevated)] hover:text-white text-[var(--color-pink)]"
                          >
                            <Film className="w-4 h-4" />
                            Creator Studio
                          </Link>
                          <Link
                            href="/creator/analytics"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--glass-surface-elevated)] hover:text-white"
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
                          className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--glass-surface-elevated)] hover:text-white text-[var(--color-pink)]"
                        >
                          <Megaphone className="w-4 h-4" />
                          Advertiser Studio
                        </Link>
                      )}

                      <Link
                        href="/blog/studio"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--glass-surface-elevated)] hover:text-white"
                      >
                        <BookOpen className="w-4 h-4" />
                        Write Blog
                      </Link>

                      <Link
                        href="/favorites"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--glass-surface-elevated)] hover:text-white"
                      >
                        Favorites
                      </Link>

                      <Link
                        href="/watchlist"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-[var(--glass-surface-elevated)] hover:text-white"
                      >
                        Watchlist
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-[var(--glass-border-subtle)]">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--status-error)] hover:bg-[var(--glass-surface-elevated)] transition-colors"
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
                className="text-sm font-semibold text-[var(--text-secondary)] hover:text-white px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold theme-neon-button px-4 py-2 rounded-full transition-all"
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
