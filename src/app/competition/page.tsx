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
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useWallet } from '@/context/WalletContext';
import { CoinIcon } from '@/components/ui/CoinIcon';
import { CompetingReel, DEFAULT_COMPETITION_ITEMS } from '@/data/competition';

const CATEGORIES = ['All', 'Drama', 'Thriller', 'Romance', 'Action', 'Sci-Fi', 'Comedy'];

export default function CompetitionPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { openCoinStore } = useWallet();

  const [competition, setCompetition] = useState<any>({
    id: 'comp-season-4',
    title: 'Lighthouse Creator Championship • Season 4',
    description: 'Viewers choose the champion! Vote for your favorite short reel or episodic drama. The highest voted creator wins ₹50,000 INR Cash + 50,000 Coins!',
    season_number: 4,
    prize_coins: 50000,
    prize_cash_inr: 50000,
    end_date: new Date(Date.now() + 18 * 86400000).toISOString(),
    total_votes: 0,
    entries_count: 0,
  });

  const [reels, setReels] = useState<CompetingReel[]>(DEFAULT_COMPETITION_ITEMS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'votes' | 'views'>('votes');
  const [activeVideoModal, setActiveVideoModal] = useState<CompetingReel | null>(null);

  // Voting State: set of videoIds user has voted for
  const [votedVideoIds, setVotedVideoIds] = useState<Set<string>>(new Set());
  const [voteToast, setVoteToast] = useState<{ show: boolean; title: string; remaining: number } | null>(null);
  const [nominateModalOpen, setNominateModalOpen] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Daily vote budget (3 votes per day)
  const DAILY_VOTE_LIMIT = 3;
  const votesCastToday = votedVideoIds.size;
  const votesRemaining = Math.max(0, DAILY_VOTE_LIMIT - votesCastToday);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 18,
    hours: 14,
    minutes: 32,
    seconds: 45,
  });

  // Load live competition data & user votes
  useEffect(() => {
    // 1. Load local votes from localStorage
    try {
      const savedVotes = localStorage.getItem('lr_competition_votes_s4');
      if (savedVotes) {
        setVotedVideoIds(new Set(JSON.parse(savedVotes)));
      }
    } catch {}

    // 2. Fetch from API
    async function loadData() {
      try {
        const res = await fetch('/api/competition');
        if (res.ok) {
          const data = await res.json();
          if (data.competition) {
            setCompetition(data.competition);
          }
          if (data.items && data.items.length > 0) {
            setReels(data.items);
          }
          if (data.userVotedIds && data.userVotedIds.length > 0) {
            setVotedVideoIds((prev) => new Set([...prev, ...data.userVotedIds]));
          }
        }
      } catch (err) {
        console.warn('Using default competition data:', err);
      }
    }

    loadData();
  }, []);

  // Live countdown timer calculation
  useEffect(() => {
    const targetDate = new Date(competition.end_date || Date.now() + 18 * 86400000).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [competition.end_date]);

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
      localStorage.setItem('lr_competition_votes_s4', JSON.stringify(Array.from(newVotedSet)));
    } catch {}

    const newRemaining = Math.max(0, DAILY_VOTE_LIMIT - newVotedSet.size);

    setVoteToast({
      show: true,
      title: `🎉 Vote registered for "${reel.title}"!`,
      remaining: newRemaining,
    });
    setTimeout(() => setVoteToast(null), 3500);

    // Call API in background
    try {
      await fetch('/api/competition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId: competition.id,
          videoId: reel.videoId,
        }),
      });
    } catch (err) {
      console.warn('Vote synced locally');
    }
  };

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

  // Leaderboard Podium Top 3 (sorted by votes)
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
      {/* 1. HERO & COMPETITION SEASON BANNER                                       */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl border border-purple-500/30 p-6 sm:p-10 md:p-12 mb-12 bg-gradient-to-br from-[#1A0B36] via-[#120726] to-[#080214] text-white shadow-2xl shadow-purple-950/40">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 -ml-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12">
          {/* Left Column: Title, Season & Description */}
          <div className="space-y-4 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 border border-amber-400/40 text-amber-300 text-xs font-black tracking-wider uppercase backdrop-blur-md shadow-sm">
              <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Season 4 Live Championship</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-none bg-gradient-to-r from-white via-purple-100 to-amber-200 bg-clip-text text-transparent filter drop-shadow">
              Community Choice Awards
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-purple-200/90 leading-relaxed max-w-xl">
              Viewers decide who wins! Vote for your favorite vertical reels and micro-series. The #1 creator takes home the{' '}
              <span className="text-amber-300 font-bold">50,000 Coins + ₹50,000 INR</span> Grand Prize, and voters can win bonus rewards!
            </p>

            {/* Quick Rules & Voter Allowance Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
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
                  Live
                </span>
              </div>

              {/* Countdown Digits */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'DAYS', val: timeLeft.days },
                  { label: 'HOURS', val: timeLeft.hours },
                  { label: 'MINS', val: timeLeft.minutes },
                  { label: 'SECS', val: timeLeft.seconds },
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

              {/* Prize Pool Display */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-600/20 border border-amber-400/40 text-left flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-200 block">
                    Total Season Bounty
                  </span>
                  <div className="text-lg font-black text-amber-300 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>50,000 Coins + ₹50,000</span>
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
                <span>Nominate / Enter Your Reel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. LIVE LEADERBOARD PODIUM (TOP 3 CONTENDERS)                              */}
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
                  {votedVideoIds.has(topThree.second.videoId) ? <Check className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />}
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
                  {votedVideoIds.has(topThree.first.videoId) ? <Check className="w-4 h-4" /> : <Heart className="w-4 h-4 fill-black" />}
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
                  {votedVideoIds.has(topThree.third.videoId) ? <Check className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />}
                  <span>{votedVideoIds.has(topThree.third.videoId) ? 'Voted' : 'Vote'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {!topThree.first && (
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-3 max-w-xl mx-auto">
            <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white">No active competition entries right now</h3>
            <p className="text-xs text-[var(--lr-text-muted,#9AA7B4)]">
              Nominate your published reels or series to enter the live championship and compete for ₹50,000 INR Cash + 50,000 Coins!
            </p>
            <button
              onClick={() => setNominateModalOpen(true)}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer"
            >
              Nominate Reel Now
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3. SEARCH, CATEGORY FILTERS & SORT BAR                                    */}
      {/* ========================================================================= */}
      <section className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
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
      {/* 4. ALL COMPETING REELS GRID                                               */}
      {/* ========================================================================= */}
      <section className="mb-16">
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
      </section>

      {/* ========================================================================= */}
      {/* 5. PRIZE BREAKDOWN & REWARD DISTRIBUTION                                  */}
      {/* ========================================================================= */}
      <section className="mb-14 rounded-3xl border border-purple-500/20 p-6 sm:p-8 bg-gradient-to-br from-[#120726] to-[#0A0318] text-white">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-400" />
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
            Championship Reward Distribution
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-purple-200/80 mb-6 max-w-2xl leading-relaxed">
          The competition rewards both top creators and active viewers. At the conclusion of Season 4, rewards are distributed automatically to winners' wallets.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: 1st Place */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-2">
            <span className="text-xl">🥇</span>
            <h4 className="font-bold text-sm text-amber-300">1st Place Champion</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>₹50,000 Cash</strong> + <strong>50,000 Coins</strong> + 30 Days Homepage Spotlight + Golden Verified Creator Badge.
            </p>
          </div>

          {/* Card 2: 2nd Place */}
          <div className="p-4 rounded-2xl bg-slate-400/10 border border-slate-400/30 space-y-2">
            <span className="text-xl">🥈</span>
            <h4 className="font-bold text-sm text-slate-200">2nd Place Contender</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>₹20,000 Cash</strong> + <strong>20,000 Coins</strong> + 14 Days Category Feature + Silver Creator Badge.
            </p>
          </div>

          {/* Card 3: 3rd Place */}
          <div className="p-4 rounded-2xl bg-amber-800/20 border border-amber-700/40 space-y-2">
            <span className="text-xl">🥉</span>
            <h4 className="font-bold text-sm text-amber-400">3rd Place Contender</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>₹10,000 Cash</strong> + <strong>10,000 Coins</strong> + Platform Feature + Bronze Creator Badge.
            </p>
          </div>

          {/* Card 4: Voter Community Lucky Draw */}
          <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/30 space-y-2">
            <span className="text-xl">🎁</span>
            <h4 className="font-bold text-sm text-pink-300">Active Voter Lucky Draw</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>5,000 Coins</strong> shared among 10 lucky viewers who voted for the winning reel!
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
                <h3 className="font-bold text-lg">Championship Rules & Guidelines</h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <strong className="text-white block mb-1">1. Daily Voting Allowance</strong>
                Every verified viewer receives 3 free votes every 24 hours. You can vote for 3 different reels or concentrate your votes.
              </div>
              <div>
                <strong className="text-white block mb-1">2. Fair Play & Anti-Bot Protection</strong>
                All votes are verified. Duplicate accounts or artificial bot manipulation are automatically disqualified by platform moderation.
              </div>
              <div>
                <strong className="text-white block mb-1">3. Creator Payout Schedule</strong>
                Winners are locked in at the expiration of the timer. Coin and cash prizes are credited within 48 hours to the creator's wallet.
              </div>
              <div>
                <strong className="text-white block mb-1">4. Voter Community Pool</strong>
                10 random lucky viewers who voted for the 1st place winner are rewarded 500 bonus coins each!
              </div>
            </div>

            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider"
            >
              Got It, Let's Vote!
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
            className="relative w-full max-w-md bg-slate-950 border border-purple-500/40 rounded-3xl p-6 text-white space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Enter Reel into Season 4</h3>
              </div>
              <button
                onClick={() => setNominateModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Published your vertical reel or micro-series? Head to Creator Studio to upload or nominate an existing published reel into the active championship round!
            </p>

            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Eligibility Requirements:</span>
              </div>
              <ul className="list-disc list-inside text-slate-300 space-y-1 pl-1">
                <li>Published status approved by moderation</li>
                <li>Vertical format (9:16 aspect ratio)</li>
                <li>Original creator-owned content</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/creator/studio"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-center font-bold text-xs uppercase tracking-wider text-white shadow-md hover:opacity-90"
              >
                Open Creator Studio →
              </Link>
              <button
                onClick={() => setNominateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

