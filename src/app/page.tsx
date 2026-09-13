'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { MediaCard } from '@/components/media/MediaCard';
import { AdvertiserCampaign } from '@/types/database';
import {
  Film,
  Music,
  BookOpen,
  Megaphone,
  Sparkles,
  ArrowRight,
  Tv,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const [sponsoredCampaigns, setSponsoredCampaigns] = useState<AdvertiserCampaign[]>([]);

  useEffect(() => {
    async function loadSponsoredContent() {
      try {
        const { data } = await supabase
          .from('advertiser_campaigns')
          .select('*, advertiser:profiles(*)')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        const nowMs = Date.now();
        const valid = (data || []).filter((c: any) => {
          if (c.end_date && new Date(c.end_date).getTime() < nowMs) return false;
          return true;
        });

        setSponsoredCampaigns(valid as AdvertiserCampaign[]);
      } catch {
        // ignore
      }
    }
    loadSponsoredContent();
  }, []);

  return (
    <div className="w-full">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Subtle Brand Ambient Glow */}
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
            <Link
              href="/home"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white font-semibold text-base transition-all shadow-lg active:scale-95"
            >
              <span>Go to Content Feed</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white font-semibold text-base transition-all shadow-lg active:scale-95"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#333336] hover:bg-[#3A3A3E] border border-[#454549] text-white font-semibold text-base transition-all"
              >
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
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#333336]/60 border border-[#454549] text-left hover:border-[#FF0080]/50 transition-colors"
            >
              <item.icon className="w-6 h-6 text-[#FF0080] mb-2" />
              <h3 className="text-sm font-semibold text-white">{item.label}</h3>
              <p className="text-xs text-[#85858B] mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTENT FORMATS SHOWCASE */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#454549]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Built For Seamless Multi-Format Discovery
          </h2>
          <p className="text-sm text-[#85858B] mt-2">
            No need to jump between five different apps. Enjoy video, music, and written content side-by-side.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Video */}
          <div className="bg-[#333336] border border-[#454549] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FF0080]/15 text-[#FF0080] flex items-center justify-center mb-4">
                <Film className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Episodic Series & Videos</h3>
              <p className="text-sm text-[#B8B8BD] leading-relaxed">
                Enjoy mini-series and movies with gesture controls, playback speed controls, and auto-rotation on mobile devices.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#454549]">
              <span className="text-xs font-semibold text-[#FF0080] flex items-center gap-1">
                Cloudinary Powered Streaming <Zap className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 2: Audio */}
          <div className="bg-[#333336] border border-[#454549] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FF0080]/15 text-[#FF0080] flex items-center justify-center mb-4">
                <Music className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Music & Audio Experience</h3>
              <p className="text-sm text-[#B8B8BD] leading-relaxed">
                Spotify-inspired persistent player with background playback, synchronized lyrics, queue management, and album collections.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#454549]">
              <span className="text-xs font-semibold text-[#FF0080] flex items-center gap-1">
                Persistent Audio Engine <Zap className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 3: Blogs */}
          <div className="bg-[#333336] border border-[#454549] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-[#FF0080]/15 text-[#FF0080] flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Community Blogs & Stories</h3>
              <p className="text-sm text-[#B8B8BD] leading-relaxed">
                Read creator essays, production notes, track commentaries, and articles with instant reactions and discussion threads.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#454549]">
              <span className="text-xs font-semibold text-[#FF0080] flex items-center gap-1">
                Open Publishing for Creators <Zap className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED SPONSORED CONTENT */}
      {sponsoredCampaigns.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#454549]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF0080]/15 text-[#FF0080] text-xs font-bold uppercase tracking-wider mb-2 border border-[#FF0080]/30">
                <Megaphone className="w-3.5 h-3.5" />
                Sponsored Content
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Partner Spotlight</h2>
              <p className="text-sm text-[#85858B] mt-1">
                Featured stories, products, and announcements from verified Yarrowplay partners.
              </p>
            </div>
            <Link
              href="/advertiser"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF0080] hover:text-white transition-colors self-start sm:self-center"
            >
              <span>Promote with Us</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sponsoredCampaigns.map((c) => (
              <MediaCard key={c.id} item={{ ...c, type: 'ad' }} />
            ))}
          </div>
        </section>
      )}

      {/* CREATOR & ADVERTISER DUAL SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#454549]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Creator Studio Card */}
          <div className="bg-[#333336] border border-[#454549] rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF0080]/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF0080]/15 text-[#FF0080] text-xs font-bold uppercase mb-4">
                <Film className="w-3.5 h-3.5" />
                For Content Creators
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Creator Studio & Deep Analytics
              </h3>
              <p className="text-sm text-[#B8B8BD] leading-relaxed mb-6">
                Upload entire series with multi-episode forms or release audio albums in minutes. Track views, watch duration, audience retention, likes, shares, and earnings from verified event data.
              </p>
              <ul className="space-y-2.5 text-xs text-[#B8B8BD]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  Multi-episode series batch upload pipeline
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  Direct-to-cloud Cloudinary ingestion (Yarrowplay preset)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  Video boosting controls for increased reach
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF0080] hover:text-white transition-colors"
              >
                <span>Join as Content Creator</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Advertiser Studio Card */}
          <div className="bg-[#333336] border border-[#454549] rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/15 text-purple-400 text-xs font-bold uppercase mb-4">
                <Megaphone className="w-3.5 h-3.5" />
                For Brands & Advertisers
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Transparent Sponsored Content
              </h3>
              <p className="text-sm text-[#B8B8BD] leading-relaxed mb-6">
                Launch targeted media campaigns that blend cleanly into the feed with prominent, honest <span className="text-[#FF0080] font-semibold">Sponsored</span> tags. Zero disguised clickbait.
              </p>
              <ul className="space-y-2.5 text-xs text-[#B8B8BD]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  Upload custom creatives (Images & Videos)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  Real-time impression and verified click tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                  Dedicated Advertiser Studio dashboard
                </li>
              </ul>
            </div>

            <div className="mt-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF0080] hover:text-white transition-colors"
              >
                <span>Launch an Advertiser Campaign</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-20 px-4 max-w-4xl mx-auto text-center border-t border-[#454549]">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <Image
            src="/logo.png"
            alt="Yarrowplay"
            fill
            sizes="64px"
            className="object-contain"
          />
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-4">
          Start Streaming and Publishing Today
        </h2>
        <p className="text-sm text-[#B8B8BD] max-w-md mx-auto mb-8">
          Join thousands of viewers and creators on the modern media platform.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white font-bold text-base transition-all shadow-xl active:scale-95"
        >
          <span>Create Your Free Account</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}
