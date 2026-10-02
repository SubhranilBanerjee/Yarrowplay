'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  AlertTriangle,
  ArrowLeft,
  Play,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Film,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function EpisodeReviewPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<any | null>(null);

  const isAdmin =
    user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    user?.email === 'admin@dramabox.stream' ||
    profile?.role === 'admin';

  useEffect(() => {
    if (!user) return;
    async function loadEpisodes() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/episodes-review');
        if (res.ok) {
          const data = await res.json();
          setEpisodes(data.longEpisodes || []);
        }
      } catch (err) {
        console.error('Failed to load review episodes:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEpisodes();
  }, [user]);

  if (!isAdmin && !isLoading) {
    return (
      <div className="min-h-screen bg-[var(--lr-bg)] text-[var(--lr-text-primary)] flex items-center justify-center p-4">
        <div className="text-center max-w-md p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)]">
          <AlertTriangle className="w-12 h-12 text-[#ECC979] mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-1">Restricted Access</h2>
          <p className="text-xs text-[var(--lr-text-muted)] mb-4">
            Only administrators are authorized to access the Episode Review Portal.
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

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = Math.round(sec % 60);
    return `${mins}m ${remainder}s`;
  };

  return (
    <div className="min-h-screen bg-[var(--lr-bg)] text-[var(--lr-text-primary)] py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
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
                <h1 className="text-2xl font-bold tracking-tight">Episode Duration Review</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Policy: 2-Min Max
                </span>
              </div>
              <p className="text-xs text-[var(--lr-text-muted)] mt-0.5">
                Pre-existing episodes exceeding 2 minutes (120 seconds). These remain active without breaking playback.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[var(--lr-card-bg)] border border-[var(--lr-border)] px-4 py-2 rounded-xl text-xs font-semibold">
              <span className="text-[var(--lr-text-muted)]">Exceeding Limit: </span>
              <span className="font-bold text-[#ECC979]">{episodes.length}</span>
            </div>
          </div>
        </div>

        {/* Informative Notice */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">2-Minute Episode Cap Enforced for New Uploads</p>
            <p className="text-amber-200/80 leading-relaxed">
              All future uploads are verified client-side and server-side to reject videos longer than 120 seconds.
              Existing content longer than 2 minutes is catalogued here for administrative review and will not be
              arbitrarily removed.
            </p>
          </div>
        </div>

        {/* Content Table / List */}
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[var(--lr-text-muted)]">
            Scanning video catalog for duration metrics...
          </div>
        ) : episodes.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] text-center space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold">All Episodes Compliant</h3>
            <p className="text-xs text-[var(--lr-text-muted)]">
              No existing episodes in the catalog exceed the 2-minute duration limit.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--lr-bg)] border-b border-[var(--lr-border)] text-[var(--lr-text-muted)] font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Episode</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Creator</th>
                    <th className="py-3.5 px-4">Views</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--lr-border)]">
                  {episodes.map((ep) => (
                    <tr key={ep.id} className="hover:bg-[var(--lr-bg)]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-9 rounded-lg bg-[var(--lr-bg)] border border-[var(--lr-border)] overflow-hidden shrink-0 relative">
                            {ep.thumbnail_url ? (
                              <img
                                src={ep.thumbnail_url}
                                alt={ep.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Film className="w-4 h-4 text-[var(--lr-text-muted)] m-auto" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold truncate text-[var(--lr-text-primary)]">{ep.title}</p>
                            <p className="text-[10px] text-[var(--lr-text-muted)] font-mono">{ep.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                          {formatDuration(ep.duration_seconds)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[var(--lr-text-primary)] font-medium">
                          {ep.creator?.display_name || ep.creator?.username || 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--lr-text-muted)] font-mono">
                        {ep.views_count?.toLocaleString() || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {ep.status || 'published'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setActiveVideo(ep)}
                            className="p-1.5 rounded-lg bg-[var(--lr-bg)] border border-[var(--lr-border)] hover:border-[#ECC979] text-[#ECC979] transition-colors"
                            title="Preview video"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <Link
                            href={`/videos/${ep.id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-[var(--lr-bg)] border border-[var(--lr-border)] hover:text-[#ECC979] transition-colors"
                            title="Open in player"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Video Preview Modal */}
        {activeVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-[var(--lr-border)] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">{activeVideo.title}</h3>
                  <p className="text-xs text-amber-400">Duration: {formatDuration(activeVideo.duration_seconds)}</p>
                </div>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="w-7 h-7 rounded-full bg-[var(--lr-bg)] border border-[var(--lr-border)] flex items-center justify-center hover:text-red-400"
                >
                  ×
                </button>
              </div>
              <div className="aspect-video bg-black flex items-center justify-center">
                <video src={activeVideo.video_url} controls autoPlay className="w-full h-full object-contain" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
