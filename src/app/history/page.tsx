'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { WatchHistoryItem } from '@/types/database';
import {
  Clock,
  Play,
  Trash2,
  Search,
  Film,
  Loader2,
  LogIn,
  AlertTriangle,
  X,
} from 'lucide-react';

export default function HistoryPage() {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<WatchHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fetchHistory = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/watch-history?limit=100');
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data.history || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleRemoveItem = async (videoId: string) => {
    setHistoryItems((prev) => prev.filter((item) => item.video_id !== videoId));
    try {
      await fetch(`/api/watch-history?video_id=${videoId}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/watch-history?clear_all=true', { method: 'DELETE' });
      if (res.ok) {
        setHistoryItems([]);
        setShowClearConfirm(false);
      }
    } catch {
      // ignore
    } finally {
      setIsClearing(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-6 py-20 text-center my-8 rounded-2xl border"
        style={{
          background: 'var(--glass-surface)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border"
          style={{
            background: 'var(--neon-purple-glow)',
            borderColor: 'var(--neon-purple-border)',
          }}
        >
          <LogIn className="w-7 h-7 text-[var(--color-pink-light)]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Sign in to view Watch History</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-6">
          Keep track of what you watch and pick up where you left off on any device.
        </p>
        <Link
          href="/login?redirect=/history"
          className="px-6 py-2.5 rounded-xl text-white text-xs font-semibold inline-block transition-all shadow-lg"
          style={{
            background: 'var(--gradient-neon)',
            boxShadow: 'var(--glow-purple)',
          }}
        >
          Sign In
        </Link>
      </div>
    );
  }

  const filteredItems = historyItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = item.video?.title?.toLowerCase() || '';
    const seriesTitle = item.video?.series?.title?.toLowerCase() || '';
    const creatorName = item.video?.creator?.display_name?.toLowerCase() || '';
    return title.includes(q) || seriesTitle.includes(q) || creatorName.includes(q);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{
              background: 'var(--neon-purple-glow)',
              borderColor: 'var(--neon-purple-border)',
            }}
          >
            <Clock className="w-5 h-5 text-[var(--color-pink-light)]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Watch History</h1>
            <p className="text-xs text-[var(--text-muted)]">
              {historyItems.length} {historyItems.length === 1 ? 'title' : 'titles'} in your history
            </p>
          </div>
        </div>

        {historyItems.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/15 border border-red-500/20 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      {historyItems.length > 0 && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search your watch history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-white text-xs rounded-xl pl-9 pr-4 py-2.5 border focus:outline-none focus:border-[var(--color-pink)] transition-all"
            style={{
              background: 'var(--glass-surface-heavy)',
              borderColor: 'var(--glass-border)',
            }}
          />
        </div>
      )}

      {/* History Items List */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-pink-light)]" />
          <span className="text-xs">Loading your watch history...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center border space-y-3"
          style={{
            background: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
          }}
        >
          <Clock className="w-12 h-12 text-white/20 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {searchQuery ? 'No matching history found' : 'No watch history yet'}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            {searchQuery
              ? 'Try searching with a different title or keyword.'
              : 'Start watching series and videos to build your watch history.'}
          </p>
          <Link
            href="/home"
            className="inline-block px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-lg"
            style={{
              background: 'var(--gradient-neon)',
              boxShadow: 'var(--glow-purple)',
            }}
          >
            Discover Content
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const video = item.video;
            if (!video) return null;

            const percent = item.progress_seconds && item.total_duration
              ? Math.min(100, Math.round((item.progress_seconds / item.total_duration) * 100))
              : 0;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3.5 rounded-2xl border transition-all hover:border-white/20"
                style={{
                  background: 'var(--glass-surface-heavy)',
                  borderColor: 'var(--glass-border)',
                }}
              >
                {/* Thumbnail & Title Info */}
                <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                  <Link
                    href={`/videos/${video.id}?t=${Math.round(item.progress_seconds)}`}
                    className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden shrink-0 bg-[#1E1B2E]"
                  >
                    {video.thumbnail_url ? (
                      <Image src={video.thumbnail_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-6 h-6 text-white/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-6 h-6 fill-white text-white" />
                    </div>
                    {/* Mini progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div className="h-full bg-[var(--color-pink-light)]" style={{ width: `${percent}%` }} />
                    </div>
                  </Link>

                  <div className="min-w-0 flex-1">
                    {video.series && (
                      <p className="text-[10px] font-bold text-[var(--color-pink-light)] uppercase tracking-wider truncate">
                        {video.series.title}
                        {video.episode_number && ` · Episode ${video.episode_number}`}
                      </p>
                    )}
                    <h3 className="text-sm font-semibold text-white truncate group-hover:text-[var(--color-pink-light)] transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                      {video.creator?.display_name || 'Creator'} · Watched on {new Date(item.last_watched_at).toLocaleDateString()}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                      {item.completed ? 'Completed' : `${percent}% watched`}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Link
                    href={`/videos/${video.id}?t=${Math.round(item.progress_seconds)}`}
                    className="px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
                    style={{
                      background: 'var(--gradient-neon)',
                      boxShadow: 'var(--glow-purple)',
                    }}
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>{item.completed ? 'Replay' : 'Resume'}</span>
                  </Link>

                  <button
                    onClick={() => handleRemoveItem(video.id)}
                    title="Remove from history"
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 relative backdrop-blur-xl border text-center"
            style={{
              background: 'var(--glass-surface-heavy)',
              borderColor: 'var(--glass-border)',
            }}
          >
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-white font-bold text-base">Clear Watch History?</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              This will remove all videos and episodes from your watch history and reset continue watching progress.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleClearAll}
                className="px-5 py-2 rounded-xl text-white text-xs font-semibold bg-red-600 hover:bg-red-500 transition-colors shadow-lg disabled:opacity-50"
              >
                {isClearing ? 'Clearing...' : 'Yes, Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
