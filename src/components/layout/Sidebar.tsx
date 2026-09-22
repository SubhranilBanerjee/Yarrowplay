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
      show: profile?.role === 'creator',
      highlight: true,
    },
    {
      label: 'Analytics',
      href: '/creator/analytics',
      icon: BarChart3,
      show: profile?.role === 'creator',
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
      className={`hidden md:flex flex-col shrink-0 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-r border-[var(--glass-border)] min-h-[calc(100vh-61px)] select-none transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20 px-2.5 py-4 items-center' : 'w-64 p-4'
      }`}
    >
      {/* Top Sidebar Header & Collapse Toggle */}
      <div
        className={`flex items-center w-full mb-3 pb-2.5 border-b border-[var(--glass-border-subtle)] ${
          isCollapsed ? 'justify-center' : 'justify-between px-1'
        }`}
      >
        {!isCollapsed && (
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] pl-2">
            Navigation
          </span>
        )}
        <div className="relative group">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#161522] border border-transparent hover:border-[#2E2A45] transition-all cursor-pointer"
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#1E1B2E] border border-[#2E2A45] text-white text-xs font-semibold whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center gap-1.5">
              <span>Expand sidebar</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className={`space-y-1.5 w-full ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
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
                className={`relative group flex items-center rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isCollapsed
                    ? 'w-12 h-12 justify-center'
                    : 'gap-3.5 px-4 py-3 w-full'
                } ${
                  isActive
                    ? 'theme-active-pill text-[#F9FAFB] shadow-[0_0_15px_rgba(139,92,246,0.35)]'
                    : 'text-[#9CA3AF] hover:bg-[#161522] hover:text-[#F9FAFB]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive ? 'text-[#F9FAFB]' : item.highlight ? 'text-[#EC4899]' : 'text-[#9CA3AF]'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {/* Netflix-style hover tooltip when collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#1E1B2E] border border-[#2E2A45] text-white text-xs font-semibold whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center gap-1.5">
                    <span>{item.label}</span>
                  </div>
                )}
              </Link>
            );
          })}
      </div>

      {/* Bottom Profile / Auth */}
      <div className={`mt-auto pt-4 border-t border-[var(--glass-border-subtle)] w-full ${isCollapsed ? 'flex flex-col items-center' : 'space-y-2'}`}>
        {user ? (
          <Link
            href={`/profile/${profile?.username || user.id}`}
            title={isCollapsed ? (profile?.display_name || 'My Profile') : undefined}
            className={`relative group flex items-center rounded-xl font-medium text-sm transition-all ${
              isCollapsed
                ? 'w-12 h-12 justify-center'
                : 'gap-3.5 px-3.5 py-2.5 w-full'
            } ${
              pathname.startsWith('/profile')
                ? 'theme-active-pill text-[#F9FAFB] font-semibold shadow-[0_0_15px_rgba(139,92,246,0.35)]'
                : 'text-[#9CA3AF] hover:bg-[#161522] hover:text-[#F9FAFB]'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A855F7] text-xs font-bold shrink-0">
              {profile?.display_name ? profile.display_name[0].toUpperCase() : 'U'}
            </div>
            {!isCollapsed && <span className="truncate flex-1">{profile?.display_name || 'My Profile'}</span>}

            {/* Hover Tooltip when collapsed */}
            {isCollapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-[#1E1B2E] border border-[#2E2A45] text-white text-xs font-semibold whitespace-nowrap shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50">
                <span>{profile?.display_name || 'My Profile'}</span>
              </div>
            )}
          </Link>
        ) : isCollapsed ? (
          <Link
            href="/register"
            title="Sign Up"
            className="w-10 h-10 rounded-xl theme-neon-button flex items-center justify-center text-white text-xs font-bold transition-all"
          >
            <Sparkles className="w-4 h-4" />
          </Link>
        ) : (
          <div className="p-3.5 rounded-xl theme-glass-card-static text-center border border-[var(--glass-border)]">
            <p className="text-[11px] text-[#9CA3AF] mb-2.5 leading-relaxed">Join Yarrowplay to stream, publish & comment.</p>
            <Link
              href="/register"
              className="block w-full text-xs font-semibold py-2 theme-neon-button rounded-xl transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
