'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { Home, Users, Plus, FileText, Menu } from 'lucide-react';

export function MobileNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toggleMobileSidebar } = useSidebar();

  const isHomeActive = pathname === '/' || pathname === '/home';
  const isFollowingActive = pathname === '/following';
  const isBlogsActive = pathname.startsWith('/blog');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090D12]/95 backdrop-blur-xl border-t border-purple-100/80 dark:border-[#182029] shadow-[0_-4px_25px_rgba(124,58,237,0.08)] dark:shadow-none px-3 py-1.5 safe-area-bottom transition-colors duration-300">
      <div className="flex items-center justify-around">
        {/* Home */}
        <Link
          href="/home"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all ${
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
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Following */}
        <Link
          href="/following"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all ${
            isFollowingActive
              ? 'text-[#7C3AED] dark:text-[#ECC979] font-bold'
              : 'text-[#6B5E99] dark:text-[#8E9BA7] hover:text-[#2E2856] dark:hover:text-[#F5F1E8]'
          }`}
        >
          <Users
            className={`w-5 h-5 ${
              isFollowingActive ? 'fill-[#7C3AED]/20 dark:fill-transparent' : ''
            }`}
          />
          <span className="text-[10px] font-medium">Following</span>
        </Link>

        {/* Floating Center Create Button */}
        <Link
          href={user ? '/creator/studio' : '/login?redirect=/creator/studio'}
          className="flex flex-col items-center -mt-4 group"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#6366F1] text-white dark:bg-[#ECC979] dark:text-[#101418] flex items-center justify-center shadow-lg shadow-purple-500/30 dark:shadow-[#ECC979]/20 group-hover:scale-105 active:scale-95 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-[#7C3AED] dark:text-[#ECC979] mt-0.5">Create</span>
        </Link>

        {/* Blogs */}
        <Link
          href="/blogs"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all ${
            isBlogsActive
              ? 'text-[#7C3AED] dark:text-[#ECC979] font-bold'
              : 'text-[#6B5E99] dark:text-[#8E9BA7] hover:text-[#2E2856] dark:hover:text-[#F5F1E8]'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-medium">Blogs</span>
        </Link>

        {/* Menu / Drawer Toggle */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[#6B5E99] dark:text-[#8E9BA7] hover:text-[#2E2856] dark:hover:text-[#F5F1E8] transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
