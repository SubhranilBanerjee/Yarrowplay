'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Lock, Eye, Database, Globe, Bell, CheckCircle2 } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-[var(--lr-text-primary)]">
      {/* Back button */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--lr-text-muted)] hover:text-[var(--lr-gold)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lighthouse Reels</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10 pb-8 border-b border-[var(--lr-border-primary)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--lr-gold)]/10 border border-[var(--lr-gold)]/30 text-[var(--lr-gold)] text-xs font-bold uppercase tracking-wider mb-4">
          <Shield className="w-3.5 h-3.5" />
          <span>Data Protection &amp; Security</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--lr-text-primary)] mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--lr-text-secondary)] leading-relaxed">
          Effective Date: January 1, 2026 · Last Updated: September 2026
        </p>
      </div>

      {/* Content */}
      <div className="space-y-10 text-sm leading-relaxed text-[var(--lr-text-secondary)]">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[var(--lr-text-primary)] flex items-center gap-2">
            <span className="text-[var(--lr-gold)]">1.</span> Information We Collect
          </h2>
          <p>
            Lighthouse Reels values your privacy. We collect only the information necessary to provide you with high-performance video, audio, and editorial streaming experiences:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-[var(--lr-bg-surface)] border border-[var(--lr-border-primary)] shadow-sm">
              <div className="flex items-center gap-2 text-[var(--lr-text-primary)] font-semibold text-xs mb-1.5">
                <Database className="w-4 h-4 text-[var(--lr-gold)]" />
                Account Credentials
              </div>
              <p className="text-xs text-[var(--lr-text-secondary)]">
                Email address, username, display name, avatar, bio, and role designation (viewer, creator, or advertiser).
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--lr-bg-surface)] border border-[var(--lr-border-primary)] shadow-sm">
              <div className="flex items-center gap-2 text-[var(--lr-text-primary)] font-semibold text-xs mb-1.5">
                <Eye className="w-4 h-4 text-[var(--lr-gold)]" />
                Playback &amp; Interaction Data
              </div>
              <p className="text-xs text-[var(--lr-text-secondary)]">
                Watch history, playback resume markers, favorites, audio playlist queues, comments, and reaction signals.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[var(--lr-text-primary)] flex items-center gap-2">
            <span className="text-[var(--lr-gold)]">2.</span> How We Use Your Data
          </h2>
          <p>We process your data for the following essential platform purposes:</p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-[var(--lr-gold)]">
            <li>To power seamless video and lossless audio streaming with personalized resume states.</li>
            <li>To compile creator analytics (view counts, aggregate engagement, retention benchmarks).</li>
            <li>To verify sponsored campaign impressions and deliver aggregated, non-personally identifiable metrics to verified advertisers.</li>
            <li>To maintain security, prevent automated bot abuse, and enforce community safety.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[var(--lr-text-primary)] flex items-center gap-2">
            <span className="text-[var(--lr-gold)]">3.</span> Cloudinary &amp; Third-Party Services
          </h2>
          <p>
            Our high-definition video and lossless audio media assets are ingested, optimized, and streamed using Cloudinary edge CDNs. Supabase provides authentication and encrypted database infrastructure. Your credentials and auth tokens are handled using industry-standard cryptography.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[var(--lr-text-primary)] flex items-center gap-2">
            <span className="text-[var(--lr-gold)]">4.</span> Cookies &amp; Local Storage
          </h2>
          <p>
            We use secure browser cookies and local storage to keep you logged in, remember your volume preference and audio player state, and save offline or pending playlists. We do not sell your personal data to third-party data brokers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[var(--lr-text-primary)] flex items-center gap-2">
            <span className="text-[var(--lr-gold)]">5.</span> Your Rights &amp; Data Deletion
          </h2>
          <p>
            You retain complete control over your personal data. You may update your profile, export your history, or request full account and media deletion at any time via your profile settings or by contacting <span className="text-[var(--lr-gold)] font-mono">privacy@lighthousereels.stream</span>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[var(--lr-text-primary)] flex items-center gap-2">
            <span className="text-[var(--lr-gold)]">6.</span> Policy Updates
          </h2>
          <p>
            We may periodically update this Privacy Policy to reflect platform features, legal requirements, or infrastructure upgrades. Notice of material updates will be provided directly through your in-app notifications.
          </p>
        </section>
      </div>

      {/* Footer Return */}
      <div className="mt-14 pt-8 border-t border-[var(--lr-border-primary)] flex items-center justify-between">
        <Link
          href="/register"
          className="text-xs font-semibold text-[var(--lr-gold)] hover:underline"
        >
          Return to Sign Up
        </Link>
        <Link
          href="/terms"
          className="text-xs text-[var(--lr-text-muted)] hover:text-[var(--lr-text-primary)] transition-colors"
        >
          View Terms of Use →
        </Link>
      </div>
    </div>
  );
}
