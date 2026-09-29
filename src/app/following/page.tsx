'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { SeriesCard } from '@/components/media/SeriesCard';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Users,
  Film,
  Tv,
  FileText,
  UserCheck,
  UserPlus,
  Play,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface FollowedCreator {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  sub_role: string | null;
  isFollowing: boolean;
}

export default function FollowingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [followedCreators, setFollowedCreators] = useState<FollowedCreator[]>([]);
  const [suggestedCreators, setSuggestedCreators] = useState<FollowedCreator[]>([]);
  const [creatorSeries, setCreatorSeries] = useState<any[]>([]);
  const [creatorVideos, setCreatorVideos] = useState<any[]>([]);
  const [creatorBlogs, setCreatorBlogs] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFollowingData() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // 1. Get creator IDs followed by current user
        const { data: followRows } = await supabase
          .from('creator_follows')
          .select('creator_id')
          .eq('follower_id', user.id);

        const followedIds = (followRows || []).map((r: any) => r.creator_id).filter(Boolean);

        if (followedIds.length > 0) {
          // Fetch profiles of followed creators
          const { data: creatorProfiles } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url, bio, sub_role')
            .in('id', followedIds);

          const mappedFollowed = (creatorProfiles || []).map((c: any) => ({
            ...c,
            isFollowing: true,
          }));
          setFollowedCreators(mappedFollowed);

          // Fetch recent series by followed creators
          const { data: seriesData } = await supabase
            .from('content_series')
            .select('*, creator:profiles(*), episodes:videos(id, episode_number, thumbnail_url, duration_seconds, views_count, is_locked)')
            .in('creator_id', followedIds)
            .order('created_at', { ascending: false })
            .limit(10);

          const mappedSeries = (seriesData || []).map((s: any) => {
            const episodes = s.episodes || [];
            const sorted = [...episodes].sort(
              (a: any, b: any) => (a.episode_number || 0) - (b.episode_number || 0)
            );
            return {
              ...s,
              first_episode_id: sorted[0]?.id || s.id,
              episode_count: episodes.length || s.total_episodes || 1,
            };
          });
          setCreatorSeries(mappedSeries);

          // Fetch recent videos / reels by followed creators
          const { data: videosData } = await supabase
            .from('videos')
            .select('*, creator:profiles(*)')
            .in('creator_id', followedIds)
            .eq('status', 'published')
            .eq('visibility', 'public')
            .order('created_at', { ascending: false })
            .limit(12);
          setCreatorVideos(videosData || []);

          // Fetch recent blogs by followed creators
          const { data: blogsData } = await supabase
            .from('blogs')
            .select('*, author:profiles(*)')
            .in('author_id', followedIds)
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(6);
          setCreatorBlogs(blogsData || []);
        } else {
          // If 0 followed creators, fetch suggested creators
          const { data: suggestions } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url, bio, sub_role')
            .eq('role', 'creator')
            .neq('id', user.id)
            .limit(8);

          setSuggestedCreators(
            (suggestions || []).map((s: any) => ({
              ...s,
              isFollowing: false,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load following feed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFollowingData();
  }, [user]);

  // Handle follow / unfollow toggle
  const handleToggleFollow = async (creatorId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Optimistic UI updates
    setFollowedCreators((prev) =>
      prev.map((c) => (c.id === creatorId ? { ...c, isFollowing: !c.isFollowing } : c))
    );
    setSuggestedCreators((prev) =>
      prev.map((c) => (c.id === creatorId ? { ...c, isFollowing: !c.isFollowing } : c))
    );

    try {
      await fetch('/api/creators/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: creatorId }),
      });
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  };

  if (!user) {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center p-4">
        <EmptyState
          icon={Users}
          title="Sign in to view your Following feed"
          description="Follow your favorite directors, reel artists, and filmmakers to get their latest series and episodes."
          actionLabel="Sign In"
          actionHref="/login"
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[var(--lr-bg-primary,#070B0F)] text-[var(--lr-text-primary,#F5F1E8)] px-4 sm:px-6 lg:px-8 py-6 pb-24">
      {/* Page Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center gap-2.5 text-xs font-bold text-[#ECC979] uppercase tracking-wider mb-1">
          <Users className="w-4 h-4" />
          <span>Creator Network</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--lr-text-primary,#F5F1E8)]">
          Following
        </h1>
        <p className="text-xs sm:text-sm text-[var(--lr-text-secondary,#B7BEC6)] mt-1">
          Latest episodes, series, and articles from creators you follow.
        </p>
      </div>

      {isLoading ? (
        <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#ECC979] border-t-transparent animate-spin mb-3" />
          <p className="text-xs text-[var(--lr-text-secondary,#9AA7B4)]">Loading creator updates...</p>
        </div>
      ) : followedCreators.length === 0 ? (
        /* ─── EMPTY FOLLOWING STATE + SUGGESTED CREATORS ─────────────────── */
        <div className="max-w-4xl mx-auto space-y-10 my-8">
          <div className="p-8 rounded-3xl bg-[var(--lr-bg-surface,#111A22)] border border-[var(--lr-border-primary,#27313A)] text-center shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-[#ECC979]/15 border border-[#ECC979]/30 flex items-center justify-center text-[#ECC979] mx-auto mb-4">
              <UserPlus className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--lr-text-primary,#F5F1E8)]">
              You aren&apos;t following any creators yet
            </h2>
            <p className="text-xs sm:text-sm text-[var(--lr-text-secondary,#B7BEC6)] mt-1.5 max-w-md mx-auto">
              Follow talented filmmakers and series creators below to see their new releases right here.
            </p>
          </div>

          {/* Suggested Creators Rail */}
          {suggestedCreators.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-[var(--lr-text-primary,#F5F1E8)]">
                <Sparkles className="w-4 h-4 text-[#ECC979]" />
                <h3>Suggested Creators</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {suggestedCreators.map((creator) => (
                  <div
                    key={creator.id}
                    className="rounded-2xl p-5 bg-[var(--lr-bg-surface,#111A22)] border border-[var(--lr-border-primary,#27313A)] flex flex-col items-center text-center justify-between"
                  >
                    <div>
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[var(--lr-bg-elevated,#1A232D)] mb-3 mx-auto border border-[#ECC979]/30">
                        {creator.avatar_url ? (
                          <Image src={creator.avatar_url} alt={creator.display_name || ''} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-[#ECC979]">
                            {creator.display_name?.[0]?.toUpperCase() || 'C'}
                          </div>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[var(--lr-text-primary,#F5F1E8)] truncate">
                        {creator.display_name || creator.username}
                      </h4>
                      <p className="text-[11px] text-[var(--lr-text-muted,#7E8B99)] truncate">
                        @{creator.username}
                      </p>
                      {creator.bio && (
                        <p className="text-xs text-[var(--lr-text-secondary,#B7BEC6)] mt-2 line-clamp-2 leading-relaxed">
                          {creator.bio}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFollow(creator.id)}
                      className={`mt-4 w-full py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        creator.isFollowing
                          ? 'bg-[var(--lr-bg-elevated,#1A232D)] border border-[var(--lr-border-primary,#27313A)] text-[var(--lr-text-primary,#F5F1E8)]'
                          : 'bg-[#ECC979] hover:bg-[#F4C95D] text-[#101418] shadow-md'
                      }`}
                    >
                      {creator.isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-[#68B88A]" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─── POPULATED FOLLOWING CONTENT ─────────────────────────────────── */
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Top Followed Creators Avatars Rail */}
          <div className="p-4 rounded-2xl bg-[var(--lr-bg-surface,#111A22)] border border-[var(--lr-border-primary,#27313A)]">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
              {followedCreators.map((creator) => (
                <Link
                  key={creator.id}
                  href={`/profile/${creator.username || creator.id}`}
                  className="flex flex-col items-center gap-1.5 shrink-0 group"
                >
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-[#ECC979]/40 group-hover:border-[#ECC979] transition-all p-0.5 shadow-md">
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-[var(--lr-bg-elevated,#1A232D)]">
                      {creator.avatar_url ? (
                        <Image src={creator.avatar_url} alt={creator.display_name || ''} fill className="object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-[#ECC979]">
                          {creator.display_name?.[0]?.toUpperCase() || 'C'}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--lr-text-primary,#F5F1E8)] max-w-[72px] truncate group-hover:text-[#ECC979] transition-colors">
                    {creator.display_name || creator.username}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Series from Followed Creators */}
          {creatorSeries.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-bold text-[var(--lr-text-primary,#F5F1E8)]">
                <Tv className="w-5 h-5 text-[#ECC979]" />
                <h2>New Series from Creators You Follow</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {creatorSeries.map((s) => (
                  <SeriesCard
                    key={s.id}
                    series={s}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Short Reels / Episodes */}
          {creatorVideos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-bold text-[var(--lr-text-primary,#F5F1E8)]">
                <Film className="w-5 h-5 text-[#ECC979]" />
                <h2>Recent Reels & Episodes</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {creatorVideos.map((v) => (
                  <Link
                    key={v.id}
                    href={`/videos/${v.id}`}
                    className="group relative aspect-[9/15] rounded-xl overflow-hidden bg-[var(--lr-bg-surface,#111A22)] border border-[var(--lr-border-primary,#27313A)] hover:border-[#ECC979]/50 transition-all flex flex-col justify-end p-2.5 shadow-md"
                  >
                    <Image
                      src={v.thumbnail_url || '/images/series_city_lights.jpg'}
                      alt={v.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="relative z-10">
                      <span className="text-[10px] text-[#ECC979] font-mono">
                        {v.episode_number ? `Ep. ${v.episode_number}` : 'Reel'}
                      </span>
                      <h3 className="text-xs font-bold text-white truncate group-hover:text-[#ECC979] transition-colors">
                        {v.title}
                      </h3>
                      <p className="text-[10px] text-white/80 truncate">
                        {v.creator?.display_name || v.creator?.username}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Articles from Followed Creators */}
          {creatorBlogs.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-bold text-[var(--lr-text-primary,#F5F1E8)]">
                <FileText className="w-5 h-5 text-[#ECC979]" />
                <h2>Articles & Stories</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {creatorBlogs.map((b) => (
                  <Link
                    key={b.id}
                    href={`/blogs/${b.id}`}
                    className="group rounded-2xl bg-[var(--lr-bg-surface,#111A22)] border border-[var(--lr-border-primary,#27313A)] hover:border-[#ECC979]/40 p-4 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {b.cover_url && (
                        <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden mb-3">
                          <Image src={b.cover_url} alt={b.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      )}
                      <span className="text-[11px] font-semibold text-[#ECC979] uppercase">
                        {b.category || 'Article'}
                      </span>
                      <h3 className="text-sm font-bold text-[var(--lr-text-primary,#F5F1E8)] group-hover:text-[#ECC979] transition-colors mt-1 line-clamp-2">
                        {b.title}
                      </h3>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-[var(--lr-text-muted,#7E8B99)] pt-2 border-t border-[var(--lr-border-subtle,#1C252D)]">
                      <span>{b.author?.display_name || 'Creator'}</span>
                      <span className="flex items-center gap-1 group-hover:text-[#ECC979] transition-colors">
                        Read <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
