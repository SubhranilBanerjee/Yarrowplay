'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  Users,
  Sparkles,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Film,
  Crown,
  Play,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminHubPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin =
    user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    user?.email === 'admin@dramabox.stream' ||
    profile?.role === 'admin';

  useEffect(() => {
    if (!user) return;
    async function fetchStats() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data.analytics);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, [user]);

  if (!isAdmin && !isLoading) {
    return (
      <div className="min-h-screen bg-[var(--lr-bg)] text-[var(--lr-text-primary)] flex items-center justify-center p-4">
        <div className="text-center max-w-md p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)]">
          <AlertTriangle className="w-12 h-12 text-[#ECC979] mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-1">Admin Access Required</h2>
          <p className="text-xs text-[var(--lr-text-muted)] mb-4">
            You must be signed in with an authorized administrator account to view this section.
          </p>
          <Link
            href="/home"
            className="btn-primary inline-flex items-center gap-2 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--lr-bg)] text-[var(--lr-text-primary)] py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#ECC979]/15 text-[#ECC979] flex items-center justify-center border border-[#ECC979]/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Admin Operations Center</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#ECC979] text-[#101418]">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-[var(--lr-text-muted)] mt-0.5">
                Centralized management for Lighthouse platform analytics, CRM, content curation, and policy enforcement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--lr-text-muted)]">Signed in as:</span>
            <span className="text-xs font-mono font-bold text-[var(--lr-text-primary)] bg-[var(--lr-bg)] px-3 py-1.5 rounded-lg border border-[var(--lr-border)]">
              {user?.email}
            </span>
          </div>
        </div>

        {/* Quick Platform Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
            <div className="flex items-center justify-between text-[var(--lr-text-muted)] mb-2">
              <span className="text-xs font-semibold">Total Users</span>
              <Users className="w-4 h-4 text-[#ECC979]" />
            </div>
            <p className="text-2xl font-bold font-mono">
              {isLoading ? '...' : analytics?.users?.total?.toLocaleString() || 0}
            </p>
            <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">
              +{analytics?.users?.newIn30d || 0} in last 30d
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
            <div className="flex items-center justify-between text-[var(--lr-text-muted)] mb-2">
              <span className="text-xs font-semibold">VIP Subscribers</span>
              <Crown className="w-4 h-4 text-[#F4C95D]" />
            </div>
            <p className="text-2xl font-bold font-mono">
              {isLoading ? '...' : analytics?.subscriptions?.totalActive?.toLocaleString() || 0}
            </p>
            <p className="text-[11px] text-emerald-400 mt-1 font-semibold">Active VIP members</p>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
            <div className="flex items-center justify-between text-[var(--lr-text-muted)] mb-2">
              <span className="text-xs font-semibold">Series Catalog</span>
              <Layers className="w-4 h-4 text-[#ECC979]" />
            </div>
            <p className="text-2xl font-bold font-mono">
              {isLoading ? '...' : analytics?.content?.series?.toLocaleString() || 0}
            </p>
            <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">
              {analytics?.content?.videos || 0} total episodes
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
            <div className="flex items-center justify-between text-[var(--lr-text-muted)] mb-2">
              <span className="text-xs font-semibold">Catalog Views</span>
              <Play className="w-4 h-4 text-[#ECC979]" />
            </div>
            <p className="text-2xl font-bold font-mono">
              {isLoading ? '...' : analytics?.engagement?.totalViews?.toLocaleString() || 0}
            </p>
            <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">
              {analytics?.engagement?.totalLikes || 0} total likes
            </p>
          </div>
        </div>

        {/* Administration Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Admin Analytics */}
          <Link
            href="/admin/analytics"
            className="group p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] hover:border-[#ECC979]/60 transition-all shadow-sm hover:shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--lr-text-muted)] group-hover:text-[#ECC979] group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-lg font-bold text-[var(--lr-text-primary)] group-hover:text-[#ECC979] transition-colors">
                Platform Analytics
              </h2>
              <p className="text-xs text-[var(--lr-text-muted)] mt-1.5 leading-relaxed">
                Comprehensive data across users, content growth, engagement activity, VIP subscription revenue, and top-performing reels.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--lr-border)] flex items-center gap-2 text-xs font-semibold text-blue-400">
              <span>View Analytics Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 2: Admin CRM */}
          <Link
            href="/admin/crm"
            className="group p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] hover:border-[#ECC979]/60 transition-all shadow-sm hover:shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--lr-text-muted)] group-hover:text-[#ECC979] group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-lg font-bold text-[var(--lr-text-primary)] group-hover:text-[#ECC979] transition-colors">
                User & Creator CRM
              </h2>
              <p className="text-xs text-[var(--lr-text-muted)] mt-1.5 leading-relaxed">
                Filter and inspect platform users, audit creator profiles, monitor VIP subscriptions, and manage account statuses or suspensions.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--lr-border)] flex items-center gap-2 text-xs font-semibold text-purple-400">
              <span>Open User CRM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 3: Must See Manager */}
          <Link
            href="/admin/must-see"
            className="group p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] hover:border-[#ECC979]/60 transition-all shadow-sm hover:shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#ECC979]/10 text-[#ECC979] border border-[#ECC979]/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles className="w-6 h-6 fill-[#ECC979]" />
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--lr-text-muted)] group-hover:text-[#ECC979] group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-lg font-bold text-[var(--lr-text-primary)] group-hover:text-[#ECC979] transition-colors">
                Must See Content Curation
              </h2>
              <p className="text-xs text-[var(--lr-text-muted)] mt-1.5 leading-relaxed">
                Control the prestigious "Must See" showcase on the Lighthouse Home page. Promote standout series, videos, and editorial blogs.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--lr-border)] flex items-center gap-2 text-xs font-semibold text-[#ECC979]">
              <span>Manage Must See Items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Card 4: Episode Length Review */}
          <Link
            href="/admin/episodes-review"
            className="group p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] hover:border-[#ECC979]/60 transition-all shadow-sm hover:shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-[var(--lr-text-muted)] group-hover:text-[#ECC979] group-hover:translate-x-1 transition-all" />
              </div>
              <h2 className="text-lg font-bold text-[var(--lr-text-primary)] group-hover:text-[#ECC979] transition-colors">
                Episode Length Review (2-Min Policy)
              </h2>
              <p className="text-xs text-[var(--lr-text-muted)] mt-1.5 leading-relaxed">
                Inspect pre-existing legacy content exceeding 2 minutes. Future uploads are strictly limited to 120 seconds.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[var(--lr-border)] flex items-center gap-2 text-xs font-semibold text-amber-400">
              <span>Review Catalog Episodes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
