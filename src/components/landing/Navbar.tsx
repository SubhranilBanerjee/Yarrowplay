'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { Film, User, Menu, X } from 'lucide-react';

interface NavRoute {
  label: string;
  href: string;
}

const NAV_ROUTES: NavRoute[] = [
  { label: 'Discover', href: '/explore' },
  { label: 'Shorts Feed', href: '/home' },
  { label: 'Creators', href: '/explore?q=creators' },
  { label: 'Trending', href: '/explore?q=trending' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-black/30 border-b border-white/5 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Mark */}
        <BrandLogo href={user ? '/home' : '/'} />

        {/* Center: Dynamic Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {NAV_ROUTES.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
                }`}
              >
                {route.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/creator/studio"
                className="hidden sm:flex items-center gap-2 bg-[#EC4899]/15 border border-[#EC4899]/35 text-[#EC4899] hover:bg-[#EC4899] hover:text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-full transition-all shadow-sm hover:shadow-[0_0_15px_rgba(236,72,153,0.4)]"
              >
                <Film className="w-4 h-4" />
                <span>Creator Studio</span>
              </Link>

              <Link
                href={`/profile/${profile?.username || user.id}`}
                className="w-9 h-9 rounded-full bg-[#1E1B2E] border border-white/10 flex items-center justify-center text-[#F9FAFB] hover:border-[#8B5CF6] transition-colors"
              >
                <User className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Log In ghost button */}
              <Link
                href="/login"
                className="text-sm font-medium text-[#F9FAFB] hover:text-white px-3.5 py-2 rounded-full hover:bg-white/5 transition-colors"
              >
                Log In
              </Link>

              {/* Join Now pill button with #EC4899 pink gradient fill */}
              <Link
                href="/register"
                className="text-sm font-bold px-5 py-2 rounded-full bg-gradient-to-r from-[#EC4899] to-[#F43F5E] text-white shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] hover:scale-105 active:scale-95 transition-all"
              >
                Join Now
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-white/5 space-y-1">
          {NAV_ROUTES.map((route) => {
            const isActive = pathname === route.href;
            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-white bg-[#8B5CF6]'
                    : 'text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-white/5'
                }`}
              >
                {route.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
