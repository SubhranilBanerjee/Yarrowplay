'use client';

import React from 'react';
import Link from 'next/link';
import {
  Download,
  Smartphone,
  Apple,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  QrCode,
  ShieldCheck,
  Zap,
  Bell,
  Play,
  Share2,
} from 'lucide-react';
import BrandLogo from '@/components/landing/BrandLogo';
import { APP_DOWNLOAD_CONFIG } from '@/config/downloadLinks';

export default function DownloadAppPage() {
  return (
    <div className="min-h-screen bg-[var(--lr-bg)] text-[var(--lr-text-primary)] py-12 px-4 sm:px-6 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="flex justify-center mb-4">
            <BrandLogo size="lg" priority />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECC979]/15 border border-[#ECC979]/30 text-[#ECC979] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 fill-[#ECC979]" />
            <span>Official Mobile Experience</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Stream Lighthouse Everywhere
          </h1>

          <p className="text-sm sm:text-base text-[var(--lr-text-muted)] leading-relaxed">
            Get instant access to vertical drama reels, 2-minute original episodes, offline downloads, and creator
            exclusives on your phone or tablet.
          </p>
        </div>

        {/* Centralized Download Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {APP_DOWNLOAD_CONFIG.platforms.map((platform) => {
            const isAvailable = platform.status === 'available';

            return (
              <div
                key={platform.id}
                className="p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] hover:border-[#ECC979]/50 transition-all shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-[var(--lr-bg)] border border-[var(--lr-border)] flex items-center justify-center text-[#ECC979]">
                      {platform.platform === 'ios' ? (
                        <Apple className="w-6 h-6" />
                      ) : platform.platform === 'pwa' ? (
                        <Zap className="w-6 h-6" />
                      ) : (
                        <Smartphone className="w-6 h-6" />
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        isAvailable
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isAvailable ? 'Available Now' : 'In Beta / Coming Soon'}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold">{platform.name}</h2>
                    <p className="text-xs text-[var(--lr-text-muted)] mt-1">{platform.badge}</p>
                    <p className="text-[11px] text-[var(--lr-text-muted)] mt-0.5 font-mono">{platform.requirements}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--lr-border)] flex items-center justify-between">
                  <span className="text-xs font-mono text-[var(--lr-text-muted)]">{platform.version}</span>

                  {isAvailable && platform.downloadUrl ? (
                    <a
                      href={platform.downloadUrl}
                      target={platform.downloadUrl.startsWith('http') ? '_blank' : '_self'}
                      rel="noopener noreferrer"
                      className="btn-primary inline-flex items-center gap-2 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>{platform.platform === 'pwa' ? 'Launch Web App' : 'Download Now'}</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-2 bg-[var(--lr-bg)] border border-[var(--lr-border)] text-[var(--lr-text-muted)] text-xs font-semibold px-4 py-2 rounded-xl cursor-not-allowed"
                    >
                      <span>Pre-Register / In Review</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* QR Code Quick Scan & Features Showcase */}
        <div className="p-8 rounded-3xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[var(--lr-bg)] border border-[var(--lr-border)] text-center space-y-3">
            <div className="w-36 h-36 rounded-xl bg-white p-2.5 flex items-center justify-center shadow-md">
              {/* Clean decorative QR Code icon placeholder */}
              <QrCode className="w-full h-full text-[#101418]" />
            </div>
            <p className="text-xs font-semibold text-[var(--lr-text-primary)]">Scan to Open on Mobile</p>
            <p className="text-[10px] text-[var(--lr-text-muted)]">Point your camera to stream instantly</p>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xl font-bold">Why Download Lighthouse Reels?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#ECC979] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">2-Minute Episode Bites</h4>
                  <p className="text-[11px] text-[var(--lr-text-muted)] mt-0.5">
                    Fast-paced cinematic series designed for mobile viewing
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#ECC979] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">Offline Reel Playback</h4>
                  <p className="text-[11px] text-[var(--lr-text-muted)] mt-0.5">
                    Save episodes to watch anywhere without mobile data
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#ECC979] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">Creator Tipping & Streaks</h4>
                  <p className="text-[11px] text-[var(--lr-text-muted)] mt-0.5">
                    Direct coin gifting and daily reward streak check-ins
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#ECC979] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold">Instant Release Alerts</h4>
                  <p className="text-[11px] text-[var(--lr-text-muted)] mt-0.5">
                    Get notified when followed creators publish new episodes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center pt-4">
          <Link
            href="/home"
            className="text-xs text-[var(--lr-text-muted)] hover:text-[#ECC979] inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Return to Lighthouse Home</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
