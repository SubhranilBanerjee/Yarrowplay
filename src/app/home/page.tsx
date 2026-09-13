'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { MediaCard, UnifiedMediaItem } from '@/components/media/MediaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Video, AudioTrack, Blog, AdvertiserCampaign } from '@/types/database';
import { Film, Music, BookOpen, Sparkles, PlusCircle, RefreshCw, Megaphone } from 'lucide-react';

export default function HomePage() {
  const supabase = createClient();

  const [activeFilter, setActiveFilter] = useState<'all' | 'videos' | 'audio' | 'blogs' | 'sponsored'>('all');
  const [feedItems, setFeedItems] = useState<UnifiedMediaItem[]>([]);
  const [allAudios, setAllAudios] = useState<AudioTrack[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<AdvertiserCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchFeed = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const nowIso = new Date().toISOString();

      // Parallelize all feed queries
      const [
        { data: videosData },
        { data: activeBoosts },
        { data: audiosData },
        { data: blogsData },
        { data: campaignsData },
      ] = await Promise.all([
        supabase
          .from('videos')
          .select('*, creator:profiles(*)')
          .eq('visibility', 'public')
          .eq('status', 'published')
          .order('created_at', { ascending: false }),

        supabase
          .from('video_boosts')
          .select('video_id')
          .eq('status', 'active')
          .lte('start_date', nowIso)
          .gte('end_date', nowIso),

        supabase
          .from('audios')
          .select('*, creator:profiles(*)')
          .eq('visibility', 'public')
          .eq('status', 'published')
          .order('created_at', { ascending: false }),

        supabase
          .from('blogs')
          .select('*, author:profiles(*)')
          .eq('status', 'published')
          .order('published_at', { ascending: false }),

        supabase
          .from('advertiser_campaigns')
          .select('*, advertiser:profiles(*)')
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
      ]);

      const boostedIds = new Set((activeBoosts || []).map((b: any) => b.video_id));

      const taggedVideos = (videosData || []).map((v: any) => ({
        ...v,
        type: 'video' as const,
        boosted: boostedIds.has(v.id),
      }));

      const taggedAudios: UnifiedMediaItem[] = (audiosData || []).map((a: any) => ({
        ...a,
        type: 'audio' as const,
      }));

      setAllAudios((audiosData as AudioTrack[]) || []);

      const taggedBlogs: UnifiedMediaItem[] = (blogsData || []).map((b: any) => ({
        ...b,
        type: 'blog' as const,
      }));

      // Filter active campaigns by end_date (if end_date specified)
      const nowMs = Date.now();
      const validCampaigns = (campaignsData || []).filter((c: any) => {
        if (c.end_date && new Date(c.end_date).getTime() < nowMs) return false;
        return true;
      });

      setAllCampaigns(validCampaigns as AdvertiserCampaign[]);

      const taggedAds: UnifiedMediaItem[] = validCampaigns.map((c: any) => ({
        ...c,
        type: 'ad' as const,
      }));

      // Merge and interleave feed (Boosted videos prioritized, Ads paced, all ads included)
      const combined: UnifiedMediaItem[] = [];
      const nonBoostedVideos = taggedVideos.filter((v: any) => !v.boosted);
      const boostedVideos = taggedVideos.filter((v: any) => v.boosted);

      // Start with boosted items at top (if any)
      combined.push(...boostedVideos);

      // Interleave regular videos, audios, and blogs
      const pool = [...nonBoostedVideos, ...taggedAudios, ...taggedBlogs].sort(
        (a, b) => new Date(b.created_at || (b as any).published_at).getTime() - new Date(a.created_at || (a as any).published_at).getTime()
      );

      // Insert ads periodically and guarantee ALL active campaigns are shown
      if (pool.length === 0) {
        combined.push(...taggedAds);
      } else {
        let adIndex = 0;
        pool.forEach((item, index) => {
          combined.push(item);
          // Insert ad after the 2nd item (index === 1) or every 3 items thereafter
          if ((index === 1 || (index > 1 && (index + 1) % 3 === 0)) && adIndex < taggedAds.length) {
            combined.push(taggedAds[adIndex]);
            adIndex++;
          }
        });

        // Ensure any remaining ads that weren't inserted due to short pool are appended
        while (adIndex < taggedAds.length) {
          combined.push(taggedAds[adIndex]);
          adIndex++;
        }
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
    if (activeFilter === 'sponsored') return item.type === 'ad';
    if (activeFilter === 'videos') return item.type === 'video' || (item.type === 'ad' && (item as any).media_type === 'video');
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

          <button
            onClick={() => setActiveFilter('sponsored')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeFilter === 'sponsored'
                ? 'bg-[#FF0080] text-white shadow-md'
                : 'bg-[#333336] text-[#B8B8BD] hover:text-white border border-[#454549]'
            }`}
          >
            <Megaphone className="w-4 h-4 text-[#FF0080]" />
            <span>Sponsored</span>
            {allCampaigns.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFilter === 'sponsored' ? 'bg-white/25 text-white' : 'bg-[#FF0080]/20 text-[#FF0080]'
              }`}>
                {allCampaigns.length}
              </span>
            )}
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
          icon={activeFilter === 'sponsored' ? Megaphone : Sparkles}
          title={activeFilter === 'sponsored' ? 'No sponsored campaigns active' : 'No content available yet'}
          description={
            activeFilter === 'sponsored'
              ? 'Launch your brand campaign to reach viewers across Yarrowplay.'
              : 'Be the first to bring stories to life by uploading your video, audio, or blog post.'
          }
          actionLabel={activeFilter === 'sponsored' ? 'Go to Advertiser Studio' : 'Go to Creator Studio'}
          actionHref={activeFilter === 'sponsored' ? '/advertiser' : '/creator/studio'}
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
