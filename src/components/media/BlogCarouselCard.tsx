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
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[var(--bg-secondary)] theme-glow-frame transition-all">
        {blog.cover_url ? (
          <Image
            src={blog.cover_url}
            alt={blog.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-purple-bright)] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
            <BookOpen className="w-8 h-8" />
          </div>
        )}
        <div className="absolute top-2 left-2 bg-[var(--bg-primary)]/85 backdrop-blur-md border border-[var(--glass-border)] text-[var(--color-pink)] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
          Blog
        </div>
      </div>

      <div className="px-1 flex flex-col gap-1">
        <h3 className="text-white text-xs sm:text-sm font-bold line-clamp-2 leading-tight group-hover:text-[var(--color-pink)] transition-colors">
          {blog.title}
        </h3>
        <p className="text-[var(--text-muted)] text-[11px] truncate font-medium">
          @{blog.author?.username || blog.author?.display_name || 'author'}
        </p>
      </div>
    </Link>
  );
}
