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
  CheckCircle,
  Megaphone,
  ShieldCheck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getStoredSiteContent, SiteContent, DEFAULT_SITE_CONTENT } from '@/lib/siteContent';

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

// Rotating Dynamic Words for 3rd Headline Line
const ROTATING_WORDS = ['Shine.', 'Glow.', 'Create.', 'Inspire.', 'Dream.'];

export function LandingHeroView() {
  const router = useRouter();
  const supabase = createClient();

  const [activeNav, setActiveNav] = useState('Home');
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Dynamic Word Typing / Rotation Effect
  const [wordIndex, setWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('Shine.');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(200);

  useEffect(() => {
    const fullWord = ROTATING_WORDS[wordIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        setCurrentText(fullWord.substring(0, currentText.length + 1));
        if (currentText === fullWord) {
          // Pause when word is complete
          setTypingSpeed(2400);
          setIsDeleting(true);
        } else {
          setTypingSpeed(110);
        }
      } else {
        // Deleting
        setCurrentText(fullWord.substring(0, currentText.length - 1));
        if (currentText === '') {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
          setTypingSpeed(250);
        } else {
          setTypingSpeed(60);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, wordIndex, typingSpeed]);

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

  return (
    <div className="min-h-screen bg-[#070216] text-[#F5F1E8] font-sans relative selection:bg-purple-600 selection:text-white pb-24 overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. DREAMY NIGHT SKY BACKGROUND (Aurora, Stars, Nebula & Clouds)             */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base cosmic deep purple gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0522] via-[#070216] to-[#04010b]" />

        {/* Ethereal Aurora Streaks */}
        <div className="absolute top-0 left-1/4 w-[55vw] h-[75vh] bg-gradient-to-b from-[#8b5cf6]/20 via-[#06b6d4]/15 to-transparent blur-3xl opacity-75 transform -rotate-12" />
        <div className="absolute top-0 right-1/4 w-[45vw] h-[65vh] bg-gradient-to-b from-[#c084fc]/25 via-[#a855f7]/15 to-transparent blur-3xl opacity-80 transform rotate-6" />

        {/* Ambient Glowing Purple Nebulas */}
        <div className="absolute -top-32 -left-32 w-[65vw] h-[65vw] max-w-[800px] max-h-[800px] rounded-full bg-radial from-[#9333ea]/25 via-[#6b21a8]/10 to-transparent blur-3xl opacity-85" />
        <div className="absolute top-1/3 -right-28 w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full bg-radial from-[#c084fc]/20 via-[#4c1d95]/10 to-transparent blur-3xl opacity-90" />
        <div className="absolute -bottom-20 left-1/4 w-[60vw] h-[50vw] max-w-[700px] max-h-[500px] rounded-full bg-radial from-[#7e22ce]/20 via-[#3b0764]/10 to-transparent blur-3xl opacity-75" />

        {/* Dreamy clouds at bottom */}
        <div className="absolute -bottom-10 left-0 right-0 h-48 bg-gradient-to-t from-[#1b0d3a]/60 via-[#120728]/30 to-transparent blur-2xl" />
        <div className="absolute bottom-6 left-10 w-96 h-36 rounded-full bg-purple-400/10 blur-[80px]" />
        <div className="absolute bottom-10 right-16 w-96 h-40 rounded-full bg-pink-500/10 blur-[90px]" />

        {/* Twinkling Starfield Pattern */}
        <div
          className="absolute inset-0 opacity-80 bg-repeat"
          style={{
            backgroundImage: `radial-gradient(1.5px 1.5px at 25px 35px, #ffffff, rgba(0,0,0,0)), 
                              radial-gradient(1.2px 1.2px at 110px 145px, #e9d5ff, rgba(0,0,0,0)), 
                              radial-gradient(2px 2px at 210px 80px, #ffffff, rgba(0,0,0,0)), 
                              radial-gradient(1.5px 1.5px at 320px 220px, #c084fc, rgba(0,0,0,0)),
                              radial-gradient(2.5px 2.5px at 420px 130px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1.2px 1.2px at 510px 290px, #fbcfe8, rgba(0,0,0,0))`,
            backgroundSize: '380px 380px',
          }}
        />
      </div>

      {/* Floating animation keyframes style */}
      <style jsx global>{`
        @keyframes floatLighthouse {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-9px) scale(1.01);
          }
        }
        .animate-float-lighthouse {
          animation: floatLighthouse 5.5s ease-in-out infinite;
        }
        @keyframes blinkCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .animate-cursor-blink {
          animation: blinkCursor 1s step-end infinite;
        }
      `}</style>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-16 sm:space-y-24">
        {/* ========================================================================= */}
        {/* REQUIREMENT: THE EXACT HERO SHOWCASE MODAL/CARD (Matching Image 2)        */}
        {/* ========================================================================= */}
        <div className="relative">
          {/* Top Floating Control Buttons (Outside Top-Left & Top-Right corners) */}
          <div className="flex items-center justify-between mb-3 px-2 sm:px-4">
            {/* Top Left X Button */}
            <button
              onClick={() => router.push('/home')}
              title="Enter App"
              className="w-11 h-11 rounded-2xl bg-white/[0.09] hover:bg-white/[0.20] backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all active:scale-95 cursor-pointer group"
            >
              <X className="w-5 h-5 text-white/90 group-hover:text-white transition-colors" />
            </button>

            {/* Top Right ... Button */}
            <div className="relative">
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                title="Options"
                className="w-11 h-11 rounded-2xl bg-white/[0.09] hover:bg-white/[0.20] backdrop-blur-xl border border-white/20 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-all active:scale-95 cursor-pointer group"
              >
                <MoreHorizontal className="w-5 h-5 text-white/90 group-hover:text-white transition-colors" />
              </button>

              {/* Options dropdown */}
              {showOptionsMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#180C38]/95 backdrop-blur-2xl border border-purple-500/30 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <Link
                    href="/admin"
                    onClick={() => setShowOptionsMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-200 hover:bg-purple-900/50 hover:text-white transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Admin Portal</span>
                  </Link>
                  <Link
                    href="/register?role=creator"
                    onClick={() => setShowOptionsMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-200 hover:bg-purple-900/50 hover:text-white transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    <span>Creator Studio</span>
                  </Link>
                  <Link
                    href="/terms"
                    onClick={() => setShowOptionsMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-200 hover:bg-purple-900/50 hover:text-white transition-colors"
                  >
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>About & Terms</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* MAIN FROSTED GLASS WINDOW */}
          <div className="relative rounded-[32px] sm:rounded-[44px] bg-[#1a0f37]/40 backdrop-blur-3xl border border-white/25 shadow-[0_30px_100px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.35),0_0_80px_rgba(168,85,247,0.2)] p-5 sm:p-9 lg:p-11 overflow-hidden">
            
            {/* INNER CARD CONTENT */}
            <div className="relative z-10 space-y-8 sm:space-y-11">
              {/* TOP NAVIGATION BAR INSIDE GLASS CONTAINER */}
              <nav className="flex items-center justify-between gap-4 pb-4 sm:pb-6">
                {/* Brand Logo & Title (Left Side) */}
                <Link href="/" className="flex items-center gap-3 group shrink-0">
                  <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden border border-purple-400/40 shadow-[0_0_18px_rgba(192,132,252,0.45)] flex items-center justify-center bg-[#180936]">
                    <Image
                      src="/images/lighthouse_hero_dark.jpg"
                      alt="Logo Beacon"
                      fill
                      className="object-cover scale-150 group-hover:scale-175 transition-transform duration-500"
                    />
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
                    LightHouse Reels
                  </span>
                </Link>

                {/* Center Navigation Menu Links */}
                <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold tracking-wide text-white/80">
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
                        className={`relative py-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                          isActive ? 'text-white font-bold' : 'hover:text-white'
                        }`}
                      >
                        {item.name}
                        {isActive && (
                          <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-300 rounded-full shadow-[0_0_10px_#f472b6]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Right Side - Purple Gradient Button "Join Now ->" */}
                <Link
                  href="/register"
                  className="px-5 sm:px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D946EF] via-[#C026D3] to-[#8B5CF6] hover:from-[#E879F9] hover:to-[#9333EA] text-white font-bold text-xs sm:text-sm shadow-[0_4px_20px_rgba(217,70,239,0.45)] hover:shadow-[0_4px_25px_rgba(217,70,239,0.7)] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
                >
                  <span>Join Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </nav>

              {/* HERO CONTENT: 2 COLUMN GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[380px] sm:min-h-[440px]">
                {/* ========================================================================= */}
                {/* LEFT COLUMN                                                               */}
                {/* ========================================================================= */}
                <div className="lg:col-span-6 space-y-6 sm:space-y-7 text-left">
                  {/* Small pill badge with sparkle icon: "Dive into Short Reels" */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/[0.12] backdrop-blur-md border border-purple-300/40 text-white shadow-[0_0_15px_rgba(192,132,252,0.25)]">
                    <Sparkles className="w-3.5 h-3.5 text-pink-300" />
                    <span>Dive into Short Reels</span>
                  </div>

                  {/* Large headline in 3 lines: "Watch.", "Discover.", and dynamic "Shine." / "Glow." / "Create." */}
                  <div className="space-y-0.5">
                    <h1 className="text-4xl sm:text-6xl lg:text-[58px] font-black text-white leading-[1.08] tracking-tight drop-shadow-lg">
                      Watch.
                    </h1>
                    <h1 className="text-4xl sm:text-6xl lg:text-[58px] font-black text-white leading-[1.08] tracking-tight drop-shadow-lg">
                      Discover.
                    </h1>
                    <div className="flex items-center">
                      <h1 className="text-4xl sm:text-6xl lg:text-[58px] font-black bg-gradient-to-r from-[#F3E8FF] via-[#E9D5FF] to-[#C084FC] bg-clip-text text-transparent leading-[1.08] tracking-tight drop-shadow-[0_4px_25px_rgba(192,132,252,0.45)]">
                        {currentText}
                      </h1>
                      <span className="inline-block w-[3px] h-9 sm:h-12 ml-1 bg-purple-300 rounded-full animate-cursor-blink shadow-[0_0_8px_#c084fc]" />
                    </div>
                  </div>

                  {/* Subheading */}
                  <p className="text-base sm:text-lg text-white/90 font-normal leading-relaxed max-w-lg drop-shadow">
                    Dive into bite-sized stories that light up your world.
                  </p>

                  {/* Two CTA buttons: Primary purple gradient & secondary glass button */}
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <Link
                      href="/home"
                      className="px-7 sm:px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D946EF] via-[#C026D3] to-[#9333EA] hover:from-[#E879F9] hover:to-[#A855F7] text-white font-bold text-sm sm:text-base shadow-[0_6px_25px_rgba(217,70,239,0.5)] hover:shadow-[0_6px_30px_rgba(217,70,239,0.75)] transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <span>Start Watching</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => setShowTrailerModal(true)}
                      className="px-6 py-3.5 rounded-full bg-white/[0.14] hover:bg-white/[0.24] backdrop-blur-md border border-white/30 text-white font-semibold text-sm sm:text-base transition-all flex items-center gap-2.5 shadow-lg active:scale-95 cursor-pointer"
                    >
                      <div className="w-5 h-5 rounded-full bg-white/20 border border-white/40 flex items-center justify-center">
                        <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                      </div>
                      <span>Watch Trailer</span>
                    </button>
                  </div>

                  {/* 3 small feature pills below (16px-24px rounded corners) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                    {/* Badge 1: Creator Friendly with sparkle icon */}
                    <div className="p-3 sm:p-3.5 rounded-[20px] bg-white/[0.09] hover:bg-white/[0.16] backdrop-blur-xl border border-white/20 hover:border-white/35 transition-all flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-white shrink-0 shadow-inner">
                        <Sparkles className="w-4 h-4 text-purple-200" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-snug">
                          Creator Friendly
                        </p>
                        <p className="text-[10px] text-purple-200/80 leading-tight">
                          Empowering Creators
                        </p>
                      </div>
                    </div>

                    {/* Badge 2: Fast & Trending with bolt icon */}
                    <div className="p-3 sm:p-3.5 rounded-[20px] bg-white/[0.09] hover:bg-white/[0.16] backdrop-blur-xl border border-white/20 hover:border-white/35 transition-all flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-white shrink-0 shadow-inner">
                        <Zap className="w-4 h-4 text-amber-300" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-snug">
                          Fast & Trending
                        </p>
                        <p className="text-[10px] text-purple-200/80 leading-tight">
                          Fresh Content Daily
                        </p>
                      </div>
                    </div>

                    {/* Badge 3: Safe & Curated with shield icon */}
                    <div className="p-3 sm:p-3.5 rounded-[20px] bg-white/[0.09] hover:bg-white/[0.16] backdrop-blur-xl border border-white/20 hover:border-white/35 transition-all flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-white shrink-0 shadow-inner">
                        <Shield className="w-4 h-4 text-cyan-300" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-snug">
                          Safe & Curated
                        </p>
                        <p className="text-[10px] text-purple-200/80 leading-tight">
                          Family-Friendly
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* RIGHT COLUMN: 3D CLAY-STYLE CUTE LIGHTHOUSE (Floating Slightly)           */}
                {/* ========================================================================= */}
                <div className="lg:col-span-6 relative flex items-center justify-center min-h-[380px] sm:min-h-[460px]">
                  {/* Floating 3D Lighthouse Container */}
                  <div className="relative w-full h-[380px] sm:h-[460px] animate-float-lighthouse flex items-center justify-center">
                    
                    {/* Glowing light beam radiating to the right */}
                    <div className="absolute top-1/4 -right-10 w-[240px] sm:w-[360px] h-[120px] sm:h-[180px] bg-gradient-to-r from-amber-300/40 via-amber-200/20 to-transparent blur-2xl transform rotate-12 pointer-events-none" />

                    {/* Ambient Glow behind lighthouse */}
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />

                    {/* 3D Lighthouse Artwork */}
                    <div className="relative w-full h-full rounded-[28px] overflow-hidden">
                      <Image
                        src="/images/lighthouse_hero_dark.jpg"
                        alt="3D Clay Lighthouse"
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-contain object-center scale-105"
                      />
                      {/* Gentle blend edges */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#1a0f37]/60 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f37]/40 via-transparent to-transparent pointer-events-none" />
                    </div>

                    {/* Sparkling stars / lights around the floating base */}
                    <div className="absolute bottom-6 left-12 w-2 h-2 rounded-full bg-pink-300 blur-[1px] animate-pulse" />
                    <div className="absolute bottom-16 right-16 w-2.5 h-2.5 rounded-full bg-purple-200 blur-[1px] animate-pulse delay-300" />
                    <div className="absolute top-20 right-8 w-2 h-2 rounded-full bg-amber-200 blur-[1px] animate-pulse delay-700" />
                  </div>
                </div>
              </div>

              {/* BOTTOM STATS PILL DOCK (Rounded 24px - Pill) */}
              <div className="p-4 sm:p-5 rounded-[24px] sm:rounded-full bg-white/[0.09] backdrop-blur-2xl border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.3)] grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-center">
                {/* Stat 1: Creators */}
                <div className="flex items-center gap-3 px-2 sm:px-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-purple-500/25 border border-purple-400/40 flex items-center justify-center text-white shrink-0 shadow-inner">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-200" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-black text-white leading-tight">
                      10K+ Creators
                    </p>
                    <p className="text-[11px] sm:text-xs text-purple-200/80">
                      Active Creators
                    </p>
                  </div>
                </div>

                {/* Stat 2: Reels */}
                <div className="flex items-center gap-3 px-2 sm:px-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-purple-500/25 border border-purple-400/40 flex items-center justify-center text-white shrink-0 shadow-inner">
                    <Film className="w-4 h-4 sm:w-5 sm:h-5 text-purple-200" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-black text-white leading-tight">
                      100K+ Reels
                    </p>
                    <p className="text-[11px] sm:text-xs text-purple-200/80">
                      Short Videos
                    </p>
                  </div>
                </div>

                {/* Stat 3: Views */}
                <div className="flex items-center gap-3 px-2 sm:px-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-purple-500/25 border border-purple-400/40 flex items-center justify-center text-white shrink-0 shadow-inner">
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-purple-200" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-black text-white leading-tight">
                      50M+ Views
                    </p>
                    <p className="text-[11px] sm:text-xs text-purple-200/80">
                      Monthly Views
                    </p>
                  </div>
                </div>

                {/* Stat 4: Rating */}
                <div className="flex items-center gap-3 px-2 sm:px-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-300 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm sm:text-base font-black text-white leading-tight">
                        4.9
                      </p>
                      <span className="text-[11px] sm:text-xs text-purple-200/80">
                        User Rating
                      </span>
                    </div>
                    <div className="text-amber-300 text-xs tracking-wider">
                      ★★★★★
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: DYNAMIC FEATURED STREAMS & CATEGORIES                          */}
        {/* ========================================================================= */}
        <section id="categories-section" className="space-y-8 scroll-mt-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/70 text-purple-300 border border-purple-500/30">
                <Film className="w-3.5 h-3.5" />
                <span>Featured Streams</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {siteText.categories.sectionTitle}
              </h2>
              <p className="text-xs sm:text-sm text-purple-200/80 max-w-xl">
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
                      : 'bg-[#130B30]/80 hover:bg-purple-900/40 text-purple-200 border border-purple-500/25'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Video Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {filteredReels.map((reel) => (
              <div
                key={reel.id}
                className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between bg-[#12082B]/90 border border-purple-500/25 hover:border-purple-400/50 shadow-xl"
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
        {/* SECTION 3: ADVERTISER & CREATOR SIGN UP CARDS                             */}
        {/* ========================================================================= */}
        <section className="space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Join The Lighthouse Ecosystem
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80">
              Whether you are an ambitious storyteller or a visionary brand, our platform accelerates your impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pt-4">
            {/* CARD 1: CREATOR SIGN UP */}
            <div className="relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.01] bg-[#12092D]/90 backdrop-blur-2xl border border-purple-500/35 hover:border-purple-400/60 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
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
                  <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
                    {siteText.creatorCard.subtitle}
                  </p>
                </div>

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
                      <span className="text-purple-100">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

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

            {/* CARD 2: ADVERTISER SIGN UP */}
            <div className="relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.01] bg-[#0E0C2D]/90 backdrop-blur-2xl border border-blue-500/35 hover:border-cyan-400/60 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
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
                  <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
                    {siteText.advertiserCard.subtitle}
                  </p>
                </div>

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
                      <span className="text-blue-100">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

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
        {/* SECTION 4: FOOTER                                                         */}
        {/* ========================================================================= */}
        <footer className="rounded-3xl p-8 sm:p-12 transition-all border bg-[#0D0722]/90 backdrop-blur-xl border-purple-500/25">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-8 border-b border-white/15">
            {/* Col 1 & 2: Brand */}
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

              <p className="text-xs text-purple-300/80 leading-relaxed max-w-sm">
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

            {/* Col 5: Legal */}
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
                src="/images/lighthouse_hero_dark.jpg"
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
