'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Play,
  Sparkles,
  ArrowRight,
  Tv,
  Film,
  Music,
  FileText,
  Shield,
  Zap,
  Globe,
  Star,
  Users,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { BrandLogo } from '@/components/landing/BrandLogo';

export function LandingHeroView() {
  const [activeTab, setActiveTab] = useState<'series' | 'reels' | 'audio' | 'blogs'>('series');

  return (
    <div className="min-h-screen bg-[#07050E] text-[#F5F1E8] overflow-hidden font-sans selection:bg-purple-600 selection:text-white">
      {/* Dynamic Purple Ambient Glow Background matching Image 2 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Main top right spotlight glow from Image 2 */}
        <div className="absolute -top-[20%] -right-[10%] w-[80vw] h-[80vw] max-w-[1000px] max-h-[1000px] rounded-full bg-radial from-[#8B5CF6]/35 via-[#6D28D9]/15 to-transparent blur-3xl opacity-80" />
        {/* Bottom left ambient purple glow */}
        <div className="absolute -bottom-[20%] -left-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-radial from-[#581C87]/25 via-[#3B0764]/10 to-transparent blur-3xl opacity-60" />
        {/* Subtle noise grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navigation Bar */}
      <header className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <BrandLogo href="/" size="md" priority />
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wider uppercase text-[#B7BEC6]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#series" className="hover:text-white transition-colors">Mini-Series</a>
            <a href="#creators" className="hover:text-white transition-colors">Creators</a>
            <a href="#pricing" className="hover:text-white transition-colors">VIP Passes</a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-[#B7BEC6] hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-900 hover:from-purple-500 hover:to-indigo-800 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-900/40 hover:shadow-purple-600/50 transition-all cursor-pointer active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* HERO SECTION matching Image 1 & 2 layout */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16 pb-20 sm:pb-32">
        {/* HUGE SEMI-TRANSPARENT BACKGROUND TYPOGRAPHY "LIGHTHOUSE REELS" (like "Flow 3.0" in Image 1) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0 overflow-hidden">
          <h1 className="text-[14vw] sm:text-[13vw] font-black tracking-tighter text-white/[0.04] leading-none uppercase whitespace-nowrap">
            LIGHTHOUSE REELS
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Headlines, Eyebrow, Subtitle & Buttons */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-center lg:text-left">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>THE NEXT-GEN ENTERTAINMENT UNIVERSE</span>
            </div>

            {/* Main Foreground Title "Lighthouse Reels" (in White, like Image 1) */}
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Meet <span className="text-white drop-shadow-[0_0_25px_rgba(168,85,247,0.5)]">Lighthouse Reels</span>
              </h2>
              <p className="text-xl sm:text-2xl font-semibold text-purple-200/90">
                Cinematic Short Dramas & Premium Reels
              </p>
            </div>

            {/* Description Subtitle */}
            <p className="text-sm sm:text-base text-[#B7BEC6] max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Instead of long draggy episodes, we rebuilt entertainment around fast-paced cliffhangers, high-definition mini-series, lossless music tracks, and creator stories.
            </p>

            {/* Action Buttons with Purple Gradient matching Image 2 */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/home"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-900 hover:from-purple-500 hover:to-indigo-800 text-white font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-xl shadow-purple-900/50 hover:shadow-purple-600/60 active:scale-95 flex items-center justify-center gap-3 group cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white text-white group-hover:scale-110 transition-transform" />
                <span>Explore What&apos;s New</span>
              </Link>

              <Link
                href="/register?role=creator"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#141224] hover:bg-[#1C1833] border border-purple-500/30 text-white font-bold text-sm sm:text-base transition-all hover:border-purple-400 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Join as Creator</span>
                <ChevronRight className="w-4 h-4 text-purple-400" />
              </Link>
            </div>

            {/* Highlights / Trust metrics under buttons */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-[#9AA7B4]">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span>No Ads with VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span>HD 4K Streaming</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-400" />
                <span>Instant Unlocks</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Graphic Showcase with Lighthouse Image */}
          <div className="lg:col-span-6 relative flex justify-center">
            {/* Outer Glow Halo behind centerpiece */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/40 via-indigo-600/30 to-purple-900/20 rounded-3xl blur-2xl transform rotate-3 scale-95 opacity-70" />

            {/* Centerpiece Image Frame (Lighthouse Showcase) */}
            <div className="relative w-full max-w-lg bg-[#0F0C1E] border border-purple-500/40 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(88,28,135,0.5)] group">
              {/* Glass Header Bar */}
              <div className="px-4 py-3 bg-[#16122C]/80 backdrop-blur-md border-b border-purple-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500/40" />
                  <div className="w-3 h-3 rounded-full bg-purple-500/20" />
                  <div className="w-3 h-3 rounded-full bg-purple-500/10" />
                </div>
                <div className="text-[11px] font-bold text-purple-200 tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-purple-400" /> Lighthouse Reels 3.0
                </div>
              </div>

              {/* Lighthouse Image Display */}
              <div className="relative aspect-[16/10] w-full bg-[#090714] overflow-hidden">
                <Image
                  src="/images/lighthouse_hero.jpg"
                  alt="Lighthouse Reels Hero Beacon"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Overlaid Gradient Shine */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0C1E] via-transparent to-transparent opacity-80" />

                {/* Floating Play Icon Badge over Lighthouse */}
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-[#14102B]/85 backdrop-blur-md border border-purple-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/50">
                      <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Lighthouse Originals</p>
                      <p className="text-[10px] text-purple-300">Stream 10,000+ Exclusive Mini-Reels</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    LIVE NOW
                  </span>
                </div>
              </div>

              {/* Right Side Floating Metric Card (matching 522k in Image 1) */}
              <div className="p-4 bg-[#141029] border-t border-purple-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-7 h-7 rounded-full bg-purple-600 border-2 border-[#141029] flex items-center justify-center text-[10px] font-bold text-white">
                      AL
                    </div>
                    <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-[#141029] flex items-center justify-center text-[10px] font-bold text-white">
                      SK
                    </div>
                    <div className="w-7 h-7 rounded-full bg-purple-800 border-2 border-[#141029] flex items-center justify-center text-[10px] font-bold text-white">
                      VR
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-black text-white leading-none">522k+</p>
                    <p className="text-[11px] text-purple-300 mt-0.5">Active Viewers & Creators</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="text-xs font-bold text-white">4.9/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE HIGHLIGHTS GRID */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-purple-900/30">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Designed for Instant Bingeing
          </h2>
          <p className="text-sm sm:text-base text-[#B7BEC6] mt-3">
            Every feature on Lighthouse Reels is tailored for seamless, ultra-fast streaming across mobile and web.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0F0C1E]/80 border border-purple-500/20 hover:border-purple-500/50 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Serialized Mini-Dramas</h3>
            <p className="text-xs text-[#B7BEC6] leading-relaxed">
              Bite-sized 1 to 2 minute vertical episodes packed with high tension, romance, and plot twists.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0F0C1E]/80 border border-purple-500/20 hover:border-purple-500/50 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Lossless Audio Tracks</h3>
            <p className="text-xs text-[#B7BEC6] leading-relaxed">
              Listen to original soundtracks, ambient audio, and creator playlists in high-fidelity sound.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0F0C1E]/80 border border-purple-500/20 hover:border-purple-500/50 transition-all hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instant Coin & VIP Unlocks</h3>
            <p className="text-xs text-[#B7BEC6] leading-relaxed">
              Unlock your favorite series seamlessly using daily streak rewards, coin passes, or VIP access.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-purple-900/30 py-10 text-center text-xs text-[#7F8993]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLogo href="/" size="sm" />
          <p>© {new Date().getFullYear()} Lighthouse Reels. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
