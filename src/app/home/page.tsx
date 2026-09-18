'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { ContentCarousel } from '@/components/media/ContentCarousel';
import { VideoCarouselCard } from '@/components/media/VideoCarouselCard';
import { BlogCarouselCard } from '@/components/media/BlogCarouselCard';
import { Video, AudioTrack, Blog } from '@/types/database';
import {
  Play,
  Music,
  RefreshCw,
  Zap,
  Film,
  BookOpen,
  Clock,
  Headphones,
  BarChart2,
  Flame,
} from 'lucide-react';

type FeedVideo = Video & { type: 'video' };
type FeedAudio = AudioTrack & { type: 'audio' };
type FeedBlog = Blog & { type: 'blog' };

type FilterType = 'all' | 'videos' | 'audio' | 'blogs';

function formatDuration(seconds?: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ─── Hero Card ──────────────────────────────────────────────────────────────
function HeroCard({ video }: { video: FeedVideo }) {
  return (
    <Link
      href={`/videos/${video.id}`}
      className="block relative w-full rounded-3xl overflow-hidden group shadow-2xl border border-[var(--glass-border)] hover:border-[var(--color-magenta)] transition-all"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[var(--bg-secondary)]">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            priority
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
            <Film className="w-16 h-16 text-[var(--color-purple-bright)]" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5 theme-neon-button text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
            <Zap className="w-3 h-3" />
            {video.series ? 'Series' : 'Featured'}
          </span>
          {video.genre && (
            <span className="flex items-center gap-1.5 bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--glass-border)] text-white text-[10px] font-semibold px-3 py-1 rounded-full">
              <BarChart2 className="w-3 h-3 text-[var(--color-pink)]" />
              {video.genre}
            </span>
          )}
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full theme-neon-button flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-2">
            {video.category && (
              <span className="bg-[var(--color-purple-bright)]/20 border border-[var(--color-purple-bright)]/40 text-[var(--color-pink)] text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                {video.category}
              </span>
            )}
            {video.tags?.slice(0, 1).map((tag) => (
              <span key={tag} className="text-[var(--text-secondary)] text-[10px] font-semibold uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>

          <h2 className="text-white font-black text-xl sm:text-3xl leading-tight line-clamp-2 drop-shadow-lg">
            {video.title}
          </h2>
          <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-1.5 line-clamp-1 max-w-2xl font-normal">
            {video.description}
          </p>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--glass-border-subtle)]">
            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-[var(--color-purple-bright)]/20 border border-[var(--glass-border)] shrink-0 flex items-center justify-center">
              {video.creator?.avatar_url ? (
                <Image src={video.creator.avatar_url} alt="" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[var(--color-pink)]">
                  {video.creator?.display_name?.[0] || 'C'}
                </div>
              )}
            </div>
            <span className="text-[var(--text-secondary)] text-xs font-medium">
              @{video.creator?.username || video.creator?.display_name || 'creator'}
            </span>
            {video.duration_seconds > 0 && (
              <span className="ml-auto flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(video.duration_seconds)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Audio Strip ─────────────────────────────────────────────────────────────
function AudioStrip({ track, onPlay }: { track: FeedAudio; onPlay: () => void }) {
  return (
    <button
      onClick={onPlay}
      className="w-full flex items-center gap-3.5 theme-glass-card rounded-2xl px-4 py-3 transition-all group text-left border border-[var(--glass-border)] hover:border-[var(--color-magenta)]"
    >
      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[var(--bg-secondary)] shrink-0 border border-[var(--glass-border-subtle)]">
        {track.cover_url ? (
          <Image src={track.cover_url} alt={track.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-purple-bright)]/20">
            <Music className="w-5 h-5 text-[var(--color-pink)]" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-xs sm:text-sm font-semibold truncate group-hover:text-[var(--color-pink)] transition-colors">
          {track.title}
        </p>
        <p className="text-[var(--text-muted)] text-[11px] truncate mt-0.5">
          {track.artist_name || track.creator?.display_name} · {track.genre || 'Audio'}
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <BarChart2 className="w-4 h-4 text-[var(--color-pink)]" />
        {track.duration_seconds > 0 && (
          <span className="text-[var(--text-muted)] text-[11px] font-medium">{formatDuration(track.duration_seconds)}</span>
        )}
        <Headphones className="w-4 h-4 text-[var(--text-muted)]" />
      </div>
    </button>
  );
}

// ─── Filter Pills ─────────────────────────────────────────────────────────────
const FILTERS: { key: FilterType; label: string; icon?: React.ElementType }[] = [
  { key: 'all', label: 'All Formats' },
  { key: 'videos', label: 'Videos', icon: Film },
  { key: 'audio', label: 'Audio', icon: Music },
  { key: 'blogs', label: 'Blogs', icon: BookOpen },
];

// ─── Main Home Page (Dynamic Content Feed for Authenticated Users) ─────────────
export default function HomePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = createClient();
  const { playTrack } = useAudioPlayer();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [audios, setAudios] = useState<FeedAudio[]>([]);
  const [blogs, setBlogs] = useState<FeedBlog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // If someone isn't logged in, redirect to landing page instead of login
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const [{ data: vids }, { data: auds }, { data: blgs }] = await Promise.all([
        supabase
          .from('videos')
          .select('*, creator:profiles(*)')
          .eq('visibility', 'public')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(30),

        supabase
          .from('audios')
          .select('*, creator:profiles(*)')
          .eq('visibility', 'public')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(12),

        supabase
          .from('blogs')
          .select('*, author:profiles(*)')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(12),
      ]);

      setVideos(((vids || []) as any[]).map((v) => ({ ...v, type: 'video' as const })));
      setAudios(((auds || []) as any[]).map((a) => ({ ...a, type: 'audio' as const })));
      setBlogs(((blgs || []) as any[]).map((b) => ({ ...b, type: 'blog' as const })));
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // Derived content
  const heroVideo = videos[0] ?? null;
  const featuredAudio = audios[0] ?? null;
  const shortVideos = videos.slice(1, 10);
  const moreVideos = videos.slice(10, 25);
  const trendingBlogs = blogs;

  // Filter overrides
  const showVideos = activeFilter === 'all' || activeFilter === 'videos';
  const showAudio = activeFilter === 'all' || activeFilter === 'audio';
  const showBlogs = activeFilter === 'all' || activeFilter === 'blogs';

  const hasNoContent =
    (activeFilter === 'videos' && videos.length === 0) ||
    (activeFilter === 'audio' && audios.length === 0) ||
    (activeFilter === 'blogs' && blogs.length === 0);

  if (!authLoading && !user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* ── Filter Navigation Bar ── */}
      <div className="flex items-center gap-2.5 pb-6 overflow-x-auto scrollbar-none">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
              activeFilter === key
                ? 'theme-active-pill'
                : 'theme-inactive-pill'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}

        <button
          onClick={fetchFeed}
          aria-label="Refresh Feed"
          className="ml-auto p-2.5 rounded-full bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-white hover:border-[var(--color-magenta)] transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[var(--color-pink)]' : ''}`} />
        </button>
      </div>

      {/* ── Loading Skeleton ── */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-[var(--glass-surface)] rounded-3xl" />
          <div className="h-14 bg-[var(--glass-surface)] rounded-2xl" />
          <div className="h-44 bg-[var(--glass-surface)] rounded-2xl" />
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && hasNoContent && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[var(--glass-surface)] border border-[var(--glass-border)] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--color-purple-bright)]/10">
            <Zap className="w-8 h-8 text-[var(--color-pink)]" />
          </div>
          <p className="text-white font-bold text-lg">No content found</p>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Content uploaded by creators will appear here.</p>
        </div>
      )}

      {/* ── Dynamic Content Showcase with Carousels ── */}
      {!isLoading && !hasNoContent && (
        <div className="space-y-10">

          {/* 1. Hero Featured Video */}
          {showVideos && heroVideo && (
            <HeroCard video={heroVideo} />
          )}

          {/* 2. Featured Audio Strip */}
          {showAudio && featuredAudio && (
            <AudioStrip
              track={featuredAudio}
              onPlay={() => playTrack(featuredAudio, audios)}
            />
          )}

          {/* 3. Latest Drops Video Carousel */}
          {showVideos && shortVideos.length > 0 && (
            <ContentCarousel
              title="Latest Drops"
              badge="FRESH"
              href="/explore?type=video"
              icon={Zap}
            >
              {shortVideos.map((v) => (
                <VideoCarouselCard key={v.id} video={v} />
              ))}
            </ContentCarousel>
          )}

          {/* 4. Trending & Series Video Carousel */}
          {showVideos && moreVideos.length > 0 && (
            <ContentCarousel
              title="Trending & Episodic Series"
              badge="HOT"
              href="/explore?type=video"
              icon={Flame}
            >
              {moreVideos.map((v) => (
                <VideoCarouselCard key={v.id} video={v} />
              ))}
            </ContentCarousel>
          )}

          {/* 5. Creator Blogs Carousel */}
          {showBlogs && trendingBlogs.length > 0 && (
            <ContentCarousel
              title="Community Blogs & Stories"
              badge="READS"
              href="/blogs"
              icon={BookOpen}
            >
              {trendingBlogs.map((b) => (
                <BlogCarouselCard key={b.id} blog={b} />
              ))}
            </ContentCarousel>
          )}

          {/* 6. Music & Audio Tracks */}
          {showAudio && audios.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-3.5 px-1">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-[var(--color-pink)]" />
                  <h2 className="text-white font-bold text-base sm:text-lg">Music & Audio</h2>
                  <span className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--glass-surface-subtle)] border border-[var(--glass-border-subtle)]">
                    LISTEN
                  </span>
                </div>
                <Link
                  href="/explore?type=audio"
                  className="text-xs font-semibold text-[var(--color-pink)] hover:text-white transition-colors"
                >
                  View all
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {audios.slice(1, 9).map((track) => (
                  <AudioStrip
                    key={track.id}
                    track={track}
                    onPlay={() => playTrack(track, audios)}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
