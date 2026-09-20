'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { MediaCard } from '@/components/media/MediaCard';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { NeonPlaySign3D } from '@/components/media/NeonPlaySign3D';
import { SpaceHeroCanvas } from '@/components/media/SpaceHeroCanvas';
import { ContentCarousel } from '@/components/media/ContentCarousel';
import { VideoCarouselCard } from '@/components/media/VideoCarouselCard';
import { BlogCarouselCard } from '@/components/media/BlogCarouselCard';
import { Video, AudioTrack, Blog, AdvertiserCampaign, ContentSeries } from '@/types/database';
import { SeriesCard } from '@/components/media/SeriesCard';
import { CreatorSpotlight } from '@/components/landing/CreatorSpotlight';
import { CreatorItem, mapSupabaseProfileToCreator } from '@/data/content';
import {
  Film,
  Music,
  BookOpen,
  Megaphone,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Play,
  Lock,
  Clock,
  BarChart2,
  Headphones,
  ChevronRight,
  Flame,
  Layers,
} from 'lucide-react';

type FeedVideo = Video & { type: 'video' };
type FeedAudio = AudioTrack & { type: 'audio' };
type FeedBlog = Blog & { type: 'blog' };

function formatDuration(seconds?: number | null) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ─── Hero Card ───────────────────────────────────────────────────────────────
function HeroCard({ video }: { video: FeedVideo }) {
  return (
    <Link href={`/videos/${video.id}`} className="block relative w-full rounded-2xl overflow-hidden group shadow-2xl">
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[var(--bg-secondary)] theme-glow-frame">
        {video.thumbnail_url ? (
          <Image src={video.thumbnail_url} alt={video.title} fill priority className="object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-secondary)]">
            <Film className="w-16 h-16 text-[var(--text-muted)]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span
            className="flex items-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg"
            style={{
              background: 'var(--gradient-neon)',
              boxShadow: 'var(--glow-pink)',
            }}
          >
            <Zap className="w-3 h-3" />{video.series ? 'Series' : 'Featured'}
          </span>
          {video.genre && (
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur border border-white/20 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
              <BarChart2 className="w-3 h-3 text-[var(--color-pink-light)]" />{video.genre}
            </span>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300 text-white"
            style={{
              background: 'var(--gradient-neon)',
              boxShadow: 'var(--glow-purple-strong)',
            }}
          >
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-2">
            {video.category && (
              <span
                className="text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                style={{ background: 'var(--gradient-neon)' }}
              >
                {video.category}
              </span>
            )}
            {video.tags?.slice(0, 1).map((tag) => <span key={tag} className="text-[var(--text-secondary)] text-[10px] font-semibold uppercase">{tag}</span>)}
          </div>
          <h2 className="text-white font-bold text-lg sm:text-xl leading-tight line-clamp-2 drop-shadow-lg">{video.title}</h2>
          <p className="text-[var(--text-secondary)] text-xs mt-1 line-clamp-1">{video.description}</p>
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/10">
            <div
              className="relative w-6 h-6 rounded-full overflow-hidden border shrink-0"
              style={{
                background: 'var(--glass-surface-heavy)',
                borderColor: 'var(--glass-border)',
              }}
            >
              {video.creator?.avatar_url
                ? <Image src={video.creator.avatar_url} alt="" fill className="object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-[var(--color-pink-light)]">{video.creator?.display_name?.[0] || 'C'}</div>}
            </div>
            <span className="text-[var(--text-secondary)] text-[11px] font-medium">@{video.creator?.username || video.creator?.display_name || 'creator'}</span>
            {video.duration_seconds > 0 && (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                <Clock className="w-3 h-3" />{formatDuration(video.duration_seconds)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Audio Strip ──────────────────────────────────────────────────────────────
function AudioStrip({ track, onPlay }: { track: FeedAudio; onPlay: () => void }) {
  return (
    <button
      onClick={onPlay}
      className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all group text-left cursor-pointer theme-glass-card theme-glow-frame"
    >
      <div
        className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border"
        style={{
          background: 'var(--glass-surface-heavy)',
          borderColor: 'var(--glass-border)',
        }}
      >
        {track.cover_url ? <Image src={track.cover_url} alt={track.title} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-5 h-5 text-[var(--color-pink-light)]" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate group-hover:text-[var(--color-pink-light)] transition-colors">{track.title}</p>
        <p className="text-[var(--text-muted)] text-[10px] truncate">{track.artist_name || track.creator?.display_name} · {track.genre || 'Audio'}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <BarChart2 className="w-4 h-4 text-[var(--color-pink-light)]" />
        {track.duration_seconds > 0 && <span className="text-[var(--text-muted)] text-[10px]">{formatDuration(track.duration_seconds)}</span>}
        <Headphones className="w-4 h-4 text-[var(--text-muted)]" />
      </div>
    </button>
  );
}

// ─── Compact Tile ─────────────────────────────────────────────────────────────
function CompactVideoTile({ video }: { video: FeedVideo }) {
  return (
    <Link href={`/videos/${video.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-video w-full rounded-xl overflow-hidden theme-glow-frame">
        {video.thumbnail_url
          ? <Image src={video.thumbnail_url} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]"><Film className="w-6 h-6" /></div>}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        {video.duration_seconds > 0 && (
          <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">{formatDuration(video.duration_seconds)}</div>
        )}
        {video.is_locked && (
          <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur p-1 rounded-md"><Lock className="w-2.5 h-2.5 text-[var(--color-pink-light)]" /></div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg text-white"
            style={{
              background: 'var(--gradient-neon)',
              boxShadow: 'var(--glow-purple)',
            }}
          >
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
      <div>
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight group-hover:text-[var(--color-pink-light)] transition-colors">{video.title}</p>
        <p className="text-[var(--text-muted)] text-[10px] mt-0.5 truncate">@{video.creator?.username || video.creator?.display_name || 'creator'}</p>
      </div>
    </Link>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, badge, href }: { title: string; badge?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-white font-bold text-lg flex items-center gap-2">
        <Zap className="w-4 h-4 text-[var(--color-pink-light)]" />{title}
      </h2>
      <div className="flex items-center gap-2">
        {badge && <span className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">{badge}</span>}
        {href && <Link href={href} className="text-[var(--color-pink-light)] hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></Link>}
      </div>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const { playTrack } = useAudioPlayer();

  const [sponsoredCampaigns, setSponsoredCampaigns] = useState<AdvertiserCampaign[]>([]);
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [seriesList, setSeriesList] = useState<ContentSeries[]>([]);
  const [audios, setAudios] = useState<FeedAudio[]>([]);
  const [blogs, setBlogs] = useState<FeedBlog[]>([]);
  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const nowMs = Date.now();

        const [
          { data: vids },
          { data: sList },
          { data: auds },
          { data: blgs },
          { data: camps },
          { data: creatorsData },
        ] = await Promise.all([
          supabase.from('videos').select('*, creator:profiles(*)').eq('visibility', 'public').eq('status', 'published').order('created_at', { ascending: false }).limit(30),
          supabase.from('content_series').select('*, creator:profiles(*), episodes:videos(id, episode_number, thumbnail_url, duration_seconds, views_count, is_locked)').order('created_at', { ascending: false }).limit(15),
          supabase.from('audios').select('*, creator:profiles(*)').eq('visibility', 'public').eq('status', 'published').order('created_at', { ascending: false }).limit(12),
          supabase.from('blogs').select('*, author:profiles(*)').eq('status', 'published').order('published_at', { ascending: false }).limit(10),
          supabase.from('advertiser_campaigns').select('*, advertiser:profiles(*)').eq('status', 'active').order('created_at', { ascending: false }),
          supabase.from('profiles').select('*').eq('role', 'creator').order('created_at', { ascending: false }).limit(10),
        ]);

        setVideos(((vids || []) as any[]).map((v) => ({ ...v, type: 'video' as const })));

        const mappedSeries = ((sList || []) as any[]).map((s) => {
          const episodes = s.episodes || [];
          const sorted = [...episodes].sort((a: any, b: any) => (a.episode_number || 0) - (b.episode_number || 0));
          return {
            ...s,
            type: 'series' as const,
            first_episode_id: sorted[0]?.id || s.id,
            episode_count: episodes.length || s.total_episodes || 1,
          };
        });
        setSeriesList(mappedSeries as any);
        setAudios(((auds || []) as any[]).map((a) => ({ ...a, type: 'audio' as const })));
        setBlogs(((blgs || []) as any[]).map((b) => ({ ...b, type: 'blog' as const })));
        setSponsoredCampaigns(((camps || []) as any[]).filter((c) => !c.end_date || new Date(c.end_date).getTime() >= nowMs) as AdvertiserCampaign[]);
        setCreators(((creatorsData || []) as any[]).map(mapSupabaseProfileToCreator));
      } catch {
        // ignore
      } finally {
        setContentLoading(false);
      }
    }
    loadAll();
  }, []);

  // Group videos by series
  const seriesMap = new Map<string, ContentSeries & { episodes: FeedVideo[] }>();
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

  const seriesGroups = Array.from(seriesMap.values())
    .filter((s) => s.episodes.length > 0)
    .map((s) => ({
      ...s,
      episodes: s.episodes.sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0)),
    }));

  const heroVideo = standaloneVideos[0] || videos[0] || null;
  const featuredAudio = audios[0] ?? null;
  const shortVideos = standaloneVideos.slice(1, 8);

  return (
    <div className="w-full">

      {/* ── HERO MARKETING SECTION WITH SPACE THEME, PARALLAX SCROLL & DISPLAY HEADLINE ── */}
      <section className="relative overflow-hidden py-10 sm:py-16 px-3 sm:px-6 lg:px-8 w-full">
        {/* Space-like watercolor nebula, constellations & scroll-driven plasma stream */}
        <SpaceHeroCanvas />

        {/* Outer Celestial Frame Box (Matching Reference Image 2) */}
        <div className="relative max-w-6xl mx-auto rounded-none border border-[var(--color-purple-bright)]/40 p-6 sm:p-10 lg:p-12 backdrop-blur-[2px] shadow-[0_0_50px_rgba(124,0,255,0.18)]">
          {/* Cosmic Corner Bracket Accents */}
          <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[var(--color-pink)]" />
          <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[var(--color-pink)]" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[var(--color-pink)]" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[var(--color-pink)]" />

          {/* Top Cosmic Navigation / Status Cue (Matching Reference Image 2) */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[var(--text-muted)] select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-none bg-[var(--color-pink)] animate-pulse" />
              <span>STATION // 01</span>
            </div>
            <div className="hidden sm:flex items-center gap-6">
              <span>CINEMA</span>
              <span>•</span>
              <span>AUDIO</span>
              <span>•</span>
              <span>WRITERS</span>
              <span>•</span>
              <span>COMMUNITY</span>
            </div>
            <div className="text-[var(--color-pink-light)] font-mono">LIVE FEED</div>
          </div>

          {/* Central Stage: Headline & Constant-Motion Play Button */}
          <div className="flex flex-col items-center justify-center text-center space-y-3 sm:space-y-4">
            {/* Minimal Upper Tag (Matching 'SEE YOU SPACE' from Reference Image 2) */}
            <p className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-[0.4em] text-white/95 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">
              STREAM • LISTEN • DISCOVER
            </p>

            {/* Massive Bold Headline: YARROWPLAY (Matching 'COWBOY' yellow-to-pink gradient display) */}
            <h1 className="font-black tracking-tight uppercase leading-none py-1 select-none text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] xl:text-[8.5rem] filter drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)]">
              <span className="bg-gradient-to-r from-[#FFE600] via-[#FF6E00] to-[#FF20D9] bg-clip-text text-transparent">
                YARROWPLAY
              </span>
            </h1>

            {/* Minimalist Sub-Label (Matching 'OPEN AIR EVENT AGENCY' from Reference Image 2) */}
            <p className="text-[11px] sm:text-xs md:text-sm uppercase tracking-[0.3em] text-[var(--text-secondary)] font-semibold max-w-lg">
              THE NEXT GENERATION MULTI-FORMAT MEDIA PLATFORM
            </p>

            {/* Constant yet dynamic motion Neon Play Sign */}
            <div className="w-full max-w-lg pt-4 pb-2">
              <NeonPlaySign3D />
            </div>

            {/* Action Buttons (Sharp geometric edges matching sidebar aesthetic) */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              {user ? (
                <Link
                  href="/home"
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-none theme-neon-button font-bold text-xs tracking-widest uppercase transition-all shadow-lg active:scale-95 border border-[var(--color-pink-light)]"
                >
                  <span>Explore Content Feed</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-none theme-neon-button font-bold text-xs tracking-widest uppercase transition-all shadow-lg active:scale-95 border border-[var(--color-pink-light)]"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-none theme-inactive-pill font-semibold text-xs tracking-widest uppercase transition-all border border-[var(--glass-border)]"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Bottom Constellation Timeline Bar (Matching Reference Image 2) */}
          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-[9px] sm:text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)] select-none">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-none bg-[var(--color-pink-light)]" />
              <span>COSMIC MEDIA NEXUS</span>
            </div>
            <div className="flex items-center gap-4">
              <span>LOSSLESS AUDIO</span>
              <span>4K STREAMING</span>
              <span>CREATOR MONETIZATION</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── DYNAMIC CONTENT FEED ── */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#454549]">

        {/* Loading skeleton */}
        {contentLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="w-full aspect-[21/9] bg-[#2B2B2D] rounded-2xl" />
            <div className="h-14 bg-[#2B2B2D] rounded-2xl" />
            <div className="grid grid-cols-3 gap-3 mt-4">
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

        {!contentLoading && (
          <div className="space-y-8">

            {/* Featured Hero Video */}
            {heroVideo && (
              <div>
                <SectionHeader title="Now Streaming" badge="LIVE" href="/home" />
                <HeroCard video={heroVideo} />
              </div>
            )}

            {/* Featured Audio Strip */}
            {featuredAudio && (
              <AudioStrip track={featuredAudio} onPlay={() => playTrack(featuredAudio, audios)} />
            )}

            {/* DEDICATED SERIES CAROUSEL: Displays only Series */}
            {seriesList.length > 0 && (
              <ContentCarousel
                title="Featured & Trending Series"
                badge="STREAMING"
                href="/explore?type=series"
                icon={Layers}
              >
                {seriesList.map((series: any) => (
                  <div key={series.id} className="w-64 sm:w-72 shrink-0 snap-start">
                    <SeriesCard series={series} />
                  </div>
                ))}
              </ContentCarousel>
            )}

            {/* Latest Standalone Videos Carousel */}
            {shortVideos.length > 0 && (
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

            {/* Creator Spotlight */}
            {creators.length > 0 && (
              <CreatorSpotlight creators={creators} />
            )}

            {/* Blogs Carousel */}
            {blogs.length > 0 && (
              <ContentCarousel
                title="From the Blog"
                badge="READS"
                href="/blogs"
                icon={BookOpen}
              >
                {blogs.map((b) => (
                  <BlogCarouselCard key={b.id} blog={b} />
                ))}
              </ContentCarousel>
            )}

            {/* More Audio (Horizontally Scrollable) */}
            {audios.length > 1 && (
              <ContentCarousel
                title="Music & Audio"
                badge="LISTEN"
                href="/explore?type=audio"
                icon={Music}
              >
                {audios.slice(1).map((track) => (
                  <div key={track.id} className="w-72 sm:w-80 shrink-0 snap-start">
                    <AudioStrip track={track} onPlay={() => playTrack(track, audios)} />
                  </div>
                ))}
              </ContentCarousel>
            )}

          </div>
        )}
      </section>

      {/* ── CONTENT FORMATS SHOWCASE (horizontally scrollable on compact viewports) ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Built For Seamless Multi-Format Discovery</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-2">No need to jump between five different apps. Enjoy video, music, and written content side-by-side.</p>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none scroll-smooth snap-x snap-mandatory md:grid md:grid-cols-3">
          {[
            { icon: Film, title: 'Episodic Series & Videos', desc: 'Enjoy mini-series and movies with gesture controls, playback speed controls, and auto-rotation on mobile devices.', tag: 'Cloudinary Powered Streaming' },
            { icon: Music, title: 'Music & Audio Experience', desc: 'Spotify-inspired persistent player with background playback, synchronized lyrics, queue management, and album collections.', tag: 'Persistent Audio Engine' },
            { icon: BookOpen, title: 'Community Blogs & Stories', desc: 'Read creator essays, production notes, track commentaries, and articles with instant reactions and discussion threads.', tag: 'Open Publishing for Creators' },
          ].map((card) => (
            <div
              key={card.title}
              className="w-[280px] sm:w-[320px] md:w-auto shrink-0 snap-start rounded-2xl p-6 flex flex-col justify-between border backdrop-blur-xl transition-all hover:border-[var(--color-purple)]"
              style={{
                background: 'var(--glass-surface)',
                borderColor: 'var(--glass-border)',
              }}
            >
              <div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border"
                  style={{
                    background: 'var(--neon-purple-glow)',
                    borderColor: 'var(--neon-purple-border)',
                    color: 'var(--color-pink-light)',
                  }}
                >
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{card.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--glass-border)' }}>
                <span className="text-xs font-semibold text-[var(--color-pink-light)] flex items-center gap-1">{card.tag} <Zap className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SPONSORED CONTENT (Horizontally scrollable carousel) ── */}
      {sponsoredCampaigns.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <ContentCarousel
            title="Partner Spotlight"
            badge="SPONSORED"
            href="/advertiser"
            icon={Megaphone}
          >
            {sponsoredCampaigns.map((c) => (
              <div key={c.id} className="w-64 sm:w-72 shrink-0 snap-start">
                <MediaCard item={{ ...c, type: 'ad' }} />
              </div>
            ))}
          </ContentCarousel>
        </section>
      )}

      {/* ── CREATOR & ADVERTISER DUAL SECTION ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[var(--glass-border-subtle)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="theme-glass-card-static border border-[var(--glass-border)] rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--color-purple-bright)]/15 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--color-purple-bright)]/20 text-[var(--color-pink)] text-xs font-bold uppercase mb-4 border border-[var(--color-purple-bright)]/30">
                <Film className="w-3.5 h-3.5" />For Content Creators
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Creator Studio & Deep Analytics</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 font-normal">Upload entire series with multi-episode forms or release audio albums in minutes. Track views, watch duration, audience retention, likes, shares, and earnings from verified event data.</p>
              <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-normal">
                {['Multi-episode series batch upload pipeline', 'Direct-to-cloud Cloudinary ingestion (Yarrowplay preset)', 'Video boosting controls for increased reach'].map((item) => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--status-success)] shrink-0" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-8">
              <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-pink)] hover:text-white transition-colors">
                <span>Join as Content Creator</span><ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="theme-glass-card-static border border-[var(--glass-border)] rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--color-magenta)]/15 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--color-magenta)]/20 text-[var(--color-pink-light)] text-xs font-bold uppercase mb-4 border border-[var(--color-magenta)]/30">
                <Megaphone className="w-3.5 h-3.5" />For Brands & Advertisers
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Transparent Sponsored Content</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 font-normal">Launch targeted media campaigns that blend cleanly into the feed with prominent, honest <span className="text-[var(--color-pink)] font-semibold">Sponsored</span> tags. Zero disguised clickbait.</p>
              <ul className="space-y-2.5 text-xs text-[var(--text-secondary)] font-normal">
                {['Upload custom creatives (Images & Videos)', 'Real-time impression and verified click tracking', 'Dedicated Advertiser Studio dashboard'].map((item) => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[var(--status-success)] shrink-0" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-8">
              <Link href="/register?role=advertiser" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-pink)] hover:text-white transition-colors">
                <span>Launch an Advertiser Campaign</span><ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA (original) ── */}
      <section className="py-20 px-4 max-w-4xl mx-auto text-center border-t" style={{ borderColor: 'var(--glass-border)' }}>
        <div className="relative w-16 h-16 mx-auto mb-4">
          <Image src="/logo.png" alt="Yarrowplay" fill sizes="64px" className="object-contain" />
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-4">Start Streaming and Publishing Today</h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-8">Join thousands of viewers and creators on the modern media platform.</p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-base transition-all shadow-xl active:scale-95"
          style={{
            background: 'var(--gradient-neon)',
            boxShadow: 'var(--glow-purple)',
          }}
        >
          <span>Create Your Free Account</span><ArrowRight className="w-5 h-5" />
        </Link>
      </section>

    </div>
  );
}
