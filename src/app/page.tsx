'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { MediaCard } from '@/components/media/MediaCard';
import { useAudioPlayer } from '@/context/AudioPlayerContext';
import { Video, AudioTrack, Blog, AdvertiserCampaign } from '@/types/database';
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
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[#1A1A1C]">
        {video.thumbnail_url ? (
          <Image src={video.thumbnail_url} alt={video.title} fill priority className="object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1A1A1C] to-[#2B2B2D]">
            <Film className="w-16 h-16 text-[#454549]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/10" />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 bg-[#FF0080] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg">
            <Zap className="w-3 h-3" />{video.series ? 'Series' : 'Featured'}
          </span>
          {video.genre && (
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur border border-white/20 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
              <BarChart2 className="w-3 h-3 text-[#FF0080]" />{video.genre}
            </span>
          )}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FF0080] flex items-center justify-center shadow-2xl shadow-[#FF0080]/40 group-hover:scale-110 transition-transform duration-300">
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-2">
            {video.category && <span className="bg-[#FF0080] text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-full">{video.category}</span>}
            {video.tags?.slice(0, 1).map((tag) => <span key={tag} className="text-[#B8B8BD] text-[10px] font-semibold uppercase">{tag}</span>)}
          </div>
          <h2 className="text-white font-bold text-lg sm:text-xl leading-tight line-clamp-2 drop-shadow-lg">{video.title}</h2>
          <p className="text-[#B8B8BD] text-xs mt-1 line-clamp-1">{video.description}</p>
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/10">
            <div className="relative w-6 h-6 rounded-full overflow-hidden bg-[#333336] border border-white/20 shrink-0">
              {video.creator?.avatar_url
                ? <Image src={video.creator.avatar_url} alt="" fill className="object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-[#FF0080]">{video.creator?.display_name?.[0] || 'C'}</div>}
            </div>
            <span className="text-[#B8B8BD] text-[11px] font-medium">@{video.creator?.username || video.creator?.display_name || 'creator'}</span>
            {video.duration_seconds > 0 && (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-[#85858B]">
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
    <button onClick={onPlay} className="w-full flex items-center gap-3 bg-[#2B2B2D] hover:bg-[#333336] border border-[#454549] hover:border-[#FF0080]/50 rounded-2xl px-4 py-3 transition-all group text-left">
      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-[#333336] shrink-0 border border-[#454549]">
        {track.cover_url ? <Image src={track.cover_url} alt={track.title} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-5 h-5 text-[#FF0080]" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate group-hover:text-[#FF0080] transition-colors">{track.title}</p>
        <p className="text-[#85858B] text-[10px] truncate">{track.artist_name || track.creator?.display_name} · {track.genre || 'Audio'}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <BarChart2 className="w-4 h-4 text-[#FF0080]" />
        {track.duration_seconds > 0 && <span className="text-[#85858B] text-[10px]">{formatDuration(track.duration_seconds)}</span>}
        <Headphones className="w-4 h-4 text-[#85858B]" />
      </div>
    </button>
  );
}

// ─── Compact Tile ─────────────────────────────────────────────────────────────
function CompactVideoTile({ video }: { video: FeedVideo }) {
  return (
    <Link href={`/videos/${video.id}`} className="group flex flex-col gap-2">
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#2B2B2D]">
        {video.thumbnail_url
          ? <Image src={video.thumbnail_url} alt={video.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="w-full h-full flex items-center justify-center text-[#454549]"><Film className="w-6 h-6" /></div>}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        {video.duration_seconds > 0 && (
          <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">{formatDuration(video.duration_seconds)}</div>
        )}
        {video.is_locked && (
          <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur p-1 rounded-md"><Lock className="w-2.5 h-2.5 text-[#FF0080]" /></div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-[#FF0080] flex items-center justify-center shadow-lg"><Play className="w-4 h-4 text-white fill-white ml-0.5" /></div>
        </div>
      </div>
      <div>
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight group-hover:text-[#FF0080] transition-colors">{video.title}</p>
        <p className="text-[#85858B] text-[10px] mt-0.5 truncate">@{video.creator?.username || video.creator?.display_name || 'creator'}</p>
      </div>
    </Link>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, badge, href }: { title: string; badge?: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-white font-bold text-lg flex items-center gap-2">
        <Zap className="w-4 h-4 text-[#FF0080]" />{title}
      </h2>
      <div className="flex items-center gap-2">
        {badge && <span className="text-[#85858B] text-[10px] font-bold uppercase tracking-widest">{badge}</span>}
        {href && <Link href={href} className="text-[#FF0080] hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></Link>}
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
  const [audios, setAudios] = useState<FeedAudio[]>([]);
  const [blogs, setBlogs] = useState<FeedBlog[]>([]);
  const [contentLoading, setContentLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const nowMs = Date.now();

        const [{ data: vids }, { data: auds }, { data: blgs }, { data: camps }] = await Promise.all([
          supabase.from('videos').select('*, creator:profiles(*)').eq('visibility', 'public').eq('status', 'published').order('created_at', { ascending: false }).limit(19),
          supabase.from('audios').select('*, creator:profiles(*)').eq('visibility', 'public').eq('status', 'published').order('created_at', { ascending: false }).limit(6),
          supabase.from('blogs').select('*, author:profiles(*)').eq('status', 'published').order('published_at', { ascending: false }).limit(6),
          supabase.from('advertiser_campaigns').select('*, advertiser:profiles(*)').eq('status', 'active').order('created_at', { ascending: false }),
        ]);

        setVideos(((vids || []) as any[]).map((v) => ({ ...v, type: 'video' as const })));
        setAudios(((auds || []) as any[]).map((a) => ({ ...a, type: 'audio' as const })));
        setBlogs(((blgs || []) as any[]).map((b) => ({ ...b, type: 'blog' as const })));
        setSponsoredCampaigns(((camps || []) as any[]).filter((c) => !c.end_date || new Date(c.end_date).getTime() >= nowMs) as AdvertiserCampaign[]);
      } catch {
        // ignore
      } finally {
        setContentLoading(false);
      }
    }
    loadAll();
  }, []);

  const heroVideo = videos[0] ?? null;
  const featuredAudio = audios[0] ?? null;
  const shortVideos = videos.slice(1, 7);
  const moreVideos = videos.slice(7, 19);

  return (
    <div className="w-full">

      {/* ── HERO MARKETING SECTION (original) ── */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF0080]/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#333336] border border-[#454549] text-xs font-semibold text-[#FF0080] mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Next Generation Multi-Format Entertainment Hub</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Stream. Listen. Read.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF0080] to-purple-400">
            Create.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-xl text-[#B8B8BD] max-w-2xl mx-auto leading-relaxed">
          Yarrowplay unites cinematic video series, high-fidelity music streaming, insightful blogs, and direct creator monetization on one unified, high-speed platform.
        </p>

        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
          {user ? (
            <Link href="/home" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white font-semibold text-base transition-all shadow-lg active:scale-95">
              <span>Go to Content Feed</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white font-semibold text-base transition-all shadow-lg active:scale-95">
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#333336] hover:bg-[#3A3A3E] border border-[#454549] text-white font-semibold text-base transition-all">
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Feature Pill Highlights */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { icon: Film, label: 'Video Series & Singles', desc: '4K ready streaming' },
            { icon: Music, label: 'Music & Audio', desc: 'Lossless & full lyrics' },
            { icon: BookOpen, label: 'Creator Blogs', desc: 'Rich editorial articles' },
            { icon: Megaphone, label: 'Authentic Ads', desc: 'Non-intrusive sponsor cards' },
          ].map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-[#333336]/60 border border-[#454549] text-left hover:border-[#FF0080]/50 transition-colors">
              <item.icon className="w-6 h-6 text-[#FF0080] mb-2" />
              <h3 className="text-sm font-semibold text-white">{item.label}</h3>
              <p className="text-xs text-[#85858B] mt-0.5">{item.desc}</p>
            </div>
          ))}
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

            {/* Latest Videos Grid */}
            {shortVideos.length > 0 && (
              <div>
                <SectionHeader title="Latest Drops" badge="FRESH" href="/explore?type=video" />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {shortVideos.map((v) => <CompactVideoTile key={v.id} video={v} />)}
                </div>
              </div>
            )}

            {/* Blogs row */}
            {blogs.length > 0 && (
              <div>
                <SectionHeader title="From the Blog" badge="READS" href="/explore?type=blog" />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {blogs.map((b) => (
                    <Link key={b.id} href={`/blogs/${b.id}`} className="group flex flex-col gap-2">
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#2B2B2D]">
                        {b.cover_url
                          ? <Image src={b.cover_url} alt={b.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full flex items-center justify-center text-[#454549]"><BookOpen className="w-6 h-6" /></div>}
                        <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur text-[#FF0080] text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase">Blog</div>
                      </div>
                      <p className="text-white text-xs font-semibold line-clamp-2 leading-tight group-hover:text-[#FF0080] transition-colors">{b.title}</p>
                      <p className="text-[#85858B] text-[10px] -mt-1 truncate">@{b.author?.username || b.author?.display_name || 'author'}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* More Videos */}
            {moreVideos.length > 0 && (
              <div>
                <SectionHeader title="More to Watch" badge="TRENDING" href="/explore?type=video" />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
                  {moreVideos.map((v) => <CompactVideoTile key={v.id} video={v} />)}
                </div>
              </div>
            )}

            {/* More Audio */}
            {audios.length > 1 && (
              <div>
                <SectionHeader title="Music & Audio" badge="LISTEN" href="/explore?type=audio" />
                <div className="space-y-2">
                  {audios.slice(1, 5).map((track) => (
                    <AudioStrip key={track.id} track={track} onPlay={() => playTrack(track, audios)} />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </section>

      {/* ── CONTENT FORMATS SHOWCASE (original) ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#454549]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Built For Seamless Multi-Format Discovery</h2>
          <p className="text-sm text-[#85858B] mt-2">No need to jump between five different apps. Enjoy video, music, and written content side-by-side.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Film, title: 'Episodic Series & Videos', desc: 'Enjoy mini-series and movies with gesture controls, playback speed controls, and auto-rotation on mobile devices.', tag: 'Cloudinary Powered Streaming' },
            { icon: Music, title: 'Music & Audio Experience', desc: 'Spotify-inspired persistent player with background playback, synchronized lyrics, queue management, and album collections.', tag: 'Persistent Audio Engine' },
            { icon: BookOpen, title: 'Community Blogs & Stories', desc: 'Read creator essays, production notes, track commentaries, and articles with instant reactions and discussion threads.', tag: 'Open Publishing for Creators' },
          ].map((card) => (
            <div key={card.title} className="bg-[#333336] border border-[#454549] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#FF0080]/15 text-[#FF0080] flex items-center justify-center mb-4">
                  <card.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-[#B8B8BD] leading-relaxed">{card.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#454549]">
                <span className="text-xs font-semibold text-[#FF0080] flex items-center gap-1">{card.tag} <Zap className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SPONSORED CONTENT (original, hidden if empty) ── */}
      {sponsoredCampaigns.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#454549]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF0080]/15 text-[#FF0080] text-xs font-bold uppercase tracking-wider mb-2 border border-[#FF0080]/30">
                <Megaphone className="w-3.5 h-3.5" />Sponsored Content
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Partner Spotlight</h2>
              <p className="text-sm text-[#85858B] mt-1">Featured stories, products, and announcements from verified Yarrowplay partners.</p>
            </div>
            <Link href="/advertiser" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF0080] hover:text-white transition-colors self-start sm:self-center">
              <span>Promote with Us</span><ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sponsoredCampaigns.map((c) => (
              <MediaCard key={c.id} item={{ ...c, type: 'ad' }} />
            ))}
          </div>
        </section>
      )}

      {/* ── CREATOR & ADVERTISER DUAL SECTION (original) ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#454549]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#333336] border border-[#454549] rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF0080]/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF0080]/15 text-[#FF0080] text-xs font-bold uppercase mb-4">
                <Film className="w-3.5 h-3.5" />For Content Creators
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Creator Studio & Deep Analytics</h3>
              <p className="text-sm text-[#B8B8BD] leading-relaxed mb-6">Upload entire series with multi-episode forms or release audio albums in minutes. Track views, watch duration, audience retention, likes, shares, and earnings from verified event data.</p>
              <ul className="space-y-2.5 text-xs text-[#B8B8BD]">
                {['Multi-episode series batch upload pipeline', 'Direct-to-cloud Cloudinary ingestion (Yarrowplay preset)', 'Video boosting controls for increased reach'].map((item) => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#22C55E]" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-8">
              <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF0080] hover:text-white transition-colors">
                <span>Join as Content Creator</span><ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-[#333336] border border-[#454549] rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 text-purple-400 text-xs font-bold uppercase mb-4">
                <Megaphone className="w-3.5 h-3.5" />For Brands & Advertisers
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Transparent Sponsored Content</h3>
              <p className="text-sm text-[#B8B8BD] leading-relaxed mb-6">Launch targeted media campaigns that blend cleanly into the feed with prominent, honest <span className="text-[#FF0080] font-semibold">Sponsored</span> tags. Zero disguised clickbait.</p>
              <ul className="space-y-2.5 text-xs text-[#B8B8BD]">
                {['Upload custom creatives (Images & Videos)', 'Real-time impression and verified click tracking', 'Dedicated Advertiser Studio dashboard'].map((item) => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#22C55E]" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-8">
              <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF0080] hover:text-white transition-colors">
                <span>Launch an Advertiser Campaign</span><ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA (original) ── */}
      <section className="py-20 px-4 max-w-4xl mx-auto text-center border-t border-[#454549]">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <Image src="/logo.png" alt="Yarrowplay" fill sizes="64px" className="object-contain" />
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-4">Start Streaming and Publishing Today</h2>
        <p className="text-sm text-[#B8B8BD] max-w-md mx-auto mb-8">Join thousands of viewers and creators on the modern media platform.</p>
        <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white font-bold text-base transition-all shadow-xl active:scale-95">
          <span>Create Your Free Account</span><ArrowRight className="w-5 h-5" />
        </Link>
      </section>

    </div>
  );
}
