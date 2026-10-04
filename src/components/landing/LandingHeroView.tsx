'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Play,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Star,
  Users,
  Film,
  Eye,
  X,
  MoreHorizontal,
  ChevronRight,
  Sun,
  Moon,
  CheckCircle,
  TrendingUp,
  Volume2,
  VolumeX,
  ExternalLink,
  ShieldCheck,
  Megaphone,
  Briefcase,
  Heart,
  Share2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getStoredSiteContent, SiteContent, DEFAULT_SITE_CONTENT } from '@/lib/siteContent';
import { useTheme } from '@/context/ThemeContext';

// Category Definitions
const CATEGORY_TABS = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'drama', label: 'Drama', icon: '🎭' },
  { id: 'romance', label: 'Romance', icon: '❤️' },
  { id: 'thriller', label: 'Thriller', icon: '⚡' },
  { id: 'comedy', label: 'Comedy', icon: '😂' },
  { id: 'fantasy', label: 'Fantasy', icon: '🔮' },
  { id: 'action', label: 'Action', icon: '🔥' },
  { id: 'scifi', label: 'Sci-Fi', icon: '🚀' },
];

// Fallback curated reels
const SAMPLE_REELS = [
  {
    id: 'reel-1',
    title: 'Whispers in the Starlight',
    creator: 'Aria Vance',
    handle: '@ariavance',
    avatar: '/images/avatar_ananya.jpg',
    category: 'romance',
    views: '1.4M',
    likes: '84K',
    duration: '1m 24s',
    thumbnail: '/images/reel_whispers.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    badge: 'Trending #1',
  },
  {
    id: 'reel-2',
    title: 'Neon Shadows: Episode 4',
    creator: 'Marcus Kane',
    handle: '@kane_films',
    avatar: '/images/avatar_ananya.jpg',
    category: 'thriller',
    views: '980K',
    likes: '62K',
    duration: '1m 45s',
    thumbnail: '/images/reel_city_nights.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    badge: 'Popular',
  },
  {
    id: 'reel-3',
    title: 'Secret Heir of Mumbai',
    creator: 'Vikram Sethi',
    handle: '@vikram_director',
    avatar: '/images/avatar_ananya.jpg',
    category: 'drama',
    views: '2.8M',
    likes: '142K',
    duration: '1m 58s',
    thumbnail: '/images/reel_kolkata.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    badge: 'Viral',
  },
  {
    id: 'reel-4',
    title: 'The Hidden Shore',
    creator: 'Elena Rostova',
    handle: '@elena_cinema',
    avatar: '/images/avatar_ananya.jpg',
    category: 'fantasy',
    views: '750K',
    likes: '49K',
    duration: '1m 12s',
    thumbnail: '/images/reel_hidden_shores.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    badge: 'New',
  },
  {
    id: 'reel-5',
    title: 'Parallel City Beats',
    creator: 'Leo Zhang',
    handle: '@zhang_motion',
    avatar: '/images/avatar_ananya.jpg',
    category: 'action',
    views: '1.1M',
    likes: '71K',
    duration: '1m 30s',
    thumbnail: '/images/reel_parallel_streets.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    badge: 'Hot',
  },
  {
    id: 'reel-6',
    title: 'Office Rivalry & Coffee',
    creator: 'Maya Lin',
    handle: '@mayalin_tv',
    avatar: '/images/avatar_ananya.jpg',
    category: 'comedy',
    views: '890K',
    likes: '53K',
    duration: '1m 08s',
    thumbnail: '/images/reel_last_light.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    badge: 'Hilarious',
  },
];

export function LandingHeroView() {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  const [activeNav, setActiveNav] = useState('Home');
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [cardDismissed, setCardDismissed] = useState(false);

  // Dynamic Site Text CMS
  const [siteText, setSiteText] = useState<SiteContent>(DEFAULT_SITE_CONTENT);

  // Dynamic Categories Content
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [reels, setReels] = useState<any[]>(SAMPLE_REELS);
  const [activeVideoPreview, setActiveVideoPreview] = useState<any | null>(null);

  // Load Dynamic Site Texts
  useEffect(() => {
    setSiteText(getStoredSiteContent());

    const handleUpdate = () => {
      setSiteText(getStoredSiteContent());
    };

    window.addEventListener('lighthouse_site_content_updated', handleUpdate);
    return () => window.removeEventListener('lighthouse_site_content_updated', handleUpdate);
  }, []);

  // Fetch Live Approved Content from Supabase
  useEffect(() => {
    async function fetchReels() {
      try {
        const { data: dbVideos } = await supabase
          .from('videos')
          .select('id, title, category, video_url, thumbnail_url, duration_seconds, views_count, likes_count, creator:profiles(display_name, username, avatar_url)')
          .eq('status', 'published')
          .limit(12);

        if (dbVideos && dbVideos.length > 0) {
          const mapped = dbVideos.map((v: any, index: number) => ({
            id: v.id,
            title: v.title,
            creator: v.creator?.display_name || 'Creator',
            handle: v.creator?.username ? `@${v.creator?.username}` : '@creator',
            avatar: v.creator?.avatar_url || '/images/avatar_ananya.jpg',
            category: (v.category || 'drama').toLowerCase(),
            views: v.views_count ? `${v.views_count.toLocaleString()}` : `${(1.2 + (index % 5) * 0.4).toFixed(1)}M`,
            likes: v.likes_count ? `${v.likes_count.toLocaleString()}` : `${(45 + (index % 5) * 15)}K`,
            duration: v.duration_seconds ? `${Math.floor(v.duration_seconds / 60)}m ${Math.round(v.duration_seconds % 60)}s` : '1m 30s',
            thumbnail: v.thumbnail_url || SAMPLE_REELS[index % SAMPLE_REELS.length].thumbnail,
            videoUrl: v.video_url || SAMPLE_REELS[index % SAMPLE_REELS.length].videoUrl,
            badge: index === 0 ? 'Trending #1' : index === 1 ? 'Popular' : 'Featured',
          }));
          setReels(mapped);
        }
      } catch {
        // use sample reels fallback
      }
    }
    fetchReels();
  }, []);

  // Filter reels by selected category
  const filteredReels = selectedCategory === 'all'
    ? reels
    : reels.filter((r) => (r.category || '').toLowerCase().includes(selectedCategory.toLowerCase()));

  // Style themes matching the user's images exactly:
  // Light Mode (Image 1): soft lavender aurora twilight sky, frosted lilac glass card, delicate white/purple borders
  // Dark Mode (Image 2): deep midnight starry cosmos, obsidian purple frosted glass, vibrant glowing purple neon rims
  const isLight = theme === 'light';

  return (
    <div
      className={`min-h-screen transition-colors duration-700 font-sans relative selection:bg-purple-600 selection:text-white pb-24 overflow-x-hidden ${
        isLight ? 'bg-[#7E6CA8] text-white' : 'bg-[#06030F] text-[#F5F1E8]'
      }`}
    >
      {/* ========================================================================= */}
      {/* DYNAMIC AMBIENT BACKGROUND (Matching uploaded images)                     */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {isLight ? (
          /* Light Mode: Ethereal lavender twilight sky with soft glowing clouds and starlight */
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-[#6A579B] via-[#7F6EA9] to-[#5C488C]" />
            <div className="absolute top-0 right-0 w-[80vw] h-[80vw] rounded-full bg-radial from-[#B099DE]/40 via-[#9278C9]/20 to-transparent blur-3xl opacity-80" />
            <div className="absolute bottom-0 left-0 w-[70vw] h-[70vw] rounded-full bg-radial from-[#9375C9]/35 via-[#684E9E]/20 to-transparent blur-3xl opacity-75" />
            {/* Soft cloud and star speckles */}
            <div
              className="absolute inset-0 opacity-40 bg-repeat"
              style={{
                backgroundImage: `radial-gradient(1.5px 1.5px at 30px 40px, #ffffff, rgba(0,0,0,0)), 
                                  radial-gradient(1.2px 1.2px at 120px 140px, #ffffff, rgba(0,0,0,0)), 
                                  radial-gradient(2px 2px at 220px 90px, #f3e8ff, rgba(0,0,0,0)), 
                                  radial-gradient(1.5px 1.5px at 310px 240px, #ffffff, rgba(0,0,0,0))`,
                backgroundSize: '340px 340px',
              }}
            />
          </>
        ) : (
          /* Dark Mode: Deep midnight purple/indigo cosmos with bright stars and violet nebula */
          <>
            <div className="absolute inset-0 bg-radial from-[#150A33] via-[#080417] to-[#040209]" />
            <div className="absolute -top-20 -right-20 w-[90vw] sm:w-[750px] h-[750px] rounded-full bg-radial from-[#9333EA]/35 via-[#6B21A8]/20 to-transparent blur-3xl opacity-90 animate-pulse duration-[8000ms]" />
            <div className="absolute -bottom-30 -left-20 w-[80vw] sm:w-[650px] h-[650px] rounded-full bg-radial from-[#7E22CE]/30 via-[#4C1D95]/15 to-transparent blur-3xl opacity-80" />
            {/* Sparkle background dots */}
            <div
              className="absolute inset-0 opacity-60 bg-repeat"
              style={{
                backgroundImage: `radial-gradient(1.5px 1.5px at 20px 30px, #ffffff, rgba(0,0,0,0)), 
                                  radial-gradient(1px 1px at 80px 120px, #e9d5ff, rgba(0,0,0,0)), 
                                  radial-gradient(2px 2px at 150px 70px, #c084fc, rgba(0,0,0,0)), 
                                  radial-gradient(1.5px 1.5px at 240px 200px, #ffffff, rgba(0,0,0,0)),
                                  radial-gradient(1px 1px at 320px 110px, #e9d5ff, rgba(0,0,0,0))`,
                backgroundSize: '350px 350px',
              }}
            />
          </>
        )}
      </div>

      {/* Main Outer Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 space-y-16 sm:space-y-24">
        {/* ========================================================================= */}
        {/* REQUIREMENT 1: THE EXACT HERO CARD (Matching Images 1 & 2)                */}
        {/* ========================================================================= */}
        {!cardDismissed ? (
          <div
            className={`relative rounded-[28px] sm:rounded-[40px] p-4 sm:p-8 lg:p-10 transition-all duration-700 ${
              isLight
                ? 'bg-[#8977B5]/45 backdrop-blur-2xl border border-white/40 shadow-[0_20px_70px_rgba(79,48,138,0.3)]'
                : 'bg-[#0E0824]/85 backdrop-blur-2xl border border-purple-500/35 shadow-[0_0_90px_rgba(147,51,234,0.3)]'
            }`}
          >
            {/* WINDOW TOP CONTROLS (Left X, Center Theme Switcher, Right ...) */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              {/* Left X Button */}
              <button
                onClick={() => setCardDismissed(false)}
                title="Hero Card Window"
                className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-inner active:scale-95 ${
                  isLight
                    ? 'bg-white/25 hover:bg-white/40 border border-white/50 text-white'
                    : 'bg-[#231545]/70 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Theme Mode Toggle (Light Mode / Dark Mode switcher) */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isLight
                      ? 'bg-white text-purple-950 shadow-md'
                      : 'text-purple-200/80 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Light Mode</span>
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    !isLight
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-purple-300" />
                  <span>Dark Mode</span>
                </button>
              </div>

              {/* Right ... Button */}
              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  title="Admin Center"
                  className={`hidden sm:flex px-3 py-1 rounded-xl text-[11px] font-bold items-center gap-1.5 transition-all ${
                    isLight
                      ? 'bg-white/20 hover:bg-white/35 text-white border border-white/40'
                      : 'bg-purple-950/60 hover:bg-purple-900 text-purple-200 border border-purple-500/30'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </Link>

                <button
                  onClick={() => router.push('/explore')}
                  title="Explore More"
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-inner active:scale-95 ${
                    isLight
                      ? 'bg-white/25 hover:bg-white/40 border border-white/50 text-white'
                      : 'bg-[#231545]/70 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 hover:text-white'
                  }`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* INNER NAVIGATION BAR */}
            <nav
              className={`flex flex-col md:flex-row items-center justify-between gap-4 pb-6 sm:pb-10 border-b ${
                isLight ? 'border-white/25' : 'border-purple-500/20'
              }`}
            >
              {/* Brand Logo & Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-500 to-purple-400 p-0.5 shadow-lg shadow-purple-600/40 flex items-center justify-center">
                  <div
                    className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                      isLight ? 'bg-[#735F9E]' : 'bg-[#0E0824]'
                    }`}
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm">
                  LightHouse <span className={isLight ? 'text-purple-200' : 'text-purple-300'}>Reels</span>
                </span>
              </div>

              {/* Navigation Menu Links */}
              <div className="flex items-center gap-4 sm:gap-7 text-xs sm:text-sm font-semibold tracking-wide text-white/80 overflow-x-auto max-w-full py-1">
                {[
                  { name: 'Home', href: '/' },
                  { name: 'Explore', href: '/explore' },
                  { name: 'Trending', href: '/home' },
                  { name: 'Categories', href: '#categories-section' },
                  { name: 'About', href: '/terms' },
                  { name: 'Blog', href: '/blog' },
                ].map((item) => {
                  const isActive = activeNav === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveNav(item.name);
                        if (item.href.startsWith('#')) {
                          document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth' });
                        } else if (item.href !== '/') {
                          router.push(item.href);
                        }
                      }}
                      className={`relative py-1 transition-colors cursor-pointer whitespace-nowrap ${
                        isActive ? 'text-white font-bold' : 'hover:text-white'
                      }`}
                    >
                      {item.name}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-300 via-pink-400 to-purple-400 rounded-full shadow-[0_0_8px_#c084fc]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* "Join Now ->" Vibrant Gradient Button */}
              <Link
                href="/register"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D946EF] via-[#C026D3] to-[#9333EA] hover:from-[#E879F9] hover:to-[#A855F7] text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/40 hover:shadow-pink-500/50 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                <span>Join Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </nav>

            {/* HERO CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-8 sm:pt-12">
              {/* LEFT COLUMN: Headings, Subtitle, Buttons, and Feature Badges */}
              <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-center lg:text-left">
                {/* Eyebrow Badge */}
                <div
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold shadow-inner ${
                    isLight
                      ? 'bg-white/20 border border-white/50 text-white'
                      : 'bg-purple-950/60 border border-purple-400/40 text-purple-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>{siteText.hero.badgeText}</span>
                </div>

                {/* Main Headline (Dynamic) */}
                <div className="space-y-1">
                  <h1 className="text-4xl sm:text-6xl lg:text-[62px] font-black text-white leading-[1.08] tracking-tight drop-shadow-md">
                    {siteText.hero.headlineLine1}
                  </h1>
                  <h1
                    className={`text-4xl sm:text-6xl lg:text-[62px] font-black leading-[1.08] tracking-tight ${
                      isLight ? 'text-purple-200' : 'text-purple-300'
                    }`}
                  >
                    {siteText.hero.headlineLine2}
                  </h1>
                </div>

                {/* Dynamic Subtitle */}
                <p
                  className={`text-sm sm:text-base lg:text-lg max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed ${
                    isLight ? 'text-white/90' : 'text-purple-200/85'
                  }`}
                >
                  {siteText.hero.subtitle}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    href="/home"
                    className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D946EF] via-[#9333EA] to-[#7E22CE] hover:from-[#E879F9] hover:to-[#A855F7] text-white font-bold text-sm shadow-xl shadow-purple-600/40 hover:shadow-purple-500/60 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span>{siteText.hero.ctaPrimary}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => setShowTrailerModal(true)}
                    className={`w-full sm:w-auto px-6 py-3.5 rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 ${
                      isLight
                        ? 'bg-white/25 hover:bg-white/35 border border-white/50 text-white'
                        : 'bg-[#1A113B]/70 hover:bg-purple-900/40 border border-purple-500/40 text-white'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-purple-500/40 border border-purple-400/50 flex items-center justify-center">
                      <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                    </div>
                    <span>{siteText.hero.ctaSecondary}</span>
                  </button>
                </div>

                {/* 3 FEATURE PILLS ROW (Creator Friendly, Fast & Trending, Safe & Curated) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  {/* Badge 1 */}
                  <div
                    className={`p-3.5 rounded-2xl transition-all flex items-center gap-3 text-left ${
                      isLight
                        ? 'bg-white/20 border border-white/40'
                        : 'bg-[#180E38]/70 border border-purple-500/25 hover:border-purple-400/40'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-white shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-snug">{siteText.hero.feature1Title}</p>
                      <p className={`text-[10px] ${isLight ? 'text-white/80' : 'text-purple-300/80'}`}>
                        {siteText.hero.feature1Subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Badge 2 */}
                  <div
                    className={`p-3.5 rounded-2xl transition-all flex items-center gap-3 text-left ${
                      isLight
                        ? 'bg-white/20 border border-white/40'
                        : 'bg-[#180E38]/70 border border-purple-500/25 hover:border-purple-400/40'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-white shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-snug">{siteText.hero.feature2Title}</p>
                      <p className={`text-[10px] ${isLight ? 'text-white/80' : 'text-purple-300/80'}`}>
                        {siteText.hero.feature2Subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Badge 3 */}
                  <div
                    className={`p-3.5 rounded-2xl transition-all flex items-center gap-3 text-left ${
                      isLight
                        ? 'bg-white/20 border border-white/40'
                        : 'bg-[#180E38]/70 border border-purple-500/25 hover:border-purple-400/40'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-white shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-snug">{siteText.hero.feature3Title}</p>
                      <p className={`text-[10px] ${isLight ? 'text-white/80' : 'text-purple-300/80'}`}>
                        {siteText.hero.feature3Subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: 3D LIGHTHOUSE ARTWORK */}
              <div className="lg:col-span-6 relative flex justify-center items-center">
                {/* Glow aura */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 via-pink-600/20 to-purple-900/40 rounded-3xl blur-2xl transform scale-95" />

                {/* 3D Render Lighthouse Artwork Card */}
                <div
                  className={`relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl transition-all duration-700 group ${
                    isLight
                      ? 'border border-white/50 shadow-[0_20px_60px_rgba(100,60,170,0.35)]'
                      : 'border border-purple-500/40 shadow-[0_20px_60px_rgba(147,51,234,0.4)]'
                  }`}
                >
                  <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full bg-[#100726]">
                    <Image
                      src={isLight ? '/images/lighthouse_hero_light.jpg' : '/images/lighthouse_hero_dark.jpg'}
                      alt="LightHouse Reels 3D Beacon"
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Gradient Overlay for subtle bottom blend */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-50 ${
                        isLight ? 'from-[#735F9E]' : 'from-[#0E0824]'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM STATS DOCK (Inside Hero Card) */}
            <div
              className={`mt-10 sm:mt-12 p-4 sm:p-5 rounded-2xl grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-center backdrop-blur-md ${
                isLight
                  ? 'bg-white/20 border border-white/40'
                  : 'bg-[#130B30]/80 border border-purple-500/30'
              }`}
            >
              {/* Stat 1 */}
              <div className="flex items-center gap-3 p-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isLight
                      ? 'bg-white/25 border border-white/40 text-white'
                      : 'bg-purple-900/50 border border-purple-500/30 text-purple-300'
                  }`}
                >
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black text-white leading-tight">
                    {siteText.hero.stat1Value}
                  </p>
                  <p className={`text-xs ${isLight ? 'text-white/80' : 'text-purple-300/80'}`}>
                    {siteText.hero.stat1Label}
                  </p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex items-center gap-3 p-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isLight
                      ? 'bg-white/25 border border-white/40 text-white'
                      : 'bg-purple-900/50 border border-purple-500/30 text-purple-300'
                  }`}
                >
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black text-white leading-tight">
                    {siteText.hero.stat2Value}
                  </p>
                  <p className={`text-xs ${isLight ? 'text-white/80' : 'text-purple-300/80'}`}>
                    {siteText.hero.stat2Label}
                  </p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex items-center gap-3 p-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isLight
                      ? 'bg-white/25 border border-white/40 text-white'
                      : 'bg-purple-900/50 border border-purple-500/30 text-purple-300'
                  }`}
                >
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black text-white leading-tight">
                    {siteText.hero.stat3Value}
                  </p>
                  <p className={`text-xs ${isLight ? 'text-white/80' : 'text-purple-300/80'}`}>
                    {siteText.hero.stat3Label}
                  </p>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="flex items-center gap-3 p-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isLight
                      ? 'bg-white/25 border border-white/40 text-amber-300'
                      : 'bg-purple-900/50 border border-purple-500/30 text-amber-400'
                  }`}
                >
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base sm:text-lg font-black text-white leading-tight">
                      {siteText.hero.stat4Value}
                    </p>
                    <span className={`text-xs ${isLight ? 'text-white/80' : 'text-purple-300/80'}`}>
                      {siteText.hero.stat4Label}
                    </span>
                  </div>
                  <div className="flex items-center text-amber-300 text-xs mt-0.5">
                    ★★★★★
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <button
              onClick={() => setCardDismissed(false)}
              className="px-6 py-3 rounded-full bg-purple-600 text-white font-bold text-sm shadow-lg hover:bg-purple-500 transition-all cursor-pointer"
            >
              Restore Hero Showcase
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* REQUIREMENT 2a: DYNAMIC CONTENT ACCORDING TO CATEGORIES (Same as Home)    */}
        {/* ========================================================================= */}
        <section id="categories-section" className="space-y-8 scroll-mt-12">
          {/* Section Heading & Subtitle (Dynamic) */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  isLight
                    ? 'bg-white/20 text-white border border-white/40'
                    : 'bg-purple-950/70 text-purple-300 border border-purple-500/30'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Featured Streams</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {siteText.categories.sectionTitle}
              </h2>
              <p className={`text-xs sm:text-sm max-w-xl ${isLight ? 'text-white/80' : 'text-purple-200/80'}`}>
                {siteText.categories.sectionSubtitle}
              </p>
            </div>

            <Link
              href="/home"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-purple-300 hover:text-white transition-colors self-start md:self-auto"
            >
              <span>Explore All on Home</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Category Tabs Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const isSelected = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#D946EF] to-[#9333EA] text-white shadow-lg shadow-purple-600/30 scale-105'
                      : isLight
                      ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                      : 'bg-[#130B30]/80 hover:bg-purple-900/40 text-purple-200 border border-purple-500/25'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Video Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {filteredReels.map((reel) => (
              <div
                key={reel.id}
                className={`group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between ${
                  isLight
                    ? 'bg-white/20 border border-white/40 shadow-lg hover:shadow-2xl'
                    : 'bg-[#12082B]/90 border border-purple-500/25 hover:border-purple-400/50 shadow-xl'
                }`}
              >
                {/* Poster & Play Hover */}
                <div className="relative aspect-[9/14] w-full bg-black/60 overflow-hidden">
                  <Image
                    src={reel.thumbnail}
                    alt={reel.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Gradient shade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                  {/* Top Badge */}
                  {reel.badge && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-[10px] font-bold text-white shadow-md">
                      {reel.badge}
                    </span>
                  )}

                  {/* Duration pill */}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono font-semibold text-white">
                    {reel.duration}
                  </span>

                  {/* Play overlay button */}
                  <button
                    onClick={() => setActiveVideoPreview(reel)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 backdrop-blur-[2px] transition-opacity cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </button>
                </div>

                {/* Details */}
                <div className="p-3 space-y-1.5">
                  <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-1 group-hover:text-purple-300 transition-colors">
                    {reel.title}
                  </h3>

                  <div className="flex items-center justify-between text-[11px] text-white/70">
                    <span className="truncate">{reel.creator}</span>
                    <span className="flex items-center gap-1 text-purple-300 shrink-0 font-medium">
                      <Eye className="w-3 h-3" /> {reel.views}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* REQUIREMENT 2b: ADVERTISER & CREATOR SIGN UP CARDS (Working Links)        */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Join The Lighthouse Ecosystem
            </h2>
            <p className={`text-xs sm:text-sm ${isLight ? 'text-white/80' : 'text-purple-200/80'}`}>
              Whether you are an ambitious storyteller or a visionary brand, our platform accelerates your impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pt-4">
            {/* CARD 1: CREATOR SIGN UP CARD */}
            <div
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.01] ${
                isLight
                  ? 'bg-white/25 backdrop-blur-2xl border border-white/50'
                  : 'bg-[#12092D]/90 backdrop-blur-2xl border border-purple-500/35 hover:border-purple-400/60 shadow-[0_0_50px_rgba(168,85,247,0.2)]'
              }`}
            >
              {/* Background ambient decorative orb */}
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />

              <div className="space-y-5 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/30 border border-purple-400/40 text-purple-200 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>{siteText.creatorCard.badge}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {siteText.creatorCard.title}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-white/85' : 'text-purple-200/80'}`}>
                    {siteText.creatorCard.subtitle}
                  </p>
                </div>

                {/* Perkz Checklist */}
                <div className="space-y-2.5 pt-2 text-xs">
                  {[
                    siteText.creatorCard.perk1,
                    siteText.creatorCard.perk2,
                    siteText.creatorCard.perk3,
                    siteText.creatorCard.perk4,
                  ].map((perk, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className={isLight ? 'text-white/90' : 'text-purple-100'}>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Working Creator Signup Link */}
              <div className="pt-8 relative z-10">
                <Link
                  href="/register?role=creator"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-600/40 hover:shadow-purple-500/60 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>{siteText.creatorCard.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* CARD 2: ADVERTISER SIGN UP CARD */}
            <div
              className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.01] ${
                isLight
                  ? 'bg-white/25 backdrop-blur-2xl border border-white/50'
                  : 'bg-[#0E0C2D]/90 backdrop-blur-2xl border border-blue-500/35 hover:border-cyan-400/60 shadow-[0_0_50px_rgba(59,130,246,0.2)]'
              }`}
            >
              {/* Background ambient decorative orb */}
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

              <div className="space-y-5 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-200 text-xs font-bold">
                  <Megaphone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{siteText.advertiserCard.badge}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {siteText.advertiserCard.title}
                  </h3>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isLight ? 'text-white/85' : 'text-blue-100/80'}`}>
                    {siteText.advertiserCard.subtitle}
                  </p>
                </div>

                {/* Perkz Checklist */}
                <div className="space-y-2.5 pt-2 text-xs">
                  {[
                    siteText.advertiserCard.perk1,
                    siteText.advertiserCard.perk2,
                    siteText.advertiserCard.perk3,
                    siteText.advertiserCard.perk4,
                  ].map((perk, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-blue-500/30 border border-blue-400/50 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span className={isLight ? 'text-white/90' : 'text-blue-100'}>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Working Advertiser Signup Link */}
              <div className="pt-8 relative z-10">
                <Link
                  href="/register?role=advertiser"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/40 hover:shadow-indigo-500/60 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>{siteText.advertiserCard.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* REQUIREMENT 2c: FOOTER SECTION                                            */}
        {/* ========================================================================= */}
        <footer
          className={`rounded-3xl p-8 sm:p-12 transition-all border ${
            isLight
              ? 'bg-white/20 backdrop-blur-xl border-white/40'
              : 'bg-[#0D0722]/90 backdrop-blur-xl border-purple-500/25'
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8 border-b border-white/15">
            {/* Col 1 & 2: Brand & Mission */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 flex items-center justify-center shadow-md">
                  <div className="w-full h-full rounded-[14px] bg-[#0E0824] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
                <span className="text-xl font-black text-white tracking-tight">
                  LightHouse <span className="text-purple-300">Reels</span>
                </span>
              </div>

              <p className={`text-xs leading-relaxed max-w-sm ${isLight ? 'text-white/80' : 'text-purple-300/80'}`}>
                {siteText.footer.mission}
              </p>

              <div className="pt-2 text-xs">
                <span className="text-purple-300">Support / Inquiries: </span>
                <a href={`mailto:${siteText.footer.contactEmail}`} className="text-white font-bold hover:underline">
                  {siteText.footer.contactEmail}
                </a>
              </div>
            </div>

            {/* Col 3: Navigation */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Explore</h4>
              <ul className="space-y-2 text-white/80">
                <li><Link href="/home" className="hover:text-white transition-colors">Home Feed</Link></li>
                <li><Link href="/explore" className="hover:text-white transition-colors">Discover Series</Link></li>
                <li><Link href="/home" className="hover:text-white transition-colors">Top Trending</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Community Blog</Link></li>
              </ul>
            </div>

            {/* Col 4: For Partners */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Partnerships</h4>
              <ul className="space-y-2 text-white/80">
                <li><Link href="/register?role=creator" className="hover:text-white transition-colors">Creator Studio</Link></li>
                <li><Link href="/register?role=advertiser" className="hover:text-white transition-colors">Brand Advertising</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Admin Portal</span>
                  <span className="text-[9px] bg-purple-600 px-1.5 py-0.5 rounded text-white">SECURE</span>
                </Link></li>
              </ul>
            </div>

            {/* Col 5: Legal & Trust */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Legal & Trust</h4>
              <ul className="space-y-2 text-white/80">
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Content Guidelines</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">DMCA / Copyright</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/70">
            <p>{siteText.footer.copyright}</p>
            <div className="flex items-center gap-4">
              <span>English (US)</span>
              <span>•</span>
              <span>Ultra-HD Streaming</span>
            </div>
          </div>
        </footer>
      </div>

      {/* ========================================================================= */}
      {/* VIDEO PREVIEW MODAL                                                       */}
      {/* ========================================================================= */}
      {activeVideoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-[#12092D] border border-purple-500/40 rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div>
                <h3 className="text-base font-bold text-white line-clamp-1">{activeVideoPreview.title}</h3>
                <p className="text-xs text-purple-300">By {activeVideoPreview.creator}</p>
              </div>
              <button
                onClick={() => setActiveVideoPreview(null)}
                className="w-8 h-8 rounded-full bg-purple-900/50 hover:bg-purple-800 text-purple-200 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-[9/16] max-h-[60vh] mx-auto rounded-2xl bg-black overflow-hidden flex items-center justify-center relative">
              <video
                src={activeVideoPreview.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/home"
                onClick={() => setActiveVideoPreview(null)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs shadow-md"
              >
                Watch Full Series on Home →
              </Link>
              <button
                onClick={() => setActiveVideoPreview(null)}
                className="px-4 py-2 text-xs text-purple-300 hover:text-white cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TRAILER MODAL                                                             */}
      {/* ========================================================================= */}
      {showTrailerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-3xl bg-[#120A2B] border border-purple-500/40 rounded-3xl overflow-hidden shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-purple-500/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Lighthouse Reels Official Trailer</h3>
              </div>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="w-8 h-8 rounded-full bg-purple-900/50 text-purple-200 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 aspect-video w-full rounded-2xl bg-black overflow-hidden flex items-center justify-center relative">
              <Image
                src={isLight ? '/images/lighthouse_hero_light.jpg' : '/images/lighthouse_hero_dark.jpg'}
                alt="Trailer preview"
                fill
                className="object-cover opacity-80"
              />
              <div className="relative z-10 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-purple-600/90 text-white flex items-center justify-center mx-auto shadow-xl shadow-purple-600/50 animate-bounce">
                  <Play className="w-8 h-8 fill-white ml-1" />
                </div>
                <p className="text-sm font-bold text-white drop-shadow">Experience Bite-Sized Entertainment</p>
                <Link
                  href="/home"
                  onClick={() => setShowTrailerModal(false)}
                  className="inline-block px-6 py-2.5 rounded-full bg-white text-purple-950 font-bold text-xs shadow-md hover:bg-purple-100 transition-all"
                >
                  Start Watching Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
