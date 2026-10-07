'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Film,
  Users,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Compass,
  Zap,
  Globe,
  Award,
  HeartHandshake,
} from 'lucide-react';
import { BrandLogo } from '@/components/landing/BrandLogo';

import { EditableText, useSiteText } from '@/context/SiteTextContext';

export default function AboutUsPage() {
  const { t } = useSiteText();
  const stats = [
    { value: '50M+', label: 'Global Video Views', sub: 'Across 120+ countries' },
    { value: '12K+', label: 'Visionary Creators', sub: 'Independent directors & storytellers' },
    { value: '45K+', label: 'Episodic Reels', sub: 'Spanning 8+ cinematic genres' },
    { value: '98%', label: 'Viewer Retention', sub: 'Binge-worthy vertical drama' },
  ];

  const pillars = [
    {
      icon: Film,
      title: 'Vertical Cinema Revolution',
      description:
        'Crafted specifically for the vertical screen. High-production, tightly paced 1-to-2 minute episodes engineered for instant hook and non-stop momentum.',
      tag: 'Innovation',
    },
    {
      icon: Users,
      title: 'Creator-First Ecosystem',
      description:
        'We put filmmakers and creators at the helm. With 70% net revenue share on episode unlocks, direct fan tips, and real-time retention telemetry.',
      tag: 'Empowerment',
    },
    {
      icon: Zap,
      title: 'Micro-Payment Economy',
      description:
        'Fair monetization through coin packs, daily check-in rewards, and rewarded ads. Viewers enjoy friction-free access while creators get rewarded fairly.',
      tag: 'Fair Model',
    },
    {
      icon: Globe,
      title: 'Culturally Diverse Stories',
      description:
        'From high-stakes corporate thrillers to tender romance, pulse-pounding mystery, and fantastical realms—bringing authentic voices from every corner of the world.',
      tag: 'Universal Reach',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--lr-bg-primary,#090D12)] text-[var(--lr-text-primary,#F5F1E8)] selection:bg-[#ECC979] selection:text-black">
      {/* Top Navbar / Navigation Header */}
      <header className="sticky top-0 z-40 bg-[var(--lr-bg-header,#090D12)]/95 backdrop-blur-md border-b border-[var(--lr-border-primary,#182029)] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <BrandLogo href="/home" showText={true} />
        
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="px-4 py-2 rounded-full text-xs font-semibold text-[var(--lr-text-secondary,#9AA7B4)] hover:text-white hover:bg-[var(--lr-bg-elevated,#131920)] transition-all"
          >
            Home
          </Link>
          <Link
            href="/home"
            className="btn-primary flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs font-bold text-white shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <span>Explore</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 pb-16 px-4 sm:px-8 max-w-6xl mx-auto">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#ECC979]/15 via-purple-600/10 to-transparent blur-[120px] pointer-events-none -z-10" />

        <div className="text-center max-w-3xl mx-auto space-y-5">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ECC979]/10 border border-[#ECC979]/30 text-[#ECC979] text-xs font-bold uppercase tracking-wider shadow-sm">
            <Sparkles className="w-3.5 h-3.5 fill-[#ECC979]" />
            <EditableText
              id="about.badge"
              defaultText="About Lighthouse Reels"
              label="About Us Badge"
            />
          </div>

          {/* Headline */}
          <EditableText
            id="about.title"
            defaultText="The Future of Vertical Cinema"
            as="h1"
            className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[1.1] text-white"
            label="About Us Main Title"
          />

          {/* Subtitle */}
          <EditableText
            id="about.description"
            defaultText="Lighthouse Reels is a premier next-generation entertainment destination for bite-sized, high-octane episodic drama and viral vertical stories. We connect visionary directors, screenwriters, and actors directly with millions of passionate viewers worldwide."
            as="p"
            className="text-sm sm:text-base md:text-lg text-[var(--lr-text-secondary,#A0ACB9)] leading-relaxed"
            label="About Us Subtitle"
          />

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
            <Link
              href="/home"
              className="btn-primary flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg shadow-[#ECC979]/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Series</span>
            </Link>
            <Link
              href="/register?role=creator"
              className="btn-secondary flex items-center gap-2 px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-white transition-all"
            >
              <span>Join as Creator</span>
              <ArrowRight className="w-4 h-4 text-[#ECC979]" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bento Section */}
      <section className="py-10 px-4 sm:px-8 max-w-6xl mx-auto border-y border-[var(--lr-border-primary,#182029)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-[var(--lr-bg-surface,#11171E)] border border-[var(--lr-border-primary,#1E2732)] flex flex-col justify-between"
            >
              <span className="text-2xl sm:text-4xl font-black bg-gradient-to-r from-[#FFE599] to-[#ECC979] bg-clip-text text-transparent">
                {s.value}
              </span>
              <div className="mt-3">
                <h4 className="text-xs sm:text-sm font-bold text-[var(--lr-text-primary,#F5F1E8)]">
                  {s.label}
                </h4>
                <p className="text-[11px] text-[var(--lr-text-muted,#788694)] mt-0.5">
                  {s.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Who We Are & Mission */}
      <section className="py-16 md:py-24 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-6 space-y-5">
            <span className="text-xs font-bold uppercase tracking-widest text-[#ECC979]">
              Our Mission
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-[var(--lr-text-primary,#F5F1E8)] uppercase">
              Stories Engineered For The Modern Mind
            </h2>
            <p className="text-xs sm:text-sm md:text-[15px] text-[var(--lr-text-secondary,#A0ACB9)] leading-relaxed">
              We live in an era where attention is fleeting, yet the hunger for profound, emotionally gripping
              storytelling has never been stronger.
            </p>
            <p className="text-xs sm:text-sm md:text-[15px] text-[var(--lr-text-secondary,#A0ACB9)] leading-relaxed">
              Lighthouse Reels was created to bridge this divide. We treat short-form episodic narrative with the same
              cinematographic rigor, dramatic nuance, and musical fidelity as feature films. Every 90-second episode
              packs a deliberate punch, keeping viewers spellbound through every cliffhanger.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#ECC979]">
                <Award className="w-4 h-4" />
                <span>Cinematic Production</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#ECC979]">
                <HeartHandshake className="w-4 h-4" />
                <span>Fair Creator Model</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-6">
            <div className="relative rounded-3xl overflow-hidden border border-[#ECC979]/20 bg-gradient-to-br from-[#151D26] to-[#0D1217] p-6 sm:p-8 shadow-2xl">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#ECC979]/15 border border-[#ECC979]/30 flex items-center justify-center text-[#ECC979]">
                  <Film className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Why Vertical Storytelling?
                </h3>
                <p className="text-xs sm:text-sm text-[var(--lr-text-secondary,#95A3B1)] leading-relaxed">
                  Over 80% of digital video consumption happens on smartphones, held vertically. Yet traditional streaming
                  platforms continue to force horizontal framing onto vertical hands.
                </p>
                <p className="text-xs sm:text-sm text-[var(--lr-text-secondary,#95A3B1)] leading-relaxed">
                  Lighthouse Reels is natively framed for 9:16 vertical immersion. Intimate close-ups, explosive action sequences,
                  and razor-sharp pacing feel like they happen right in your palm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Pillars */}
      <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto border-t border-[var(--lr-border-primary,#182029)]">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#ECC979]">
            Built Different
          </span>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-[var(--lr-text-primary,#F5F1E8)]">
            Our Core Pillars
          </h2>
          <p className="text-xs sm:text-sm text-[var(--lr-text-secondary,#8E9BA8)]">
            How we are setting a new benchmark for short-form entertainment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-2xl bg-[var(--lr-bg-surface,#11171E)] border border-[var(--lr-border-primary,#1E2732)] hover:border-[#ECC979]/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#ECC979]/10 border border-[#ECC979]/20 flex items-center justify-center text-[#ECC979] group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[var(--lr-text-muted,#788694)]">
                    {p.tag}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#ECC979] transition-colors mb-2">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--lr-text-secondary,#8E9BA8)] leading-relaxed">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-16 px-4 sm:px-8 max-w-6xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 text-center bg-gradient-to-r from-purple-950/40 via-[#161D26] to-[#121820] border border-[#ECC979]/30 shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white">
              Ready To Experience The Next Era?
            </h2>
            <p className="text-xs sm:text-sm text-[var(--lr-text-secondary,#A0ACB9)] leading-relaxed">
              Explore thousands of captivating episodes right now, or join our creator program to broadcast your series to millions.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/home"
                className="btn-primary px-7 py-3 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg hover:scale-105 transition-all"
              >
                Explore Now
              </Link>
              <Link
                href="/register"
                className="px-7 py-3 rounded-full text-xs sm:text-sm font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-8 border-t border-[var(--lr-border-primary,#182029)] text-center text-xs text-[var(--lr-text-muted,#6A7885)]">
        <p>© 2026 Lighthouse Reels. All rights reserved.</p>
      </footer>
    </div>
  );
}
