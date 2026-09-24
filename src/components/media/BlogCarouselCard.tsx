'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Blog } from '@/types/database';
import { BookOpen } from 'lucide-react';

export function BlogCarouselCard({ blog }: { blog: Blog }) {
  return (
    <Link
      href={`/blogs/${blog.id}`}
      className="group shrink-0 snap-start w-[220px] sm:w-[250px] md:w-[270px] flex flex-col gap-2.5 transition-all"
    >
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#111A22] border border-white/[0.07] group-hover:border-[#F4C95D]/40 transition-all">
        {blog.cover_url ? (
          <Image
            src={blog.cover_url}
            alt={blog.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#F4C95D] bg-gradient-to-br from-[#111A22] to-[#151F28]">
            <BookOpen className="w-8 h-8" />
          </div>
        )}
        <div className="absolute top-2 left-2 bg-[#070B0F]/85 backdrop-blur-md border border-[#27313A] text-[#F4C95D] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
          Blog
        </div>
      </div>

      <div className="px-1 flex flex-col gap-1">
        <h3 className="text-[#F5F1E8] text-xs sm:text-sm font-bold line-clamp-2 leading-tight group-hover:text-[#F4C95D] transition-colors">
          {blog.title}
        </h3>
        <p className="text-[#7F8993] text-[11px] truncate font-medium">
          @{blog.author?.username || blog.author?.display_name || 'author'}
        </p>
      </div>
    </Link>
  );
}
