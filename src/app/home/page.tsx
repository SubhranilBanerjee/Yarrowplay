'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { Video, AudioTrack, Blog } from '@/types/database';
import {
  Play,
  Music,
  RefreshCw,
  Zap,
  Film,
  BookOpen,
  Clock,
  TrendingUp,
  Headphones,
  BarChart2,
  ChevronRight,
  Lock,
} from 'lucide-react';

type FeedVideo = Video & { type: 'video' };
type FeedAudio = AudioTrack & { type: 'audio' };
type FeedBlog = Blog & { type: 'blog' };
type FeedItem = FeedVideo | FeedAudio | FeedBlog;

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
    <Link href={`/videos/${video.id}`} className="block relative w-full rounded-3xl overflow-hidden group shadow-2xl border border-[var(--glass-border)] hover:border-[var(--color-magenta)] transition-all">
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
          {/* Tag row */}
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

          {/* Creator + Stats row */}
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
      {/* Cover */}
      <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-[var(--bg-secondary)] shrink-0 border border-[var(--glass-border-subtle)]">
        {track.cover_url ? (
          <Image src={track.cover_url} alt={track.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[var(--color-purple-bright)]/20">
            <Music className="w-5 h-5 text-[var(--color-pink)]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs sm:text-sm font-semibold truncate group-hover:text-[var(--color-pink)] transition-colors">
          {track.title}
        </p>
        <p className="text-[var(--text-muted)] text-[11px] truncate mt-0.5">
          {track.artist_name || track.creator?.display_name} · {track.genre || 'Audio'}
        </p>
      </div>

      {/* Waveform icon + headphones */}
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

// ─── Compact Tile ─────────────────────────────────────────────────────────────
function CompactVideoTile({ video }: { video: FeedVideo }) {
  return (
    <Link href={`/videos/${video.id}`} className="group flex flex-col gap-2">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--glass-border)] group-hover:border-[var(--color-magenta)] transition-all">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-purple-bright)] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
            <Film className="w-6 h-6" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

        {/* Duration badge */}
        {video.duration_seconds > 0 && (
          <div className="absolute top-2 left-2 bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--glass-border-subtle)] text-[var(--text-secondary)] text-[9px] font-bold px-1.5 py-0.5 rounded-md">
            {formatDuration(video.duration_seconds)}
          </div>
        )}

        {/* Lock badge */}
        {video.is_locked && (
          <div className="absolute top-2 right-2 bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--glass-border)] p-1 rounded-md">
            <Lock className="w-2.5 h-2.5 text-[var(--color-pink)]" />
          </div>
        )}

        {/* Play on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full theme-neon-button flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Meta */}
      <div>
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight group-hover:text-[var(--color-pink)] transition-colors">
          {video.title}
        </p>
        <p className="text-[var(--text-muted)] text-[10px] mt-0.5 truncate font-normal">
          @{video.creator?.username || video.creator?.display_name || 'creator'}
        </p>
      </div>
    </Link>
  );
}

// ─── Compact Blog Tile ────────────────────────────────────────────────────────
function CompactBlogTile({ blog }: { blog: FeedBlog }) {
  return (
    <Link href={`/blogs/${blog.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--glass-border)] group-hover:border-[var(--color-magenta)] transition-all">
        {blog.cover_url ? (
          <Image src={blog.cover_url} alt={blog.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--color-purple-bright)] bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
            <BookOpen className="w-6 h-6" />
          </div>
        )}
        <div className="absolute top-2 left-2 bg-[var(--bg-primary)]/80 backdrop-blur-md border border-[var(--glass-border)] text-[var(--color-pink)] text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">
          Blog
        </div>
      </div>
      <div>
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight group-hover:text-[var(--color-pink)] transition-colors">
          {blog.title}
        </p>
        <p className="text-[var(--text-muted)] text-[10px] mt-0.5 truncate font-normal">
          @{blog.author?.username || blog.author?.display_name || 'author'}
        </p>
      </div>
    </Link>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, badge, href }: { title: string; badge?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <h2 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
        <Zap className="w-4 h-4 text-[var(--color-pink)]" />
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">{badge}</span>
        )}
        {href && (
          <Link href={href} className="text-[var(--color-pink)] hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Filter Pills ─────────────────────────────────────────────────────────────
const FILTERS: { key: FilterType; label: string; icon?: React.ElementType }[] = [
  { key: 'all', label: 'All Formats' },
  { key: 'videos', label: 'Videos', icon: Film },
  { key: 'audio', label: 'Audio', icon: Music },
  { key: 'blogs', label: 'Blogs', icon: BookOpen },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const supabase = createClient();
  const { playTrack } = useAudioPlayer();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [audios, setAudios] = useState<FeedAudio[]>([]);
  const [blogs, setBlogs] = useState<FeedBlog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          .limit(10),

        supabase
          .from('blogs')
          .select('*, author:profiles(*)')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(10),
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

  useEffect(() => { fetchFeed(); }, []);

  // Derived data
  const heroVideo = videos[0] ?? null;
  const featuredAudio = audios[0] ?? null;
  const shortVideos = videos.slice(1, 7); // "shorts" section
  const moreVideos = videos.slice(7, 19); // trending section
  const trendingBlogs = blogs.slice(0, 6);

  // Filter-specific overrides
  const showVideos = activeFilter === 'all' || activeFilter === 'videos';
  const showAudio = activeFilter === 'all' || activeFilter === 'audio';
  const showBlogs = activeFilter === 'all' || activeFilter === 'blogs';

  const hasNoContent =
    (activeFilter === 'videos' && videos.length === 0) ||
    (activeFilter === 'audio' && audios.length === 0) ||
    (activeFilter === 'blogs' && blogs.length === 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

      {/* ── Filter Pills ── */}
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
          aria-label="Refresh"
          className="ml-auto p-2.5 rounded-full bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-white hover:border-[var(--color-magenta)] transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[var(--color-pink)]' : ''}`} />
        </button>
      </div>

      {/* ── Loading Skeleton ── */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-[var(--glass-surface)] rounded-3xl" />
          <div className="h-14 bg-[var(--glass-surface)] rounded-2xl" />
          <div className="h-5 bg-[var(--glass-surface)] rounded w-40" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-video bg-[var(--glass-surface)] rounded-2xl" />
                <div className="h-3 bg-[var(--glass-surface)] rounded w-4/5" />
                <div className="h-2 bg-[var(--glass-surface)] rounded w-2/5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── No content ── */}
      {!isLoading && hasNoContent && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-[var(--glass-surface)] border border-[var(--glass-border)] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--color-purple-bright)]/10">
            <Zap className="w-8 h-8 text-[var(--color-pink)]" />
          </div>
          <p className="text-white font-bold text-lg">No content yet</p>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Content uploaded by creators will appear here.</p>
        </div>
      )}

      {!isLoading && !hasNoContent && (
        <div className="space-y-7">

          {/* ── HERO FEATURED VIDEO ── */}
          {showVideos && heroVideo && (
            <HeroCard video={heroVideo} />
          )}

          {/* ── FEATURED AUDIO STRIP ── */}
          {showAudio && featuredAudio && (
            <AudioStrip
              track={featuredAudio}
              onPlay={() => playTrack(featuredAudio, audios)}
            />
          )}

          {/* ── ALL AUDIO (audio-only filter) ── */}
          {activeFilter === 'audio' && audios.length > 0 && (
            <div>
              <SectionHeader title="All Tracks" badge="MUSIC" />
              <div className="space-y-2">
                {audios.map((track) => (
                  <AudioStrip
                    key={track.id}
                    track={track}
                    onPlay={() => playTrack(track, audios)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── SHORTS / QUICK BITES SECTION ── */}
          {showVideos && shortVideos.length > 0 && (
            <div>
              <SectionHeader title="Latest Drops" badge="FRESH" href="/explore?type=video" />
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {shortVideos.map((v) => (
                  <CompactVideoTile key={v.id} video={v} />
                ))}
              </div>
            </div>
          )}

          {/* ── BLOGS SECTION ── */}
          {showBlogs && trendingBlogs.length > 0 && (
            <div>
              <SectionHeader title="From the Blog" badge="READS" href="/explore?type=blog" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {trendingBlogs.map((b) => (
                  <CompactBlogTile key={b.id} blog={b} />
                ))}
              </div>
            </div>
          )}

          {/* ── MORE VIDEOS / TRENDING ── */}
          {showVideos && moreVideos.length > 0 && (
            <div>
              <SectionHeader title="More to Watch" badge="TRENDING" href="/explore?type=video">
              </SectionHeader>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                {moreVideos.map((v) => (
                  <CompactVideoTile key={v.id} video={v} />
                ))}
              </div>
            </div>
          )}

          {/* ── MORE AUDIO STRIPS (in all/audio) ── */}
          {showAudio && activeFilter === 'all' && audios.length > 1 && (
            <div>
              <SectionHeader title="Music & Audio" badge="LISTEN" href="/explore?type=audio" />
              <div className="space-y-2">
                {audios.slice(1, 5).map((track) => (
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
