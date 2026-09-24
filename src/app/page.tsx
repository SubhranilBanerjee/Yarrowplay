'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { MediaCard } from '@/components/media/MediaCard';
import { SeriesCard } from '@/components/media/SeriesCard';
import { ContentCarousel } from '@/components/media/ContentCarousel';
import { EmptyState } from '@/components/ui/EmptyState';
import { SpecularButton } from '@/components/ui/SpecularButton';
import { DriftWall, DriftWallItem } from '@/components/ui/DriftWall';
import { ContentSeries, AudioTrack, Blog, AdvertiserCampaign } from '@/types/database';
import {
  Film,
  Music,
  BookOpen,
  Zap,
  ArrowRight,
  Flame,
  Layers,
  Radio,
  Sparkles,
  Megaphone,
  Compass,
  CheckCircle2,
} from 'lucide-react';

type SeriesItem = ContentSeries & {
  type: 'series';
  first_episode_id?: string;
  episode_count?: number;
};

type AudioItem = AudioTrack & { type: 'audio' };
type BlogItem = Blog & { type: 'blog' };
type AdItem = AdvertiserCampaign & { type: 'ad' };

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [activeType, setActiveType] = useState<'all' | 'series' | 'audio' | 'blog'>('all');
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [audioList, setAudioList] = useState<AudioItem[]>([]);
  const [blogList, setBlogList] = useState<BlogItem[]>([]);
  const [campaignList, setCampaignList] = useState<AdItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadExploreData() {
      setIsLoading(true);
      try {
        const nowMs = Date.now();

        const [
          { data: sData, error: sErr },
          { data: aData, error: aErr },
          { data: bData, error: bErr },
          { data: cData, error: cErr },
        ] = await Promise.all([
          supabase
            .from('content_series')
            .select('*, creator:profiles(*), episodes:videos(id, episode_number, thumbnail_url, duration_seconds, views_count, is_locked)')
            .order('created_at', { ascending: false })
            .limit(40),
          supabase
            .from('audios')
            .select('*, creator:profiles(*)')
            .eq('status', 'published')
            .eq('visibility', 'public')
            .order('created_at', { ascending: false })
            .limit(40),
          supabase
            .from('blogs')
            .select('*, author:profiles(*)')
            .eq('status', 'published')
            .order('published_at', { ascending: false })
            .limit(30),
          supabase
            .from('advertiser_campaigns')
            .select('*, advertiser:profiles(*)')
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(12),
        ]);

        if (!sErr && sData) {
          const mappedSeries: SeriesItem[] = sData.map((s: any) => {
            const episodes = s.episodes || [];
            const sorted = [...episodes].sort(
              (a: any, b: any) => (a.episode_number || 0) - (b.episode_number || 0)
            );
            return {
              ...s,
              type: 'series' as const,
              first_episode_id: sorted[0]?.id || s.id,
              episode_count: episodes.length || s.total_episodes || 1,
            };
          });
          setSeriesList(mappedSeries);
        }

        if (!aErr && aData) {
          setAudioList(aData.map((a: any) => ({ ...a, type: 'audio' as const })));
        }

        if (!bErr && bData) {
          setBlogList(bData.map((b: any) => ({ ...b, type: 'blog' as const })));
        }

        if (!cErr && cData) {
          const activeAds: AdItem[] = cData
            .filter((c: any) => !c.end_date || new Date(c.end_date).getTime() >= nowMs)
            .map((c: any) => ({ ...c, type: 'ad' as const }));
          setCampaignList(activeAds);
        }
      } catch {
        // ignore load errors
      } finally {
        setIsLoading(false);
      }
    }

    loadExploreData();
  }, []);

  // Group Series by Category (Explore logic)
  const seriesByCategory = useMemo(() => {
    const map = new Map<string, SeriesItem[]>();
    for (const s of seriesList) {
      const cat = s.category?.trim() || 'Featured Series';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    return Array.from(map.entries());
  }, [seriesList]);

  // Group Audio by Genre (Explore logic)
  const audioByGenre = useMemo(() => {
    const map = new Map<string, AudioItem[]>();
    for (const a of audioList) {
      const genre = a.genre?.trim() || 'Featured Audio';
      if (!map.has(genre)) map.set(genre, []);
      map.get(genre)!.push(a);
    }
    return Array.from(map.entries());
  }, [audioList]);

  // Group Blogs by Category (Explore logic)
  const blogsByCategory = useMemo(() => {
    const map = new Map<string, BlogItem[]>();
    for (const b of blogList) {
      const cat = b.category?.trim() || 'Stories & Articles';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(b);
    }
    return Array.from(map.entries());
  }, [blogList]);

  // Split campaigns to intersperse naturally in between content
  const firstBatchAds = useMemo(() => campaignList.slice(0, 4), [campaignList]);
  const secondBatchAds = useMemo(() => campaignList.slice(4), [campaignList]);

  const totalContentCount =
    seriesList.length + audioList.length + blogList.length + campaignList.length;

  // Dynamic thumbnails from content for the hero DriftWall background
  const heroWallItems: DriftWallItem[] | undefined = useMemo(() => {
    const list: DriftWallItem[] = [];

    for (const s of seriesList) {
      if (s.cover_url) {
        list.push({
          image: s.cover_url,
          title: s.title,
          href: `/videos/${s.first_episode_id || s.id}`,
        });
      }
      if (s.episodes && Array.isArray(s.episodes)) {
        for (const ep of s.episodes) {
          if (ep.thumbnail_url && ep.thumbnail_url !== s.cover_url) {
            list.push({
              image: ep.thumbnail_url,
              title: ep.title || s.title,
              href: `/videos/${ep.id}`,
            });
          }
        }
      }
    }

    for (const a of audioList) {
      if (a.cover_url) {
        list.push({
          image: a.cover_url,
          title: a.title,
          href: '/explore?type=audio',
        });
      }
    }

    for (const b of blogList) {
      if (b.cover_url) {
        list.push({
          image: b.cover_url,
          title: b.title,
          href: `/blogs/${b.id}`,
        });
      }
    }

    for (const c of campaignList) {
      if (c.media_url) {
        list.push({
          image: c.media_url,
          title: c.title,
          href: c.target_url || '/advertiser',
        });
      }
    }

    return list.length > 0 ? list : undefined;
  }, [seriesList, audioList, blogList, campaignList]);

  return (
    <div className="w-full">
      {/* ── 1. MINIMAL HERO SECTION WITH DRIFT WALL BACKGROUND ── */}
      <section className="relative w-full pt-20 pb-16 px-4 flex flex-col items-center justify-center text-center overflow-hidden min-h-[440px] sm:min-h-[500px]">
        {/* DriftWall Background */}
        <div className="absolute inset-0 w-full h-full pointer-events-auto overflow-hidden opacity-60">
          <DriftWall
            items={heroWallItems}
            columns={6}
            tileWidth={200}
            tileHeight={130}
            gap={16}
            tilt={15}
            turn={-14}
            perspective={1100}
            depth={120}
            speed={36}
            direction="up"
            variance={0.45}
            parallax={0.6}
            lift={64}
            fade={0.6}
            dim={0.55}
            overlayColor="#070B0F"
          />
        </div>

        {/* Cinematic gradient overlays to blend the wall into the page and enhance headline legibility */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#070B0F] via-transparent to-[#070B0F]/80 z-[1]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_65%_55%_at_50%_50%,rgba(7,11,15,0.4)_0%,rgba(7,11,15,0.92)_100%)] z-[1]" />

        {/* Hero Content (Z-10, relative) */}
        <div className="relative z-10 flex flex-col items-center justify-center pointer-events-auto">
          {/* Massive Bold Headline */}
          <h1 className="font-black tracking-tight uppercase leading-none py-1 select-none text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] xl:text-[8.5rem] filter drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)]">
            <span className="text-[#F5F1E8]">
              LIGHTHOUSE <span className="text-[#F4C95D]">REELS</span>
            </span>
          </h1>

          {/* Two Specular Buttons Below */}
          <div className="flex flex-wrap items-center justify-center gap-5 pt-8">
            {user ? (
              <>
                <SpecularButton
                  size="md"
                  radius={10}
                  tint="#F4C95D"
                  tintOpacity={0.12}
                  blur={12}
                  textColor="#0B0F13"
                  lineColor="#F4C95D"
                  baseColor="#F4C95D"
                  intensity={1.2}
                  shineSize={14}
                  shineFade={35}
                  thickness={1.5}
                  speed={0.4}
                  followMouse
                  proximity={250}
                  onClick={() => router.push('/home')}
                >
                  <span className="font-bold">Explore Content Feed</span>
                </SpecularButton>

                <SpecularButton
                  size="md"
                  radius={10}
                  tint="#ffffff"
                  tintOpacity={0.04}
                  blur={12}
                  textColor="#F5F1E8"
                  lineColor="#52606C"
                  baseColor="#111A22"
                  intensity={1.0}
                  shineSize={14}
                  shineFade={35}
                  thickness={1.5}
                  speed={0.35}
                  followMouse
                  proximity={250}
                  onClick={() => router.push('/explore')}
                >
                  <span>Explore Catalog</span>
                </SpecularButton>
              </>
            ) : (
              <>
                <SpecularButton
                  size="md"
                  radius={10}
                  tint="#F4C95D"
                  tintOpacity={0.12}
                  blur={12}
                  textColor="#0B0F13"
                  lineColor="#F4C95D"
                  baseColor="#F4C95D"
                  intensity={1.2}
                  shineSize={14}
                  shineFade={35}
                  thickness={1.5}
                  speed={0.4}
                  followMouse
                  proximity={250}
                  onClick={() => router.push('/register')}
                >
                  <span className="font-bold">Get Started Free</span>
                </SpecularButton>

                <SpecularButton
                  size="md"
                  radius={10}
                  tint="#ffffff"
                  tintOpacity={0.04}
                  blur={12}
                  textColor="#F5F1E8"
                  lineColor="#52606C"
                  baseColor="#111A22"
                  intensity={1.0}
                  shineSize={14}
                  shineFade={35}
                  thickness={1.5}
                  speed={0.35}
                  followMouse
                  proximity={250}
                  onClick={() => router.push('/login')}
                >
                  <span>Sign In</span>
                </SpecularButton>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── 2. EXPLORE-STYLE CONTENT FEED (EXPANDED TO FULL WIDTH, NO WASTED SIDE SPACES) ── */}
      <section className="py-6 px-3 sm:px-6 md:px-8 lg:px-10 max-w-[1750px] mx-auto border-t border-[var(--glass-border)]">
        {/* Filter Tabs (Explore page style) */}
        <div className="flex items-center gap-2 pb-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveType('all')}
            className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeType === 'all' ? 'theme-active-pill' : 'theme-inactive-pill'
            }`}
          >
            All Formats
          </button>

          <button
            onClick={() => setActiveType('series')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeType === 'series' ? 'theme-active-pill' : 'theme-inactive-pill'
            }`}
          >
            <Layers className="w-4 h-4" />
            Series
          </button>

          <button
            onClick={() => setActiveType('audio')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeType === 'audio' ? 'theme-active-pill' : 'theme-inactive-pill'
            }`}
          >
            <Music className="w-4 h-4" />
            Audio
          </button>

          <button
            onClick={() => setActiveType('blog')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
              activeType === 'blog' ? 'theme-active-pill' : 'theme-inactive-pill'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Blogs
          </button>
        </div>

        {/* Content Rows */}
        {isLoading ? (
          <div className="space-y-8 animate-pulse">
            <div className="h-6 w-48 bg-[#111A22] rounded-lg mb-4 border border-[#1C252D]" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-video bg-[#111A22] rounded-xl border border-[#1C252D]" />
              ))}
            </div>
            <div className="h-6 w-48 bg-[#111A22] rounded-lg mt-8 mb-4 border border-[#1C252D]" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-video bg-[#111A22] rounded-xl border border-[#1C252D]" />
              ))}
            </div>
          </div>
        ) : totalContentCount === 0 ? (
          <EmptyState
            icon={Compass}
            title="No content available"
            description="Content is being added to the platform. Check back shortly!"
            actionLabel="Explore Catalog"
            actionHref="/explore"
          />
        ) : (
          <div className="space-y-12">
            {/* 1. TOP SPOTLIGHT SERIES */}
            {(activeType === 'all' || activeType === 'series') && seriesList.length > 0 && (
              <ContentCarousel
                title="Trending Series"
                badge="MUST WATCH"
                icon={Flame}
                href="/explore?type=series"
              >
                {seriesList.map((series) => (
                  <div key={series.id} className="w-64 sm:w-72 shrink-0 snap-start">
                    <SeriesCard series={series} />
                  </div>
                ))}
              </ContentCarousel>
            )}

            {/* 2. SERIES CATEGORY ROWS */}
            {(activeType === 'all' || activeType === 'series') &&
              seriesByCategory.map(([categoryName, seriesInCat]) => (
                <ContentCarousel
                  key={categoryName}
                  title={`${categoryName} Series`}
                  badge={`${seriesInCat.length} ${seriesInCat.length === 1 ? 'SHOW' : 'SHOWS'}`}
                  icon={Layers}
                  href="/explore?type=series"
                >
                  {seriesInCat.map((series) => (
                    <div key={series.id} className="w-64 sm:w-72 shrink-0 snap-start">
                      <SeriesCard series={series} />
                    </div>
                  ))}
                </ContentCarousel>
              ))}

            {/* ── 3. ADVERTISEMENT BREAK 1: PROPERLY INTERSPERSED BETWEEN SERIES & AUDIO ── */}
            {firstBatchAds.length > 0 && (activeType === 'all' || activeType === 'series') && (
              <div className="py-2">
                <ContentCarousel
                  title="Sponsored Partner Drops"
                  badge="SPONSORED"
                  icon={Sparkles}
                  href="/advertiser"
                >
                  {firstBatchAds.map((ad) => (
                    <div key={ad.id} className="w-64 sm:w-72 shrink-0 snap-start">
                      <MediaCard item={ad} />
                    </div>
                  ))}
                </ContentCarousel>
              </div>
            )}

            {/* 4. AUDIO TRACKS DIVIDED BY GENRE */}
            {(activeType === 'all' || activeType === 'audio') &&
              audioByGenre.map(([genreName, tracksInGenre]) => (
                <ContentCarousel
                  key={genreName}
                  title={`${genreName} Tracks`}
                  badge={`${tracksInGenre.length} TRACKS`}
                  icon={Radio}
                  href="/explore?type=audio"
                >
                  {tracksInGenre.map((track) => (
                    <div key={track.id} className="w-56 sm:w-64 shrink-0 snap-start">
                      <MediaCard item={track} allAudioTracks={audioList} />
                    </div>
                  ))}
                </ContentCarousel>
              ))}

            {/* ── 5. ADVERTISEMENT BREAK 2: PROPERLY INTERSPERSED BETWEEN AUDIO & BLOGS ── */}
            {secondBatchAds.length > 0 && (activeType === 'all' || activeType === 'audio') && (
              <div className="py-2">
                <ContentCarousel
                  title="Brand &amp; Partner Spotlight"
                  badge="FEATURED ADVERTISER"
                  icon={Megaphone}
                  href="/advertiser"
                >
                  {secondBatchAds.map((ad) => (
                    <div key={ad.id} className="w-64 sm:w-72 shrink-0 snap-start">
                      <MediaCard item={ad} />
                    </div>
                  ))}
                </ContentCarousel>
              </div>
            )}

            {/* 6. BLOG ARTICLES DIVIDED BY CATEGORY */}
            {(activeType === 'all' || activeType === 'blog') &&
              blogsByCategory.map(([catName, blogsInCat]) => (
                <ContentCarousel
                  key={catName}
                  title={`${catName} Blogs`}
                  badge="READS"
                  icon={BookOpen}
                  href="/blogs"
                >
                  {blogsInCat.map((blog) => (
                    <div key={blog.id} className="w-64 sm:w-72 shrink-0 snap-start">
                      <MediaCard item={blog} />
                    </div>
                  ))}
                </ContentCarousel>
              ))}
          </div>
        )}
      </section>

      {/* ── 3. CREATOR & ADVERTISER DUAL HUB ── */}
      <section className="py-14 px-3 sm:px-6 md:px-8 lg:px-10 max-w-[1750px] mx-auto border-t border-[var(--glass-border)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="theme-glass-card-static border border-[var(--glass-border)] rounded-2xl p-7 flex flex-col justify-between relative overflow-hidden shadow-xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-purple-bright)]/20 text-[var(--color-pink)] text-xs font-bold uppercase mb-3 border border-[var(--color-purple-bright)]/30">
                <Film className="w-3.5 h-3.5" />For Creators
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Creator Studio &amp; Multi-Format Publishing</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-5 font-normal">
                Upload video series, release music tracks, or publish creator blogs with unified metrics and real-time audience feedback.
              </p>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-normal">
                {['Multi-episode batch series uploading', 'Lossless audio streaming engine', 'Audience engagement & views metrics'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-pink)] hover:text-white transition-colors"
              >
                <span>Join as Creator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="theme-glass-card-static border border-[var(--glass-border)] rounded-2xl p-7 flex flex-col justify-between relative overflow-hidden shadow-xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-magenta)]/20 text-[var(--color-pink-light)] text-xs font-bold uppercase mb-3 border border-[var(--color-magenta)]/30">
                <Megaphone className="w-3.5 h-3.5" />For Advertisers
              </div>
              <h3 className="text-xl font-bold text-white mb-2">High-Visibility Native Placements</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-5 font-normal">
                Reach highly engaged audiences across streaming video, music listeners, and avid article readers with verified impression tracking.
              </p>
              <ul className="space-y-2 text-xs text-[var(--text-secondary)] font-normal">
                {['Direct feed and carousel integration', 'Real-time impression & click analytics', 'Dedicated advertiser management dashboard'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <Link
                href="/register?role=advertiser"
                className="inline-flex items-center gap-2 text-xs font-bold text-[var(--color-pink)] hover:text-white transition-colors"
              >
                <span>Launch Advertiser Campaign</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. STATIC CARDS WITH TEXT AT THE END (GLASSMORHIC DESIGN) ── */}
      <section className="py-16 px-3 sm:px-6 md:px-8 lg:px-10 max-w-[1750px] mx-auto border-t border-[var(--glass-border)]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Built For Seamless Multi-Format Discovery
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 font-normal">
            No need to jump between five different apps. Enjoy video, music, and written content side-by-side.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Episodic Series & Videos */}
          <div className="rounded-2xl p-6 sm:p-7 backdrop-blur-2xl bg-white/[0.04] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between hover:border-[var(--color-pink)]/40 hover:bg-white/[0.07] transition-all group">
            <div>
              <div className="w-11 h-11 rounded-xl bg-[var(--color-pink)]/15 border border-[var(--color-pink)]/30 text-[var(--color-pink-light)] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Episodic Series &amp; Videos</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
                Enjoy mini-series and movies with gesture controls, playback speed controls, and auto-rotation on mobile devices.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wide uppercase text-[var(--color-pink-light)] flex items-center gap-1.5">
                Cloudinary Powered Streaming <Zap className="w-3.5 h-3.5 text-[var(--color-pink)]" />
              </span>
            </div>
          </div>

          {/* Card 2: Music & Audio Experience */}
          <div className="rounded-2xl p-6 sm:p-7 backdrop-blur-2xl bg-white/[0.04] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between hover:border-[var(--color-purple-bright)]/40 hover:bg-white/[0.07] transition-all group">
            <div>
              <div className="w-11 h-11 rounded-xl bg-[var(--color-purple-bright)]/15 border border-[var(--color-purple-bright)]/30 text-[var(--color-pink-light)] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Music className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Music &amp; Audio Experience</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
                Spotify-inspired persistent player with background playback, synchronized lyrics, queue management, and album collections.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wide uppercase text-[var(--color-pink-light)] flex items-center gap-1.5">
                Persistent Audio Engine <Zap className="w-3.5 h-3.5 text-[var(--color-purple-bright)]" />
              </span>
            </div>
          </div>

          {/* Card 3: Community Blogs & Stories */}
          <div className="rounded-2xl p-6 sm:p-7 backdrop-blur-2xl bg-white/[0.04] border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between hover:border-[var(--color-magenta)]/40 hover:bg-white/[0.07] transition-all group">
            <div>
              <div className="w-11 h-11 rounded-xl bg-[var(--color-magenta)]/15 border border-[var(--color-magenta)]/30 text-[var(--color-pink-light)] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Community Blogs &amp; Stories</h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
                Read creator essays, production notes, track commentaries, and articles with instant reactions and discussion threads.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wide uppercase text-[#F4C95D] flex items-center gap-1.5">
                Open Publishing for Creators <Zap className="w-3.5 h-3.5 text-[#F4C95D]" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. PLATFORM FOOTER & LEGAL LINKS ── */}
      <footer className="py-10 px-4 max-w-[1750px] mx-auto border-t border-[#27313A]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7F8993]">
          <div className="flex items-center gap-2">
            <span className="font-black tracking-wider text-[#F5F1E8]">LIGHTHOUSE REELS</span>
            <span>· Premium Short-Form Video &amp; Entertainment Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-[#F5F1E8] transition-colors">
              Terms of Use
            </Link>
            <Link href="/privacy" className="hover:text-[#F5F1E8] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/explore" className="hover:text-[#F5F1E8] transition-colors">
              Explore Catalog
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
