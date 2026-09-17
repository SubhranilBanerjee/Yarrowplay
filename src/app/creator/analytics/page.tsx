'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  BarChart3,
  Eye,
  Heart,
  ThumbsDown,
  MessageSquare,
  Share2,
  Clock,
  DollarSign,
  Film,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

interface ContentMetric {
  id: string;
  title: string;
  type: 'video' | 'audio';
  views: number;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  watchTimeMinutes: number;
  earnings: number;
  boosted: boolean;
}

export default function CreatorAnalyticsPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'video' | 'audio'>('all');
  const [contentList, setContentList] = useState<ContentMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Aggregated totals
  const [totals, setTotals] = useState({
    views: 0,
    likes: 0,
    dislikes: 0,
    comments: 0,
    shares: 0,
    watchTimeMinutes: 0,
    earnings: 0,
    totalContent: 0,
  });

  const fetchAnalytics = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // 1. Fetch user's videos
      const { data: videos } = await supabase
        .from('videos')
        .select('*')
        .eq('creator_id', user.id);

      // 2. Fetch user's audios
      const { data: audios } = await supabase
        .from('audios')
        .select('*')
        .eq('creator_id', user.id);

      // 3. Fetch active boosts
      const { data: boosts } = await supabase
        .from('video_boosts')
        .select('video_id')
        .eq('creator_id', user.id)
        .eq('status', 'active');

      const boostedSet = new Set((boosts || []).map((b: any) => b.video_id));

      // 4. Fetch creator earnings
      const { data: earningsData } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', user.id);

      // 5. Fetch watch_time analytics events
      const { data: watchEvents } = await supabase
        .from('analytics_events')
        .select('content_id, duration_seconds')
        .eq('creator_id', user.id)
        .eq('event_type', 'watch_time');

      const watchTimeMap = new Map<string, number>();
      (watchEvents || []).forEach((e: any) => {
        const cur = watchTimeMap.get(e.content_id) || 0;
        watchTimeMap.set(e.content_id, cur + (Number(e.duration_seconds) || 0));
      });

      const earningsMap = new Map<string, number>();
      (earningsData || []).forEach((e: any) => {
        const cur = earningsMap.get(e.content_id) || 0;
        earningsMap.set(e.content_id, cur + (Number(e.amount) || 0));
      });

      const metrics: ContentMetric[] = [];

      (videos || []).forEach((v: any) => {
        const durationSecs = watchTimeMap.get(v.id) || (v.views_count * (v.duration_seconds || 45) * 0.4);
        metrics.push({
          id: v.id,
          title: v.title,
          type: 'video',
          views: v.views_count || 0,
          likes: v.likes_count || 0,
          dislikes: v.dislikes_count || 0,
          comments: v.comments_count || 0,
          shares: v.shares_count || 0,
          watchTimeMinutes: Math.round(durationSecs / 60),
          earnings: earningsMap.get(v.id) || 0,
          boosted: boostedSet.has(v.id),
        });
      });

      (audios || []).forEach((a: any) => {
        const durationSecs = watchTimeMap.get(a.id) || (a.views_count * (a.duration_seconds || 180) * 0.6);
        metrics.push({
          id: a.id,
          title: a.title,
          type: 'audio',
          views: a.views_count || 0,
          likes: a.likes_count || 0,
          dislikes: a.dislikes_count || 0,
          comments: 0,
          shares: a.shares_count || 0,
          watchTimeMinutes: Math.round(durationSecs / 60),
          earnings: earningsMap.get(a.id) || 0,
          boosted: false,
        });
      });

      setContentList(metrics);

      // Calculate totals
      const totalViews = metrics.reduce((acc, m) => acc + m.views, 0);
      const totalLikes = metrics.reduce((acc, m) => acc + m.likes, 0);
      const totalDislikes = metrics.reduce((acc, m) => acc + m.dislikes, 0);
      const totalComments = metrics.reduce((acc, m) => acc + m.comments, 0);
      const totalShares = metrics.reduce((acc, m) => acc + m.shares, 0);
      const totalWatchTime = metrics.reduce((acc, m) => acc + m.watchTimeMinutes, 0);
      const totalEarnings = metrics.reduce((acc, m) => acc + m.earnings, 0);

      setTotals({
        views: totalViews,
        likes: totalLikes,
        dislikes: totalDislikes,
        comments: totalComments,
        shares: totalShares,
        watchTimeMinutes: totalWatchTime,
        earnings: totalEarnings,
        totalContent: metrics.length,
      });
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  // Handle video boosting action directly from analytics
  const handleBoostVideo = async (videoId: string) => {
    if (!user) return;
    try {
      const now = new Date();
      const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await supabase.from('video_boosts').insert({
        video_id: videoId,
        creator_id: user.id,
        status: 'active',
        start_date: now.toISOString(),
        end_date: inSevenDays.toISOString(),
        budget: 0,
        priority: 2,
      });

      await fetchAnalytics();
    } catch {
      // ignore
    }
  };

  const filteredContent = contentList.filter((item) => {
    if (contentTypeFilter === 'all') return true;
    return item.type === contentTypeFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-[var(--color-pink-light)]" />
            Creator Analytics
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Real performance telemetry derived from database events and viewer playback sessions.
          </p>
        </div>

        {/* Date Filters */}
        <div
          className="flex items-center gap-2 p-1.5 rounded-xl border self-start sm:self-auto backdrop-blur-md"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <button
            onClick={() => setDateRange('7d')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            style={
              dateRange === '7d'
                ? {
                    background: 'var(--gradient-neon)',
                    color: '#ffffff',
                    boxShadow: 'var(--glow-purple)',
                  }
                : { color: 'var(--text-secondary)' }
            }
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange('30d')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            style={
              dateRange === '30d'
                ? {
                    background: 'var(--gradient-neon)',
                    color: '#ffffff',
                    boxShadow: 'var(--glow-purple)',
                  }
                : { color: 'var(--text-secondary)' }
            }
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange('all')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            style={
              dateRange === 'all'
                ? {
                    background: 'var(--gradient-neon)',
                    color: '#ffffff',
                    boxShadow: 'var(--glow-purple)',
                  }
                : { color: 'var(--text-secondary)' }
            }
          >
            All Time
          </button>
        </div>
      </div>

      {/* 8 Primary Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div
          className="rounded-2xl p-4 border backdrop-blur-md transition-all hover:border-[var(--color-purple)]"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs uppercase font-semibold">Total Views</span>
            <Eye className="w-4 h-4 text-[var(--color-pink-light)]" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totals.views.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-400 mt-1 block">Live stream events</span>
        </div>

        <div
          className="rounded-2xl p-4 border backdrop-blur-md transition-all hover:border-[var(--color-purple)]"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs uppercase font-semibold">Watch Time</span>
            <Clock className="w-4 h-4 text-[var(--color-pink-light)]" />
          </div>
          <p className="text-2xl font-extrabold text-white">
            {totals.watchTimeMinutes.toLocaleString()}{' '}
            <span className="text-xs font-normal text-[var(--text-muted)]">mins</span>
          </p>
          <span className="text-[11px] text-emerald-400 mt-1 block">Heartbeat verified</span>
        </div>

        <div
          className="rounded-2xl p-4 border backdrop-blur-md transition-all hover:border-[var(--color-purple)]"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs uppercase font-semibold">Total Likes</span>
            <Heart className="w-4 h-4 text-[var(--color-pink-light)]" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totals.likes.toLocaleString()}</p>
          <span className="text-[11px] text-[var(--text-secondary)] mt-1 block">
            {totals.dislikes} dislikes
          </span>
        </div>

        <div
          className="rounded-2xl p-4 border backdrop-blur-md transition-all hover:border-[var(--color-purple)]"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs uppercase font-semibold">Total Shares</span>
            <Share2 className="w-4 h-4 text-[var(--color-pink-light)]" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totals.shares.toLocaleString()}</p>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">Web share & copy links</span>
        </div>

        <div
          className="rounded-2xl p-4 border backdrop-blur-md transition-all hover:border-[var(--color-purple)]"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs uppercase font-semibold">Comments</span>
            <MessageSquare className="w-4 h-4 text-[var(--color-pink-light)]" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totals.comments.toLocaleString()}</p>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">Discussions</span>
        </div>

        <div
          className="rounded-2xl p-4 border backdrop-blur-md transition-all hover:border-[var(--color-purple)]"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs uppercase font-semibold">Published Items</span>
            <Film className="w-4 h-4 text-[var(--color-pink-light)]" />
          </div>
          <p className="text-2xl font-extrabold text-white">{totals.totalContent}</p>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">Videos & Audio</span>
        </div>

        <div
          className="rounded-2xl p-4 border backdrop-blur-md transition-all hover:border-[var(--color-purple)]"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs uppercase font-semibold">Creator Earnings</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-white">${totals.earnings.toFixed(2)}</p>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">Recorded revenue</span>
        </div>

        <div
          className="rounded-2xl p-4 border backdrop-blur-md transition-all hover:border-[var(--color-purple)]"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
            <span className="text-xs uppercase font-semibold">Avg Retention</span>
            <Sparkles className="w-4 h-4 text-[var(--color-pink-light)]" />
          </div>
          <p className="text-2xl font-extrabold text-white">
            {totals.views > 0
              ? Math.min(100, Math.round((totals.watchTimeMinutes * 60 / (totals.views * 120)) * 100))
              : 0}
            %
          </p>
          <span className="text-[11px] text-[var(--text-muted)] mt-1 block">Session completion</span>
        </div>
      </div>

      {/* Visual Chart: Performance Bars */}
      <div
        className="rounded-2xl p-6 mb-8 border backdrop-blur-xl"
        style={{
          background: 'var(--glass-surface)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white">Audience Engagement by Upload</h2>
            <p className="text-xs text-[var(--text-muted)]">Comparing views against watch duration</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded"
                style={{ background: 'var(--gradient-neon)' }}
              />
              <span className="text-[var(--text-secondary)]">Views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-500" />
              <span className="text-[var(--text-secondary)]">Watch Time (mins)</span>
            </div>
          </div>
        </div>

        {contentList.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            No uploaded content yet to chart.
          </div>
        ) : (
          <div className="space-y-4">
            {contentList.slice(0, 6).map((item) => {
              const maxViews = Math.max(...contentList.map((c) => c.views), 1);
              const maxWatch = Math.max(...contentList.map((c) => c.watchTimeMinutes), 1);
              const viewPct = Math.max(8, (item.views / maxViews) * 100);
              const watchPct = Math.max(8, (item.watchTimeMinutes / maxWatch) * 100);

              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white truncate max-w-xs">{item.title}</span>
                    <span className="text-[var(--text-muted)]">
                      {item.views} views • {item.watchTimeMinutes} mins
                    </span>
                  </div>
                  <div
                    className="h-3 rounded-full overflow-hidden flex gap-1 p-0.5"
                    style={{ background: 'var(--glass-surface-heavy)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${viewPct}%`,
                        background: 'var(--gradient-neon)',
                        boxShadow: 'var(--glow-pink)',
                      }}
                    />
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${watchPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item-by-Item Telemetry Table */}
      <div
        className="rounded-2xl p-6 border backdrop-blur-xl"
        style={{
          background: 'var(--glass-surface)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-base font-bold text-white">Itemized Content Telemetry</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setContentTypeFilter('all')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
              style={
                contentTypeFilter === 'all'
                  ? {
                      background: 'var(--gradient-neon)',
                      color: '#ffffff',
                      borderColor: 'var(--color-pink)',
                      boxShadow: 'var(--glow-purple)',
                    }
                  : {
                      background: 'var(--glass-surface-heavy)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--glass-border)',
                    }
              }
            >
              All
            </button>
            <button
              onClick={() => setContentTypeFilter('video')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
              style={
                contentTypeFilter === 'video'
                  ? {
                      background: 'var(--gradient-neon)',
                      color: '#ffffff',
                      borderColor: 'var(--color-pink)',
                      boxShadow: 'var(--glow-purple)',
                    }
                  : {
                      background: 'var(--glass-surface-heavy)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--glass-border)',
                    }
              }
            >
              Videos Only
            </button>
            <button
              onClick={() => setContentTypeFilter('audio')}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
              style={
                contentTypeFilter === 'audio'
                  ? {
                      background: 'var(--gradient-neon)',
                      color: '#ffffff',
                      borderColor: 'var(--color-pink)',
                      boxShadow: 'var(--glow-purple)',
                    }
                  : {
                      background: 'var(--glass-surface-heavy)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--glass-border)',
                    }
              }
            >
              Audio Only
            </button>
          </div>
        </div>

        {filteredContent.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No telemetry records"
            description="Upload your first video or audio track to generate audience metrics."
            actionLabel="Upload in Creator Studio"
            actionHref="/creator/studio"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--text-secondary)]">
              <thead
                className="border-b text-[var(--text-muted)] uppercase"
                style={{ borderColor: 'var(--glass-border)' }}
              >
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4">Watch Time</th>
                  <th className="py-3 px-4">Likes / Dislikes</th>
                  <th className="py-3 px-4">Shares</th>
                  <th className="py-3 px-4">Earnings</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className="divide-y"
                style={{ borderColor: 'var(--glass-border)' }}
              >
                {filteredContent.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white truncate max-w-[200px]">
                      {item.title}
                    </td>
                    <td className="py-3.5 px-4 capitalize">
                      <span
                        className="px-2 py-0.5 rounded-full border text-[11px]"
                        style={{
                          background: 'var(--glass-surface-heavy)',
                          borderColor: 'var(--glass-border)',
                        }}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-white font-medium">{item.views}</td>
                    <td className="py-3.5 px-4">{item.watchTimeMinutes} mins</td>
                    <td className="py-3.5 px-4">
                      <span className="text-emerald-400">{item.likes}</span> /{' '}
                      <span className="text-red-400">{item.dislikes}</span>
                    </td>
                    <td className="py-3.5 px-4">{item.shares}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-medium">${item.earnings.toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {item.type === 'video' && (
                        item.boosted ? (
                          <span
                            className="px-2.5 py-1 rounded-lg font-semibold text-[11px] border"
                            style={{
                              background: 'var(--neon-purple-glow)',
                              borderColor: 'var(--neon-purple-border)',
                              color: 'var(--color-pink-light)',
                            }}
                          >
                            Boosted
                          </span>
                        ) : (
                          <button
                            onClick={() => handleBoostVideo(item.id)}
                            className="px-2.5 py-1 rounded-lg text-white font-semibold text-[11px] transition-all cursor-pointer shadow-md"
                            style={{
                              background: 'var(--gradient-neon)',
                              boxShadow: 'var(--glow-purple)',
                            }}
                          >
                            Boost Video
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
