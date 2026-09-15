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
    <Link href={`/videos/${video.id}`} className="block relative w-full rounded-2xl overflow-hidden group shadow-2xl">
      {/* Thumbnail */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[#1A1A1C]">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            priority
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A1A1C] to-[#2B2B2D]">
            <Film className="w-16 h-16 text-[#454549]" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 bg-[#FF0080] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">
            <Zap className="w-3 h-3" />
            {video.series ? 'Series' : 'Featured'}
          </span>
          {video.genre && (
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur border border-white/20 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
              <BarChart2 className="w-3 h-3 text-[#FF0080]" />
              {video.genre}
            </span>
          )}
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FF0080] flex items-center justify-center shadow-2xl shadow-[#FF0080]/40 group-hover:scale-110 transition-transform duration-300">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Tag row */}
          <div className="flex items-center gap-2 mb-2">
            {video.category && (
              <span className="bg-[#FF0080] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">
                {video.category}
              </span>
            )}
            {video.tags?.slice(0, 1).map((tag) => (
              <span key={tag} className="text-[#B8B8BD] text-[10px] font-semibold uppercase">
                {tag}
              </span>
            ))}
          </div>

          <h2 className="text-white font-bold text-lg sm:text-xl leading-tight line-clamp-2 drop-shadow-lg">
            {video.title}
          </h2>
          <p className="text-[#B8B8BD] text-xs mt-1 line-clamp-1">
            {video.description}
          </p>

          {/* Creator + Stats row */}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/10">
            <div className="relative w-6 h-6 rounded-full overflow-hidden bg-[#333336] border border-white/20 shrink-0">
              {video.creator?.avatar_url ? (
                <Image src={video.creator.avatar_url} alt="" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-[#FF0080]">
                  {video.creator?.display_name?.[0] || 'C'}
                </div>
              )}
            </div>
            <span className="text-[#B8B8BD] text-[11px] font-medium">
              @{video.creator?.username || video.creator?.display_name || 'creator'}
            </span>
            {video.duration_seconds > 0 && (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-[#85858B]">
                <Clock className="w-3 h-3" />
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
      className="w-full flex items-center gap-3 bg-[#2B2B2D] hover:bg-[#333336] border border-[#454549] hover:border-[#FF0080]/50 rounded-2xl px-4 py-3 transition-all group text-left"
    >
      {/* Cover */}
      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#333336] shrink-0 border border-[#454549]">
        {track.cover_url ? (
          <Image src={track.cover_url} alt={track.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-5 h-5 text-[#FF0080]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate group-hover:text-[#FF0080] transition-colors">
          {track.title}
        </p>
        <p className="text-[#85858B] text-[10px] truncate">
          {track.artist_name || track.creator?.display_name} · {track.genre || 'Audio'}
        </p>
      </div>

      {/* Waveform icon + headphones */}
      <div className="flex items-center gap-2 shrink-0">
        <BarChart2 className="w-4 h-4 text-[#FF0080]" />
        {track.duration_seconds > 0 && (
          <span className="text-[#85858B] text-[10px]">{formatDuration(track.duration_seconds)}</span>
        )}
        <Headphones className="w-4 h-4 text-[#85858B]" />
      </div>
    </button>
  );
}

// ─── Compact Tile ─────────────────────────────────────────────────────────────
function CompactVideoTile({ video }: { video: FeedVideo }) {
  return (
    <Link href={`/videos/${video.id}`} className="group flex flex-col gap-2">
      {/* Thumbnail */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#2B2B2D]">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#454549]">
            <Film className="w-6 h-6" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

        {/* Duration badge */}
        {video.duration_seconds > 0 && (
          <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
            {formatDuration(video.duration_seconds)}
          </div>
        )}

        {/* Lock badge */}
        {video.is_locked && (
          <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur p-1 rounded-md">
            <Lock className="w-2.5 h-2.5 text-[#FF0080]" />
          </div>
        )}

        {/* Play on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-[#FF0080] flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>

      {/* Meta */}
      <div>
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight group-hover:text-[#FF0080] transition-colors">
          {video.title}
        </p>
        <p className="text-[#85858B] text-[10px] mt-0.5 truncate">
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
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#2B2B2D]">
        {blog.cover_url ? (
          <Image src={blog.cover_url} alt={blog.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#454549] bg-gradient-to-br from-[#2B2B2D] to-[#333336]">
            <BookOpen className="w-6 h-6" />
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur text-[#FF0080] text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase">
          Blog
        </div>
      </div>
      <div>
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight group-hover:text-[#FF0080] transition-colors">
          {blog.title}
        </p>
        <p className="text-[#85858B] text-[10px] mt-0.5 truncate">
          @{blog.author?.username || blog.author?.display_name || 'author'}
        </p>
      </div>
    </Link>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, badge, href }: { title: string; badge?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-white font-bold text-base flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#FF0080]" />
        {title}
      </h2>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[#85858B] text-[10px] font-bold uppercase tracking-widest">{badge}</span>
        )}
        {href && (
          <Link href={href} className="text-[#FF0080] hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Filter Pills ─────────────────────────────────────────────────────────────
const FILTERS: { key: FilterType; label: string; icon?: React.ElementType }[] = [
  { key: 'all', label: 'All' },
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
      <div className="flex items-center gap-2 pb-5 overflow-x-auto scrollbar-none">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              activeFilter === key
                ? 'bg-[#FF0080] text-white shadow-lg shadow-[#FF0080]/30'
                : 'bg-[#2B2B2D] text-[#B8B8BD] hover:text-white border border-[#454549]'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}

        <button
          onClick={fetchFeed}
          aria-label="Refresh"
          className="ml-auto p-2 rounded-full bg-[#2B2B2D] border border-[#454549] text-[#85858B] hover:text-white transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#FF0080]' : ''}`} />
        </button>
      </div>

      {/* ── Loading Skeleton ── */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-[#2B2B2D] rounded-2xl" />
          <div className="h-14 bg-[#2B2B2D] rounded-2xl" />
          <div className="h-5 bg-[#2B2B2D] rounded w-40" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-video bg-[#2B2B2D] rounded-xl" />
                <div className="h-3 bg-[#2B2B2D] rounded w-4/5" />
                <div className="h-2 bg-[#2B2B2D] rounded w-2/5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── No content ── */}
      {!isLoading && hasNoContent && (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-[#2B2B2D] border border-[#454549] flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-[#FF0080]" />
          </div>
          <p className="text-white font-semibold">No content yet</p>
          <p className="text-[#85858B] text-sm mt-1">Content uploaded by creators will appear here.</p>
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
