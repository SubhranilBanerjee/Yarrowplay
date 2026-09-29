'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  Flame,
  Star,
  Tv,
  Film,
  FileText,
  Check,
  Search,
  ArrowLeft,
  Loader2,
  ShieldAlert,
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  cover_url?: string;
  thumbnail_url?: string;
  category?: string;
  is_must_see?: boolean;
  views_count?: number;
  creator?: { display_name?: string };
  author?: { display_name?: string };
}

export default function AdminMustSeePage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'series' | 'videos' | 'blogs'>('series');
  const [seriesList, setSeriesList] = useState<ContentItem[]>([]);
  const [videoList, setVideoList] = useState<ContentItem[]>([]);
  const [blogList, setBlogList] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const isAdmin =
    !!user?.email &&
    (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      user.email === 'admin@dramabox.stream' ||
      profile?.role === 'admin');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/must-see');
      if (res.ok) {
        const data = await res.json();
        setSeriesList(data.series || []);
        setVideoList(data.videos || []);
        setBlogList(data.blogs || []);
      }
    } catch (err) {
      console.error('Failed to load must see list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async (type: 'series' | 'video' | 'blog', id: string, currentState: boolean) => {
    setTogglingId(id);
    const nextState = !currentState;

    // Optimistic update
    if (type === 'series') {
      setSeriesList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_must_see: nextState } : item))
      );
    } else if (type === 'video') {
      setVideoList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_must_see: nextState } : item))
      );
    } else {
      setBlogList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_must_see: nextState } : item))
      );
    }

    try {
      await fetch('/api/admin/must-see', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: type,
          content_id: id,
          is_must_see: nextState,
        }),
      });
    } catch (err) {
      console.error('Failed to toggle must see:', err);
      fetchData(); // Rollback
    } finally {
      setTogglingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="w-12 h-12 text-[#D96868] mb-3" />
        <h2 className="text-xl font-bold text-[var(--lr-text-primary,#F5F1E8)]">Admin Access Required</h2>
        <p className="text-xs text-[var(--lr-text-secondary,#9AA7B4)] mt-1 max-w-sm">
          You must be an authorized platform administrator to manage Must See content.
        </p>
        <Link
          href="/home"
          className="mt-4 px-4 py-2 rounded-xl bg-[#ECC979] text-[#101418] text-xs font-bold"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const currentList =
    activeTab === 'series'
      ? seriesList
      : activeTab === 'videos'
      ? videoList
      : blogList;

  const filteredItems = currentList.filter((item) =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const totalMarked = currentList.filter((i) => i.is_must_see).length;

  return (
    <div className="w-full min-h-screen bg-[var(--lr-bg-primary,#070B0F)] text-[var(--lr-text-primary,#F5F1E8)] px-4 sm:px-6 lg:px-8 py-6 pb-24">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/admin"
              className="text-xs text-[var(--lr-text-muted,#7E8B99)] hover:text-[#ECC979] flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Flame className="w-7 h-7 text-[#ECC979]" />
            <span>Must See Content Manager</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--lr-text-secondary,#9AA7B4)] mt-1">
            Designate premium editorial picks to feature on the homepage &quot;Must See&quot; rail.
          </p>
        </div>

        {/* Marked summary pill */}
        <div className="px-4 py-2 rounded-2xl bg-[var(--lr-bg-surface,#111A22)] border border-[var(--lr-border-primary,#27313A)] text-xs flex items-center gap-2">
          <Star className="w-4 h-4 fill-[#ECC979] text-[#ECC979]" />
          <span className="text-[var(--lr-text-secondary,#B7BEC6)]">Currently Marked:</span>
          <span className="font-bold text-[#ECC979]">{totalMarked} items</span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {[
            { id: 'series', label: 'Series', icon: Tv, count: seriesList.filter((i) => i.is_must_see).length },
            { id: 'videos', label: 'Episodes & Reels', icon: Film, count: videoList.filter((i) => i.is_must_see).length },
            { id: 'blogs', label: 'Blog Articles', icon: FileText, count: blogList.filter((i) => i.is_must_see).length },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#ECC979] text-[#101418] shadow-md'
                    : 'bg-[var(--lr-bg-surface,#111A22)] text-[var(--lr-text-secondary,#9AA7B4)] border border-[var(--lr-border-primary,#27313A)] hover:bg-[var(--lr-bg-elevated,#151F28)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-[#101418] text-[#ECC979]' : 'bg-[#ECC979]/20 text-[#ECC979]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--lr-text-muted,#7E8B99)] pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--lr-bg-surface,#111A22)] border border-[var(--lr-border-primary,#27313A)] text-xs text-[var(--lr-text-primary,#F5F1E8)] placeholder-[var(--lr-text-muted,#7E8B99)] rounded-xl pl-9 pr-3 py-2 outline-none focus:border-[#ECC979]"
          />
        </div>
      </div>

      {/* Content Table / Cards */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-7 h-7 text-[#ECC979] animate-spin mb-2" />
            <p className="text-xs text-[var(--lr-text-secondary,#9AA7B4)]">Loading content items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 px-4 rounded-2xl bg-[var(--lr-bg-surface,#111A22)] border border-[var(--lr-border-primary,#27313A)] text-center">
            <p className="text-xs text-[var(--lr-text-muted,#7E8B99)]">No content found matching filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredItems.map((item) => {
              const isMarked = Boolean(item.is_must_see);
              const isToggling = togglingId === item.id;
              const imgUrl = item.cover_url || item.thumbnail_url || '/images/series_city_lights.jpg';
              const authorName = item.creator?.display_name || item.author?.display_name || 'Creator';

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 justify-between ${
                    isMarked
                      ? 'bg-gradient-to-r from-[#241C10] to-[var(--lr-bg-surface,#111A22)] border-[#ECC979]/50 shadow-md'
                      : 'bg-[var(--lr-bg-surface,#111A22)] border-[var(--lr-border-primary,#27313A)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-[#151D25]">
                      <Image src={imgUrl} alt={item.title} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {isMarked && (
                          <span className="px-1.5 py-0.2 rounded bg-[#ECC979] text-[#101418] text-[9px] font-black uppercase tracking-wider">
                            MUST SEE
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--lr-text-muted,#7E8B99)] truncate">
                          {item.category || authorName}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-[var(--lr-text-primary,#F5F1E8)] truncate mt-0.5">
                        {item.title}
                      </h3>
                      {item.views_count !== undefined && (
                        <p className="text-[10px] text-[var(--lr-text-muted,#7E8B99)] mt-0.5">
                          {item.views_count} views
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() =>
                      handleToggle(
                        activeTab === 'series' ? 'series' : activeTab === 'videos' ? 'video' : 'blog',
                        item.id,
                        isMarked
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                      isMarked
                        ? 'bg-[#ECC979] text-[#101418] hover:bg-[#D4A318]'
                        : 'bg-[var(--lr-bg-elevated,#18212B)] border border-[var(--lr-border-primary,#27313A)] text-[var(--lr-text-secondary,#9AA7B4)] hover:text-[#ECC979] hover:border-[#ECC979]/40'
                    }`}
                  >
                    {isToggling ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isMarked ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Must See</span>
                      </>
                    ) : (
                      <span>+ Mark</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
