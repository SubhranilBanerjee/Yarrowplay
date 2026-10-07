'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSiteText } from '@/context/SiteTextContext';
import { Home, Sparkles, FileText, User } from 'lucide-react';

export function MobileNavbar() {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { t } = useSiteText();

  const isHomeActive = pathname === '/' || pathname === '/home';
  const isRecommendationsActive = pathname.startsWith('/recommendations');
  const isBlogsActive = pathname.startsWith('/blog');
  const isProfileActive = pathname.startsWith('/profile');

  const profileHref = user
    ? profile?.username
      ? `/profile/${profile.username}`
      : `/profile/${user.id}`
    : '/login?redirect=/profile';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090D12]/95 backdrop-blur-xl border-t border-purple-100/80 dark:border-[#182029] shadow-[0_-4px_25px_rgba(124,58,237,0.08)] dark:shadow-none px-2 py-1.5 safe-area-bottom transition-colors duration-300">
      <div className="grid grid-cols-4 items-center">
        {/* 1. Home */}
        <Link
          href="/home"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            isHomeActive
              ? 'text-[#7C3AED] dark:text-[#ECC979] font-bold'
              : 'text-[#6B5E99] dark:text-[#8E9BA7] hover:text-[#2E2856] dark:hover:text-[#F5F1E8]'
          }`}
        >
          <Home
            className={`w-5 h-5 ${
              isHomeActive ? 'fill-[#7C3AED] dark:fill-[#ECC979]' : ''
            }`}
          />
          <span className="text-[10px] font-medium truncate max-w-[68px]">
            {t('nav.home', 'Home')}
          </span>
        </Link>

        {/* 2. Recommendations */}
        <Link
          href="/recommendations"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            isRecommendationsActive
              ? 'text-[#7C3AED] dark:text-[#ECC979] font-bold'
              : 'text-[#6B5E99] dark:text-[#8E9BA7] hover:text-[#2E2856] dark:hover:text-[#F5F1E8]'
          }`}
        >
          <Sparkles
            className={`w-5 h-5 ${
              isRecommendationsActive ? 'fill-[#7C3AED] dark:fill-[#ECC979]' : ''
            }`}
          />
          <span className="text-[10px] font-medium truncate max-w-[80px]">
            {t('nav.recommendations', 'Recommendations')}
          </span>
        </Link>

        {/* 3. Blogs */}
        <Link
          href="/blogs"
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            isBlogsActive
              ? 'text-[#7C3AED] dark:text-[#ECC979] font-bold'
              : 'text-[#6B5E99] dark:text-[#8E9BA7] hover:text-[#2E2856] dark:hover:text-[#F5F1E8]'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-medium truncate max-w-[68px]">
            {t('nav.blogs', 'Blogs')}
          </span>
        </Link>

        {/* 4. Profile */}
        <Link
          href={profileHref}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
            isProfileActive
              ? 'text-[#7C3AED] dark:text-[#ECC979] font-bold'
              : 'text-[#6B5E99] dark:text-[#8E9BA7] hover:text-[#2E2856] dark:hover:text-[#F5F1E8]'
          }`}
        >
          <User
            className={`w-5 h-5 ${
              isProfileActive ? 'fill-[#7C3AED]/20 dark:fill-transparent' : ''
            }`}
          />
          <span className="text-[10px] font-medium truncate max-w-[68px]">
            {t('nav.profile', 'Profile')}
          </span>
        </Link>
      </div>
    </nav>
  );
}
