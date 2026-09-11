'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { MediaCard } from '@/components/media/MediaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Video } from '@/types/database';
import { Bookmark } from 'lucide-react';

export default function WatchlistPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [watchlist, setWatchlist] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchWatchlist = async () => {
      setIsLoading(true);
      try {
        const { data: wList } = await supabase
          .from('watchlists')
          .select('video:videos(*, creator:profiles(*))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        const videos = (wList || []).map((w: any) => w.video).filter(Boolean);
        setWatchlist(videos);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchlist();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Bookmark className="w-7 h-7 text-[#FF0080]" />
          My Watchlist
        </h1>
        <p className="text-sm text-[#85858B] mt-1">
          Continue watching where you left off or save videos for movie night.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#333336] rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Watchlist is empty"
          description="Save videos to your watchlist while browsing the home feed."
          actionLabel="Browse Videos"
          actionHref="/home"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {watchlist.map((v) => (
            <MediaCard key={v.id} item={{ ...v, type: 'video' }} />
          ))}
        </div>
      )}
    </div>
  );
}
