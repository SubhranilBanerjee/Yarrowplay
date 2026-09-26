'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import {
  Home,
  Compass,
  Tv,
  Zap,
  Headphones,
  FileText,
  Users,
  Bookmark,
  Download,
  Clock,
  Crown,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/landing/BrandLogo';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isMobileOpen, closeMobileSidebar } = useSidebar();

  const mainNav = [
    {
      label: 'Home',
      href: '/home',
      activeCheck: (p: string) => p === '/' || p === '/home',
      icon: Home,
    },
    {
      label: 'Explore',
      href: '/explore',
      activeCheck: (p: string) => p === '/explore' && !p.includes('type='),
      icon: Compass,
    },
    {
      label: 'Series',
      href: '/explore?type=series',
      activeCheck: (p: string) => p.includes('type=series'),
      icon: Tv,
    },
    {
      label: 'Shorts',
      href: '/explore?type=shorts',
      activeCheck: (p: string) => p.includes('type=shorts'),
      icon: Zap,
    },
    {
      label: 'Audio',
      href: '/explore?type=audio',
      activeCheck: (p: string) => p.includes('type=audio'),
      icon: Headphones,
    },
    {
      label: 'Blogs',
      href: '/blogs',
      activeCheck: (p: string) => p.startsWith('/blog'),
      icon: FileText,
    },
    {
      label: 'Creators',
      href: '/explore?type=creators',
      activeCheck: (p: string) => p.includes('type=creators'),
      icon: Users,
    },
  ];

  const libraryNav = [
    {
      label: 'Saved',
      href: user ? '/watchlist' : '/login',
      activeCheck: (p: string) => p === '/watchlist' || p === '/favorites',
      icon: Bookmark,
    },
    {
      label: 'Downloads',
      href: user ? '/history' : '/login',
      activeCheck: (p: string) => p === '/downloads',
      icon: Download,
    },
    {
      label: 'History',
      href: user ? '/history' : '/login',
      activeCheck: (p: string) => p === '/history',
      icon: Clock,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between select-none">
      <div className="space-y-4">
        {/* Main Navigation Group */}
        <div className="space-y-1">
          {mainNav.map((item) => {
            const isActive = item.activeCheck(pathname);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={closeMobileSidebar}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#221C13] text-[#ECC979] border border-[#ECC979]/25 shadow-[0_2px_12px_rgba(236,201,121,0.08)]'
                    : 'text-[#9AA7B4] hover:text-[#F5F1E8] hover:bg-[#131920]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'fill-[#ECC979] text-[#ECC979]' : 'text-[#85929F]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Library Subheader & Section */}
        <div>
          <div className="text-[11px] font-medium text-[#6B7783] px-3.5 pb-1.5 uppercase tracking-wider">
            Library
          </div>
          <div className="space-y-1">
            {libraryNav.map((item) => {
              const isActive = item.activeCheck(pathname);
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#221C13] text-[#ECC979] border border-[#ECC979]/25'
                      : 'text-[#9AA7B4] hover:text-[#F5F1E8] hover:bg-[#131920]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#ECC979]' : 'text-[#85929F]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Pro Card: Lighthouse Pro */}
      <div className="pt-4 mt-auto">
        <div className="relative rounded-2xl p-4 bg-gradient-to-b from-[#161D26] to-[#0E141A] border border-[#232D38] overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#ECC979]/10 rounded-full blur-2xl pointer-events-none" />
          <div
            className="absolute inset-0 opacity-15 bg-cover bg-center pointer-events-none mix-blend-screen"
            style={{ backgroundImage: `url('/images/hero_distant_shore.jpg')` }}
          />

          <div className="relative z-10">
            <div className="w-7 h-7 rounded-lg bg-[#2A2315] border border-[#ECC979]/30 flex items-center justify-center text-[#ECC979] mb-2.5 shadow-sm">
              <Crown className="w-4 h-4 fill-[#ECC979]/60 text-[#ECC979]" />
            </div>

            <h4 className="text-sm font-bold text-[#F5F1E8] tracking-tight">
              Lighthouse Pro
            </h4>
            <p className="text-[11px] text-[#86929F] mt-1 leading-snug">
              Unlock exclusive series, early access, downloads and more.
            </p>

            <Link
              href={user ? '/profile?tab=vip' : '/login?redirect=/profile?tab=vip'}
              onClick={closeMobileSidebar}
              className="mt-3.5 w-full bg-[#ECC979] hover:bg-[#F4C95D] active:scale-98 text-[#101418] font-bold text-xs py-2 rounded-xl text-center block transition-all shadow-md"
            >
              Upgrade
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop & Tablet Landscape Sticky Sidebar */}
      <aside className="hidden md:flex flex-col shrink-0 w-52 lg:w-60 bg-[#090D12] border-r border-[#182029] sticky top-[57px] h-[calc(100vh-57px)] max-h-[calc(100vh-57px)] px-3 py-4 select-none overflow-y-auto no-scrollbar z-20">
        {sidebarContent}
      </aside>

      {/* 2. Mobile & Tablet Portrait Slide-over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop blur overlay */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={closeMobileSidebar}
            aria-hidden="true"
          />

          {/* Slide-in sidebar panel */}
          <div className="relative w-72 max-w-[85vw] bg-[#090D12] border-r border-[#182029] h-full p-4 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200 overflow-y-auto no-scrollbar">
            {/* Drawer Header with Logo and Close Button */}
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-[#182029]">
              <BrandLogo href={user ? '/home' : '/'} />
              <button
                type="button"
                onClick={closeMobileSidebar}
                aria-label="Close sidebar"
                className="p-1.5 rounded-lg text-[#86929F] hover:text-[#F5F1E8] hover:bg-[#141B22] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar nav items */}
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
