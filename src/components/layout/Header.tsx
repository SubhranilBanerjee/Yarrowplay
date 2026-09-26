'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Plus,
  Bell,
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
  Clock,
  Tv,
} from 'lucide-react';
import Image from 'next/image';
import { BrandLogo } from '@/components/landing/BrandLogo';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const pathname = usePathname();
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

  const defaultAvatar = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090D12]/95 backdrop-blur-md border-b border-[#182029] px-4 md:px-6 py-2.5 transition-all">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Left: Brand Logo matching screenshot */}
        <div className="shrink-0 flex items-center">
          <BrandLogo href={user ? '/home' : '/'} />
        </div>

        {/* Center: Global Search Bar matching screenshot */}
        <div className="flex-1 max-w-xl mx-2 md:mx-6">
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

        {/* Right: + Create Button, Notifications (Bell + 6), and User Avatar */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* + Create Button */}
          <Link
            href={user ? '/creator/studio' : '/login?redirect=/creator/studio'}
            className="flex items-center gap-1.5 bg-[#ECC979] hover:bg-[#F4C95D] active:scale-95 text-[#101418] font-semibold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-full shadow-sm transition-all cursor-pointer font-sans"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create</span>
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
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#E03E3E] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
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
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden bg-[#151D25]">
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
              <div className="absolute right-0 mt-2.5 w-60 rounded-xl bg-[#0F151B] border border-[#212A34] shadow-2xl py-2 z-50">
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
    </header>
  );
}
