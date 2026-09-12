'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { MediaCard, UnifiedMediaItem } from '@/components/media/MediaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Heart, Film, Music, BookOpen } from 'lucide-react';

export default function FavoritesPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'blog'>('video');
  const [favoriteItems, setFavoriteItems] = useState<UnifiedMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      setIsLoading(true);
      try {
        const { data: favs } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id);

        if (favs && favs.length > 0) {
          const vidIds = favs.filter((f: any) => f.content_type === 'video').map((f: any) => f.content_id);
          const audIds = favs.filter((f: any) => f.content_type === 'audio').map((f: any) => f.content_id);
          const blgIds = favs.filter((f: any) => f.content_type === 'blog').map((f: any) => f.content_id);

          const [vidsRes, audsRes, blgsRes] = await Promise.all([
            vidIds.length > 0
              ? supabase.from('videos').select('*, creator:profiles(*)').in('id', vidIds)
              : Promise.resolve({ data: [] }),
            audIds.length > 0
              ? supabase.from('audios').select('*, creator:profiles(*)').in('id', audIds)
              : Promise.resolve({ data: [] }),
            blgIds.length > 0
              ? supabase.from('blogs').select('*, author:profiles(*)').in('id', blgIds)
              : Promise.resolve({ data: [] }),
          ]);

          const list: UnifiedMediaItem[] = [];
          (vidsRes.data || []).forEach((v: any) => list.push({ ...v, type: 'video' }));
          (audsRes.data || []).forEach((a: any) => list.push({ ...a, type: 'audio' }));
          (blgsRes.data || []).forEach((b: any) => list.push({ ...b, type: 'blog' }));

          setFavoriteItems(list);
        } else {
          setFavoriteItems([]);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const filteredItems = favoriteItems.filter((item) => item.type === activeTab);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Heart className="w-7 h-7 text-[#FF0080]" />
          My Favorites
        </h1>
        <p className="text-sm text-[#85858B] mt-1">
          Your bookmarked videos, music, and blogs saved in your Supabase profile.
        </p>
      </div>

      {/* Tabs: Videos, Audios, Blogs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'video'
              ? 'bg-[#FF0080] text-white shadow-md'
              : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
          }`}
        >
          <Film className="w-4 h-4" />
          Videos
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'audio'
              ? 'bg-[#FF0080] text-white shadow-md'
              : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
          }`}
        >
          <Music className="w-4 h-4" />
          Audios
        </button>

        <button
          onClick={() => setActiveTab('blog')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'blog'
              ? 'bg-[#FF0080] text-white shadow-md'
              : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Blogs
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#333336] rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={`No favorite ${activeTab}s saved yet`}
          description={`Browse the ${activeTab} library and tap the heart icon to save favorites here.`}
          actionLabel="Explore Feed"
          actionHref="/home"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <MediaCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
