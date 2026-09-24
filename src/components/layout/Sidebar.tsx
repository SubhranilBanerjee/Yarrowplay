'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import {
  Home,
  Film,
  BarChart3,
  BookOpen,
  Bookmark,
  Heart,
  Compass,
  Megaphone,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Clock,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  // Hide sidebar on the landing page
  if (pathname === '/') {
    return null;
  }

  const navItems = [
    { label: 'Home', href: '/home', icon: Home, show: true },
    { label: 'Explore', href: '/explore', icon: Compass, show: true },
    { label: 'Blogs', href: '/blogs', icon: BookOpen, show: true },
    {
      label: 'Creator Studio',
      href: '/creator/studio',
      icon: Film,
      show: true,
      highlight: true,
    },
    {
      label: 'Analytics',
      href: '/creator/analytics',
      icon: BarChart3,
      show: true,
    },
    {
      label: 'Advertiser Studio',
      href: '/advertiser',
      icon: Megaphone,
      show: profile?.role === 'advertiser',
      highlight: true,
    },
    { label: 'Watchlist', href: '/watchlist', icon: Bookmark, show: !!user },
    { label: 'Favorites', href: '/favorites', icon: Heart, show: !!user },
    { label: 'History', href: '/history', icon: Clock, show: !!user },
  ];

  return (
    <aside
      onWheel={(e) => e.stopPropagation()}
      className={`hidden md:flex flex-col shrink-0 bg-[#080D12] border-r border-[#1C252D] sticky top-[61px] h-[calc(100vh-61px)] max-h-[calc(100vh-61px)] overflow-hidden select-none overscroll-none transition-all duration-300 ease-in-out z-20 ${
        isCollapsed ? 'w-20 px-2.5 py-3.5 items-center' : 'w-64 p-3.5'
      }`}
    >
      {/* Top Sidebar Header & Collapse Toggle */}
      <div
        className={`flex items-center w-full mb-2.5 pb-2 border-b border-[#1C252D] shrink-0 ${
          isCollapsed ? 'justify-center' : 'justify-between px-1'
        }`}
      >
        {!isCollapsed && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7F8993] pl-2">
            Navigation
          </span>
        )}
        <div className="relative group">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#9AA5AF] hover:text-[#F5F1E8] hover:bg-[#111A22] border border-transparent hover:border-[#27313A] transition-all cursor-pointer"
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-[#101820] border border-[#27313A] text-[#F5F1E8] text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center gap-1.5">
              <span>Expand sidebar</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className={`space-y-1 w-full shrink-0 overflow-hidden ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={`relative group flex items-center rounded-lg font-medium text-sm transition-all duration-150 ${
                  isCollapsed
                    ? 'w-10 h-10 justify-center'
                    : 'gap-3 px-3.5 py-2.5 w-full'
                } ${
                  isActive
                    ? 'bg-[#F4C95D]/12 text-[#F5F1E8] font-semibold'
                    : 'text-[#B7BEC6] hover:bg-[#111A22] hover:text-[#F5F1E8]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-[#F4C95D]' : 'text-[#9AA5AF]'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {/* Subtle active left border bar */}
                {isActive && !isCollapsed && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#F4C95D] rounded-r" />
                )}

                {/* Hover tooltip when collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-[#101820] border border-[#27313A] text-[#F5F1E8] text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center gap-1.5">
                    <span>{item.label}</span>
                  </div>
                )}
              </Link>
            );
          })}
      </div>

      {/* Bottom Profile / Auth */}
      <div className={`mt-auto pt-3 border-t border-[#1C252D] w-full shrink-0 overflow-hidden ${isCollapsed ? 'flex flex-col items-center' : 'space-y-2'}`}>
        {user ? (
          <Link
            href={`/profile/${profile?.username || user.id}`}
            title={isCollapsed ? (profile?.display_name || 'My Profile') : undefined}
            className={`relative group flex items-center rounded-lg font-medium text-sm transition-all ${
              isCollapsed
                ? 'w-10 h-10 justify-center'
                : 'gap-3 px-3.5 py-2 w-full'
            } ${
              pathname.startsWith('/profile')
                ? 'bg-[#F4C95D]/12 text-[#F5F1E8] font-semibold'
                : 'text-[#B7BEC6] hover:bg-[#111A22] hover:text-[#F5F1E8]'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-[#151F28] border border-[#27313A] flex items-center justify-center text-[#F4C95D] text-xs font-bold shrink-0">
              {profile?.display_name ? profile.display_name[0].toUpperCase() : 'U'}
            </div>
            {!isCollapsed && <span className="truncate flex-1 text-xs text-[#F5F1E8]">{profile?.display_name || 'My Profile'}</span>}

            {/* Hover Tooltip when collapsed */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 rounded-lg bg-[#101820] border border-[#27313A] text-[#F5F1E8] text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50">
                <span>{profile?.display_name || 'My Profile'}</span>
              </div>
            )}
          </Link>
        ) : isCollapsed ? (
          <Link
            href="/register"
            title="Sign Up"
            className="w-10 h-10 rounded-lg theme-neon-button flex items-center justify-center text-[#0B0F13] text-xs font-bold transition-all"
          >
            <Sparkles className="w-4 h-4" />
          </Link>
        ) : (
          <div className="p-3 rounded-xl bg-[#111A22] text-center border border-[#1C252D]">
            <p className="text-[11px] text-[#B7BEC6] mb-2 leading-relaxed">Join Lighthouse Reels to stream, publish &amp; comment.</p>
            <Link
              href="/register"
              className="block w-full text-xs font-semibold py-1.5 theme-neon-button rounded-lg transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
