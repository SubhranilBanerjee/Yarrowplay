'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  History,
  Search,
  Moon,
  Sun,
  Crown,
  Trash2,
  Pause,
  Play,
  ArrowLeft,
  AlertTriangle,
  Check,
  Download,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useWallet } from '@/context/WalletContext';

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { openSubscriptionModal } = useWallet();

  const [isLoading, setIsLoading] = useState(true);
  const [pauseWatchHistory, setPauseWatchHistory] = useState(false);
  const [isUpdatingPause, setIsUpdatingPause] = useState(false);

  // Search History
  const [searches, setSearches] = useState<{ id: string; query: string; created_at: string }[]>([]);
  const [isLoadingSearches, setIsLoadingSearches] = useState(true);

  // Confirmation Modals
  const [showClearWatchModal, setShowClearWatchModal] = useState(false);
  const [isClearingWatch, setIsClearingWatch] = useState(false);
  const [showClearSearchModal, setShowClearSearchModal] = useState(false);
  const [isClearingSearch, setIsClearingSearch] = useState(false);

  // Toast / Status banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (!user) {
      router.push('/login?next=/settings');
      return;
    }

    async function loadSettings() {
      setIsLoading(true);
      try {
        const [settingsRes, searchRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/search-history'),
        ]);

        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          setPauseWatchHistory(Boolean(sData.settings?.pause_watch_history));
        }

        if (searchRes.ok) {
          const sData = await searchRes.json();
          setSearches(sData.history || []);
        }
      } catch (err) {
        console.error('Failed to load settings data:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingSearches(false);
      }
    }

    loadSettings();
  }, [user, router]);

  // Handle Toggle Pause Watch History
  const handleTogglePause = async () => {
    const nextState = !pauseWatchHistory;
    setIsUpdatingPause(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pause_watch_history: nextState }),
      });

      if (res.ok) {
        setPauseWatchHistory(nextState);
        showToast(
          nextState
            ? 'Watch history is now paused. New activity will not be recorded.'
            : 'Watch history resumed. Your watch progress will be saved.'
        );
      } else {
        showToast('Failed to update watch history preference.');
      }
    } catch {
      showToast('Network error updating watch history preference.');
    } finally {
      setIsUpdatingPause(false);
    }
  };

  // Handle Clear Watch History
  const handleConfirmClearWatch = async () => {
    setIsClearingWatch(true);
    try {
      const res = await fetch('/api/watch-history?clear_all=true', { method: 'DELETE' });
      if (res.ok) {
        setShowClearWatchModal(false);
        showToast('Watch history has been cleared permanently.');
      } else {
        showToast('Failed to clear watch history.');
      }
    } catch {
      showToast('Network error clearing watch history.');
    } finally {
      setIsClearingWatch(false);
    }
  };

  // Handle Clear Search History
  const handleConfirmClearSearch = async () => {
    setIsClearingSearch(true);
    try {
      const res = await fetch('/api/search-history?clear_all=true', { method: 'DELETE' });
      if (res.ok) {
        setSearches([]);
        setShowClearSearchModal(false);
        showToast('Search history has been cleared permanently.');
      } else {
        showToast('Failed to clear search history.');
      }
    } catch {
      showToast('Network error clearing search history.');
    } finally {
      setIsClearingSearch(false);
    }
  };

  // Delete single search item
  const handleDeleteSearchItem = async (query: string) => {
    setSearches((prev) => prev.filter((item) => item.query !== query));
    try {
      await fetch(`/api/search-history?query=${encodeURIComponent(query)}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to remove query:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--lr-bg)] text-[var(--lr-text-primary)] transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[var(--lr-card-bg)] border border-[#ECC979] text-[var(--lr-text-primary)] px-4 py-3 rounded-xl shadow-2xl animate-fade-in text-sm font-medium">
          <Check className="w-4 h-4 text-[#ECC979]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Navigation & Title */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-[var(--lr-card-bg)] border border-[var(--lr-border)] flex items-center justify-center hover:border-[#ECC979] transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--lr-text-muted)] hover:text-[#ECC979]" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-xs sm:text-sm text-[var(--lr-text-muted)] mt-0.5">
              Manage your playback history, privacy, theme, and subscription
            </p>
          </div>
        </div>

        {/* Profile Snapshot Header */}
        <div className="p-5 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#182330] border border-[var(--lr-border)] flex items-center justify-center text-xl font-bold text-[#ECC979]">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (profile?.display_name || user?.email || 'U')[0].toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  {profile?.display_name || 'Lighthouse Member'}
                </h2>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#ECC979]/15 text-[#ECC979] border border-[#ECC979]/30">
                  {profile?.vip_tier && profile.vip_tier !== 'none' && profile.vip_tier !== 'free'
                    ? `${profile.vip_tier} VIP`
                    : 'Free Tier'}
                </span>
              </div>
              <p className="text-xs text-[var(--lr-text-muted)] mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openSubscriptionModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-[#ECC979] to-[#D4A745] hover:brightness-105 active:scale-95 text-[#101418] font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow transition-all cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              <span>
                {profile?.vip_tier && profile.vip_tier !== 'none' && profile.vip_tier !== 'free'
                  ? 'Manage Plan'
                  : 'Subscribe to VIP'}
              </span>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. WATCH HISTORY SETTINGS */}
          <div className="p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#ECC979]/10 text-[#ECC979] flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Watch History</h3>
                <p className="text-xs text-[var(--lr-text-muted)]">Control how playback activity is recorded</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {/* Pause Watch History Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--lr-bg)] border border-[var(--lr-border)]">
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Pause Watch History</span>
                    {pauseWatchHistory && (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                        PAUSED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--lr-text-muted)] mt-1">
                    When enabled, any new episodes or reels you watch will not be logged. Existing history is preserved.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isUpdatingPause}
                  onClick={handleTogglePause}
                  className={`relative shrink-0 w-12 h-6.5 rounded-full transition-colors duration-200 cursor-pointer ${
                    pauseWatchHistory ? 'bg-[#ECC979]' : 'bg-[var(--lr-border)]'
                  }`}
                  aria-label="Toggle pause watch history"
                >
                  <span
                    className={`inline-block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                      pauseWatchHistory ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/history"
                  className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-[var(--lr-bg)] border border-[var(--lr-border)] hover:border-[#ECC979] transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-[#ECC979]" />
                  <span>View Watch History</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setShowClearWatchModal(true)}
                  className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/60 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Watch History</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. SEARCH HISTORY SETTINGS */}
          <div className="p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ECC979]/10 text-[#ECC979] flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Search History</h3>
                  <p className="text-xs text-[var(--lr-text-muted)]">Manage your search query history</p>
                </div>
              </div>

              {searches.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearSearchModal(true)}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {isLoadingSearches ? (
              <div className="p-4 text-center text-xs text-[var(--lr-text-muted)]">Loading search history...</div>
            ) : searches.length === 0 ? (
              <div className="p-4 rounded-xl bg-[var(--lr-bg)] border border-[var(--lr-border)] text-center text-xs text-[var(--lr-text-muted)]">
                No recent searches saved.
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[var(--lr-text-muted)]">Recent queries:</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {searches.slice(0, 15).map((item) => (
                    <div
                      key={item.id || item.query}
                      className="group flex items-center gap-2 bg-[var(--lr-bg)] border border-[var(--lr-border)] hover:border-[#ECC979]/40 text-xs px-3 py-1.5 rounded-full transition-colors"
                    >
                      <Link href={`/search?q=${encodeURIComponent(item.query)}`} className="hover:text-[#ECC979]">
                        {item.query}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteSearchItem(item.query)}
                        className="text-[var(--lr-text-muted)] hover:text-red-400 transition-colors"
                        aria-label={`Remove ${item.query}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. THEME SELECTION */}
          <div className="p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#ECC979]/10 text-[#ECC979] flex items-center justify-center">
                {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold">Appearance</h3>
                <p className="text-xs text-[var(--lr-text-muted)]">Choose your preferred visual theme</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-xl border flex items-center gap-3.5 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-[#ECC979] bg-[#ECC979]/10'
                    : 'border-[var(--lr-border)] bg-[var(--lr-bg)] hover:border-[#ECC979]/40'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#0E1318] border border-[#212A34] flex items-center justify-center text-[#ECC979]">
                  <Moon className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Dark Mode</span>
                    {theme === 'dark' && <Check className="w-4 h-4 text-[#ECC979]" />}
                  </div>
                  <p className="text-xs text-[var(--lr-text-muted)] mt-0.5">
                    Sleek cinematic theme optimized for OLED & low light
                  </p>
                </div>
              </button>

              {/* Light Mode Option */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-4 rounded-xl border flex items-center gap-3.5 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-[#ECC979] bg-[#ECC979]/10'
                    : 'border-[var(--lr-border)] bg-[var(--lr-bg)] hover:border-[#ECC979]/40'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#F8F9FA] border border-[#D0D7DE] flex items-center justify-center text-[#ECC979]">
                  <Sun className="w-5 h-5" />
                </div>
                <div className="text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">Light Mode</span>
                    {theme === 'light' && <Check className="w-4 h-4 text-[#ECC979]" />}
                  </div>
                  <p className="text-xs text-[var(--lr-text-muted)] mt-0.5">
                    Clean high-contrast theme for bright environments
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 4. APP DOWNLOAD & LINKS */}
          <div className="p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#ECC979]/10 text-[#ECC979] flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Lighthouse Mobile App</h3>
                <p className="text-xs text-[var(--lr-text-muted)]">
                  Take premium reels and original series anywhere on iOS and Android
                </p>
              </div>
            </div>

            <Link
              href="/download"
              className="flex items-center justify-center gap-2 bg-[var(--lr-bg)] border border-[var(--lr-border)] hover:border-[#ECC979] text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
            >
              <Download className="w-3.5 h-3.5 text-[#ECC979]" />
              <span>Get Download Links</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Clear Watch History */}
      {showClearWatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--lr-text-primary)]">Clear Watch History?</h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--lr-text-muted)] leading-relaxed mb-6">
              This will permanently delete all your watch history and progress across all devices. This action cannot be
              undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isClearingWatch}
                onClick={() => setShowClearWatchModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--lr-bg)] border border-[var(--lr-border)] hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingWatch}
                onClick={handleConfirmClearWatch}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isClearingWatch ? 'Clearing...' : 'Yes, Clear History'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear Search History */}
      {showClearSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[var(--lr-card-bg)] border border-[var(--lr-border)] shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[var(--lr-text-primary)]">Clear Search History?</h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--lr-text-muted)] leading-relaxed mb-6">
              This will permanently remove all your past search queries from your account. This action cannot be
              undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isClearingSearch}
                onClick={() => setShowClearSearchModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--lr-bg)] border border-[var(--lr-border)] hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isClearingSearch}
                onClick={handleConfirmClearSearch}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isClearingSearch ? 'Clearing...' : 'Yes, Clear Searches'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
