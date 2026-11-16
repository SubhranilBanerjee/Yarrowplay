'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Trophy,
  Crown,
  Sparkles,
  Flame,
  Play,
  Heart,
  Check,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Coins,
  Gift,
  Award,
  ChevronRight,
  Share2,
  X,
  Volume2,
  VolumeX,
  TrendingUp,
  UserCheck,
  Zap,
  Film,
  ShieldCheck,
  Palette,
  Plus,
  Layers,
  Settings,
  Calendar,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useWallet } from '@/context/WalletContext';
import { createClient } from '@/lib/supabase/client';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { CompetingReel, Competition, CompetitionTheme } from '@/data/competition';

// Preset theme gradients for quick design
const GRADIENT_PRESETS = [
  { name: 'Obsidian Violet', value: 'from-[#2A0845] via-[#1B053A] to-[#0A0216]', accent: '#A855F7' },
  { name: 'Cyberpunk Neon', value: 'from-[#3B0764] via-[#4A044E] to-[#140224]', accent: '#EC4899' },
  { name: 'Emerald Noir', value: 'from-[#064E3B] via-[#022C22] to-[#051610]', accent: '#10B981' },
  { name: 'Crimson Fury', value: 'from-[#450A0A] via-[#2A0505] to-[#0F0202]', accent: '#EF4444' },
  { name: 'Midnight Amber', value: 'from-[#291804] via-[#1C0F02] to-[#0A0501]', accent: '#F59E0B' },
  { name: 'Deep Cyber Ocean', value: 'from-[#082F49] via-[#0C4A6E] to-[#03131E]', accent: '#38BDF8' },
];

export default function CompetitionPage() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { openCoinStore } = useWallet();

  // Dynamic Competition & Reel State from Supabase
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [reels, setReels] = useState<CompetingReel[]>([]);
  const [themesList, setThemesList] = useState<CompetitionTheme[]>([]);
  const [competitionsHistory, setCompetitionsHistory] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Modal State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'votes' | 'views'>('votes');
  const [activeVideoModal, setActiveVideoModal] = useState<CompetingReel | null>(null);

  // Voting State
  const [votedVideoIds, setVotedVideoIds] = useState<Set<string>>(new Set());
  const [voteToast, setVoteToast] = useState<{ show: boolean; title: string; remaining: number } | null>(null);
  const [nominateModalOpen, setNominateModalOpen] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Creator Video Submission Modal State
  const [creatorPublishedVideos, setCreatorPublishedVideos] = useState<any[]>([]);
  const [loadingCreatorVideos, setLoadingCreatorVideos] = useState(false);
  const [selectedVideoToSubmit, setSelectedVideoToSubmit] = useState('');
  const [submittingEntry, setSubmittingEntry] = useState(false);
  const [submitEntryMsg, setSubmitEntryMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals for Admin Actions
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showCreateThemeModal, setShowCreateThemeModal] = useState(false);
  const [showThemeCatalogModal, setShowThemeCatalogModal] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);

  // Launch Competition Form State
  const [launchThemeId, setLaunchThemeId] = useState<string>('');
  const [launchTitle, setLaunchTitle] = useState('');
  const [launchSeasonNumber, setLaunchSeasonNumber] = useState(1);
  const [launchPrizeCash, setLaunchPrizeCash] = useState(50000);
  const [launchPrizeCoins, setLaunchPrizeCoins] = useState(50000);
  const [launchDurationDays, setLaunchDurationDays] = useState(14);
  const [launchDescription, setLaunchDescription] = useState('');

  // Create Theme Form State
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeTagline, setNewThemeTagline] = useState('');
  const [newThemeCategory, setNewThemeCategory] = useState('Sci-Fi');
  const [newThemeEmoji, setNewThemeEmoji] = useState('🚀');
  const [newThemeDescription, setNewThemeDescription] = useState('');
  const [newThemeGradient, setNewThemeGradient] = useState(GRADIENT_PRESETS[0].value);
  const [newThemeAccent, setNewThemeAccent] = useState(GRADIENT_PRESETS[0].accent);
  const [newThemeRules, setNewThemeRules] = useState('');

  // Check admin authorization strictly from verified server-backed profile
  const isAdmin = useMemo(() => {
    if (profile?.role === 'admin') return true;
    const envAdmin = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase();
    if (user?.email && envAdmin && user.email.trim().toLowerCase() === envAdmin) return true;
    return false;
  }, [profile, user]);

  // Daily vote budget (3 votes per day)
  const DAILY_VOTE_LIMIT = 3;
  const votesCastToday = votedVideoIds.size;
  const votesRemaining = Math.max(0, DAILY_VOTE_LIMIT - votesCastToday);

  // Dynamic countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Load live dynamic competition data & user votes from Supabase
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/competition');
      if (res.ok) {
        const data = await res.json();
        if (data.competition) {
          setCompetition(data.competition);
          setLaunchSeasonNumber((data.competition.season_number || 1) + 1);
          if (data.competition.theme_id) {
            setLaunchThemeId(data.competition.theme_id);
          }
        } else {
          setCompetition(null);
        }
        if (Array.isArray(data.items)) {
          setReels(data.items);
        } else {
          setReels([]);
        }
        if (Array.isArray(data.themes)) {
          setThemesList(data.themes);
          if (!launchThemeId && data.themes[0]) {
            setLaunchThemeId(data.themes[0].id);
          }
        }
        if (Array.isArray(data.competitions)) {
          setCompetitionsHistory(data.competitions);
        }
        if (Array.isArray(data.userVotedIds)) {
          setVotedVideoIds(new Set(data.userVotedIds));
        }
      }
    } catch (err) {
      console.warn('Failed to load dynamic competition data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch creator's published videos when nomination modal opens
  useEffect(() => {
    if (nominateModalOpen && user) {
      const currentUserId = user.id;
      async function loadPublishedVideos() {
        setLoadingCreatorVideos(true);
        setSubmitEntryMsg(null);
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from('videos')
            .select('id, title, thumbnail_url, category, duration_seconds, views_count, status')
            .eq('creator_id', currentUserId)
            .eq('status', 'published')
            .order('created_at', { ascending: false });

          if (data && data.length > 0) {
            setCreatorPublishedVideos(data);
            if (!selectedVideoToSubmit) {
              setSelectedVideoToSubmit(data[0].id);
            }
          } else {
            setCreatorPublishedVideos([]);
          }
        } catch {
          setCreatorPublishedVideos([]);
        } finally {
          setLoadingCreatorVideos(false);
        }
      }

      loadPublishedVideos();
    }
  }, [nominateModalOpen, user]);

  // Handle explicit submission of video into championship
  const handleSubmitVideoEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoToSubmit || !competition?.id) return;
    setSubmittingEntry(true);
    setSubmitEntryMsg(null);

    try {
      const res = await fetch('/api/competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_entry',
          competitionId: competition.id,
          videoId: selectedVideoToSubmit,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitEntryMsg({ type: 'success', text: data.message || 'Video entered successfully!' });
        if (data.items) {
          setReels(data.items);
        } else {
          await loadData();
        }
        setTimeout(() => {
          setNominateModalOpen(false);
          setSubmitEntryMsg(null);
        }, 1800);
      } else {
        setSubmitEntryMsg({ type: 'error', text: data.error || 'Failed to submit entry.' });
      }
    } catch {
      setSubmitEntryMsg({ type: 'error', text: 'Network error submitting entry.' });
    } finally {
      setSubmittingEntry(false);
    }
  };

  // Handle Admin: Create New Theme
  const handleCreateTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim()) return;

    setAdminActionLoading(true);
    try {
      const rulesArray = newThemeRules
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const res = await fetch('/api/competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_theme',
          name: newThemeName.trim(),
          tagline: newThemeTagline.trim(),
          description: newThemeDescription.trim(),
          category: newThemeCategory,
          badgeEmoji: newThemeEmoji,
          bannerGradient: newThemeGradient,
          accentColor: newThemeAccent,
          rules: rulesArray.length > 0 ? rulesArray : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.themes) {
          setThemesList(data.themes);
        }
        if (data.theme) {
          setLaunchThemeId(data.theme.id);
        }
        setShowCreateThemeModal(false);
        setNewThemeName('');
        setNewThemeTagline('');
        setNewThemeDescription('');
        setNewThemeRules('');
        setAdminNotice(`Theme "${data.theme?.name}" created successfully! Ready to launch.`);
        setTimeout(() => setAdminNotice(null), 5000);
      }
    } catch (err) {
      console.error('Failed to create theme:', err);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Handle Admin: Launch New Competition
  const handleLaunchCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminActionLoading(true);

    try {
      const selectedTheme = themesList.find((t) => t.id === launchThemeId);
      const titleToUse = launchTitle.trim() || `${selectedTheme?.name || 'Creator'} Championship`;

      const res = await fetch('/api/competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'launch_competition',
          themeId: launchThemeId,
          title: titleToUse,
          seasonNumber: Number(launchSeasonNumber) || 1,
          prizeCashInr: Number(launchPrizeCash) || 50000,
          prizeCoins: Number(launchPrizeCoins) || 50000,
          durationDays: Number(launchDurationDays) || 14,
          description: launchDescription.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.competition) {
          setCompetition(data.competition);
          setLaunchSeasonNumber((data.competition.season_number || 1) + 1);
        }
        if (data.competitions) {
          setCompetitionsHistory(data.competitions);
        }
        setShowLaunchModal(false);
        setAdminNotice(`🎉 Season ${data.competition?.season_number} Launched Live with Theme "${data.competition?.theme_name}"!`);
        setTimeout(() => setAdminNotice(null), 6000);
      }
    } catch (err) {
      console.error('Failed to launch competition:', err);
    } finally {
      setAdminActionLoading(false);
    }
  };

  // Handle Casting a Vote
  const handleVote = async (reel: CompetingReel, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (votedVideoIds.has(reel.videoId)) {
      setVoteToast({
        show: true,
        title: `You already voted for "${reel.title}"!`,
        remaining: votesRemaining,
      });
      setTimeout(() => setVoteToast(null), 3000);
      return;
    }

    if (votesRemaining <= 0) {
      setVoteToast({
        show: true,
        title: 'You used all 3 free votes for today! Come back tomorrow or boost with Coins.',
        remaining: 0,
      });
      setTimeout(() => setVoteToast(null), 3500);
      return;
    }

    // Optimistically update UI vote counts
    const updatedVotes = reel.votes + 1;
    setReels((prev) =>
      prev.map((r) => (r.videoId === reel.videoId ? { ...r, votes: updatedVotes } : r))
    );

    const newVotedSet = new Set(votedVideoIds);
    newVotedSet.add(reel.videoId);
    setVotedVideoIds(newVotedSet);

    try {
      localStorage.setItem('lr_competition_votes', JSON.stringify(Array.from(newVotedSet)));
    } catch {}

    const newRemaining = Math.max(0, DAILY_VOTE_LIMIT - newVotedSet.size);

    setVoteToast({
      show: true,
      title: `🎉 Vote registered for "${reel.title}"!`,
      remaining: newRemaining,
    });
    setTimeout(() => setVoteToast(null), 3500);

    // Call API in background to persist in Supabase
    try {
      await fetch('/api/competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId: competition?.id || 'active',
          videoId: reel.videoId,
        }),
      });
    } catch (err) {
      console.warn('Vote recorded locally');
    }
  };

  // Dynamically extract categories from currently loaded items
  const categories = useMemo(() => {
    const cats = new Set<string>();
    reels.forEach((r) => {
      if (r.category && r.category.trim()) {
        cats.add(r.category.trim());
      }
    });
    return ['All', ...Array.from(cats).sort()];
  }, [reels]);

  // Active theme details
  const activeTheme: CompetitionTheme | undefined = useMemo(() => {
    if (competition?.theme) return competition.theme;
    if (competition?.theme_id) {
      return themesList.find((t) => t.id === competition.theme_id);
    }
    return themesList[0] || undefined;
  }, [competition, themesList]);

  // Dynamically compute prize breakdown from active competition bounty
  const prizeCash = competition?.prize_cash_inr || 0;
  const prizeCoins = competition?.prize_coins || 0;

  const firstPlaceCash = Math.round(prizeCash * 0.6);
  const firstPlaceCoins = Math.round(prizeCoins * 0.6);

  const secondPlaceCash = Math.round(prizeCash * 0.25);
  const secondPlaceCoins = Math.round(prizeCoins * 0.25);

  const thirdPlaceCash = Math.round(prizeCash * 0.15);
  const thirdPlaceCoins = Math.round(prizeCoins * 0.15);

  const voterCoins = Math.round(prizeCoins * 0.1);

  // Filter & sort entries
  const filteredReels = useMemo(() => {
    return reels
      .filter((r) => {
        const matchesCategory =
          selectedCategory === 'All' ||
          (r.category || '').toLowerCase() === selectedCategory.toLowerCase();
        const matchesSearch =
          searchQuery.trim() === '' ||
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'votes') return b.votes - a.votes;
        return parseInt(b.views) - parseInt(a.views);
      });
  }, [reels, selectedCategory, searchQuery, sortBy]);

  // Dynamic Leaderboard Podium Top 3 (sorted strictly by votes)
  const topThree = useMemo(() => {
    const sorted = [...reels].sort((a, b) => b.votes - a.votes);
    return {
      first: sorted[0] || null,
      second: sorted[1] || null,
      third: sorted[2] || null,
    };
  }, [reels]);

  const totalVotesAcrossAll = useMemo(() => {
    return reels.reduce((sum, item) => sum + item.votes, 0);
  }, [reels]);

  return (
    <div
      className={`min-h-screen py-8 px-3 sm:px-6 md:px-8 max-w-7xl mx-auto transition-colors duration-300 font-sans selection:bg-purple-600 selection:text-white ${
        isLight ? 'text-slate-900' : 'text-white'
      }`}
    >
      {/* ========================================================================= */}
      {/* ADMIN CONTROLS TOOLBAR & NOTIFICATION                                     */}
      {/* ========================================================================= */}
      {isAdmin && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-900/20 border border-purple-500/30 backdrop-blur-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-200">
                  Admin Mode: Active
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-purple-300/80">
                Active Theme: &quot;{activeTheme?.name || 'Default'}&quot; • {themesList.length} Themes Available
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setLaunchTitle(`${activeTheme?.name || 'Creator'} Championship`);
                setLaunchDescription(activeTheme?.description || '');
                setShowLaunchModal(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black shadow-md shadow-amber-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 fill-black" />
              <span>Launch Competition</span>
            </button>

            <button
              onClick={() => setShowCreateThemeModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Theme</span>
            </button>

            <button
              onClick={() => setShowThemeCatalogModal(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden sm:inline">Theme Catalog ({themesList.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin Notice Banner */}
      {adminNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-xl animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{adminNotice}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DYNAMIC HERO & COMPETITION SEASON BANNER (THEME-POWERED)               */}
      {/* ========================================================================= */}
      {isLoading ? (
        <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 p-8 sm:p-12 mb-12 bg-[#120726]/60 animate-pulse">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl w-full">
              <div className="h-6 w-48 rounded-full bg-purple-500/20" />
              <div className="h-10 w-3/4 rounded-2xl bg-purple-500/20" />
              <div className="h-4 w-full rounded-full bg-purple-500/10" />
              <div className="h-4 w-2/3 rounded-full bg-purple-500/10" />
            </div>
            <div className="w-full sm:w-[340px] h-60 rounded-2xl bg-purple-500/10" />
          </div>
        </section>
      ) : (
        <section
          className={`relative overflow-hidden rounded-3xl border border-purple-500/30 p-6 sm:p-10 md:p-12 mb-12 bg-gradient-to-br ${
            activeTheme?.bannerGradient || 'from-[#1A0B36] via-[#120726] to-[#080214]'
          } text-white shadow-2xl shadow-purple-950/40`}
        >
          {/* Ambient Glow Orbs */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-0 -ml-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12">
            {/* Left Column: Title, Season, Theme & Description */}
            <div className="space-y-4 max-w-2xl text-center lg:text-left">
              {/* Season & Theme Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-wider uppercase backdrop-blur-md shadow-sm">
                  <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>Season {competition?.season_number || 1} Championship</span>
                </div>

                {activeTheme && (
                  <div
                    onClick={() => setShowThemeCatalogModal(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-purple-200 text-xs font-bold tracking-wider cursor-pointer transition-colors"
                  >
                    <span>{activeTheme.badgeEmoji || '🎨'}</span>
                    <span>Theme: {activeTheme.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-200 uppercase">
                      {activeTheme.category}
                    </span>
                  </div>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-none bg-gradient-to-r from-white via-purple-100 to-amber-200 bg-clip-text text-transparent filter drop-shadow">
                {competition?.title || `${activeTheme?.name || 'Creator'} Championship`}
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-purple-200/90 leading-relaxed max-w-xl">
                {competition?.description || activeTheme?.description ||
                  'Viewers decide who wins! Vote for your favorite vertical reels and micro-series. The #1 creator takes home the Grand Prize, and voters can win bonus rewards!'}
              </p>

              {/* Theme Criteria & Guidelines Callout */}
              {activeTheme && activeTheme.rules && activeTheme.rules.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-black/40 border border-purple-500/30 text-left space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Theme Submission Criteria ({activeTheme.name}):</span>
                  </div>
                  <ul className="text-[11px] text-purple-200/90 space-y-0.5 list-disc list-inside">
                    {activeTheme.rules.slice(0, 3).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Rules & Voter Allowance Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs text-white backdrop-blur-md">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Your Votes Today:{' '}
                    <strong className="text-amber-300 font-bold">
                      {votesRemaining} of {DAILY_VOTE_LIMIT} left
                    </strong>
                  </span>
                </div>

                <button
                  onClick={() => setShowRulesModal(true)}
                  className="text-xs font-semibold text-purple-300 hover:text-white underline underline-offset-4 cursor-pointer transition-colors"
                >
                  View Reward & Voting Rules
                </button>
              </div>
            </div>

            {/* Right Column: Live Countdown Clock & Grand Prize Showcase */}
            <div className="w-full lg:w-auto shrink-0 flex flex-col items-center">
              <div className="w-full sm:w-[340px] rounded-2xl border border-amber-400/30 p-5 bg-gradient-to-b from-[#2B1254]/90 to-[#180A30]/95 backdrop-blur-xl shadow-xl text-center space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-200 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Voting Closes In</span>
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                    Live Season
                  </span>
                </div>

                {/* Dynamic Countdown Digits */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'DAYS', val: timeLeft ? timeLeft.days : 0 },
                    { label: 'HOURS', val: timeLeft ? timeLeft.hours : 0 },
                    { label: 'MINS', val: timeLeft ? timeLeft.minutes : 0 },
                    { label: 'SECS', val: timeLeft ? timeLeft.seconds : 0 },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-black/40 border border-purple-500/30 flex flex-col items-center justify-center"
                    >
                      <span className="font-mono text-xl sm:text-2xl font-black text-amber-300">
                        {item.val.toString().padStart(2, '0')}
                      </span>
                      <span className="text-[9px] font-bold tracking-wider text-purple-300/80">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Dynamic Prize Pool Display */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-600/20 border border-amber-400/40 text-left flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-200 block">
                      Total Season Bounty
                    </span>
                    <div className="text-lg font-black text-amber-300 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span>
                        {prizeCash > 0 && prizeCoins > 0
                          ? `${prizeCoins.toLocaleString()} Coins + ₹${prizeCash.toLocaleString()}`
                          : prizeCash > 0
                          ? `₹${prizeCash.toLocaleString()}`
                          : `${prizeCoins.toLocaleString()} Coins`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-purple-300 block">
                      Total Votes
                    </span>
                    <span className="text-sm font-extrabold text-white">
                      {totalVotesAcrossAll.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Submit Reel CTA for Creators */}
                <button
                  onClick={() => setNominateModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Nominate / Enter Reel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. DYNAMIC LIVE LEADERBOARD PODIUM (TOP 3 CONTENDERS)                     */}
      {/* ========================================================================= */}
      <section className="mb-14 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              <Crown className="w-4 h-4" />
              <span>Current Leaders</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
              Live Season Podium
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[var(--lr-text-muted,#9AA7B4)] max-w-md">
            The top 3 highest voted creators at the end of the countdown receive official cash & coin rewards.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 rounded-3xl bg-purple-500/10 border border-purple-500/20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* Rank 2 (Silver) */}
            {topThree.second && (
              <div
                onClick={() => setActiveVideoModal(topThree.second)}
                className="order-2 md:order-1 relative rounded-3xl p-5 border border-slate-300/40 dark:border-slate-500/30 bg-gradient-to-b from-slate-200/50 to-slate-100/30 dark:from-[#1A1828] dark:to-[#0F0D1A] group cursor-pointer hover:scale-[1.02] transition-all shadow-xl"
              >
                <div className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-black text-xs uppercase tracking-wider border border-white/20 flex items-center gap-1 shadow-md">
                  <span>🥈 2nd Place</span>
                </div>

                <div className="relative aspect-[9/12] w-full rounded-2xl overflow-hidden mb-4 bg-black/40">
                  <Image
                    src={topThree.second.thumbnail}
                    alt={topThree.second.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md uppercase">
                      {topThree.second.category}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base mt-1 line-clamp-1">
                      {topThree.second.title}
                    </h3>
                    <p className="text-xs text-purple-200">{topThree.second.creator}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                      Votes Tally
                    </span>
                    <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                      {topThree.second.votes.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleVote(topThree.second!, e)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      votedVideoIds.has(topThree.second.videoId)
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white dark:bg-white/10 hover:bg-purple-600 hover:text-white border border-purple-500/30'
                    }`}
                  >
                    {votedVideoIds.has(topThree.second.videoId) ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                    )}
                    <span>{votedVideoIds.has(topThree.second.videoId) ? 'Voted' : 'Vote'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold - Center & Elevated) */}
            {topThree.first && (
              <div
                onClick={() => setActiveVideoModal(topThree.first)}
                className="order-1 md:order-2 relative rounded-3xl p-6 border-2 border-amber-400/80 bg-gradient-to-b from-amber-500/15 via-[#231242] to-[#120824] group cursor-pointer hover:scale-[1.03] transition-all shadow-2xl shadow-amber-500/20 md:-translate-y-3"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs uppercase tracking-wider border border-amber-200 flex items-center gap-1.5 shadow-lg">
                  <Crown className="w-4 h-4 fill-black" />
                  <span>🥇 1st Place (Leader)</span>
                </div>

                <div className="relative aspect-[9/13] w-full rounded-2xl overflow-hidden mb-4 bg-black/40">
                  <Image
                    src={topThree.first.thumbnail}
                    alt={topThree.first.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-400 text-black uppercase tracking-wider">
                      {topThree.first.category}
                    </span>
                    <h3 className="font-extrabold text-base sm:text-lg mt-1 line-clamp-1 drop-shadow">
                      {topThree.first.title}
                    </h3>
                    <p className="text-xs text-amber-200 font-semibold">{topThree.first.creator}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-400/20">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-200/80 block">
                      Leading Votes
                    </span>
                    <span className="text-xl font-black text-amber-300">
                      {topThree.first.votes.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleVote(topThree.first!, e)}
                    className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                      votedVideoIds.has(topThree.first.videoId)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black shadow-amber-500/40'
                    }`}
                  >
                    {votedVideoIds.has(topThree.first.videoId) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Heart className="w-4 h-4 fill-black" />
                    )}
                    <span>{votedVideoIds.has(topThree.first.videoId) ? 'Voted' : 'Vote Leader'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {topThree.third && (
              <div
                onClick={() => setActiveVideoModal(topThree.third)}
                className="order-3 relative rounded-3xl p-5 border border-amber-700/40 dark:border-amber-700/30 bg-gradient-to-b from-amber-900/10 to-amber-950/20 dark:from-[#1D1216] dark:to-[#12080D] group cursor-pointer hover:scale-[1.02] transition-all shadow-xl"
              >
                <div className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full bg-amber-800 text-amber-100 font-black text-xs uppercase tracking-wider border border-white/20 flex items-center gap-1 shadow-md">
                  <span>🥉 3rd Place</span>
                </div>

                <div className="relative aspect-[9/12] w-full rounded-2xl overflow-hidden mb-4 bg-black/40">
                  <Image
                    src={topThree.third.thumbnail}
                    alt={topThree.third.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md uppercase">
                      {topThree.third.category}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base mt-1 line-clamp-1">
                      {topThree.third.title}
                    </h3>
                    <p className="text-xs text-purple-200">{topThree.third.creator}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-500/80 block">
                      Votes Tally
                    </span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                      {topThree.third.votes.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleVote(topThree.third!, e)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      votedVideoIds.has(topThree.third.videoId)
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white dark:bg-white/10 hover:bg-purple-600 hover:text-white border border-purple-500/30'
                    }`}
                  >
                    {votedVideoIds.has(topThree.third.videoId) ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                    )}
                    <span>{votedVideoIds.has(topThree.third.videoId) ? 'Voted' : 'Vote'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic Empty State if no entries exist yet */}
        {!isLoading && reels.length === 0 && (
          <div className="p-10 sm:p-14 rounded-3xl bg-white/5 border border-purple-500/20 text-center space-y-4 max-w-xl mx-auto backdrop-blur-xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No active competition entries right now</h3>
            <p className="text-xs sm:text-sm text-[var(--lr-text-muted,#9AA7B4)] leading-relaxed">
              Nominate your published reels or series to enter the live championship under theme &quot;{activeTheme?.name}&quot; and compete for{' '}
              {prizeCash > 0 && prizeCoins > 0
                ? `${prizeCoins.toLocaleString()} Coins + ₹${prizeCash.toLocaleString()} INR`
                : `${prizeCoins.toLocaleString()} Coins`}
              !
            </p>
            <button
              onClick={() => setNominateModalOpen(true)}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-purple-600/30"
            >
              Nominate Reel Now
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. DYNAMIC SEARCH, CATEGORY FILTERS & SORT BAR                            */}
      {/* ========================================================================= */}
      <section className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Dynamic Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30 scale-105'
                    : isLight
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    : 'bg-white/5 text-purple-200 hover:bg-white/10 border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input & Sort Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search reels or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-1.5 rounded-full text-xs border focus:outline-none focus:border-purple-500 transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    : 'bg-white/5 border-white/10 text-white placeholder-purple-300/50'
                }`}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-purple-300 hidden sm:inline">Sort:</span>
              <button
                onClick={() => setSortBy(sortBy === 'votes' ? 'views' : 'votes')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                  isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-purple-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{sortBy === 'votes' ? 'Most Votes' : 'Most Views'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. DYNAMIC COMPETING REELS GRID                                          */}
      {/* ========================================================================= */}
      <section className="mb-16">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="aspect-[9/16] rounded-2xl bg-purple-500/10 border border-purple-500/20" />
            ))}
          </div>
        ) : filteredReels.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white/5 border border-purple-500/20 text-center space-y-3">
            <Film className="w-8 h-8 text-purple-400 mx-auto" />
            <h4 className="text-base font-bold text-white">No matching competition reels</h4>
            <p className="text-xs text-slate-400">
              No entries found matching &quot;{searchQuery || selectedCategory}&quot;.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {filteredReels.map((reel, index) => {
              const hasVoted = votedVideoIds.has(reel.videoId);
              const rank = index + 1;

              return (
                <div
                  key={reel.id}
                  onClick={() => setActiveVideoModal(reel)}
                  className={`relative aspect-[9/16] rounded-2xl overflow-hidden border group cursor-pointer select-none transition-all duration-300 hover:scale-[1.02] ${
                    hasVoted
                      ? 'border-purple-500 shadow-lg shadow-purple-600/25 ring-2 ring-purple-500/50'
                      : isLight
                      ? 'bg-slate-100 border-purple-200 shadow-md hover:border-purple-400'
                      : 'bg-[#120726] border-purple-500/20 shadow-xl hover:border-purple-400 hover:shadow-purple-900/30'
                  }`}
                >
                  {/* Thumbnail Image */}
                  <Image
                    src={reel.thumbnail}
                    alt={reel.title}
                    fill
                    sizes="(max-width: 640px) 180px, 240px"
                    className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />

                  {/* Scrim Gradients */}
                  <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-none" />

                  {/* Top Badges: Rank & Category */}
                  <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between z-10">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md ${
                        rank === 1
                          ? 'bg-amber-400 text-black font-extrabold'
                          : rank === 2
                          ? 'bg-slate-200 text-slate-900'
                          : rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-black/60 backdrop-blur-md text-white border border-white/20'
                      }`}
                    >
                      #{rank}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/90 border border-white/20">
                      {reel.duration}
                    </span>
                  </div>

                  {/* Play Button Icon on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all duration-300 shadow-xl">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom Details & Vote Button */}
                  <div className="absolute bottom-0 inset-x-0 p-3 z-10 flex flex-col justify-end text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                      {reel.category}
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm line-clamp-1 group-hover:text-purple-200 transition-colors drop-shadow">
                      {reel.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-purple-200/90 mt-0.5 mb-2.5">
                      <span className="truncate max-w-[100px]">{reel.creator}</span>
                      <span className="text-amber-300 font-bold">{reel.votes.toLocaleString()} votes</span>
                    </div>

                    {/* High Contrast Vote Action Button */}
                    <button
                      onClick={(e) => handleVote(reel, e)}
                      className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${
                        hasVoted
                          ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                          : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      {hasVoted ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Voted</span>
                        </>
                      ) : (
                        <>
                          <Heart className="w-3.5 h-3.5 fill-white stroke-none" />
                          <span>Vote ({reel.votes})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. DYNAMIC PRIZE BREAKDOWN & REWARD DISTRIBUTION                          */}
      {/* ========================================================================= */}
      <section className="mb-14 rounded-3xl border border-purple-500/20 p-6 sm:p-8 bg-gradient-to-br from-[#120726] to-[#0A0318] text-white">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            Championship Reward Distribution
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-purple-200/80 mb-6 max-w-2xl leading-relaxed">
          The competition rewards both top creators and active viewers. At the conclusion of Season{' '}
          {competition?.season_number || 1}, rewards are distributed automatically to winners&apos; wallets.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: 1st Place */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-2">
            <span className="text-xl">🥇</span>
            <h4 className="font-bold text-sm text-amber-300">1st Place Champion</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>₹{firstPlaceCash.toLocaleString()} Cash</strong> +{' '}
              <strong>{firstPlaceCoins.toLocaleString()} Coins</strong> + 30 Days Homepage Spotlight + Golden Verified Creator Badge.
            </p>
          </div>

          {/* Card 2: 2nd Place */}
          <div className="p-4 rounded-2xl bg-slate-400/10 border border-slate-400/30 space-y-2">
            <span className="text-xl">🥈</span>
            <h4 className="font-bold text-sm text-slate-200">2nd Place Contender</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>₹{secondPlaceCash.toLocaleString()} Cash</strong> +{' '}
              <strong>{secondPlaceCoins.toLocaleString()} Coins</strong> + 14 Days Category Feature + Silver Creator Badge.
            </p>
          </div>

          {/* Card 3: 3rd Place */}
          <div className="p-4 rounded-2xl bg-amber-800/20 border border-amber-700/40 space-y-2">
            <span className="text-xl">🥉</span>
            <h4 className="font-bold text-sm text-amber-400">3rd Place Contender</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>₹{thirdPlaceCash.toLocaleString()} Cash</strong> +{' '}
              <strong>{thirdPlaceCoins.toLocaleString()} Coins</strong> + Platform Feature + Bronze Creator Badge.
            </p>
          </div>

          {/* Card 4: Voter Community Lucky Draw */}
          <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/30 space-y-2">
            <span className="text-xl">🎁</span>
            <h4 className="font-bold text-sm text-pink-300">Active Voter Lucky Draw</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>{voterCoins.toLocaleString()} Coins</strong> shared among lucky viewers who voted for the winning reel!
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. VOTE TOAST BANNER                                                      */}
      {/* ========================================================================= */}
      {voteToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 to-slate-900 border border-purple-400/40 text-white shadow-2xl flex items-center gap-3 max-w-md">
            <div className="w-9 h-9 rounded-full bg-purple-600/40 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-bold">{voteToast.title}</p>
              <p className="text-[11px] text-purple-200/80">
                {voteToast.remaining > 0
                  ? `${voteToast.remaining} daily votes remaining today.`
                  : 'Daily vote allowance reached.'}
              </p>
            </div>
            <button
              onClick={() => setVoteToast(null)}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. VIDEO TRAILER PREVIEW MODAL                                            */}
      {/* ========================================================================= */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-slate-950 border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/90 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-600/80 text-white">
                  {activeVideoModal.category}
                </span>
                <h3 className="font-bold text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                  {activeVideoModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer transition-colors text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src={activeVideoModal.videoUrl}
                poster={activeVideoModal.thumbnail}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            {/* Modal Footer with Vote CTA */}
            <div className="p-4 bg-slate-900/90 border-t border-white/10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-purple-300 font-semibold">{activeVideoModal.creator}</span>
                <p className="text-xs text-slate-400">
                  {activeVideoModal.votes.toLocaleString()} votes • {activeVideoModal.duration}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleVote(activeVideoModal)}
                  className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    votedVideoIds.has(activeVideoModal.videoId)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md hover:opacity-90'
                  }`}
                >
                  {votedVideoIds.has(activeVideoModal.videoId) ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Voted</span>
                    </>
                  ) : (
                    <>
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>Vote for this Reel</span>
                    </>
                  )}
                </button>

                <Link
                  href="/home"
                  className="px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 text-xs font-semibold transition-colors"
                >
                  Explore More
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. RULES MODAL                                                            */}
      {/* ========================================================================= */}
      {showRulesModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowRulesModal(false)}
        >
          <div
            className="relative w-full max-w-lg bg-slate-950 border border-purple-500/40 rounded-3xl p-6 text-white space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg">Championship Rules &amp; Guidelines</h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              {activeTheme && (
                <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-1">
                  <div className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <span>{activeTheme.badgeEmoji}</span>
                    <span>Current Active Theme: {activeTheme.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{activeTheme.description}</p>
                </div>
              )}

              <div>
                <strong className="text-white block mb-1">1. Daily Voting Allowance</strong>
                Every verified viewer receives 3 free votes every 24 hours. You can vote for 3 different reels or concentrate your votes.
              </div>
              <div>
                <strong className="text-white block mb-1">2. Fair Play &amp; Anti-Bot Protection</strong>
                All votes are verified. Duplicate accounts or artificial bot manipulation are automatically disqualified by platform moderation.
              </div>
              <div>
                <strong className="text-white block mb-1">3. Creator Payout Schedule</strong>
                Winners are locked in at the expiration of the timer. Coin and cash prizes are credited within 48 hours to the creator&apos;s wallet.
              </div>
              <div>
                <strong className="text-white block mb-1">4. Voter Community Pool</strong>
                Active viewers who vote for the champion share the community bonus coins pool!
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Got It, Let&apos;s Vote!
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. CREATOR NOMINATION MODAL                                               */}
      {/* ========================================================================= */}
      {nominateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setNominateModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-slate-950 border border-purple-500/40 rounded-3xl p-6 text-white space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Enter Reel into Season {competition?.season_number || 1}</h3>
              </div>
              <button
                onClick={() => setNominateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!user ? (
              <div className="text-center py-6 space-y-3">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                <p className="text-sm font-semibold">Creator Account Required</p>
                <p className="text-xs text-slate-300">
                  Please sign in or create an account to enter your published reels into this competition.
                </p>
                <Link
                  href="/login"
                  className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Sign In to Enter
                </Link>
              </div>
            ) : loadingCreatorVideos ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-purple-300">Loading your published reels...</p>
              </div>
            ) : creatorPublishedVideos.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <Film className="w-10 h-10 text-purple-400 mx-auto" />
                <p className="text-sm font-semibold">No Published Videos Found</p>
                <p className="text-xs text-slate-300">
                  You don&apos;t have any published vertical reels yet. Publish a reel in Creator Studio to submit it to the competition!
                </p>
                <Link
                  href="/creator/studio"
                  className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Go to Creator Studio →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitVideoEntry} className="space-y-4">
                <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Active Theme: &quot;{activeTheme?.name || 'Open Championship'}&quot;</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Category: <strong>{activeTheme?.category || 'All Categories'}</strong>. Selected video will be displayed in the competition and compete for real cash &amp; coin rewards.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-purple-200">Select Reel to Submit:</label>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {creatorPublishedVideos.map((vid) => (
                      <label
                        key={vid.id}
                        onClick={() => setSelectedVideoToSubmit(vid.id)}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          selectedVideoToSubmit === vid.id
                            ? 'bg-purple-600/20 border-purple-400 shadow-md'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedReel"
                          checked={selectedVideoToSubmit === vid.id}
                          onChange={() => setSelectedVideoToSubmit(vid.id)}
                          className="accent-purple-500"
                        />
                        {vid.thumbnail_url ? (
                          <img
                            src={vid.thumbnail_url}
                            alt={vid.title}
                            className="w-12 h-16 object-cover rounded-lg shrink-0 border border-white/10"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-purple-900/50 rounded-lg shrink-0 flex items-center justify-center">
                            <Film className="w-5 h-5 text-purple-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{vid.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                            <span className="capitalize">{vid.category || 'General'}</span>
                            <span>•</span>
                            <span>{vid.views_count || 0} views</span>
                            {vid.duration_seconds && (
                              <>
                                <span>•</span>
                                <span>{Math.round(vid.duration_seconds)}s</span>
                              </>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {submitEntryMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      submitEntryMsg.type === 'success'
                        ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {submitEntryMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{submitEntryMsg.text}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={submittingEntry || !selectedVideoToSubmit}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submittingEntry ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Crown className="w-3.5 h-3.5 text-amber-300" />
                        <span>Enter Competition</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNominateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-white/20 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. ADMIN MODAL: LAUNCH NEW COMPETITION WITH THEME                        */}
      {/* ========================================================================= */}
      {showLaunchModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowLaunchModal(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#0f0720] border border-purple-500/40 rounded-3xl p-6 sm:p-8 text-white space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg sm:text-xl uppercase tracking-tight">Launch New Competition</h3>
                  <p className="text-xs text-purple-300/80">Select a theme and launch the next official championship season</p>
                </div>
              </div>
              <button
                onClick={() => setShowLaunchModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLaunchCompetition} className="space-y-4">
              {/* Select Theme */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-purple-200">
                    Select Competition Theme:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLaunchModal(false);
                      setShowCreateThemeModal(true);
                    }}
                    className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Theme</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {themesList.map((t) => {
                    const isSelected = launchThemeId === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setLaunchThemeId(t.id);
                          setLaunchTitle(`${t.name} Championship`);
                          setLaunchDescription(t.description);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-purple-600/30 border-amber-400 shadow-md ring-1 ring-amber-400/60'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base">{t.badgeEmoji || '🎬'}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-purple-200">
                            {t.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs mt-1 text-white truncate">{t.name}</h4>
                        <p className="text-[10px] text-slate-300 line-clamp-1">{t.tagline || t.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Title & Season */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-purple-200">Championship Title</label>
                  <input
                    type="text"
                    required
                    value={launchTitle}
                    onChange={(e) => setLaunchTitle(e.target.value)}
                    placeholder="e.g. Cyberpunk 2099 Championship"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">Season #</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={launchSeasonNumber}
                    onChange={(e) => setLaunchSeasonNumber(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                  />
                </div>
              </div>

              {/* Prizes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">Grand Prize Cash (₹ INR)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={launchPrizeCash}
                    onChange={(e) => setLaunchPrizeCash(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex gap-1.5 pt-1">
                    {[25000, 50000, 100000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setLaunchPrizeCash(val)}
                        className="px-2 py-0.5 rounded text-[10px] bg-white/10 hover:bg-white/20 text-slate-300"
                      >
                        ₹{(val / 1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">Grand Prize Coins</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    required
                    value={launchPrizeCoins}
                    onChange={(e) => setLaunchPrizeCoins(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                  <div className="flex gap-1.5 pt-1">
                    {[25000, 50000, 100000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setLaunchPrizeCoins(val)}
                        className="px-2 py-0.5 rounded text-[10px] bg-white/10 hover:bg-white/20 text-slate-300"
                      >
                        {(val / 1000).toFixed(0)}k Coins
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Duration Days */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-200">Duration (Countdown Days)</label>
                <div className="flex items-center gap-2">
                  {[7, 14, 21, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setLaunchDurationDays(d)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        launchDurationDays === d
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-200">Competition Brief for Creators</label>
                <textarea
                  rows={2}
                  value={launchDescription}
                  onChange={(e) => setLaunchDescription(e.target.value)}
                  placeholder="Tell creators and voters what this championship is about..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowLaunchModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminActionLoading}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trophy className="w-4 h-4 fill-black" />
                  <span>{adminActionLoading ? 'Launching...' : '🚀 Launch Active Competition'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. ADMIN MODAL: CREATE NEW THEME                                         */}
      {/* ========================================================================= */}
      {showCreateThemeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowCreateThemeModal(false)}
        >
          <div
            className="relative w-full max-w-xl bg-[#0f0720] border border-purple-500/40 rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg uppercase tracking-tight">Theme Studio</h3>
                  <p className="text-xs text-purple-300/80">Design and register a custom competition theme</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateThemeModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTheme} className="space-y-3.5">
              {/* Theme Name & Emoji */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3 space-y-1">
                  <label className="text-xs font-bold text-purple-200">Theme Name</label>
                  <input
                    type="text"
                    required
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                    placeholder="e.g. Retro VHS 80s Slasher"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">Emoji Icon</label>
                  <input
                    type="text"
                    value={newThemeEmoji}
                    onChange={(e) => setNewThemeEmoji(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-sm text-center text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Tagline & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">Category / Genre</label>
                  <select
                    value={newThemeCategory}
                    onChange={(e) => setNewThemeCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1a0e33] border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400"
                  >
                    {['Sci-Fi', 'Romance', 'Thriller', 'Comedy', 'Action', 'Drama', 'Horror', 'Documentary', 'Fantasy', 'Music'].map(
                      (cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">Catchy Tagline</label>
                  <input
                    type="text"
                    value={newThemeTagline}
                    onChange={(e) => setNewThemeTagline(e.target.value)}
                    placeholder="e.g. High-Tension Analog Horrors"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-200">Theme Description / Creative Brief</label>
                <textarea
                  rows={2}
                  required
                  value={newThemeDescription}
                  onChange={(e) => setNewThemeDescription(e.target.value)}
                  placeholder="Describe what kind of stories, lighting, camera angles, or mood creators should produce..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              {/* Atmosphere Gradient Preset */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-200">Atmosphere Visual Preset</label>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENT_PRESETS.map((p) => {
                    const isSelected = newThemeGradient === p.value;
                    return (
                      <div
                        key={p.name}
                        onClick={() => {
                          setNewThemeGradient(p.value);
                          setNewThemeAccent(p.accent);
                        }}
                        className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                          isSelected ? 'border-amber-400 bg-white/10 ring-1 ring-amber-400' : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className={`h-4 w-full rounded bg-gradient-to-r ${p.value} mb-1 border border-white/10`} />
                        <span className="text-[10px] font-bold text-slate-300 block truncate">{p.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rules / Submission Criteria */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-purple-200">
                  Submission Criteria / Rules (one per line)
                </label>
                <textarea
                  rows={2}
                  value={newThemeRules}
                  onChange={(e) => setNewThemeRules(e.target.value)}
                  placeholder="Vertical 9:16 format required&#10;Original audio score or dialogue&#10;Under 90 seconds"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateThemeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/20 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminActionLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{adminActionLoading ? 'Saving...' : '✨ Save & Register Theme'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. ADMIN MODAL: THEME CATALOG BROWSER                                    */}
      {/* ========================================================================= */}
      {showThemeCatalogModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowThemeCatalogModal(false)}
        >
          <div
            className="relative w-full max-w-3xl bg-[#0f0720] border border-purple-500/40 rounded-3xl p-6 sm:p-8 text-white space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-lg">Championship Theme Catalog ({themesList.length})</h3>
              </div>
              <button
                onClick={() => setShowThemeCatalogModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {themesList.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:border-purple-400/50 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-2xl">{t.badgeEmoji || '🎬'}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-500/30">
                        {t.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white">{t.name}</h4>
                    <p className="text-xs text-purple-200/80 mt-1">{t.tagline || t.description}</p>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {t.rules?.length || 3} Submission Rules
                    </span>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setLaunchThemeId(t.id);
                          setLaunchTitle(`${t.name} Championship`);
                          setLaunchDescription(t.description);
                          setShowThemeCatalogModal(false);
                          setShowLaunchModal(true);
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-bold uppercase bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:opacity-90"
                      >
                        Launch
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
