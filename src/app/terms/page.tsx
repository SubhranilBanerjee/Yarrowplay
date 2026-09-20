'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, FileText, CheckCircle2, AlertTriangle, Scale, Lock, RefreshCw } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-white">
      {/* Back button */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-muted)] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Yarrowplay</span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-10 pb-8 border-b border-[var(--glass-border)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-purple-bright)]/10 border border-[var(--color-purple-bright)]/30 text-[var(--color-pink-light)] text-xs font-bold uppercase tracking-wider mb-4">
          <Scale className="w-3.5 h-3.5" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
          Terms of Use
        </h1>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Effective Date: January 1, 2026 · Last Updated: September 2026
        </p>
      </div>

      {/* Content */}
      <div className="space-y-10 text-sm leading-relaxed text-[var(--text-secondary)]">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[var(--color-pink)]">1.</span> Acceptance of Terms
          </h2>
          <p>
            Welcome to Yarrowplay (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). By accessing, registering for, or using our multi-format entertainment platform, including video streaming, audio playback, creator blogs, and advertising portals, you agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree to these terms, you may not register or access the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[var(--color-pink)]">2.</span> User Accounts &amp; Roles
          </h2>
          <p>
            Yarrowplay offers multiple user tiers including Viewers, Creators, and Advertisers:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 marker:text-[var(--color-pink)]">
            <li><strong className="text-white">Account Security:</strong> You are responsible for safeguarding your login credentials and for all activities that occur under your account.</li>
            <li><strong className="text-white">Viewer Accounts:</strong> Intended for personal, non-commercial entertainment and community engagement.</li>
            <li><strong className="text-white">Creator Accounts:</strong> Granted publishing permissions for episodic video series, audio tracks, and written blogs in compliance with community standards.</li>
            <li><strong className="text-white">Advertiser Accounts:</strong> Authorized to upload vetted promotional campaigns and track verified impressions and engagements.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[var(--color-pink)]">3.</span> Intellectual Property &amp; Content Licensing
          </h2>
          <p>
            Creators retain ownership of their original audio, video, and editorial content. By publishing on Yarrowplay, creators grant Yarrowplay a non-exclusive, worldwide, royalty-free license to stream, host, index, cache, and display the content across web and mobile surfaces.
          </p>
          <p>
            Users may not download, scrape, reverse-engineer, redistribute, or circumvent digital rights management (DRM) or stream encryption implemented on the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[var(--color-pink)]">4.</span> Acceptable Use &amp; Community Rules
          </h2>
          <p>When participating on Yarrowplay, you agree not to:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              'Upload copyrighted media without proper licensing or authorization',
              'Publish hate speech, violent extremist material, or harmful disinformation',
              'Attempt denial-of-service or tamper with platform API endpoints',
              'Artificially inflate views, audio streams, or advertising click-throughs',
            ].map((rule, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-[var(--glass-surface)] border border-[var(--glass-border)] text-xs text-white/90 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--color-pink)] shrink-0 mt-0.5" />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[var(--color-pink)]">5.</span> Advertisements &amp; Sponsored Content
          </h2>
          <p>
            Yarrowplay features transparent, designated promotional materials and partner sponsorships clearly identified with &ldquo;Sponsored&rdquo; or &ldquo;Promoted&rdquo; tags. We do not endorse third-party products advertised on the platform, and user interaction with external advertiser links is governed by third-party terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[var(--color-pink)]">6.</span> Account Termination &amp; Suspension
          </h2>
          <p>
            We reserve the right to suspend, restrict, or terminate any account found in violation of these Terms of Use or engaged in fraudulent streaming activities without prior notice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[var(--color-pink)]">7.</span> Disclaimers &amp; Limitation of Liability
          </h2>
          <p>
            The platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. Yarrowplay disclaims all warranties of any kind, whether express or implied, including uninterrupted playback, latency-free audio streaming, or continuous platform availability.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-[var(--color-pink)]">8.</span> Contact Information
          </h2>
          <p>
            For legal inquiries, copyright notices, or questions regarding these Terms, please contact our compliance department at <span className="text-[var(--color-pink-light)] font-mono">legal@yarrowplay.stream</span>.
          </p>
        </section>
      </div>

      {/* Footer Return */}
      <div className="mt-14 pt-8 border-t border-[var(--glass-border)] flex items-center justify-between">
        <Link
          href="/register"
          className="text-xs font-semibold text-[var(--color-pink)] hover:underline"
        >
          Return to Sign Up
        </Link>
        <Link
          href="/privacy"
          className="text-xs text-[var(--text-muted)] hover:text-white transition-colors"
        >
          View Privacy Policy →
        </Link>
      </div>
    </div>
  );
}
