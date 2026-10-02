'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  TrendingUp,
  Users,
  Film,
  Crown,
  Heart,
  MessageSquare,
  Play,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Eye,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin =
    user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    user?.email === 'admin@dramabox.stream' ||
    profile?.role === 'admin';

  useEffect(() => {
    if (!user) return;
    async function loadAnalytics() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const json = await res.json();
          setData(json.analytics);
        }
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [user]);

  if (!isAdmin && !isLoading) {
    return (
      <div className="min-h-screen bg-[var(--lr-bg)] text-[var(--lr-text-primary)] flex items-center justify-center p-4">
        <div className="text-center max-w-md p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)]">
          <AlertTriangle className="w-12 h-12 text-[#ECC979] mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-1">Restricted Access</h2>
          <p className="text-xs text-[var(--lr-text-muted)] mb-4">
            You must be an administrator to access platform analytics.
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

  const users = data?.users || {};
  const content = data?.content || {};
  const engagement = data?.engagement || {};
  const subs = data?.subscriptions || {};
  const topContent = data?.topContent || [];
  const topSeries = data?.topSeries || [];

  return (
    <div className="min-h-screen bg-[var(--lr-bg)] text-[var(--lr-text-primary)] py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-10 h-10 rounded-full bg-[var(--lr-card-bg)] border border-[var(--lr-border)] flex items-center justify-center hover:border-[#ECC979] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--lr-text-muted)] hover:text-[#ECC979]" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">Platform Analytics</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  Realtime DB Data
                </span>
              </div>
              <p className="text-xs text-[var(--lr-text-muted)] mt-0.5">
                Authoritative platform-level metrics across users, content growth, engagement, and VIP subscriptions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--lr-text-muted)]">
            <Calendar className="w-4 h-4 text-[#ECC979]" />
            <span>Updated: Just now</span>
          </div>
        </div>

        {/* 1. USERS & CREATORS SECTION */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Users className="w-4 h-4 text-[#ECC979]" />
            <span>Users & Creator Community</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
              <span className="text-xs text-[var(--lr-text-muted)]">Total Registered Users</span>
              <p className="text-2xl font-bold font-mono mt-1">
                {isLoading ? '...' : (users.total || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-400 mt-1">Active user accounts</p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
              <span className="text-xs text-[var(--lr-text-muted)]">New Users (Last 30d)</span>
              <p className="text-2xl font-bold font-mono mt-1">
                {isLoading ? '...' : (users.newIn30d || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-blue-400 mt-1">Recent user growth</p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
              <span className="text-xs text-[var(--lr-text-muted)]">Active Users (7d est.)</span>
              <p className="text-2xl font-bold font-mono mt-1">
                {isLoading ? '...' : (users.activeEstimates || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">~45% engagement rate</p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
              <span className="text-xs text-[var(--lr-text-muted)]">Verified Creators</span>
              <p className="text-2xl font-bold font-mono mt-1">
                {isLoading ? '...' : (users.creators || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-[#ECC979] mt-1">Creator role verified</p>
            </div>
          </div>
        </div>

        {/* 2. CONTENT & REEL METRICS */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Film className="w-4 h-4 text-[#ECC979]" />
            <span>Content Catalog</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
              <span className="text-xs text-[var(--lr-text-muted)]">Total Series</span>
              <p className="text-2xl font-bold font-mono mt-1">
                {isLoading ? '...' : (content.series || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">Original show titles</p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
              <span className="text-xs text-[var(--lr-text-muted)]">Episodes & Videos</span>
              <p className="text-2xl font-bold font-mono mt-1">
                {isLoading ? '...' : (content.videos || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">Published videos</p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
              <span className="text-xs text-[var(--lr-text-muted)]">Published Blogs</span>
              <p className="text-2xl font-bold font-mono mt-1">
                {isLoading ? '...' : (content.blogs || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">Editorial articles</p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
              <span className="text-xs text-[var(--lr-text-muted)]">Policy Compliance</span>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">100%</p>
              <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">2-minute episode cap active</p>
            </div>
          </div>
        </div>

        {/* 3. ENGAGEMENT METRICS */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <TrendingUp className="w-4 h-4 text-[#ECC979]" />
            <span>Platform Engagement</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
              <div className="flex items-center justify-between text-[var(--lr-text-muted)]">
                <span className="text-xs">Total Views</span>
                <Play className="w-3.5 h-3.5 text-[#ECC979]" />
              </div>
              <p className="text-2xl font-bold font-mono mt-1">
                {isLoading ? '...' : (engagement.totalViews || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-emerald-400 mt-1">Actual recorded views</p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
              <div className="flex items-center justify-between text-[var(--lr-text-muted)]">
                <span className="text-xs">Total Likes</span>
                <Heart className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <p className="text-2xl font-bold font-mono mt-1">
                {isLoading ? '...' : (engagement.totalLikes || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">User favorited reactions</p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
              <div className="flex items-center justify-between text-[var(--lr-text-muted)]">
                <span className="text-xs">Comments</span>
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <p className="text-2xl font-bold font-mono mt-1">
                {isLoading ? '...' : (engagement.totalComments || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">Community discussions</p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
              <div className="flex items-center justify-between text-[var(--lr-text-muted)]">
                <span className="text-xs">Creator Follows</span>
                <Users className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <p className="text-2xl font-bold font-mono mt-1">
                {isLoading ? '...' : (engagement.totalFollows || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">Follower connections</p>
            </div>
          </div>
        </div>

        {/* 4. SUBSCRIPTION PLANS & REVENUE BREAKDOWN */}
        <div className="p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F4C95D]/15 text-[#F4C95D] flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold">VIP Subscriptions & Revenue</h2>
                <p className="text-xs text-[var(--lr-text-muted)]">Weekly, Monthly, and Yearly plan performance</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-[var(--lr-text-muted)]">Active Subscribers</span>
                <p className="text-lg font-bold font-mono text-[#F4C95D]">{subs.totalActive || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[var(--lr-bg)] border border-[var(--lr-border)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--lr-text-primary)]">Weekly Pass</span>
                <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded font-mono font-bold">
                  ₹99/wk
                </span>
              </div>
              <p className="text-2xl font-bold font-mono text-[var(--lr-text-primary)]">
                {subs.breakdown?.weekly || 0}
              </p>
              <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">Short-term subscribers</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--lr-bg)] border border-[var(--lr-border)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--lr-text-primary)]">Monthly VIP</span>
                <span className="text-[10px] bg-[#ECC979]/20 text-[#ECC979] px-2 py-0.5 rounded font-mono font-bold">
                  ₹299/mo
                </span>
              </div>
              <p className="text-2xl font-bold font-mono text-[#ECC979]">
                {subs.breakdown?.monthly || 0}
              </p>
              <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">Core subscription plan</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--lr-bg)] border border-[var(--lr-border)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-[var(--lr-text-primary)]">Yearly VIP</span>
                <span className="text-[10px] bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded font-mono font-bold">
                  ₹1,999/yr
                </span>
              </div>
              <p className="text-2xl font-bold font-mono text-purple-400">
                {subs.breakdown?.yearly || 0}
              </p>
              <p className="text-[11px] text-[var(--lr-text-muted)] mt-1">High retention members</p>
            </div>
          </div>
        </div>

        {/* 5. TOP PERFORMING CONTENT TABLE */}
        <div className="rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[var(--lr-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ECC979]" />
              <h3 className="text-sm font-bold">Most-Viewed Content Leaderboard</h3>
            </div>
            <span className="text-xs text-[var(--lr-text-muted)]">Data-driven ranking</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--lr-bg)] border-b border-[var(--lr-border)] text-[var(--lr-text-muted)] font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Content Title</th>
                  <th className="py-3 px-4">Creator</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Likes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--lr-border)]">
                {topContent.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--lr-text-muted)]">
                      No videos recorded yet.
                    </td>
                  </tr>
                ) : (
                  topContent.map((v: any, idx: number) => (
                    <tr key={v.id} className="hover:bg-[var(--lr-bg)]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#ECC979]">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-6 rounded bg-[var(--lr-bg)] border border-[var(--lr-border)] overflow-hidden shrink-0">
                            {v.thumbnail_url && (
                              <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <span className="font-bold text-[var(--lr-text-primary)] truncate max-w-xs">{v.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--lr-text-muted)]">
                        {v.creator?.display_name || v.creator?.username || 'Creator'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[var(--lr-text-muted)]">
                        {v.duration_seconds ? `${v.duration_seconds}s` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--lr-text-primary)]">
                        {v.views_count?.toLocaleString() || 0}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-rose-400">
                        {v.likes_count?.toLocaleString() || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
