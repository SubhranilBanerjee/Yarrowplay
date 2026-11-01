'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Play,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Sun,
  Moon,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Users,
  Megaphone,
  Film,
  Mail,
  Shield,
  Star,
  Compass,
  Heart,
  Eye,
  Flame,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import { getStoredSiteContent, SiteContent, DEFAULT_SITE_CONTENT } from '@/lib/siteContent';
import { BrandLogo } from '@/components/landing/BrandLogo';

export interface ReelItem {
  id: string;
  title: string;
  subtitle?: string;
  creator: string;
  handle: string;
  category: string;
  views: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  badge?: string;
  accentColor?: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  badgeColor: string;
  items: ReelItem[];
}

export const CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'drama', label: 'Drama' },
  { id: 'romance', label: 'Romance' },
  { id: 'thriller', label: 'Thriller' },
  { id: 'action', label: 'Action' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'scifi', label: 'Sci-Fi' },
];

// Helper to assign a vibrant contextual emoji to dynamic categories from Supabase
export function getCategoryEmoji(catName: string): string {
  const c = (catName || '').toLowerCase();
  if (c.includes('drama')) return '🎭';
  if (c.includes('romance') || c.includes('love')) return '❤️';
  if (c.includes('thriller') || c.includes('mystery') || c.includes('suspense')) return '⚡';
  if (c.includes('action') || c.includes('adventure')) return '🔥';
  if (c.includes('comedy') || c.includes('humor') || c.includes('funny')) return '😄';
  if (c.includes('sci-fi') || c.includes('scifi') || c.includes('fantasy')) return '🚀';
  if (c.includes('doc') || c.includes('documentary')) return '📄';
  if (c.includes('travel')) return '✈️';
  if (c.includes('music')) return '🎵';
  if (c.includes('lifestyle')) return '☕';
  return '🎬';
}

// Helper to assign a compelling description to dynamic categories from Supabase
export function getCategoryTagline(catName: string): string {
  const c = (catName || '').toLowerCase();
  if (c.includes('drama')) return 'Deep emotional narratives, complex characters, and cinematic conflict.';
  if (c.includes('romance')) return 'Heartfelt connections, passionate journeys, and irresistible chemistry.';
  if (c.includes('thriller')) return 'Edge-of-your-seat suspense, deep conspiracies, and psychological twists.';
  if (c.includes('action')) return 'High-octane stunts, relentless pacing, and spectacular cinematic sequences.';
  if (c.includes('comedy')) return 'Witty banter, viral sketches, and laugh-out-loud micro-episodes.';
  if (c.includes('sci-fi') || c.includes('scifi')) return 'Futuristic cyberpunk realms, mythic lore, and mind-bending concepts.';
  if (c.includes('doc')) return 'Real stories, investigative journeys, and true-to-life documentaries.';
  return `Curated ${catName} original productions and short video content from verified creators.`;
}

// Global empty placeholder array for fallback references
const SAMPLE_REELS: ReelItem[] = [];

// 3D Chrome Star Sparkle Component
function ChromeStar({ className = 'w-16 h-16', rotation = 0 }: { className?: string; rotation?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ transform: `rotate(${rotation}deg)` }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="chromeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#E9D5FF" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="75%" stopColor="#581C87" />
          <stop offset="100%" stopColor="#D8B4FE" />
        </linearGradient>
        <linearGradient id="chromeGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="35%" stopColor="#C084FC" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#2E1065" stopOpacity="0.95" />
        </linearGradient>
        <filter id="starGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <polygon points="50,0 50,50 100,50 62,38" fill="url(#chromeGrad1)" />
      <polygon points="100,50 50,50 50,100 62,62" fill="url(#chromeGrad2)" />
      <polygon points="50,100 50,50 0,50 38,62" fill="url(#chromeGrad1)" />
      <polygon points="0,50 50,50 50,0 38,38" fill="url(#chromeGrad2)" />
      <circle cx="50" cy="50" r="3.5" fill="#FFFFFF" filter="url(#starGlow)" />
    </svg>
  );
}

export function LandingHeroView() {
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const [activeNav, setActiveNav] = useState('Home');
  const [siteText, setSiteText] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [isLoadingDynamic, setIsLoadingDynamic] = useState(true);
  const [activeVideoModal, setActiveVideoModal] = useState<any | null>(null);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());

  // Category Row Scroll Containers
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollCategoryRow = (categoryId: string, direction: 'left' | 'right') => {
    const container = rowRefs.current[categoryId];
    if (container) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const toggleLike = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedVideos((prev) => {
      const next = new Set(prev);
      if (next.has(videoId)) {
        next.delete(videoId);
      } else {
        next.add(videoId);
      }
      return next;
    });
  };

  // For Section 6 legacy carousel
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [reels, setReels] = useState<any[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Load dynamic CMS text and subscribe to live changes
  useEffect(() => {
    setSiteText(getStoredSiteContent());
    const handleUpdate = () => {
      setSiteText(getStoredSiteContent());
    };
    window.addEventListener('lighthouse_site_content_updated', handleUpdate);
    return () => window.removeEventListener('lighthouse_site_content_updated', handleUpdate);
  }, []);

  // Fetch Live Approved Dynamic Content EXCLUSIVELY from Supabase
  useEffect(() => {
    async function fetchDynamicContent() {
      setIsLoadingDynamic(true);
      try {
        const [
          { data: dbVideos },
          { data: dbSeries },
        ] = await Promise.all([
          supabase
            .from('videos')
            .select('id, title, category, video_url, thumbnail_url, duration_seconds, views_count, likes_count, creator:profiles(display_name, username)')
            .eq('status', 'published')
            .order('created_at', { ascending: false })
            .limit(60),
          supabase
            .from('content_series')
            .select('id, title, category, description, cover_url, total_episodes, created_at, creator:profiles(display_name, username), episodes:videos(id, episode_number, video_url, thumbnail_url, duration_seconds, views_count)')
            .order('created_at', { ascending: false })
            .limit(60),
        ]);

        const allDynamicItems: ReelItem[] = [];

        // 1. Dynamic series from Supabase (strictly require at least 1 valid episode video and thumbnail)
        if (dbSeries && dbSeries.length > 0) {
          dbSeries.forEach((s: any) => {
            const firstEp = s.episodes?.find((e: any) => e.episode_number === 1) || s.episodes?.[0];
            const epCount = s.episodes?.length || 0;

            // If the series has no playable episodes (e.g. deleted from admin), do not show ghost thumbnails
            if (!firstEp || !firstEp.video_url || epCount === 0) {
              return;
            }

            const thumbnail = s.cover_url || firstEp?.thumbnail_url;
            if (!thumbnail) {
              return;
            }

            const rawCat = (s.category && s.category.trim()) ? s.category.trim() : 'Drama';
            const creatorName = s.creator?.display_name || s.creator?.username || 'Studio Creator';
            const creatorHandle = s.creator?.username ? `@${s.creator.username}` : `@${creatorName.toLowerCase().replace(/\s+/g, '')}`;

            allDynamicItems.push({
              id: `series-${s.id}`,
              title: s.title || 'Untitled Series',
              subtitle: s.description || `${epCount} Episode${epCount === 1 ? '' : 's'}`,
              creator: creatorName,
              handle: creatorHandle,
              category: rawCat,
              views: epCount > 0 ? `${epCount} Ep` : 'Series',
              duration: epCount > 0 ? `${epCount} Episodes` : 'Original Series',
              thumbnail,
              videoUrl: firstEp.video_url,
              badge: epCount > 0 ? `${epCount} Episodes` : 'Original',
              accentColor: '#9333EA',
            });
          });
        }

        // 2. Dynamic published standalone videos from Supabase
        if (dbVideos && dbVideos.length > 0) {
          dbVideos.forEach((v: any) => {
            if (!v.video_url || !v.thumbnail_url) return;

            const rawCat = (v.category && v.category.trim()) ? v.category.trim() : 'General';
            const creatorName = v.creator?.display_name || v.creator?.username || 'Creator';
            const creatorHandle = v.creator?.username ? `@${v.creator.username}` : '@creator';
            const durSec = v.duration_seconds || 0;
            const durDisplay = durSec > 0 ? `${Math.floor(durSec / 60)}m ${durSec % 60}s` : 'Short Reel';
            const vc = v.views_count || 0;
            const viewsDisplay = vc >= 1000000 ? `${(vc / 1000000).toFixed(1)}M` : vc >= 1000 ? `${(vc / 1000).toFixed(0)}K` : `${vc} views`;

            allDynamicItems.push({
              id: `video-${v.id}`,
              title: v.title || 'Untitled Reel',
              subtitle: 'Dynamic Reel',
              creator: creatorName,
              handle: creatorHandle,
              category: rawCat,
              views: viewsDisplay,
              duration: durDisplay,
              thumbnail: v.thumbnail_url,
              videoUrl: v.video_url,
              badge: vc > 1000 ? 'Trending' : 'New',
              accentColor: '#A855F7',
            });
          });
        }

        // 3. Group strictly by category from Supabase
        const catMap = new Map<string, ReelItem[]>();
        allDynamicItems.forEach((item) => {
          const rawCat = item.category || 'General';
          const formattedCat = rawCat.charAt(0).toUpperCase() + rawCat.slice(1);
          if (!catMap.has(formattedCat)) {
            catMap.set(formattedCat, []);
          }
          catMap.get(formattedCat)!.push(item);
        });

        const dynamicGroups: CategoryGroup[] = [];
        catMap.forEach((items, cName) => {
          dynamicGroups.push({
            id: cName.toLowerCase().replace(/\s+/g, '-'),
            name: cName,
            emoji: getCategoryEmoji(cName),
            tagline: getCategoryTagline(cName),
            badgeColor: 'from-purple-600 to-pink-600',
            items,
          });
        });

        setCategoryGroups(dynamicGroups);
        setReels(allDynamicItems);
      } catch (err) {
        console.error('Failed to load dynamic Supabase content:', err);
        setCategoryGroups([]);
        setReels([]);
      } finally {
        setIsLoadingDynamic(false);
      }
    }

    fetchDynamicContent();
  }, []);

  // Filtered categories for hero section strictly from Supabase
  const displayedCategories = activeCategoryFilter === 'all'
    ? categoryGroups
    : categoryGroups.filter((g) => g.id === activeCategoryFilter);

  const totalVideosCount = categoryGroups.reduce((acc, cat) => acc + cat.items.length, 0);

  // Filter reels for legacy section
  const filteredReels = selectedCategory === 'all'
    ? reels
    : reels.filter((r) => (r.category || '').toLowerCase().includes(selectedCategory.toLowerCase()));

  // Carousel scroll
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 340;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const scrollToSection = (id: string, name: string) => {
    setActiveNav(name);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 relative selection:bg-purple-600 selection:text-white overflow-x-hidden ${
        isLight ? 'bg-white text-slate-900' : 'bg-[#070314] text-white'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. BACKGROUND GLOW & AMBIENCE                                             */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {isLight ? (
          // Crisp, pristine white with subtle lavender radial aura
          <>
            <div className="absolute top-0 right-0 w-[800px] h-[700px] bg-purple-100/40 rounded-full blur-[140px]" />
            <div className="absolute top-[40%] left-[-200px] w-[600px] h-[600px] bg-fuchsia-50/60 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 right-[-100px] w-[700px] h-[700px] bg-indigo-50/50 rounded-full blur-[160px]" />
          </>
        ) : (
          // Deep cosmic obsidian with neon magenta/violet aurora
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-[#09031B] via-[#070314] to-[#04010B]" />
            <div className="absolute top-[-100px] right-[-50px] w-[650px] h-[650px] bg-purple-600/15 rounded-full blur-[160px]" />
            <div className="absolute top-[25%] left-[-150px] w-[500px] h-[500px] bg-fuchsia-700/10 rounded-full blur-[140px]" />
            <div className="absolute bottom-1/4 right-[10%] w-[550px] h-[550px] bg-purple-900/20 rounded-full blur-[180px]" />
          </>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. FLOATING PILL NAVBAR                                                   */}
      {/* ========================================================================= */}
      <header className="sticky top-4 z-50 px-4 sm:px-8 max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <BrandLogo href="/home" showText={true} />

        {/* Center Pill Menu */}
        <nav
          className={`hidden lg:flex items-center gap-1 px-4 py-1.5 rounded-full border shadow-lg backdrop-blur-xl transition-all ${
            isLight
              ? 'bg-white/85 border-slate-200/90 text-slate-700 shadow-slate-200/60'
              : 'bg-[#150B2D]/85 border-white/10 text-white/80 shadow-black/40'
          }`}
        >
          <Link
            href="/home"
            className={`px-3.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
              isLight
                ? 'hover:text-slate-950 hover:bg-slate-100 text-slate-700'
                : 'hover:text-white hover:bg-white/10 text-white/80'
            }`}
          >
            Home
          </Link>
          <Link
            href="/about"
            className={`px-3.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
              isLight
                ? 'hover:text-slate-950 hover:bg-slate-100 text-slate-700'
                : 'hover:text-white hover:bg-white/10 text-white/80'
            }`}
          >
            About Us
          </Link>
          {[
            { id: 'services', label: 'Services' },
            { id: 'why-us', label: 'Work Process' },
            { id: 'creators', label: 'Creators' },
            { id: 'advertisers', label: 'Advertisers' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id, item.label)}
              className={`px-3.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                activeNav === item.label
                  ? isLight
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-950 font-bold shadow-sm'
                  : isLight
                  ? 'hover:text-slate-950 hover:bg-slate-100'
                  : 'hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Actions: Theme Toggle & Contact Pill CTA */}
        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Switch */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
                : 'bg-[#150B2D]/80 border-white/10 text-purple-200 hover:text-white hover:bg-purple-950'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4 text-purple-700" /> : <Sun className="w-4 h-4 text-amber-300" />}
          </button>

          {/* Contact Us CTA Button */}
          <button
            onClick={() => scrollToSection('footer', 'Contact Us')}
            className="px-5 py-2 rounded-full text-xs font-bold tracking-wide uppercase bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-lg shadow-purple-600/35 hover:shadow-purple-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Contact Us</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 3. HERO SECTION (POLARIS DESIGN CO. LAYOUT)                              */}
      {/* ========================================================================= */}
      <section id="hero" className="relative z-10 pt-12 md:pt-20 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Pill Category Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {(siteText.hero?.badgeTags || ['BRANDING & IDENTITY', 'UI/UX DESIGN', 'WEBSITE DESIGN & DEVELOPMENT', 'MARKETING & CREATIVE DESIGN']).map((tag, idx) => (
                <span
                  key={idx}
                  className={`text-[10px] md:text-xs font-semibold px-3.5 py-1.5 rounded-full border uppercase tracking-wider transition-colors ${
                    isLight
                      ? 'bg-purple-50/80 border-purple-200 text-purple-700'
                      : 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Outlined + Solid Neon Headline */}
            <div className="space-y-1">
              <h1
                className="text-4xl sm:text-6xl md:text-7xl lg:text-7xl font-black uppercase tracking-tight"
                style={{
                  WebkitTextStroke: isLight ? '1.5px #7C3AED' : '1.5px #C084FC',
                  color: 'transparent',
                }}
              >
                {siteText.hero?.headlineOutlined || 'DESIGN THAT'}
              </h1>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-7xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent filter drop-shadow-[0_4px_24px_rgba(168,85,247,0.35)]">
                {siteText.hero?.headlineSolid || 'BUILDS BRANDS'}
              </h1>
            </div>

            {/* Subtitle */}
            <p className={`text-sm sm:text-base md:text-lg max-w-xl leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}>
              {siteText.hero?.subtitle ||
                'We Craft Bold Visuals, Seamless Digital Experiences, And Strategic Designs That Help Brands Stand Out, Connect, And Grow.'}
            </p>

            {/* Dual CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/home"
                className="px-7 py-3 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-xl shadow-purple-600/40 hover:shadow-purple-600/60 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Explore</span>
              </Link>

              <Link
                href="/about"
                className={`px-7 py-3 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase border backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow-sm'
                    : 'bg-[#150B2D]/70 border-white/20 text-white hover:bg-white/10'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>Learn More</span>
              </Link>
            </div>
          </div>

          {/* Right Hero Visual: 3D Cyber Character with Floating Metallic Chrome Stars */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            {/* Ambient Purple Rim Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-purple-600/40 via-fuchsia-600/30 to-transparent rounded-[38px] blur-2xl opacity-70 pointer-events-none" />

            {/* Top-Left Floating Chrome Star */}
            <div className="absolute -top-8 -left-6 z-20 animate-bounce duration-[4000ms] pointer-events-none">
              <ChromeStar className="w-16 h-16 md:w-20 md:h-20 drop-shadow-[0_8px_20px_rgba(168,85,247,0.4)]" rotation={-12} />
            </div>

            {/* Main Cyber Visual Card */}
            <div
              className={`relative z-10 w-full max-w-[440px] aspect-[4/5] rounded-[32px] overflow-hidden border shadow-2xl transition-all group ${
                isLight ? 'bg-slate-100 border-purple-200 shadow-purple-900/10' : 'bg-[#120726] border-purple-500/30 shadow-black/80'
              }`}
            >
              <Image
                src="/images/cyber_hero_visual.jpg"
                alt="Futuristic Creative Vision"
                fill
                priority
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              {/* Subtle inner gradient shade */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-950/60 via-transparent to-black/20 pointer-events-none" />
            </div>

            {/* Bottom-Right Floating Chrome Star */}
            <div className="absolute -bottom-8 -right-6 z-20 animate-pulse duration-[3000ms] pointer-events-none">
              <ChromeStar className="w-14 h-14 md:w-16 md:h-16 drop-shadow-[0_8px_20px_rgba(217,70,239,0.4)]" rotation={18} />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* HERO CATEGORIZED CONTENT SHOWCASE (DISPLAYED SEPARATED ACCORDING TO CATEGORIES) */}
        {/* ========================================================================= */}
        <div id="hero-categories" className="mt-16 md:mt-24 pt-12 border-t border-purple-500/20 space-y-10">
          {/* Header & Quick Category Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-600/15 border border-purple-500/35 text-purple-300 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                <span>Featured Catalog</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent filter drop-shadow-[0_2px_16px_rgba(168,85,247,0.3)]">
                Browse By Category
              </h2>
              <p className={`text-xs sm:text-sm md:text-base leading-relaxed ${
                isLight ? 'text-slate-600' : 'text-slate-300'
              }`}>
                Explore all bite-sized vertical cinematic reels, episodic micro-dramas, and original series separated by genre.
              </p>
            </div>

            {/* Quick Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveCategoryFilter('all')}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategoryFilter === 'all'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/35 scale-105'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                }`}
              >
                <span>✨ All Categories</span>
                <span className="text-[10px] opacity-80 px-1.5 py-0.5 rounded-full bg-black/20">
                  {totalVideosCount}
                </span>
              </button>

              {categoryGroups.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryFilter(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCategoryFilter === cat.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/35 scale-105'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 border border-white/10'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-80 px-1.5 py-0.5 rounded-full bg-black/20">
                    {cat.items.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Categorized Content Sections (Separated according to categories) */}
          <div className="space-y-10">
            {isLoadingDynamic ? (
              /* Shimmering Loading Skeleton while fetching from Supabase */
              <div className="space-y-8 animate-pulse">
                {[1, 2].map((sIdx) => (
                  <div
                    key={sIdx}
                    className={`p-6 sm:p-8 rounded-3xl border ${
                      isLight ? 'bg-purple-50/40 border-purple-200/60' : 'bg-[#0f0622]/50 border-purple-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="space-y-2">
                        <div className="h-6 w-36 rounded-full bg-purple-500/20" />
                        <div className="h-4 w-64 rounded-full bg-purple-500/10" />
                      </div>
                      <div className="flex gap-2">
                        <div className="w-9 h-9 rounded-full bg-purple-500/20" />
                        <div className="w-9 h-9 rounded-full bg-purple-500/20" />
                      </div>
                    </div>
                    <div className="flex gap-5 overflow-hidden">
                      {[1, 2, 3, 4].map((cIdx) => (
                        <div
                          key={cIdx}
                          className="w-[220px] aspect-[9/16] rounded-[24px] bg-purple-500/10 border border-purple-500/20 shrink-0"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : categoryGroups.length === 0 ? (
              /* Empty state when no dynamic content exists in Supabase */
              <div
                className={`p-12 sm:p-16 rounded-3xl border text-center space-y-4 ${
                  isLight
                    ? 'bg-purple-50/50 border-purple-200/80 shadow-sm'
                    : 'bg-[#0f0622]/60 border-purple-500/20 backdrop-blur-xl shadow-2xl'
                }`}
              >
                <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-600/20 border border-purple-500/35 flex items-center justify-center text-purple-300">
                  <Film className="w-8 h-8" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  No Dynamic Content Uploaded Yet
                </h3>
                <p className={`text-xs sm:text-sm max-w-md mx-auto leading-relaxed ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  Only live dynamic content fetched from Supabase is displayed here. Head to Creator Studio to upload your first episodic series or video reels!
                </p>
                <div className="pt-2">
                  <Link
                    href="/creator/studio"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                  >
                    <span>Open Creator Studio →</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Dynamic Categories Rendered Separately */
              displayedCategories.map((cat) => (
                <div
                  key={cat.id}
                  id={`cat-${cat.id}`}
                  className={`p-6 sm:p-8 rounded-3xl border transition-all ${
                    isLight
                      ? 'bg-purple-50/50 border-purple-200/80 shadow-md shadow-purple-900/5'
                      : 'bg-[#0f0622]/60 border-purple-500/20 backdrop-blur-xl shadow-2xl'
                  }`}
                >
                  {/* Category Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{cat.emoji}</span>
                        <h3 className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {cat.name}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-600/20 text-purple-400 border border-purple-500/30">
                          {cat.items.length} {cat.items.length === 1 ? 'Title' : 'Titles'}
                        </span>
                      </div>
                      <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-purple-200/70'}`}>
                        {cat.tagline}
                      </p>
                    </div>

                    {/* Category Controls: Left/Right arrows + Explore link */}
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/search?category=${encodeURIComponent(cat.name)}`}
                        className="text-xs font-bold text-purple-400 hover:text-purple-300 uppercase tracking-wider flex items-center gap-1 group transition-colors"
                      >
                        <span>Explore {cat.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>

                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => scrollCategoryRow(cat.id, 'left')}
                          aria-label={`Scroll ${cat.name} Left`}
                          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-purple-300 shadow-sm'
                              : 'bg-[#150B2D] border-white/15 text-white hover:bg-white/10 hover:border-purple-400'
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => scrollCategoryRow(cat.id, 'right')}
                          aria-label={`Scroll ${cat.name} Right`}
                          className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                            isLight
                              ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-purple-300 shadow-sm'
                              : 'bg-[#150B2D] border-white/15 text-white hover:bg-white/10 hover:border-purple-400'
                          }`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Scrolling Video Track */}
                  <div
                    ref={(el) => {
                      rowRefs.current[cat.id] = el;
                    }}
                    className="flex items-center gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-3 pt-1 -mx-2 px-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {cat.items.map((reel) => (
                      <div
                        key={reel.id}
                        onClick={() => setActiveVideoModal(reel)}
                        className={`relative w-[210px] sm:w-[230px] md:w-[250px] aspect-[9/16] rounded-[24px] overflow-hidden shrink-0 border group cursor-pointer transition-all duration-300 hover:scale-[1.03] select-none ${
                          isLight
                            ? 'bg-white border-purple-200 shadow-lg shadow-purple-900/5 hover:border-purple-400 hover:shadow-purple-900/20'
                            : 'bg-[#130728] border-purple-500/25 shadow-2xl shadow-black/60 hover:border-purple-400 hover:shadow-purple-600/30'
                        }`}
                      >
                        {/* Video Thumbnail from Supabase or Artistic Fallback Card */}
                        {reel.thumbnail ? (
                          <Image
                            src={reel.thumbnail}
                            alt={reel.title}
                            fill
                            sizes="(max-width: 640px) 210px, 250px"
                            unoptimized={reel.thumbnail.startsWith('http')}
                            className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1E0E3D] via-[#2A1254] to-[#120626] flex flex-col items-center justify-center p-5 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-purple-600/25 border border-purple-500/40 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-purple-900/50">
                              <Film className="w-6 h-6 text-purple-300" />
                            </div>
                            <span className="text-xs font-bold text-white line-clamp-2 px-1">
                              {reel.title}
                            </span>
                            <span className="text-[10px] text-purple-300 uppercase tracking-wider mt-1.5 font-semibold">
                              {reel.category}
                            </span>
                          </div>
                        )}

                        {/* Scrim Gradients */}
                        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/65 to-transparent pointer-events-none" />

                        {/* Top Badges: Badge & Duration */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                          {reel.badge ? (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md">
                              {reel.badge}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md">
                              {reel.category}
                            </span>
                          )}

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/90 border border-white/20">
                            {reel.duration}
                          </span>
                        </div>

                        {/* Center Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-115 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300 shadow-xl shadow-purple-900/60">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Like Button */}
                        <button
                          onClick={(e) => toggleLike(reel.id, e)}
                          aria-label="Like video"
                          className="absolute top-11 right-3 z-20 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-colors ${
                              likedVideos.has(reel.id)
                                ? 'fill-[#EC4899] text-[#EC4899]'
                                : 'hover:text-[#EC4899]'
                            }`}
                          />
                        </button>

                        {/* Bottom Info Scrim */}
                        <div className="absolute bottom-0 inset-x-0 p-4 z-10 flex flex-col justify-end text-white">
                          <h4 className="font-bold text-sm sm:text-base leading-snug line-clamp-1 group-hover:text-purple-200 transition-colors drop-shadow">
                            {reel.title}
                          </h4>

                          <div className="flex items-center justify-between text-xs text-purple-200/90 mt-1.5">
                            <span className="truncate max-w-[130px]">{reel.creator}</span>
                            <span className="text-[11px] opacity-80 shrink-0">{reel.views}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SOCIAL PROOF / SATISFIED CLIENTS LOGOS BAR                             */}
      {/* ========================================================================= */}
      <section className="relative z-10 py-12 px-4 sm:px-8 max-w-7xl mx-auto border-t border-b border-purple-500/15">
        <h3 className={`text-center font-bold text-lg md:text-xl tracking-tight mb-8 ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          {siteText.hero?.satisfiedClientsCount || '100+ Satisfied Clients'}
        </h3>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 md:gap-14 max-w-5xl mx-auto opacity-80">
          {(siteText.hero?.clientLogos || ['Catalyx', 'Propulse', 'Aether Media', 'Nova Studios', 'Kinetic Reels', 'Vortex Digital', 'Starlight Prod']).map((logo, idx) => (
            <div
              key={idx}
              className={`font-black text-sm md:text-base tracking-widest uppercase transition-all duration-300 hover:scale-110 cursor-default ${
                isLight
                  ? 'text-slate-400 hover:text-purple-600'
                  : 'text-slate-400 hover:text-purple-300 drop-shadow-[0_2px_10px_rgba(168,85,247,0.2)]'
              }`}
            >
              {logo}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. WHO WE ARE / ABOUT US & 4-CARD BENTO GRID                             */}
      {/* ========================================================================= */}
      <section id="about" className="relative z-10 py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Header Row: Title on Left, Description on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mb-12">
          <div className="md:col-span-4">
            <span className={`text-[11px] font-bold tracking-widest uppercase block mb-1 ${
              isLight ? 'text-purple-600' : 'text-purple-400'
            }`}>
              {siteText.about?.badge || 'ABOUT OUR PLATFORM'}
            </span>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {siteText.about?.title || 'WHO WE ARE'}
            </h2>
          </div>

          <div className="md:col-span-8">
            <p className={`text-sm sm:text-base md:text-lg leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}>
              {siteText.about?.description ||
                'We Are A Creative Design Agency Focused On Turning Ideas Into Impactful Visual Experiences. From Brand Identity To Digital Design, We Help Businesses Communicate Clearly And Look Unforgettable.'}
            </p>
          </div>
        </div>

        {/* 4-Card 2x2 Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: Team & Creator Collaboration Image (Top Left) */}
          <div className={`relative h-[280px] sm:h-[320px] rounded-[28px] overflow-hidden border group shadow-xl ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}>
            <Image
              src="/images/team_creators_collab.jpg"
              alt="Creative team collaborating"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 keep-white">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-purple-600/80 text-white backdrop-blur-md">
                Production Crew
              </span>
              <p className="text-white text-sm font-semibold mt-2 drop-shadow-md">
                {siteText.about?.highlight1 || 'Leading the future of vertical cinema and episodic storytelling.'}
              </p>
            </div>
          </div>

          {/* Card 2: JOIN AS A CREATOR (Top Right - replaces original Our Mission) */}
          <div
            id="creators"
            className="keep-white relative h-[280px] sm:h-[320px] rounded-[28px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl border border-purple-400/30 text-white bg-gradient-to-br from-[#8A1BB9] via-[#630D88] to-[#3B0764]"
          >
            {/* Subtle background radial shimmer */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/15 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20">
                  {siteText.creatorCard?.badge || 'FOR CREATORS'}
                </span>
                <Users className="w-5 h-5 text-purple-200" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-2">
                {siteText.creatorCard?.title || 'JOIN AS A CREATOR'}
              </h3>

              <p className="text-xs sm:text-sm text-purple-100/90 line-clamp-3 leading-relaxed mb-4">
                {siteText.creatorCard?.subtitle ||
                  'Empower your storytelling. Upload high-impact episodic reels, retain 70% of coin unlocks, and cultivate an obsessed global fandom.'}
              </p>

              {/* Perks List */}
              <div className="space-y-1.5 hidden sm:block">
                {[
                  siteText.creatorCard?.perk1 || 'Instant creator dashboard & episode retention graphs',
                  siteText.creatorCard?.perk2 || '70% creator revenue share on coin unlocks & tips',
                  siteText.creatorCard?.perk3 || 'Global CDN streaming with 4K HDR playback',
                ].map((perk, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-purple-100">
                    <Check className="w-3.5 h-3.5 text-pink-300 shrink-0" />
                    <span className="truncate">{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/studio"
                className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-purple-950 font-bold text-xs uppercase tracking-wider hover:bg-purple-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md cursor-pointer"
              >
                <span className="text-purple-950 font-bold">{siteText.creatorCard?.ctaText || 'Creator Studio →'}</span>
              </Link>
            </div>
          </div>

          {/* Card 3: JOIN AS AN ADVERTISER (Bottom Left - replaces original Our Vision) */}
          <div
            id="advertisers"
            className="keep-white relative h-[280px] sm:h-[320px] rounded-[28px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl border border-purple-400/30 text-white bg-gradient-to-br from-[#8A1BB9] via-[#630D88] to-[#3B0764]"
          >
            {/* Subtle background radial shimmer */}
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/15 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20">
                  {siteText.advertiserCard?.badge || 'FOR ADVERTISERS'}
                </span>
                <Megaphone className="w-5 h-5 text-purple-200" />
              </div>

              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-2">
                {siteText.advertiserCard?.title || 'JOIN AS AN ADVERTISER'}
              </h3>

              <p className="text-xs sm:text-sm text-purple-100/90 line-clamp-3 leading-relaxed mb-4">
                {siteText.advertiserCard?.subtitle ||
                  'Command 100% viewer attention with non-intrusive rewarded sponsor ads, brand placements, and high-conversion vertical campaigns.'}
              </p>

              {/* Perks List */}
              <div className="space-y-1.5 hidden sm:block">
                {[
                  siteText.advertiserCard?.perk1 || 'Over 85% verified video completion rate (VCR)',
                  siteText.advertiserCard?.perk2 || 'Laser-focused category & demographic targeting',
                  siteText.advertiserCard?.perk3 || '100% brand-safe, human-moderated content catalog',
                ].map((perk, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-purple-100">
                    <Check className="w-3.5 h-3.5 text-pink-300 shrink-0" />
                    <span className="truncate">{perk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => scrollToSection('footer', 'Contact Us')}
                className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-purple-950 font-bold text-xs uppercase tracking-wider hover:bg-purple-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md cursor-pointer"
              >
                <span className="text-purple-950 font-bold">{siteText.advertiserCard?.ctaText || 'Partner With Us →'}</span>
              </button>
            </div>
          </div>

          {/* Card 4: Executive Boardroom & Brand Partners Image (Bottom Right) */}
          <div className={`relative h-[280px] sm:h-[320px] rounded-[28px] overflow-hidden border group shadow-xl ${
            isLight ? 'border-slate-200' : 'border-white/10'
          }`}>
            <Image
              src="/images/brand_partners_meeting.jpg"
              alt="Brand partners in executive boardroom meeting"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 keep-white">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-purple-600/80 text-white backdrop-blur-md">
                Brand Strategy
              </span>
              <p className="text-white text-sm font-semibold mt-2 drop-shadow-md">
                {siteText.about?.highlight2 || 'Connecting millions of engaged viewers with visionary talent across the globe.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. OUR SERVICES / CONTENT SHOWCASE CAROUSEL                              */}
      {/* ========================================================================= */}
      <section id="services" className="relative z-10 py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <span className={`text-[11px] font-bold tracking-widest uppercase block mb-1 ${
              isLight ? 'text-purple-600' : 'text-purple-400'
            }`}>
              {siteText.services?.badge || 'OUR SERVICES'}
            </span>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {siteText.services?.title || 'OUR SERVICES'}
            </h2>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
                    : isLight
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Showcase Grid: Left Title & Description + Right Carousel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column Description with Carousel Controls */}
          <div className="lg:col-span-4 space-y-5">
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
              {selectedCategory === 'all'
                ? 'BRANDING & IDENTITY'
                : `${selectedCategory.toUpperCase()} SHOWCASE`}
            </h3>

            <p className={`text-xs sm:text-sm leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}>
              {siteText.services?.description ||
                'We Build Strong Brand Identities That Tell Your Story And Leave A Lasting Impression.'}
            </p>

            {/* Navigation Buttons (←) (→) */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => scrollCarousel('left')}
                aria-label="Previous Showcase Item"
                className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
                    : 'bg-[#150B2D] border-white/15 text-white hover:bg-white/10 hover:border-purple-400'
                }`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
                aria-label="Next Showcase Item"
                className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
                    : 'bg-[#150B2D] border-white/15 text-white hover:bg-white/10 hover:border-purple-400'
                }`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Column: Carousel Cards */}
          <div className="lg:col-span-8">
            <div
              ref={carouselRef}
              className="flex items-center gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1"
            >
              {filteredReels.map((reel) => (
                <div
                  key={reel.id}
                  onClick={() => setActiveVideoModal(reel)}
                  className="keep-white min-w-[240px] sm:min-w-[270px] max-w-[270px] h-[370px] rounded-[28px] p-6 flex flex-col justify-between relative overflow-hidden shadow-xl border border-purple-500/30 cursor-pointer group hover:scale-[1.03] transition-all duration-300 shrink-0 text-white bg-gradient-to-br from-[#8A1BB9] via-[#630D88] to-[#3B0764]"
                >
                  {/* Decorative Waves & Curved Contours */}
                  <div className="absolute inset-0 opacity-25 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 200 300" fill="none">
                      <path d="M-20 60 Q 60 120 220 80" stroke="white" strokeWidth="1.5" />
                      <path d="M-20 100 Q 60 160 220 120" stroke="white" strokeWidth="1.5" />
                      <path d="M-20 140 Q 60 200 220 160" stroke="white" strokeWidth="1.5" />
                      <path d="M-20 180 Q 60 240 220 200" stroke="white" strokeWidth="1.5" />
                      <path d="M-20 220 Q 60 280 220 240" stroke="white" strokeWidth="1.5" />
                    </svg>
                  </div>

                  {/* Top Row: Category Tag & Arrow Icon (↗) */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-md border border-white/20">
                      {reel.category}
                    </span>
                    <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center bg-white/10 group-hover:bg-white group-hover:text-purple-900 transition-colors">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Center Brand / Logo Icon */}
                  <div className="relative z-10 my-auto text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-white/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                      <Play className="w-5 h-5 fill-white" />
                    </div>
                    <span className="text-2xl font-black tracking-widest uppercase block drop-shadow-md">
                      {reel.title.split(' ')[0]}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-purple-200">
                      {reel.subtitle || reel.creator}
                    </span>
                  </div>

                  {/* Bottom Information */}
                  <div className="relative z-10 pt-2 border-t border-white/15">
                    <h4 className="font-bold text-sm tracking-tight truncate">
                      {reel.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-purple-200/80 mt-1">
                      <span>{reel.views} views</span>
                      <span>{reel.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. WHY CHOOSE US (6-CARD GRID)                                           */}
      {/* ========================================================================= */}
      <section id="why-us" className="relative z-10 py-20 px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Header Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mb-12">
          <div className="md:col-span-5">
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              {siteText.whyChooseUs?.title || 'WHY CHOOSE US'}
            </h2>
          </div>

          <div className="md:col-span-7">
            <p className={`text-sm sm:text-base md:text-lg leading-relaxed ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}>
              {siteText.whyChooseUs?.subtitle ||
                "We Don't Just Design, We Solve Problems Through Creativity."}
            </p>
          </div>
        </div>

        {/* 6-Card Grid: 3 columns, 2 rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: siteText.whyChooseUs?.feature1Title || 'Strategy-Driven Content' },
            { title: siteText.whyChooseUs?.feature2Title || 'Clean, Modern Aesthetics' },
            { title: siteText.whyChooseUs?.feature3Title || 'Client-Focused Approach' },
            { title: siteText.whyChooseUs?.feature4Title || 'Fast Turnaround Time' },
            { title: siteText.whyChooseUs?.feature5Title || 'Transparent Communication' },
            { title: siteText.whyChooseUs?.feature6Title || 'Scalable Design Solutions' },
          ].map((item, index) => (
            <div
              key={index}
              className={`p-6 rounded-2xl border transition-all duration-300 group hover:-translate-y-1 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 hover:border-purple-300 hover:bg-white hover:shadow-lg hover:shadow-purple-900/5'
                  : 'bg-[#120826]/70 border-white/10 hover:border-purple-500/40 hover:bg-[#180B33]'
              }`}
            >
              {/* Purple Square Icon with White Checkmark */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30 mb-5 group-hover:scale-105 transition-transform">
                <Check className="w-5 h-5 text-white stroke-[2.5]" />
              </div>

              {/* Feature Title */}
              <h3 className={`font-bold text-base sm:text-lg tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {item.title}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER (EDITABLE FROM ADMIN CMS)                                       */}
      {/* ========================================================================= */}
      <footer
        id="footer"
        className={`relative z-10 border-t py-16 px-4 sm:px-8 transition-colors ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-700'
            : 'bg-[#05020E] border-white/10 text-slate-300'
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-purple-500/15">
            {/* Left: Brand & Mission */}
            <div className="md:col-span-5 space-y-4">
              <BrandLogo href="/home" showText={true} />

              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                {siteText.footer?.brandTagline || 'Bite-Sized Stories That Light Up Your World'}
              </p>

              <p className="text-xs sm:text-sm leading-relaxed opacity-80 max-w-md">
                {siteText.footer?.mission ||
                  'Lighthouse Reels is the premier platform for cinematic micro-dramas and viral vertical reels, connecting visionary creators with millions of passionate viewers worldwide.'}
              </p>
            </div>

            {/* Middle: Quick Links */}
            <div className="md:col-span-3 space-y-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {siteText.footer?.quickLinksTitle || 'Quick Navigation'}
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/home" className="hover:text-purple-500 cursor-pointer">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-purple-500 cursor-pointer">
                    About Us
                  </Link>
                </li>
                <li>
                  <button onClick={() => scrollToSection('services', 'Services')} className="hover:text-purple-500 cursor-pointer">
                    Showcase & Services
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('why-us', 'Work Process')} className="hover:text-purple-500 cursor-pointer">
                    Why Choose Us
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('creators', 'Creators')} className="hover:text-purple-500 cursor-pointer">
                    Join as a Creator
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('advertisers', 'Advertisers')} className="hover:text-purple-500 cursor-pointer">
                    Join as an Advertiser
                  </button>
                </li>
              </ul>
            </div>

            {/* Right: Contact */}
            <div className="md:col-span-4 space-y-3">
              <h4 className={`text-xs font-bold uppercase tracking-wider ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                Get In Touch
              </h4>
              <p className="text-xs opacity-80">
                Interested in collaboration, episodic sponsorships, or studio partnerships?
              </p>

              {siteText.footer?.contactEmail && (
                <div className="pt-1">
                  <a
                    href={`mailto:${siteText.footer.contactEmail}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{siteText.footer.contactEmail}</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar: Copyright & Legal */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs opacity-70">
            <p>{siteText.footer?.copyright || '© 2026 LightHouse Reels Inc. All rights reserved.'}</p>
            <p className="text-center sm:text-right">{siteText.footer?.legalNotice}</p>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 9. VIDEO PREVIEW / TRAILER POPUP MODAL                                    */}
      {/* ========================================================================= */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-slate-950 border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/90 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-600/80 text-white">
                  {activeVideoModal.category}
                </span>
                <h3 className="font-bold text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                  {activeVideoModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src={activeVideoModal.videoUrl}
                poster={activeVideoModal.thumbnail}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Details Footer */}
            <div className="p-4 bg-slate-900/90 border-t border-white/10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-purple-300 font-semibold">{activeVideoModal.creator}</span>
                <p className="text-xs text-slate-400">{activeVideoModal.views} views • {activeVideoModal.duration}</p>
              </div>
              <Link
                href="/series"
                className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
              >
                Watch Full Series →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
