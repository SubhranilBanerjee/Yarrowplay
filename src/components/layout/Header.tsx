'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { useWallet } from '@/context/WalletContext';
import { CoinIcon } from '@/components/ui/CoinIcon';
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
  Coins,
  Crown,
  Gift,
  Tag,
  History,
  Sun,
  Moon,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';
import { BrandLogo } from '@/components/landing/BrandLogo';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useTheme } from '@/context/ThemeContext';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { toggleMobileSidebar } = useSidebar();
  const { coins, isVIP, openCoinStore, openDailyRewards } = useWallet();
  const { theme, toggleTheme } = useTheme();
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

  const isAdmin =
    !!user?.email &&
    (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      user.email === 'admin@dramabox.stream' ||
      profile?.role === 'admin');

  const isCreator =
    profile?.role === 'creator' ||
    user?.user_metadata?.role === 'creator';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
    }
  };

  const defaultAvatar =
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80';

  const userMeta = user?.user_metadata || {};
  const displayName =
    profile?.display_name ||
    userMeta.full_name ||
    userMeta.name ||
    (userMeta.given_name ? `${userMeta.given_name} ${userMeta.family_name || ''}`.trim() : null) ||
    userMeta.display_name ||
    user?.email?.split('@')[0] ||
    'User';

  const avatarUrl =
    profile?.avatar_url ||
    userMeta.avatar_url ||
    userMeta.picture ||
    defaultAvatar;

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--lr-bg-header,#090D12)]/95 backdrop-blur-md border-b border-[var(--lr-border-primary,#182029)] px-3 sm:px-4 md:px-6 py-2.5 transition-all">
      <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Drawer Trigger + Brand Logo */}
        <div className="shrink-0 flex items-center gap-2 sm:gap-3">
          {/* Hamburger toggle for mobile & tablet drawer */}
          <button
            type="button"
            onClick={toggleMobileSidebar}
            aria-label="Open navigation menu"
            className="md:hidden p-1.5 rounded-lg text-[var(--lr-text-muted,#9AA7B4)] hover:text-[var(--lr-text-primary,#F5F1E8)] hover:bg-[var(--lr-bg-elevated,#131920)] transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <BrandLogo href={user ? '/home' : '/'} />
        </div>

        {/* Center: Search Bar (Desktop & Tablet) */}
        <div className="hidden sm:flex flex-1 max-w-xs md:max-w-md lg:max-w-xl mx-2 md:mx-4 lg:mx-6">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--lr-text-muted,#7A8694)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search series, creators, genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--lr-bg-surface,#131920)] hover:bg-[var(--lr-bg-elevated,#151D25)] focus:bg-[var(--lr-bg-elevated,#151D25)] text-[var(--lr-text-primary,#F5F1E8)] placeholder-[var(--lr-text-muted,#76828F)] text-xs sm:text-sm rounded-full pl-11 pr-4 py-2 border border-[var(--lr-border-primary,#212A34)] focus:outline-none focus:border-[#ECC979]/70 transition-all shadow-inner"
            />
          </form>
        </div>

        {/* Right: Search Icon (Mobile), Theme Toggle, + Create Button, Notifications, Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          {/* Mobile search toggle button (visible only on < sm) */}
          <button
            type="button"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            aria-label="Toggle search"
            className="sm:hidden p-2 rounded-full text-[var(--lr-text-muted,#9AA7B4)] hover:text-[var(--lr-text-primary,#F5F1E8)] hover:bg-[var(--lr-bg-elevated,#131920)] transition-colors"
          >
            {showMobileSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>

          {/* Theme Toggle (Dark / Light Mode) */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-full text-[var(--lr-text-muted,#9AA7B4)] hover:text-[#ECC979] hover:bg-[var(--lr-bg-elevated,#131920)] border border-[var(--lr-border-primary,#212A34)] transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#ECC979]" />
            ) : (
              <Moon className="w-4 h-4 text-[#C99A32]" />
            )}
          </button>

          {/* Coin Wallet Button */}
          <button
            type="button"
            onClick={() => openCoinStore('coins')}
            title="Coin Store & Wallet"
            className="flex items-center gap-1.5 bg-[var(--lr-bg-surface,#141D26)] hover:bg-[var(--lr-bg-elevated,#1A2530)] text-[#F4C95D] border border-[#F4C95D]/30 hover:border-[#F4C95D]/60 text-xs sm:text-sm font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full shadow-sm transition-all active:scale-95 cursor-pointer font-sans"
          >
            <CoinIcon className="w-4 h-4 text-[#F4C95D]" />
            <span>{coins}</span>
            {isVIP && (
              <span className="text-[10px] bg-[#F4C95D] text-[#0B0F13] px-1.5 py-0.2 rounded-full font-black flex items-center gap-0.5 ml-0.5">
                VIP
              </span>
            )}
          </button>

          {/* + Create Button (Only visible to creators) */}
          {isCreator && (
            <Link
              href="/creator/studio"
              className="btn-primary flex items-center gap-1 sm:gap-1.5 text-white font-bold text-xs sm:text-sm px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full shadow-md transition-all cursor-pointer font-sans"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              <span className="inline">Create</span>
            </Link>
          )}

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
                  src={avatarUrl}
                  alt={displayName}
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
                        {displayName}
                      </p>
                      {user.email && (
                        <p className="text-[11px] text-[#7A8794] truncate mt-0.5">
                          {user.email}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#ECC979]/15 text-[#ECC979] border border-[#ECC979]/30">
                          {profile?.role || 'viewer'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1 text-xs text-[#B7BEC6]">
                      {/* Monetization & Rewards Section */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          openCoinStore('coins');
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#151D25] text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Coins className="w-4 h-4 text-[#F4C95D]" />
                          <span className="text-[#F5F1E8]">Coin Wallet</span>
                        </div>
                        <span className="text-xs font-bold text-[#F4C95D] flex items-center gap-1"><CoinIcon className="w-3.5 h-3.5" /> {coins}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          openCoinStore('vip');
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#151D25] text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Crown className="w-4 h-4 text-[#F4C95D]" />
                          <span className="text-[#F5F1E8]">VIP Subscription</span>
                        </div>
                        {isVIP ? (
                          <span className="text-[10px] text-[#68B88A] bg-[#68B88A]/15 px-1.5 py-0.5 rounded border border-[#68B88A]/30">Active</span>
                        ) : (
                          <span className="text-[10px] text-[#F4C95D]">Get VIP</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          openDailyRewards();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#151D25] text-[#F5F1E8] text-left transition-colors cursor-pointer"
                      >
                        <Gift className="w-4 h-4 text-[#F4C95D]" />
                        <span>Daily Rewards Streak</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          openCoinStore('promo');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#151D25] text-[#F5F1E8] text-left transition-colors cursor-pointer"
                      >
                        <Tag className="w-4 h-4 text-[#F4C95D]" />
                        <span>Redeem Promo Code</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          openCoinStore('history');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#151D25] text-[#B7BEC6] hover:text-[#F5F1E8] text-left transition-colors cursor-pointer border-b border-[#182029]/80 pb-2 mb-1"
                      >
                        <History className="w-4 h-4 text-[#7A8694]" />
                        <span>Transaction History</span>
                      </button>

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
                        href="/settings"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-[#151D25] hover:text-[#F5F1E8] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[#ECC979]" />
                        <span>Account Settings</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-[#151D25] text-[#F4C95D] font-semibold transition-colors border-t border-[#182029]/60 mt-1 pt-2"
                        >
                          <ShieldCheck className="w-4 h-4 text-[#F4C95D]" />
                          <span>Admin Portal</span>
                        </Link>
                      )}
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
