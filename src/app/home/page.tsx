'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { ContentCarousel } from '@/components/media/ContentCarousel';
import { VideoCarouselCard } from '@/components/media/VideoCarouselCard';
import { BlogCarouselCard } from '@/components/media/BlogCarouselCard';
import { Video, AudioTrack, Blog, ContentSeries, AudioAlbum } from '@/types/database';
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
  Layers,
  Disc,
  Sparkles,
} from 'lucide-react';
import { RecommendationCard, RecommendationItem } from '@/components/media/RecommendationCard';

type FeedVideo = Video & { type: 'video' };
type FeedAudio = AudioTrack & { type: 'audio' };
type FeedBlog = Blog & { type: 'blog' };

type FilterType = 'all' | 'videos' | 'audio' | 'blogs';

interface SeriesWithEpisodes extends ContentSeries {
  episodes: FeedVideo[];
}

interface AlbumWithTracks extends AudioAlbum {
  tracks: FeedAudio[];
}

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
      className="block relative w-full rounded-3xl overflow-hidden group shadow-2xl theme-glow-frame transition-all"
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
            {video.series_id ? 'Series Episode' : 'Featured'}
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
      className="w-full flex items-center gap-3.5 theme-glass-card theme-glow-frame rounded-2xl px-4 py-3 transition-all group text-left cursor-pointer"
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

// Helper: Group videos by series
function groupContentBySeries(
  videos: FeedVideo[],
  seriesList: ContentSeries[]
): {
  seriesGroups: SeriesWithEpisodes[];
  standaloneVideos: FeedVideo[];
} {
  const seriesMap = new Map<string, SeriesWithEpisodes>();

  for (const s of seriesList) {
    seriesMap.set(s.id, { ...s, episodes: [] });
  }

  const standaloneVideos: FeedVideo[] = [];

  for (const v of videos) {
    if (v.series_id) {
      if (!seriesMap.has(v.series_id)) {
        seriesMap.set(v.series_id, {
          id: v.series_id,
          creator_id: v.creator_id,
          title: v.series?.title || 'Series Collection',
          description: v.series?.description || '',
          category: v.category || null,
          tags: v.tags || [],
          cover_url: v.series?.cover_url || v.thumbnail_url || null,
          cover_public_id: null,
          total_episodes: 0,
          created_at: v.created_at,
          updated_at: v.updated_at,
          creator: v.creator,
          episodes: [],
        });
      }
      seriesMap.get(v.series_id)!.episodes.push(v);
    } else {
      standaloneVideos.push(v);
    }
  }

  const seriesGroups: SeriesWithEpisodes[] = [];
  for (const s of seriesMap.values()) {
    if (s.episodes.length > 0) {
      s.episodes.sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0));
      seriesGroups.push(s);
    }
  }

  return { seriesGroups, standaloneVideos };
}

// Helper: Group audio by album
function groupAudioByAlbum(
  audios: FeedAudio[],
  albumList: AudioAlbum[]
): {
  albumGroups: AlbumWithTracks[];
  standaloneAudio: FeedAudio[];
} {
  const albumMap = new Map<string, AlbumWithTracks>();
  for (const a of albumList) {
    albumMap.set(a.id, { ...a, tracks: [] });
  }

  const standaloneAudio: FeedAudio[] = [];
  for (const track of audios) {
    if (track.album_id) {
      if (!albumMap.has(track.album_id)) {
        albumMap.set(track.album_id, {
          id: track.album_id,
          creator_id: track.creator_id,
          title: 'Album Collection',
          artist_name: track.artist_name || track.creator?.display_name || 'Artist',
          genre: track.genre || null,
          description: null,
          cover_url: track.cover_url || null,
          cover_public_id: null,
          created_at: track.created_at,
          updated_at: track.created_at,
          creator: track.creator,
          tracks: [],
        });
      }
      albumMap.get(track.album_id)!.tracks.push(track);
    } else {
      standaloneAudio.push(track);
    }
  }

  const albumGroups: AlbumWithTracks[] = [];
  for (const alb of albumMap.values()) {
    if (alb.tracks.length > 0) {
      alb.tracks.sort((a, b) => (a.track_number || 0) - (b.track_number || 0));
      albumGroups.push(alb);
    }
  }

  return { albumGroups, standaloneAudio };
}

// ─── Main Home Page (Public & Authenticated Video Feed) ─────────────────────────
export default function HomePage() {
  const supabase = createClient();
  const { playTrack } = useAudioPlayer();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [seriesList, setSeriesList] = useState<ContentSeries[]>([]);
  const [audios, setAudios] = useState<FeedAudio[]>([]);
  const [albumList, setAlbumList] = useState<AudioAlbum[]>([]);
  const [blogs, setBlogs] = useState<FeedBlog[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const [
        { data: vids },
        { data: sList },
        { data: auds },
        { data: aList },
        { data: blgs },
        recData,
      ] = await Promise.all([
        supabase
          .from('videos')
          .select('*, creator:profiles(*)')
          .eq('visibility', 'public')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(50),

        supabase
          .from('content_series')
          .select('*, creator:profiles(*)')
          .order('created_at', { ascending: false })
          .limit(15),

        supabase
          .from('audios')
          .select('*, creator:profiles(*)')
          .eq('visibility', 'public')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(30),

        supabase
          .from('audio_albums')
          .select('*, creator:profiles(*)')
          .order('created_at', { ascending: false })
          .limit(10),

        supabase
          .from('blogs')
          .select('*, author:profiles(*)')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(12),

        fetch('/api/recommendations?limit=12')
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

      setVideos(((vids || []) as any[]).map((v) => ({ ...v, type: 'video' as const })));
      setSeriesList((sList as ContentSeries[]) || []);
      setAudios(((auds || []) as any[]).map((a) => ({ ...a, type: 'audio' as const })));
      setAlbumList((aList as AudioAlbum[]) || []);
      setBlogs(((blgs || []) as any[]).map((b) => ({ ...b, type: 'blog' as const })));
      if (recData?.recommendations) {
        setRecommendations(recData.recommendations);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // Group series and albums
  const { seriesGroups, standaloneVideos } = groupContentBySeries(videos, seriesList);
  const { albumGroups, standaloneAudio } = groupAudioByAlbum(audios, albumList);

  const heroVideo = standaloneVideos[0] || videos[0] || null;
  const shortVideos = standaloneVideos.slice(1, 10);
  const trendingBlogs = blogs;

  // Filter overrides
  const showVideos = activeFilter === 'all' || activeFilter === 'videos';
  const showAudio = activeFilter === 'all' || activeFilter === 'audio';
  const showBlogs = activeFilter === 'all' || activeFilter === 'blogs';

  const hasNoContent =
    (activeFilter === 'videos' && videos.length === 0) ||
    (activeFilter === 'audio' && audios.length === 0) ||
    (activeFilter === 'blogs' && blogs.length === 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* ── Filter Navigation Bar ── */}
      <div className="flex items-center gap-2.5 pb-6 overflow-x-auto scrollbar-none">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
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
          className="ml-auto p-2.5 rounded-full bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--text-muted)] hover:text-white hover:border-[var(--color-magenta)] transition-all shrink-0 cursor-pointer"
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
          {showAudio && audios.length > 0 && (
            <AudioStrip
              track={audios[0]}
              onPlay={() => playTrack(audios[0], audios)}
            />
          )}

          {/* 2.5 Recommended for You Carousel */}
          {recommendations.length > 0 && (
            <ContentCarousel
              title="Recommended for You"
              badge="Personalized Picks"
              icon={Sparkles}
            >
              {recommendations.map((rec) => (
                <RecommendationCard key={`${rec.contentType}-${rec.id}`} item={rec} />
              ))}
            </ContentCarousel>
          )}

          {/* 3. DEDICATED SERIES CAROUSELS: Episodes appear inside their series carousel */}
          {showVideos && seriesGroups.map((series) => (
            <ContentCarousel
              key={series.id}
              title={series.title}
              badge={`SERIES · ${series.episodes.length} EPS`}
              href={`/videos/${series.episodes[0]?.id || ''}`}
              icon={Layers}
            >
              {series.episodes.map((ep) => (
                <VideoCarouselCard key={ep.id} video={ep} />
              ))}
            </ContentCarousel>
          ))}

          {/* 4. Standalone Videos Carousel */}
          {showVideos && shortVideos.length > 0 && (
            <ContentCarousel
              title="Featured Movies & Drops"
              badge="FRESH"
              href="/explore?type=video"
              icon={Zap}
            >
              {shortVideos.map((v) => (
                <VideoCarouselCard key={v.id} video={v} />
              ))}
            </ContentCarousel>
          )}

          {/* 5. DEDICATED ALBUM COLLECTIONS */}
          {showAudio && albumGroups.map((album) => (
            <div key={album.id} className="theme-glass-card theme-glow-frame rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Disc className="w-5 h-5 text-[var(--color-pink)]" />
                  <h2 className="text-white font-bold text-base sm:text-lg">{album.title}</h2>
                  <span className="text-[var(--color-pink)] text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[var(--color-pink)]/15 border border-[var(--color-pink)]/30">
                    ALBUM · {album.tracks.length} TRACKS
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] font-medium">
                  {album.artist_name || album.creator?.display_name}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {album.tracks.map((t) => (
                  <AudioStrip
                    key={t.id}
                    track={t}
                    onPlay={() => playTrack(t, album.tracks)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* 6. Creator Blogs Carousel */}
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

          {/* 7. Singles & Audio Tracks */}
          {showAudio && standaloneAudio.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3.5 px-1">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-[var(--color-pink)]" />
                  <h2 className="text-white font-bold text-base sm:text-lg">Singles & Audio Tracks</h2>
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
                {standaloneAudio.slice(0, 8).map((track) => (
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

