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
                className={`flex items-center gap-3.5 px-4 py-3 rounded-none font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'theme-active-pill font-semibold border-l-4 border-l-[var(--color-pink)] shadow-md'
                    : 'text-[var(--text-secondary)] border-l-4 border-l-transparent hover:bg-[var(--glass-surface)] hover:text-white hover:border-y hover:border-r hover:border-[var(--glass-border)]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : item.highlight ? 'text-[var(--color-pink)]' : 'text-[var(--text-muted)]'
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
            className={`flex items-center gap-3.5 px-4 py-3 rounded-none font-medium text-sm transition-all ${
              pathname.startsWith('/profile')
                ? 'theme-active-pill border-l-4 border-l-[var(--color-pink)] font-semibold'
                : 'text-[var(--text-secondary)] bg-[var(--glass-surface-subtle)] border border-[var(--glass-border-subtle)] hover:bg-[var(--glass-surface)] hover:border-[var(--glass-border)] hover:text-white'
            }`}
          >
            <div className="w-7 h-7 rounded-none bg-[var(--color-purple-bright)]/20 border border-[var(--color-purple-bright)]/40 flex items-center justify-center text-[var(--color-pink)] text-xs font-bold shrink-0">
              {profile?.display_name ? profile.display_name[0].toUpperCase() : 'U'}
            </div>
            <span className="truncate flex-1">{profile?.display_name || 'My Profile'}</span>
          </Link>
        ) : (
          <div className="p-4 rounded-none theme-glass-card-static text-center border border-[var(--glass-border)]">
            <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">Join Yarrowplay to like, upload and comment.</p>
            <Link
              href="/register"
              className="block w-full text-xs font-semibold py-2.5 theme-neon-button rounded-none transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
