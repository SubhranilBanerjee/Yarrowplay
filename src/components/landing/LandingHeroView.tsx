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
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';
import { getStoredSiteContent, SiteContent, DEFAULT_SITE_CONTENT } from '@/lib/siteContent';

// Category Definitions
const CATEGORY_TABS = [
  { id: 'all', label: 'All' },
  { id: 'drama', label: 'Drama' },
  { id: 'romance', label: 'Romance' },
  { id: 'thriller', label: 'Thriller' },
  { id: 'action', label: 'Action' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'comedy', label: 'Comedy' },
  { id: 'scifi', label: 'Sci-Fi' },
];

// Fallback dynamic curated reels
const SAMPLE_REELS = [
  {
    id: 'reel-1',
    title: 'Catalyx Vision',
    subtitle: 'Logo Design & Identity',
    creator: 'Catalyx Studios',
    handle: '@catalyx',
    category: 'drama',
    views: '1.4M',
    duration: '1m 24s',
    thumbnail: '/images/reel_whispers.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    badge: 'Popular',
    accentColor: '#9333EA',
  },
  {
    id: 'reel-2',
    title: 'Propulse Brand',
    subtitle: 'Brand Guidelines',
    creator: 'Propulse Media',
    handle: '@propulse',
    category: 'thriller',
    views: '980K',
    duration: '1m 45s',
    thumbnail: '/images/reel_city_nights.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    badge: 'Trending',
    accentColor: '#A855F7',
  },
  {
    id: 'reel-3',
    title: 'Catalyx Systems',
    subtitle: 'Visual Identity Systems',
    creator: 'Catalyx Studios',
    handle: '@catalyx',
    category: 'romance',
    views: '2.8M',
    duration: '1m 58s',
    thumbnail: '/images/reel_kolkata.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    badge: 'Featured',
    accentColor: '#7E22CE',
  },
  {
    id: 'reel-4',
    title: 'Aether Evolution',
    subtitle: 'Rebranding Suite',
    creator: 'Aether Media',
    handle: '@aether',
    category: 'fantasy',
    views: '750K',
    duration: '1m 12s',
    thumbnail: '/images/reel_hidden_shores.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    badge: 'New',
    accentColor: '#6B21A8',
  },
  {
    id: 'reel-5',
    title: 'Nova Motion Beats',
    subtitle: 'Digital Experience',
    creator: 'Nova Studios',
    handle: '@novastudios',
    category: 'action',
    views: '1.1M',
    duration: '1m 30s',
    thumbnail: '/images/reel_parallel_streets.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    badge: 'Hot',
    accentColor: '#9333EA',
  },
  {
    id: 'reel-6',
    title: 'Kinetic Micro-Series',
    subtitle: 'Episodic Production',
    creator: 'Kinetic Reels',
    handle: '@kinetic',
    category: 'comedy',
    views: '890K',
    duration: '1m 08s',
    thumbnail: '/images/reel_last_light.jpg',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    badge: 'Viral',
    accentColor: '#C084FC',
  },
];

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [reels, setReels] = useState<any[]>(SAMPLE_REELS);
  const [activeVideoModal, setActiveVideoModal] = useState<any | null>(null);
  const [isMuted, setIsMuted] = useState(true);

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

  // Fetch Live Approved Content from Supabase
  useEffect(() => {
    async function fetchReels() {
      try {
        const { data: dbVideos } = await supabase
          .from('videos')
          .select('id, title, category, video_url, thumbnail_url, duration_seconds, views_count, likes_count, creator:profiles(display_name, username)')
          .eq('status', 'published')
          .limit(12);

        if (dbVideos && dbVideos.length > 0) {
          const mapped = dbVideos.map((v: any, index: number) => ({
            id: v.id,
            title: v.title,
            subtitle: v.category ? `${v.category.toUpperCase()} PRODUCTION` : 'ORIGINAL SERIES',
            creator: v.creator?.display_name || 'Studio Creator',
            handle: v.creator?.username ? `@${v.creator?.username}` : '@creator',
            category: (v.category || 'drama').toLowerCase(),
            views: v.views_count ? `${v.views_count.toLocaleString()}` : `${(1.2 + (index % 5) * 0.4).toFixed(1)}M`,
            duration: v.duration_seconds ? `${Math.floor(v.duration_seconds / 60)}m ${Math.round(v.duration_seconds % 60)}s` : '1m 30s',
            thumbnail: v.thumbnail_url || SAMPLE_REELS[index % SAMPLE_REELS.length].thumbnail,
            videoUrl: v.video_url || SAMPLE_REELS[index % SAMPLE_REELS.length].videoUrl,
            badge: index === 0 ? 'Trending #1' : index === 1 ? 'Popular' : 'Featured',
            accentColor: index % 2 === 0 ? '#9333EA' : '#A855F7',
          }));
          setReels(mapped);
        }
      } catch {
        // use fallback sample reels
      }
    }
    fetchReels();
  }, []);

  // Filter reels
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
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
            <span className="text-white text-base font-black">✦</span>
          </div>
          <span className={`font-black text-sm tracking-widest uppercase transition-colors ${
            isLight ? 'text-slate-900 group-hover:text-purple-600' : 'text-white group-hover:text-purple-300'
          }`}>
            POLARIS <span className="font-light opacity-70">DESIGN CO.</span>
          </span>
        </Link>

        {/* Center Pill Menu */}
        <nav
          className={`hidden lg:flex items-center gap-1 px-4 py-1.5 rounded-full border shadow-lg backdrop-blur-xl transition-all ${
            isLight
              ? 'bg-white/85 border-slate-200/90 text-slate-700 shadow-slate-200/60'
              : 'bg-[#150B2D]/85 border-white/10 text-white/80 shadow-black/40'
          }`}
        >
          {[
            { id: 'hero', label: 'Home' },
            { id: 'about', label: 'About Us' },
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
          <Link
            href="/admin"
            className={`px-3.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
              isLight
                ? 'text-purple-700 hover:bg-purple-50'
                : 'text-purple-300 hover:bg-purple-900/40'
            }`}
          >
            Admin
          </Link>
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
              <button
                onClick={() => {
                  if (reels.length > 0) setActiveVideoModal(reels[0]);
                }}
                className="px-7 py-3 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-xl shadow-purple-600/40 hover:shadow-purple-600/60 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-current" />
                </div>
                <span>{siteText.hero?.ctaPrimary || 'Get A Free Consultation'}</span>
              </button>

              <button
                onClick={() => scrollToSection('services', 'Services')}
                className={`px-7 py-3 rounded-full text-xs sm:text-sm font-bold tracking-wide uppercase border backdrop-blur-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50 shadow-sm'
                    : 'bg-[#150B2D]/70 border-white/20 text-white hover:bg-white/10'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>{siteText.hero?.ctaSecondary || 'View Our Work'}</span>
              </button>
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
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white text-base font-black shadow-lg shadow-purple-600/30">
                  ✦
                </div>
                <span className={`font-black text-sm tracking-widest uppercase ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  POLARIS DESIGN CO.
                </span>
              </div>

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
                  <button onClick={() => scrollToSection('hero', 'Home')} className="hover:text-purple-500 cursor-pointer">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('about', 'About Us')} className="hover:text-purple-500 cursor-pointer">
                    About Us
                  </button>
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

            {/* Right: Contact & Admin */}
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

              <div className="pt-2">
                <Link
                  href="/admin"
                  className={`inline-block px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                      : 'bg-purple-950/50 border-purple-500/30 text-purple-300 hover:bg-purple-900/50'
                  }`}
                >
                  Admin CMS Portal →
                </Link>
              </div>
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
