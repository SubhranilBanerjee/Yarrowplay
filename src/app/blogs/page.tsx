'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { MediaCard } from '@/components/media/MediaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Blog } from '@/types/database';
import { BookOpen, Plus, Sparkles, RefreshCw } from 'lucide-react';

export default function BlogsFeedPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('blogs')
        .select('*, author:profiles(*)')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data } = await query;
      setBlogs((data as Blog[]) || []);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-[#FF0080]" />
            Blogs & Stories
          </h1>
          <p className="text-sm text-[#85858B] mt-1">
            Essays, commentaries, and deep dives published by the Yarrowplay creator community.
          </p>
        </div>

        {user && (
          <Link
            href="/blog/studio"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white font-semibold text-sm transition-all shadow-md self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Write a Blog</span>
          </Link>
        )}
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2.5 pb-6 overflow-x-auto scrollbar-none">
        {['all', 'Entertainment', 'Music', 'Technology', 'Culture', 'Film Review', 'Tutorial'].map(
          (cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold capitalize transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'theme-active-pill'
                  : 'theme-inactive-pill'
              }`}
            >
              {cat}
            </button>
          )
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#333336] rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && blogs.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No blogs published yet"
          description="Be the first to share an editorial essay or production story on Yarrowplay."
          actionLabel="Write First Blog"
          actionHref="/blog/studio"
        />
      )}

      {/* Grid */}
      {!isLoading && blogs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((b) => (
            <MediaCard key={b.id} item={{ ...b, type: 'blog' }} />
          ))}
        </div>
      )}
    </div>
  );
}
