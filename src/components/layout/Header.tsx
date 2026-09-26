'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import {
  Search,
  Plus,
  Bell,
  User as UserIcon,
  LogOut,
  Film,
  BarChart3,
  Bookmark,
  Clock,
  Menu,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { BrandLogo } from '@/components/landing/BrandLogo';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { toggleMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
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
      setShowMobileSearch(false);
    }
  };

  const defaultAvatar =
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D12]/95 backdrop-blur-md border-b border-[#182029] px-3 sm:px-4 md:px-6 py-2.5 transition-all">
      <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Drawer Trigger + Brand Logo */}
        <div className="shrink-0 flex items-center gap-2 sm:gap-3">
          {/* Hamburger toggle for mobile & tablet drawer */}
          <button
            type="button"
            onClick={toggleMobileSidebar}
            aria-label="Open navigation menu"
            className="md:hidden p-1.5 rounded-lg text-[#9AA7B4] hover:text-[#F5F1E8] hover:bg-[#131920] transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <BrandLogo href={user ? '/home' : '/'} />
        </div>

        {/* Center: Search Bar (Desktop & Tablet) */}
        <div className="hidden sm:flex flex-1 max-w-xs md:max-w-md lg:max-w-xl mx-2 md:mx-4 lg:mx-6">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A8694] pointer-events-none" />
            <input
              type="text"
              placeholder="Search series, creators, genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#131920] hover:bg-[#151D25] focus:bg-[#151D25] text-[#F5F1E8] placeholder-[#76828F] text-xs sm:text-sm rounded-full pl-11 pr-4 py-2 border border-[#212A34] focus:outline-none focus:border-[#ECC979]/70 transition-all shadow-inner"
            />
          </form>
        </div>

        {/* Right: Search Icon (Mobile), + Create Button, Notifications, Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          {/* Mobile search toggle button (visible only on < sm) */}
          <button
            type="button"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            aria-label="Toggle search"
            className="sm:hidden p-2 rounded-full text-[#9AA7B4] hover:text-[#F5F1E8] hover:bg-[#131920] transition-colors"
          >
            {showMobileSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* + Create Button */}
          <Link
            href={user ? '/creator/studio' : '/login?redirect=/creator/studio'}
            className="flex items-center gap-1 sm:gap-1.5 bg-[#ECC979] hover:bg-[#F4C95D] active:scale-95 text-[#101418] font-semibold text-xs sm:text-sm px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full shadow-sm transition-all cursor-pointer font-sans"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="inline">Create</span>
          </Link>

          {/* Notifications: Bell with red badge '6' */}
          {user ? (
            <NotificationDropdown />
          ) : (
            <Link
              href="/login"
              className="relative p-2 text-[#9EABB8] hover:text-[#F5F1E8] transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute top-1 right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#E03E3E] text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center shadow-sm">
                6
              </span>
            </Link>
          )}

          {/* User Avatar & Menu */}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center p-0.5 rounded-full border border-[#26313C] hover:border-[#ECC979] transition-all cursor-pointer focus:outline-none"
              aria-label="User menu"
            >
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full overflow-hidden bg-[#151D25]">
                <Image
                  src={profile?.avatar_url || defaultAvatar}
                  alt={profile?.display_name || 'User Profile'}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2.5 w-56 sm:w-60 rounded-xl bg-[#0F151B] border border-[#212A34] shadow-2xl py-2 z-50">
                {user ? (
                  <>
                    <div className="px-4 py-2.5 border-b border-[#182029]">
                      <p className="text-sm font-semibold text-[#F5F1E8] truncate">
                        {profile?.display_name || user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#ECC979]/15 text-[#ECC979] border border-[#ECC979]/30">
                          {profile?.role || 'viewer'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1 text-xs text-[#B7BEC6]">
                      <Link
                        href={`/profile/${profile?.username || user.id}`}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-[#151D25] hover:text-[#F5F1E8] transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-[#ECC979]" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        href="/creator/studio"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-[#151D25] hover:text-[#ECC979] transition-colors"
                      >
                        <Film className="w-4 h-4 text-[#ECC979]" />
                        <span>Creator Studio</span>
                      </Link>

                      <Link
                        href="/creator/analytics"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-[#151D25] hover:text-[#F5F1E8] transition-colors"
                      >
                        <BarChart3 className="w-4 h-4 text-[#7E9BB5]" />
                        <span>Creator Analytics</span>
                      </Link>

                      <Link
                        href="/watchlist"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-[#151D25] hover:text-[#F5F1E8] transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-[#9AA5AF]" />
                        <span>Saved</span>
                      </Link>

                      <Link
                        href="/history"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-[#151D25] hover:text-[#F5F1E8] transition-colors"
                      >
                        <Clock className="w-4 h-4 text-[#9AA5AF]" />
                        <span>History</span>
                      </Link>
                    </div>

                    <div className="pt-1 mt-1 border-t border-[#182029]">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs text-[#D96868] hover:bg-[#151D25] transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-1">
                    <Link
                      href="/login"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs text-[#F5F1E8] hover:bg-[#151D25] transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-[#ECC979]" />
                      <span>Sign In</span>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-xs text-[#ECC979] hover:bg-[#151D25] font-semibold transition-colors"
                    >
                      <Plus className="w-4 h-4 text-[#ECC979]" />
                      <span>Create Account</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Expandable Bar */}
      {showMobileSearch && (
        <div className="sm:hidden pt-2.5 pb-1 px-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A8694] pointer-events-none" />
            <input
              type="text"
              autoFocus
              placeholder="Search series, creators, genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#131920] text-[#F5F1E8] placeholder-[#76828F] text-xs rounded-full pl-10 pr-4 py-2 border border-[#212A34] focus:outline-none focus:border-[#ECC979]"
            />
          </form>
        </div>
      )}
    </header>
  );
}
