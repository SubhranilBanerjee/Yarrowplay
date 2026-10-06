'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { useWallet } from '@/context/WalletContext';
import {
  Home,
  Users,
  FileText,
  Bookmark,
  Clock,
  Crown,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  User,
  Settings,
  BarChart3,
} from 'lucide-react';
import { BrandLogo } from '@/components/landing/BrandLogo';

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { isCollapsed, toggleSidebar, isMobileOpen, closeMobileSidebar } = useSidebar();
  const { openSubscriptionModal } = useWallet();

  // Canonical Phase 3 Main Navigation: HOME, FOLLOWING, BLOGS
  const mainNav = [
    {
      label: 'Home',
      href: '/home',
      activeCheck: (p: string) => p === '/' || p === '/home',
      icon: Home,
    },
    {
      label: 'Following',
      href: '/following',
      activeCheck: (p: string) => p === '/following',
      icon: Users,
    },
    {
      label: 'Blogs',
      href: '/blogs',
      activeCheck: (p: string) => p.startsWith('/blog'),
      icon: FileText,
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
      label: 'History',
      href: user ? '/history' : '/login',
      activeCheck: (p: string) => p === '/history',
      icon: Clock,
    },
  ];

  const isCreator =
    profile?.role === 'creator' ||
    user?.user_metadata?.role === 'creator' ||
    profile?.role === 'admin';

  const accountNav = [
    {
      label: 'Profile',
      href: user
        ? profile?.username
          ? `/profile/${profile.username}`
          : `/profile/${user.id}`
        : '/login?redirect=/profile',
      activeCheck: (p: string) => p.startsWith('/profile'),
      icon: User,
    },
    {
      label: 'Account Settings',
      href: user ? '/settings' : '/login?redirect=/settings',
      activeCheck: (p: string) => p.startsWith('/settings'),
      icon: Settings,
    },
    ...(isCreator
      ? [
          {
            label: 'Creator Analytics',
            href: '/creator/analytics',
            activeCheck: (p: string) => p.startsWith('/creator/analytics'),
            icon: BarChart3,
          },
        ]
      : []),
  ];

  const renderNavLinks = (collapsed: boolean) => (
    <div className="flex flex-col h-full justify-between select-none">
      <div className="space-y-4">
        {/* Collapse Toggle Button (Desktop only) */}
        <div className="hidden md:flex items-center justify-end px-1 pb-1">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-[var(--lr-text-muted,#7E8B99)] hover:text-[var(--lr-text-primary,#F5F1E8)] hover:bg-[var(--lr-bg-elevated,#131920)] border border-[var(--lr-border-subtle,#1A232D)] transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

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
                title={collapsed ? item.label : undefined}
                className={`flex items-center ${
                  collapsed ? 'justify-center px-2' : 'gap-3.5 px-3.5'
                } py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'btn-primary text-white font-bold shadow-md'
                    : 'text-[var(--lr-text-secondary,#9AA7B4)] hover:text-[var(--lr-text-primary,#F5F1E8)] hover:bg-[var(--lr-bg-elevated,#131920)]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive ? 'fill-white text-white' : 'text-[var(--lr-text-muted,#85929F)]'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Library Subheader & Section */}
        <div>
          {!collapsed && (
            <div className="text-[11px] font-medium text-[var(--lr-text-muted,#6B7783)] px-3.5 pb-1.5 uppercase tracking-wider">
              Library
            </div>
          )}
          <div className="space-y-1">
            {libraryNav.map((item) => {
              const isActive = item.activeCheck(pathname);
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center ${
                    collapsed ? 'justify-center px-2' : 'gap-3.5 px-3.5'
                  } py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'btn-primary text-white font-bold shadow-md'
                      : 'text-[var(--lr-text-secondary,#9AA7B4)] hover:text-[var(--lr-text-primary,#F5F1E8)] hover:bg-[var(--lr-bg-elevated,#131920)]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-[var(--lr-text-muted,#85929F)]'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Account / Creator Section */}
        <div>
          {!collapsed && (
            <div className="text-[11px] font-medium text-[var(--lr-text-muted,#6B7783)] px-3.5 pb-1.5 uppercase tracking-wider">
              Account
            </div>
          )}
          <div className="space-y-1">
            {accountNav.map((item) => {
              const isActive = item.activeCheck(pathname);
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMobileSidebar}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center ${
                    collapsed ? 'justify-center px-2' : 'gap-3.5 px-3.5'
                  } py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'btn-primary text-white font-bold shadow-md'
                      : 'text-[var(--lr-text-secondary,#9AA7B4)] hover:text-[var(--lr-text-primary,#F5F1E8)] hover:bg-[var(--lr-bg-elevated,#131920)]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-[var(--lr-text-muted,#85929F)]'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Pro Card: Subscribe */}
      <div className="pt-4 mt-auto">
        {collapsed ? (
          <button
            type="button"
            onClick={() => openSubscriptionModal('monthly')}
            title="Subscribe to Lighthouse Pro"
            aria-label="Subscribe to Lighthouse Pro"
            className="btn-primary w-full flex items-center justify-center p-3 rounded-2xl text-white hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <Crown className="w-5 h-5 fill-white text-white" />
          </button>
        ) : (
          <div className="relative rounded-2xl p-4 bg-gradient-to-b from-[var(--lr-bg-surface,#161D26)] to-[var(--lr-bg-primary,#0E141A)] border border-purple-500/30 overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-7 h-7 rounded-lg bg-purple-900/40 border border-purple-500/40 flex items-center justify-center text-purple-300 mb-2.5 shadow-sm">
                <Crown className="w-4 h-4 fill-purple-300 text-purple-300" />
              </div>

              <h4 className="text-sm font-bold text-[var(--lr-text-primary,#F5F1E8)] tracking-tight flex items-center gap-1.5">
                <span>Lighthouse Pro</span>
                <Sparkles className="w-3 h-3 text-purple-400" />
              </h4>
              <p className="text-[11px] text-[var(--lr-text-secondary,#86929F)] mt-1 leading-snug">
                Unlimited ad-free episodes, 4K quality, offline downloads, and creator exclusives.
              </p>

              <button
                type="button"
                onClick={() => {
                  closeMobileSidebar();
                  openSubscriptionModal('monthly');
                }}
                className="btn-primary mt-3.5 w-full text-white font-bold text-xs py-2.5 rounded-xl text-center block transition-all shadow-md cursor-pointer"
              >
                Subscribe
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop & Tablet Landscape Collapsible Sticky Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 bg-[var(--lr-bg-sidebar,#080D12)] border-r border-[var(--lr-border-primary,#182029)] sticky top-[57px] h-[calc(100vh-57px)] max-h-[calc(100vh-57px)] py-4 select-none overflow-y-auto no-scrollbar z-20 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-16 lg:w-20 px-2' : 'w-56 lg:w-60 px-3'
        }`}
      >
        {renderNavLinks(isCollapsed)}
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
          <div className="relative w-72 max-w-[85vw] bg-[var(--lr-bg-sidebar,#080D12)] border-r border-[var(--lr-border-primary,#182029)] h-full p-4 flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200 overflow-y-auto no-scrollbar">
            {/* Drawer Header with Logo and Close Button */}
            <div className="flex items-center justify-between pb-4 mb-2 border-b border-[var(--lr-border-primary,#182029)]">
              <BrandLogo href={user ? '/home' : '/'} />
              <button
                type="button"
                onClick={closeMobileSidebar}
                aria-label="Close sidebar"
                className="p-1.5 rounded-lg text-[var(--lr-text-muted,#86929F)] hover:text-[var(--lr-text-primary,#F5F1E8)] hover:bg-[var(--lr-bg-elevated,#141B22)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar nav items */}
            {renderNavLinks(false)}
          </div>
        </div>
      )}
    </>
  );
}
