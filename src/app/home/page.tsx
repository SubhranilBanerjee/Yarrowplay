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
import { SeriesCard } from '@/components/media/SeriesCard';
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
  Layers,
  Disc,
  Sparkles,
  Flame,
} from 'lucide-react';
import { RecommendationCard, RecommendationItem } from '@/components/media/RecommendationCard';
import {
  VideoItem,
  CreatorItem,
  CategorySection,
  mapSupabaseVideoToItem,
  mapSupabaseProfileToCreator,
} from '@/data/content';
import { RecommendedSection } from '@/components/landing/RecommendedSection';
import { CreatorSpotlight } from '@/components/landing/CreatorSpotlight';
import { VideoPreviewModal } from '@/components/landing/VideoPreviewModal';
import { ContinueWatchingSection } from '@/components/media/ContinueWatchingSection';

type FeedVideo = Video & { type: 'video' };
type FeedAudio = AudioTrack & { type: 'audio' };
type FeedBlog = Blog & { type: 'blog' };
type FeedSeries = ContentSeries & {
  type: 'series';
  first_episode_id?: string;
  episode_count?: number;
};

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
      className="block relative w-full rounded-2xl overflow-hidden group shadow-2xl transition-all border border-[#27313A] hover:border-[#F4C95D]/40"
    >
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[#111A22]">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            priority
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111A22] to-[#151F28]">
            <Film className="w-16 h-16 text-[#F4C95D]" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070B0F] via-[#070B0F]/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <span className="flex items-center gap-1.5 bg-[#F4C95D] text-[#0B0F13] text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-md shadow-md">
            <Zap className="w-3 h-3 fill-current" />
            {video.series_id ? 'Series Episode' : 'Featured Premiere'}
          </span>
          {video.genre && (
            <span className="flex items-center gap-1.5 bg-[#070B0F]/85 backdrop-blur-md border border-[#27313A] text-[#F5F1E8] text-[10px] font-semibold px-3 py-1 rounded-md">
              <BarChart2 className="w-3 h-3 text-[#7E9BB5]" />
              {video.genre}
            </span>
          )}
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#F4C95D] hover:bg-[#FFD978] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
            <Play className="w-7 h-7 text-[#0B0F13] fill-[#0B0F13] ml-1" />
          </div>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-2">
            {video.category && (
              <span className="bg-[#151F28] border border-[#27313A] text-[#F4C95D] text-[10px] font-bold uppercase px-2.5 py-0.5 rounded">
                {video.category}
              </span>
            )}
            {video.tags?.slice(0, 1).map((tag) => (
              <span key={tag} className="text-[#7F8993] text-[10px] font-semibold uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>

          <h2 className="text-[#F5F1E8] font-black text-xl sm:text-3xl leading-tight line-clamp-2 drop-shadow-lg">
            {video.title}
          </h2>
          <p className="text-[#B7BEC6] text-xs sm:text-sm mt-1.5 line-clamp-1 max-w-2xl font-normal">
            {video.description}
          </p>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
            <div className="relative w-7 h-7 rounded-full overflow-hidden bg-[#151F28] border border-[#27313A] shrink-0 flex items-center justify-center">
              {video.creator?.avatar_url ? (
                <Image src={video.creator.avatar_url} alt="" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[#F4C95D]">
                  {video.creator?.display_name?.[0] || 'C'}
                </div>
              )}
            </div>
            <span className="text-[#B7BEC6] text-xs font-medium">
              @{video.creator?.username || video.creator?.display_name || 'creator'}
            </span>
            {video.duration_seconds > 0 && (
              <span className="ml-auto flex items-center gap-1 text-[11px] text-[#7F8993]">
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
      className="w-full flex items-center gap-3.5 bg-[#111A22] hover:bg-[#151F28] border border-[#1C252D] hover:border-[#F4C95D]/30 rounded-xl px-4 py-3 transition-all group text-left cursor-pointer shadow-sm"
    >
      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#151F28] shrink-0 border border-[#27313A]">
        {track.cover_url ? (
          <Image src={track.cover_url} alt={track.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#151F28]">
            <Music className="w-5 h-5 text-[#F4C95D]" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[#F5F1E8] text-xs sm:text-sm font-semibold truncate group-hover:text-[#F4C95D] transition-colors">
          {track.title}
        </p>
        <p className="text-[#7F8993] text-[11px] truncate mt-0.5">
          {track.artist_name || track.creator?.display_name} · {track.genre || 'Audio'}
        </p>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <BarChart2 className="w-4 h-4 text-[#7E9BB5]" />
        {track.duration_seconds > 0 && (
          <span className="text-[#7F8993] text-[11px] font-medium">{formatDuration(track.duration_seconds)}</span>
        )}
        <Headphones className="w-4 h-4 text-[#7F8993]" />
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

export default function HomePage() {
  const supabase = createClient();
  const { playTrack } = useAudioPlayer();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [seriesList, setSeriesList] = useState<FeedSeries[]>([]);
  const [audios, setAudios] = useState<FeedAudio[]>([]);
  const [albumList, setAlbumList] = useState<AudioAlbum[]>([]);
  const [blogs, setBlogs] = useState<FeedBlog[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic preview modal state
  const [selectedVideoItem, setSelectedVideoItem] = useState<VideoItem | null>(null);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const [
        { data: vids },
        { data: sList },
        { data: auds },
        { data: aList },
        { data: blgs },
        { data: creatorsData },
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
          .select('*, creator:profiles(*), episodes:videos(id, episode_number, thumbnail_url, duration_seconds, views_count, is_locked)')
          .order('created_at', { ascending: false })
          .limit(30),

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

        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'creator')
          .order('created_at', { ascending: false })
          .limit(8),

        fetch('/api/recommendations?limit=12')
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

      const mappedVideos = ((vids || []) as any[]).map((v) => ({ ...v, type: 'video' as const }));
      setVideos(mappedVideos);

      const mappedSeries: FeedSeries[] = ((sList || []) as any[]).map((s) => {
        const episodes = s.episodes || [];
        const sorted = [...episodes].sort((a: any, b: any) => (a.episode_number || 0) - (b.episode_number || 0));
        return {
          ...s,
          type: 'series' as const,
          first_episode_id: sorted[0]?.id || s.id,
          episode_count: episodes.length || s.total_episodes || 1,
        };
      });
      setSeriesList(mappedSeries);

      setAudios(((auds || []) as any[]).map((a) => ({ ...a, type: 'audio' as const })));
      setAlbumList((aList as AudioAlbum[]) || []);
      setBlogs(((blgs || []) as any[]).map((b) => ({ ...b, type: 'blog' as const })));
      
      const mappedCreators = (creatorsData || []).map(mapSupabaseProfileToCreator);
      setCreators(mappedCreators);

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

  const { seriesGroups, standaloneVideos } = groupContentBySeries(videos, seriesList);
  const { albumGroups, standaloneAudio } = groupAudioByAlbum(audios, albumList);

  // Group Series by Category
  const seriesByCategory = React.useMemo(() => {
    const map = new Map<string, FeedSeries[]>();
    for (const s of seriesList) {
      const cat = s.category?.trim() || 'Featured Series';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return Array.from(map.entries());
  }, [seriesList]);

  const heroVideo = standaloneVideos[0] || videos[0] || null;
  const trendingBlogs = blogs;

  const showVideos = activeFilter === 'all' || activeFilter === 'videos';
  const showAudio = activeFilter === 'all' || activeFilter === 'audio';
  const showBlogs = activeFilter === 'all' || activeFilter === 'blogs';

  return (
    <div className="min-h-screen bg-transparent text-[#F5F1E8] pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* ── Filter Navigation Bar ── */}
        <div className="flex items-center gap-2.5 pb-6 overflow-x-auto scrollbar-none">
          {FILTERS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                activeFilter === key
                  ? 'bg-[#F4C95D] text-[#0B0F13] shadow-sm'
                  : 'bg-[#111A22] text-[#B7BEC6] hover:text-[#F5F1E8] hover:bg-[#151F28] border border-[#27313A]'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}

          <button
            onClick={fetchFeed}
            aria-label="Refresh Feed"
            className="ml-auto p-2.5 rounded-full bg-[#111A22] border border-[#27313A] text-[#B7BEC6] hover:text-[#F5F1E8] hover:border-[#F4C95D] transition-all shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#F4C95D]' : ''}`} />
          </button>
        </div>

        {/* ── Loading Skeleton ── */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-[#111A22] border border-[#1C252D] rounded-2xl" />
            <div className="h-14 bg-[#111A22] border border-[#1C252D] rounded-xl" />
            <div className="h-44 bg-[#111A22] border border-[#1C252D] rounded-xl" />
          </div>
        )}

        {/* ── Dynamic Content Feed ── */}
        {!isLoading && (
          <div className="space-y-12">
            {/* Continue Watching for active user */}
            <ContinueWatchingSection />

            {/* 1. Hero Featured Video (if available) */}
            {showVideos && heroVideo && <HeroCard video={heroVideo} />}

            {/* 2. SECTION A: "Featured Series" Carousel */}
            {showVideos && seriesList.length > 0 && (
              <ContentCarousel
                title="Featured & Trending Series"
                badge="TOP SHOWS"
                icon={Flame}
              >
                {seriesList.map((series) => (
                  <div key={series.id} className="w-64 sm:w-72 shrink-0 snap-start">
                    <SeriesCard series={series} />
                  </div>
                ))}
              </ContentCarousel>
            )}

            {/* 3. SECTION B: "Creator Spotlight" */}
            {creators.length > 0 && <CreatorSpotlight creators={creators} />}

            {/* 4. Recommendation Card Carousel from Edge Recommender (if available) */}
            {recommendations.length > 0 && (
              <ContentCarousel
                title="Personalized for You"
                badge="AI PICK"
                icon={Sparkles}
              >
                {recommendations.map((rec) => (
                  <RecommendationCard key={`${rec.contentType}-${rec.id}`} item={rec} />
                ))}
              </ContentCarousel>
            )}

            {/* 5. Audio Strip / Featured Audio */}
            {showAudio && audios.length > 0 && (
              <AudioStrip
                track={audios[0]}
                onPlay={() => playTrack(audios[0], audios)}
              />
            )}

            {/* 6. Featured Movies & Drops (Standalone Videos) */}
            {showVideos && standaloneVideos.length > 1 && (
              <ContentCarousel
                title="Featured Movies & Drops"
                badge="FRESH"
                href="/explore?type=video"
                icon={Zap}
              >
                {standaloneVideos.slice(1).map((v) => (
                  <VideoCarouselCard key={v.id} video={v} />
                ))}
              </ContentCarousel>
            )}

            {/* 7. Recommended Portrait Short Videos */}
            {showVideos && videos.length > 0 && (
              <RecommendedSection
                items={videos.map(mapSupabaseVideoToItem)}
                onSelectVideo={(v) => setSelectedVideoItem(v)}
              />
            )}

            {/* 8. Series Divided by Category (Netflix style rows) */}
            {showVideos &&
              seriesByCategory.map(([catName, seriesItems]) => (
                <ContentCarousel
                  key={catName}
                  title={`${catName} Series`}
                  badge={`${seriesItems.length} ${seriesItems.length === 1 ? 'SHOW' : 'SHOWS'}`}
                  icon={Layers}
                >
                  {seriesItems.map((series) => (
                    <div key={series.id} className="w-64 sm:w-72 shrink-0 snap-start">
                      <SeriesCard series={series} />
                    </div>
                  ))}
                </ContentCarousel>
              ))}

            {/* 9. Dedicated Album Collections */}
            {showAudio &&
              albumGroups.map((album) => (
                <div key={album.id} className="bg-[#111A22] border border-[#27313A] rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Disc className="w-5 h-5 text-[#F4C95D]" />
                      <h2 className="text-[#F5F1E8] font-bold text-base sm:text-lg">{album.title}</h2>
                      <span className="text-[#F4C95D] text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md bg-[#F4C95D]/12 border border-[#F4C95D]/25">
                        ALBUM · {album.tracks.length} TRACKS
                      </span>
                    </div>
                    <p className="text-xs text-[#7F8993] font-medium">
                      {album.artist_name || album.creator?.display_name}
                    </p>
                  </div>

                  <div
                    className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none scroll-smooth snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {album.tracks.map((t) => (
                      <div key={t.id} className="w-72 sm:w-80 shrink-0 snap-start">
                        <AudioStrip
                          track={t}
                          onPlay={() => playTrack(t, album.tracks)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {/* 10. Creator Blogs Carousel */}
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

            {/* 11. Singles & Audio Tracks (Horizontally Scrollable) */}
            {showAudio && standaloneAudio.length > 0 && (
              <ContentCarousel
                title="Singles & Audio Tracks"
                badge="LISTEN"
                href="/explore?type=audio"
                icon={Music}
              >
                {standaloneAudio.map((track) => (
                  <div key={track.id} className="w-72 sm:w-80 shrink-0 snap-start">
                    <AudioStrip
                      track={track}
                      onPlay={() => playTrack(track, audios)}
                    />
                  </div>
                ))}
              </ContentCarousel>
            )}
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        video={selectedVideoItem}
        onClose={() => setSelectedVideoItem(null)}
      />
    </div>
  );
}
