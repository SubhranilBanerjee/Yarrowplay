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
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#2B2B2D] border-r border-[#454549] min-h-[calc(100vh-61px)] p-4 select-none">
      <div className="space-y-1">
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const isActive = pathname === item.href || (item.href !== '/home' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-[#FF0080] text-white shadow-md'
                    : 'text-[#B8B8BD] hover:bg-[#333336] hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : item.highlight ? 'text-[#FF0080]' : 'text-[#85858B]'
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </div>

      <div className="mt-auto pt-6 border-t border-[#454549] space-y-1">
        {user ? (
          <Link
            href={`/profile/${profile?.username || user.id}`}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              pathname.startsWith('/profile')
                ? 'bg-[#3A3A3E] text-white'
                : 'text-[#B8B8BD] hover:bg-[#333336] hover:text-white'
            }`}
          >
            <User className="w-5 h-5 text-[#85858B]" />
            <span className="truncate">{profile?.display_name || 'My Profile'}</span>
          </Link>
        ) : (
          <div className="p-4 rounded-xl bg-[#333336] border border-[#454549] text-center">
            <p className="text-xs text-[#B8B8BD] mb-3">Join Yarrowplay to like, upload and comment.</p>
            <Link
              href="/register"
              className="block w-full text-xs font-semibold py-2 bg-[#FF0080] hover:bg-[#E00071] text-white rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
