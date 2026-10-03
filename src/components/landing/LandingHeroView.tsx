'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { BrandLogo } from '@/components/landing/BrandLogo';

export function LandingHeroView() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('Home');
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [cardDismissed, setCardDismissed] = useState(false);

  return (
    <div className="min-h-screen bg-[#06030F] text-[#F5F1E8] overflow-x-hidden font-sans relative selection:bg-purple-600 selection:text-white pb-16">
      {/* Dynamic Cosmic Background with Twinkling Stars & Aurora Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Deep starry space gradient */}
        <div className="absolute inset-0 bg-radial from-[#150A33] via-[#080417] to-[#040209]" />

        {/* Top-Right Purple Aurora Glow */}
        <div className="absolute -top-20 -right-20 w-[90vw] sm:w-[700px] h-[700px] rounded-full bg-radial from-[#9333EA]/30 via-[#6B21A8]/15 to-transparent blur-3xl opacity-80 animate-pulse duration-[8000ms]" />

        {/* Bottom-Left Violet Ambient Spotlight */}
        <div className="absolute -bottom-30 -left-20 w-[80vw] sm:w-[600px] h-[600px] rounded-full bg-radial from-[#7E22CE]/25 via-[#4C1D95]/10 to-transparent blur-3xl opacity-70" />

        {/* Sparkle background dots */}
        <div
          className="absolute inset-0 opacity-40 bg-repeat"
          style={{
            backgroundImage: `radial-gradient(1.5px 1.5px at 20px 30px, #ffffff, rgba(0,0,0,0)), 
                              radial-gradient(1px 1px at 80px 120px, #e9d5ff, rgba(0,0,0,0)), 
                              radial-gradient(2px 2px at 150px 70px, #c084fc, rgba(0,0,0,0)), 
                              radial-gradient(1.5px 1.5px at 240px 200px, #ffffff, rgba(0,0,0,0)),
                              radial-gradient(1px 1px at 320px 110px, #e9d5ff, rgba(0,0,0,0))`,
            backgroundSize: '350px 350px',
          }}
        />
      </div>

      {/* Main Outer Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        {/* HERO CARD FRAME (Matching exact design in image) */}
        {!cardDismissed ? (
          <div className="relative rounded-[28px] sm:rounded-[36px] bg-[#0E0824]/85 backdrop-blur-2xl border border-purple-500/30 p-4 sm:p-8 lg:p-10 shadow-[0_0_90px_rgba(147,51,234,0.22)] transition-all duration-500">
            {/* Window Top Controls (Left X and Right ...) */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <button
                onClick={() => setCardDismissed(false)}
                title="Card View Option"
                className="w-9 h-9 rounded-2xl bg-[#231545]/70 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-inner active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              <button
                onClick={() => alert('Lighthouse Reels Options')}
                title="More Options"
                className="w-9 h-9 rounded-2xl bg-[#231545]/70 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-inner active:scale-95"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Inner Header / Nav Bar inside Card */}
            <nav className="flex flex-col md:flex-row items-center justify-between gap-4 pb-8 sm:pb-12 border-b border-purple-500/15">
              {/* Brand Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-600/40 flex items-center justify-center">
                  <div className="w-full h-full rounded-[14px] bg-[#0E0824] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  LightHouse <span className="text-purple-300">Reels</span>
                </span>
              </div>

              {/* Navigation Links */}
              <div className="flex items-center gap-4 sm:gap-7 text-xs sm:text-sm font-semibold tracking-wide text-purple-200/70 overflow-x-auto max-w-full py-1">
                {['Home', 'Explore', 'Trending', 'Categories', 'About', 'Blog'].map((item) => {
                  const isActive = activeNav === item;
                  return (
                    <button
                      key={item}
                      onClick={() => setActiveNav(item)}
                      className={`relative py-1 transition-colors cursor-pointer whitespace-nowrap ${
                        isActive ? 'text-white font-bold' : 'hover:text-white'
                      }`}
                    >
                      {item}
                      {isActive && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-400 to-pink-500 rounded-full shadow-[0_0_8px_#c084fc]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Right CTA Button "Join Now ->" */}
              <Link
                href="/register"
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/40 hover:shadow-pink-500/50 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                <span>Join Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </nav>

            {/* HERO CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center pt-8 sm:pt-12">
              {/* Left Column: Headlines, Eyebrow & Buttons */}
              <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-center lg:text-left">
                {/* Eyebrow Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/60 border border-purple-400/30 text-purple-200 text-xs font-semibold shadow-inner">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Dive into Short Reels</span>
                </div>

                {/* Main Headline */}
                <div className="space-y-1">
                  <h1 className="text-4xl sm:text-6xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight">
                    Watch. Discover.
                  </h1>
                  <h1 className="text-4xl sm:text-6xl lg:text-6xl font-black text-purple-300 leading-[1.08] tracking-tight">
                    Shine.
                  </h1>
                </div>

                {/* Subtitle */}
                <p className="text-purple-200/80 text-sm sm:text-base lg:text-lg max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
                  Dive into bite-sized stories that light up your world.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    href="/home"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-xl shadow-purple-600/40 hover:shadow-purple-500/60 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <span>Start Watching</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => setShowTrailerModal(true)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#1A113B]/70 hover:bg-purple-900/40 border border-purple-500/40 text-white font-semibold text-sm transition-all hover:border-purple-300 flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
                  >
                    <div className="w-5 h-5 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center">
                      <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                    </div>
                    <span>Watch Trailer</span>
                  </button>
                </div>

                {/* Feature Pills / Badges (Row of 3 cards matching picture) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                  {/* Badge 1 */}
                  <div className="p-3.5 rounded-2xl bg-[#180E38]/70 border border-purple-500/25 hover:border-purple-400/40 transition-all flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-snug">Creator Friendly</p>
                      <p className="text-[10px] text-purple-300/80">Empowering Creators</p>
                    </div>
                  </div>

                  {/* Badge 2 */}
                  <div className="p-3.5 rounded-2xl bg-[#180E38]/70 border border-purple-500/25 hover:border-purple-400/40 transition-all flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                      <Zap className="w-4 h-4 text-purple-300" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-snug">Fast & Trending</p>
                      <p className="text-[10px] text-purple-300/80">Fresh Content Daily</p>
                    </div>
                  </div>

                  {/* Badge 3 */}
                  <div className="p-3.5 rounded-2xl bg-[#180E38]/70 border border-purple-500/25 hover:border-purple-400/40 transition-all flex items-center gap-3 text-left">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-snug">Safe & Curated</p>
                      <p className="text-[10px] text-purple-300/80">Family-Friendly</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: 3D Lighthouse Artwork Graphic */}
              <div className="lg:col-span-6 relative flex justify-center items-center">
                {/* Glow aura behind Lighthouse */}
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 via-pink-600/20 to-purple-900/40 rounded-3xl blur-2xl transform scale-95" />

                {/* 3D Render Lighthouse Artwork Card */}
                <div className="relative w-full max-w-lg rounded-3xl overflow-hidden border border-purple-500/40 shadow-[0_20px_60px_rgba(147,51,234,0.4)] group">
                  <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full bg-[#0C0620]">
                    <Image
                      src="/images/lighthouse_hero_3d.jpg"
                      alt="LightHouse Reels 3D Beacon"
                      fill
                      priority
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />

                    {/* Gradient Overlay for seamless blending */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E0824] via-transparent to-transparent opacity-60" />
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM STATS BAR (Spanning horizontally across bottom of card) */}
            <div className="mt-10 sm:mt-12 p-4 sm:p-5 rounded-2xl bg-[#130B30]/80 backdrop-blur-md border border-purple-500/30 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-center">
              {/* Stat 1 */}
              <div className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <Users className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black text-white leading-tight">10K+ Creators</p>
                  <p className="text-xs text-purple-300/80">Active Creators</p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <Film className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black text-white leading-tight">100K+ Reels</p>
                  <p className="text-xs text-purple-300/80">Short Videos</p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <Eye className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-black text-white leading-tight">50M+ Views</p>
                  <p className="text-xs text-purple-300/80">Monthly Views</p>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="flex items-center gap-3 p-2">
                <div className="w-10 h-10 rounded-xl bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base sm:text-lg font-black text-white leading-tight">4.9</p>
                    <span className="text-xs text-purple-300/80">User Rating</span>
                  </div>
                  <div className="flex items-center text-amber-400 text-xs mt-0.5">
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
      </div>

      {/* TRAILER PREVIEW MODAL */}
      {showTrailerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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
                src="/images/lighthouse_hero_3d.jpg"
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
