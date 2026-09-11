'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { MediaCard, UnifiedMediaItem } from '@/components/media/MediaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Video, AudioTrack, Blog, AdvertiserCampaign } from '@/types/database';
import { Film, Music, BookOpen, Sparkles, PlusCircle, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const supabase = createClient();

  const [activeFilter, setActiveFilter] = useState<'all' | 'videos' | 'audio' | 'blogs'>('all');
  const [feedItems, setFeedItems] = useState<UnifiedMediaItem[]>([]);
  const [allAudios, setAllAudios] = useState<AudioTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchFeed = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch public published videos with creator profiles
      const { data: videosData, error: videosErr } = await supabase
        .from('videos')
        .select('*, creator:profiles(*)')
        .eq('visibility', 'public')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      // 2. Fetch active boosts to identify boosted videos
      const nowIso = new Date().toISOString();
      const { data: activeBoosts } = await supabase
        .from('video_boosts')
        .select('video_id')
        .eq('status', 'active')
        .lte('start_date', nowIso)
        .gte('end_date', nowIso);

      const boostedIds = new Set((activeBoosts || []).map((b) => b.video_id));

      const taggedVideos = (videosData || []).map((v) => ({
        ...v,
        type: 'video' as const,
        boosted: boostedIds.has(v.id),
      }));

      // 3. Fetch public published audios
      const { data: audiosData } = await supabase
        .from('audios')
        .select('*, creator:profiles(*)')
        .eq('visibility', 'public')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      const taggedAudios: UnifiedMediaItem[] = (audiosData || []).map((a) => ({
        ...a,
        type: 'audio' as const,
      }));

      setAllAudios((audiosData as AudioTrack[]) || []);

      // 4. Fetch published blogs
      const { data: blogsData } = await supabase
        .from('blogs')
        .select('*, author:profiles(*)')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      const taggedBlogs: UnifiedMediaItem[] = (blogsData || []).map((b) => ({
        ...b,
        type: 'blog' as const,
      }));

      // 5. Fetch active advertiser campaigns
      const { data: campaignsData } = await supabase
        .from('advertiser_campaigns')
        .select('*, advertiser:profiles(*)')
        .eq('status', 'active')
        .lte('start_date', nowIso)
        .gte('end_date', nowIso);

      const taggedAds: UnifiedMediaItem[] = (campaignsData || []).map((c) => ({
        ...c,
        type: 'ad' as const,
      }));

      // 6. Merge and interleave feed (Boosted videos prioritized, Ads paced, etc.)
      const combined: UnifiedMediaItem[] = [];
      const nonBoostedVideos = taggedVideos.filter((v) => !v.boosted);
      const boostedVideos = taggedVideos.filter((v) => v.boosted);

      // Start with boosted items at top (if any)
      combined.push(...boostedVideos);

      // Interleave regular videos, audios, and blogs
      const pool = [...nonBoostedVideos, ...taggedAudios, ...taggedBlogs].sort(
        (a, b) => new Date(b.created_at || (b as any).published_at).getTime() - new Date(a.created_at || (a as any).published_at).getTime()
      );

      // Insert ads periodically
      let adIndex = 0;
      pool.forEach((item, index) => {
        combined.push(item);
        if ((index + 1) % 4 === 0 && taggedAds.length > 0) {
          combined.push(taggedAds[adIndex % taggedAds.length]);
          adIndex++;
        }
      });

      // If no organic content but ads exist, display ads
      if (pool.length === 0 && taggedAds.length > 0) {
        combined.push(...taggedAds);
      }

      setFeedItems(combined);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to load content. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const filteredItems = feedItems.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'videos') return item.type === 'video' || item.type === 'ad';
    if (activeFilter === 'audio') return item.type === 'audio';
    if (activeFilter === 'blogs') return item.type === 'blog';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Category / Format Filter Tabs */}
      <div className="flex items-center justify-between gap-4 pb-6 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeFilter === 'all'
                ? 'bg-[#FF0080] text-white shadow-md'
                : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
            }`}
          >
            All Content
          </button>

          <button
            onClick={() => setActiveFilter('videos')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeFilter === 'videos'
                ? 'bg-[#FF0080] text-white shadow-md'
                : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
            }`}
          >
            <Film className="w-4 h-4" />
            Videos
          </button>

          <button
            onClick={() => setActiveFilter('audio')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeFilter === 'audio'
                ? 'bg-[#FF0080] text-white shadow-md'
                : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
            }`}
          >
            <Music className="w-4 h-4" />
            Audio & Music
          </button>

          <button
            onClick={() => setActiveFilter('blogs')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeFilter === 'blogs'
                ? 'bg-[#FF0080] text-white shadow-md'
                : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Blogs
          </button>
        </div>

        <button
          onClick={fetchFeed}
          aria-label="Refresh Feed"
          className="p-2 rounded-xl bg-[#333336] border border-[#454549] text-[#B8B8BD] hover:text-white transition-colors shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#FF0080]' : ''}`} />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-[#333336] rounded-2xl border border-[#454549] overflow-hidden animate-pulse"
            >
              <div className="aspect-square sm:aspect-video bg-[#3A3A3E]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-[#3A3A3E] rounded w-3/4" />
                <div className="h-3 bg-[#3A3A3E] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && errorMsg && (
        <EmptyState
          icon={RefreshCw}
          title="Unable to load feed"
          description={errorMsg}
          actionLabel="Try Again"
          onAction={fetchFeed}
        />
      )}

      {/* Empty State */}
      {!isLoading && !errorMsg && filteredItems.length === 0 && (
        <EmptyState
          icon={Sparkles}
          title="No content available yet"
          description="Be the first to bring stories to life by uploading your video, audio, or blog post."
          actionLabel="Go to Creator Studio"
          actionHref="/creator/studio"
        />
      )}

      {/* Media Grid: Square tiles on mobile, responsive grid on tablet/desktop */}
      {!isLoading && !errorMsg && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <MediaCard key={`${item.type}-${item.id}`} item={item} allAudioTracks={allAudios} />
          ))}
        </div>
      )}
    </div>
  );
}
