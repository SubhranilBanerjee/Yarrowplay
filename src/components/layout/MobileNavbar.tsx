'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { Home, Compass, Plus, FileText, Menu } from 'lucide-react';

export function MobileNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { toggleMobileSidebar } = useSidebar();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090D12]/95 backdrop-blur-xl border-t border-[#182029] px-3 py-1.5 safe-area-bottom">
      <div className="flex items-center justify-around">
        {/* Home */}
        <Link
          href="/home"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all ${
            pathname === '/' || pathname === '/home'
              ? 'text-[#ECC979]'
              : 'text-[#8E9BA7] hover:text-[#F5F1E8]'
          }`}
        >
          <Home
            className={`w-5 h-5 ${
              pathname === '/' || pathname === '/home' ? 'fill-[#ECC979]' : ''
            }`}
          />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Explore */}
        <Link
          href="/explore"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all ${
            pathname === '/explore' ? 'text-[#ECC979]' : 'text-[#8E9BA7] hover:text-[#F5F1E8]'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] font-medium">Explore</span>
        </Link>

        {/* Floating Center Create Button */}
        <Link
          href={user ? '/creator/studio' : '/login?redirect=/creator/studio'}
          className="flex flex-col items-center -mt-4 group"
        >
          <div className="w-11 h-11 rounded-full bg-[#ECC979] text-[#101418] flex items-center justify-center shadow-lg shadow-[#ECC979]/20 group-hover:scale-105 active:scale-95 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-semibold text-[#ECC979] mt-0.5">Create</span>
        </Link>

        {/* Blogs */}
        <Link
          href="/blogs"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all ${
            pathname.startsWith('/blog') ? 'text-[#ECC979]' : 'text-[#8E9BA7] hover:text-[#F5F1E8]'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-medium">Blogs</span>
        </Link>

        {/* Menu / Drawer Toggle */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[#8E9BA7] hover:text-[#F5F1E8] transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
