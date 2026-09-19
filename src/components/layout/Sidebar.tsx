'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  Film,
  BarChart3,
  BookOpen,
  Bookmark,
  Heart,
  Compass,
  Megaphone,
  User,
  Settings,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();

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
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-r border-[var(--glass-border)] min-h-[calc(100vh-61px)] p-4 select-none">
      <div className="space-y-1.5">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? 'theme-active-pill text-[#F9FAFB] shadow-[0_0_15px_rgba(139,92,246,0.35)]'
                    : 'text-[#9CA3AF] hover:bg-[#161522] hover:text-[#F9FAFB]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-[#F9FAFB]' : item.highlight ? 'text-[#EC4899]' : 'text-[#9CA3AF]'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </div>

      <div className="mt-auto pt-6 border-t border-[var(--glass-border-subtle)] space-y-1">
        {user ? (
          <Link
            href={`/profile/${profile?.username || user.id}`}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              pathname.startsWith('/profile')
                ? 'theme-active-pill text-[#F9FAFB] font-semibold shadow-[0_0_15px_rgba(139,92,246,0.35)]'
                : 'text-[#9CA3AF] hover:bg-[#161522] hover:text-[#F9FAFB]'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-[#A855F7] text-xs font-bold shrink-0">
              {profile?.display_name ? profile.display_name[0].toUpperCase() : 'U'}
            </div>
            <span className="truncate flex-1">{profile?.display_name || 'My Profile'}</span>
          </Link>
        ) : (
          <div className="p-4 rounded-xl theme-glass-card-static text-center border border-[var(--glass-border)]">
            <p className="text-xs text-[#9CA3AF] mb-3 leading-relaxed">Join Yarrowplay to like, upload and comment.</p>
            <Link
              href="/register"
              className="block w-full text-xs font-semibold py-2.5 theme-neon-button rounded-xl transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
