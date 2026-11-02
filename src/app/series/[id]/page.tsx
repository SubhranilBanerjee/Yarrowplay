'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { BrandLogo } from '@/components/landing/BrandLogo';
import {
  Play,
  Star,
  Bookmark,
  Share2,
  Film,
  Sparkles,
  ChevronLeft,
  Clock,
  Eye,
  Heart,
  MessageSquare,
  ThumbsUp,
  Check,
  Lock,
  Unlock,
  X,
  Layers,
  Send,
  ShieldCheck,
  Tv,
  ArrowRight,
} from 'lucide-react';

interface EpisodeItem {
  id: string;
  episode_number: number;
  title: string;
  description?: string;
  thumbnail_url: string;
  video_url: string;
  duration_seconds: number;
  views_count: number;
  likes_count: number;
  is_locked: boolean;
  price_inr?: number;
}

interface SeriesReview {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number; // 1-5
  title: string;
  content: string;
  helpful_count: number;
  created_at: string;
  is_helpful?: boolean;
}

interface SeriesComment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  likes_count: number;
  created_at: string;
  user_liked?: boolean;
}

interface SeriesDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  cover_url: string;
  total_episodes: number;
  created_at: string;
  creator?: {
    id: string;
    display_name: string;
    username: string;
    avatar_url?: string;
    bio?: string;
  };
  episodes: EpisodeItem[];
}

export default function SeriesInfoPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const rawSeriesId = (params?.id as string) || '';
  const cleanSeriesId = rawSeriesId.replace(/^series-/, '');

  const [series, setSeries] = useState<SeriesDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'episodes' | 'premise' | 'reviews' | 'comments' | 'related'>('episodes');
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active video trailer/player modal
  const [activeVideoModal, setActiveVideoModal] = useState<EpisodeItem | null>(null);

  // Reviews state (strictly dynamic)
  const [reviews, setReviews] = useState<SeriesReview[]>([]);

  // Review Form state
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Comments state (strictly dynamic)
  const [comments, setComments] = useState<SeriesComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Related series state (strictly dynamic from Supabase)
  const [relatedSeriesList, setRelatedSeriesList] = useState<any[]>([]);

  // Show bottom toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Fetch Series details from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadSeries() {
      setIsLoading(true);
      try {
        // Query Supabase content_series
        const { data: dbSeries, error: sErr } = await supabase
          .from('content_series')
          .select(`
            id,
            title,
            description,
            category,
            tags,
            cover_url,
            total_episodes,
            created_at,
            creator:profiles(id, display_name, username, avatar_url, bio),
            episodes:videos(
              id,
              episode_number,
              title,
              description,
              thumbnail_url,
              video_url,
              duration_seconds,
              views_count,
              likes_count,
              is_locked,
              price_inr
            )
          `)
          .eq('id', cleanSeriesId)
          .maybeSingle();

        if (dbSeries && isMounted) {
          const sortedEpisodes = (dbSeries.episodes || []).sort(
            (a: any, b: any) => (a.episode_number || 1) - (b.episode_number || 1)
          );

          setSeries({
            id: dbSeries.id,
            title: dbSeries.title || 'Untitled Series',
            description: dbSeries.description || 'No premise synopsis provided for this series.',
            category: dbSeries.category || 'Drama',
            tags: dbSeries.tags || ['Micro-Series', 'Original'],
            cover_url: dbSeries.cover_url || '/images/reel_whispers.jpg',
            total_episodes: dbSeries.total_episodes || sortedEpisodes.length || 1,
            created_at: dbSeries.created_at || new Date().toISOString(),
            creator: dbSeries.creator as any,
            episodes: sortedEpisodes,
          });

          // Fetch related series from Supabase with same category
          const { data: relData } = await supabase
            .from('content_series')
            .select('id, title, category, cover_url, total_episodes, creator:profiles(display_name)')
            .neq('id', cleanSeriesId)
            .limit(4);

          if (relData && isMounted) {
            setRelatedSeriesList(relData);
          }

          // Fetch dynamic comments from Supabase
          try {
            const { data: dbComments } = await supabase
              .from('comments')
              .select('id, user_id, content, created_at, likes_count, user:profiles(display_name, username, avatar_url)')
              .eq('content_id', cleanSeriesId)
              .order('created_at', { ascending: false });

            if (dbComments && isMounted) {
              setComments(
                dbComments.map((c: any) => ({
                  id: c.id,
                  user_id: c.user_id,
                  user_name: c.user?.display_name || c.user?.username || 'Viewer',
                  user_avatar: c.user?.avatar_url,
                  content: c.content,
                  likes_count: c.likes_count || 0,
                  created_at: new Date(c.created_at).toLocaleDateString(),
                  user_liked: false,
                }))
              );
            }
          } catch {}
        } else {
          // Strictly dynamic: if not found in database, set series to null
          if (isMounted) {
            setSeries(null);
          }
        }

        // Check if in user watchlist
        if (user && isMounted) {
          const { data: wlData } = await supabase
            .from('watchlists')
            .select('id')
            .eq('user_id', user.id)
            .eq('series_id', cleanSeriesId)
            .maybeSingle();

          if (wlData) setIsInWatchlist(true);
        }
      } catch (err) {
        console.error('Error fetching series details:', err);
        if (isMounted) setSeries(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSeries();
    return () => {
      isMounted = false;
    };
  }, [cleanSeriesId, user, supabase]);

  // Average Rating calculation
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return '5.0';
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // Toggle Watchlist
  const handleToggleWatchlist = async () => {
    if (!user) {
      showToast('Please sign in to save this series to your watchlist!');
      return;
    }

    try {
      if (isInWatchlist) {
        await supabase
          .from('watchlists')
          .delete()
          .eq('user_id', user.id)
          .eq('series_id', cleanSeriesId);
        setIsInWatchlist(false);
        showToast('Removed from your Watchlist');
      } else {
        await supabase.from('watchlists').insert({
          user_id: user.id,
          series_id: cleanSeriesId,
        });
        setIsInWatchlist(true);
        showToast('Added to your Watchlist! ❤️');
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
      setIsInWatchlist(!isInWatchlist);
      showToast(isInWatchlist ? 'Removed from Watchlist' : 'Added to Watchlist!');
    }
  };

  // Share link
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      if (navigator.share) {
        navigator.share({
          title: series?.title || 'Lighthouse Reels Series',
          text: `Check out "${series?.title}" on Lighthouse Reels!`,
          url: window.location.href,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard! 📋');
      }
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle.trim() || !reviewContent.trim()) {
      showToast('Please provide both a title and review text.');
      return;
    }

    setIsSubmittingReview(true);
    const newRev: SeriesReview = {
      id: `rev-${Date.now()}`,
      user_id: user?.id || 'anon-user',
      user_name: profile?.display_name || profile?.username || 'Verified Viewer',
      user_avatar: profile?.avatar_url || undefined,
      rating: reviewRating,
      title: reviewTitle.trim(),
      content: reviewContent.trim(),
      helpful_count: 0,
      created_at: 'Just now',
      is_helpful: false,
    };

    setReviews([newRev, ...reviews]);
    setReviewTitle('');
    setReviewContent('');
    setIsSubmittingReview(false);
    showToast('Your review has been published! ⭐');
  };

  // Toggle Helpful on a review
  const handleToggleHelpful = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const nextHelpful = !r.is_helpful;
          return {
            ...r,
            is_helpful: nextHelpful,
            helpful_count: nextHelpful ? r.helpful_count + 1 : Math.max(0, r.helpful_count - 1),
          };
        }
        return r;
      })
    );
  };

  // Submit Comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    const commentText = newComment.trim();

    if (user) {
      try {
        await supabase.from('comments').insert({
          user_id: user.id,
          content_type: 'video',
          content_id: cleanSeriesId,
          content: commentText,
        });
      } catch {}
    }

    const newComm: SeriesComment = {
      id: `comm-${Date.now()}`,
      user_id: user?.id || 'anon-user',
      user_name: profile?.display_name || profile?.username || 'Viewer',
      user_avatar: profile?.avatar_url || undefined,
      content: commentText,
      likes_count: 0,
      created_at: 'Just now',
      user_liked: false,
    };

    setComments([newComm, ...comments]);
    setNewComment('');
    setIsSubmittingComment(false);
    showToast('Comment posted! 💬');
  };

  // Like a comment
  const handleToggleCommentLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          const nextLiked = !c.user_liked;
          return {
            ...c,
            user_liked: nextLiked,
            likes_count: nextLiked ? c.likes_count + 1 : Math.max(0, c.likes_count - 1),
          };
        }
        return c;
      })
    );
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isLight ? 'bg-white' : 'bg-[#080214]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-purple-500/30 border-t-purple-600 animate-spin" />
          <p className="text-sm font-bold text-purple-400 uppercase tracking-widest">Loading Dynamic Series...</p>
        </div>
      </div>
    );
  }

  // Strictly dynamic: If series not found in Supabase
  if (!series) {
    return (
      <div className={`min-h-screen font-sans ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#080214] text-white'}`}>
        <header className="px-4 sm:px-8 py-4 border-b border-purple-500/15 flex items-center justify-between">
          <BrandLogo href="/home" showText={true} />
          <Link
            href="/series"
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider text-white transition-all"
          >
            All Series
          </Link>
        </header>
        <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-300">
            <Film className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">Series Not Found</h2>
          <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
            This series does not exist or has been unpublished by the creator. Explore all live original series currently available on the platform!
          </p>
          <div className="pt-2">
            <Link
              href="/series"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/30"
            >
              <span>Explore Series Catalog →</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const firstEp = series.episodes?.[0];

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 relative selection:bg-purple-600 selection:text-white ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#080214] text-white'
      }`}
    >
      {/* 1. TOP NAVBAR HEADER */}
      <header className="sticky top-0 z-40 px-4 sm:px-8 py-3.5 backdrop-blur-xl border-b transition-colors border-purple-500/15 bg-slate-950/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/30 text-xs font-semibold text-white/90 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <BrandLogo href="/home" showText={true} />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/competition"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-amber-400/25 transition-all"
            >
              <span>Contest Arena</span>
            </Link>

            <button
              onClick={handleShare}
              className="p-2 rounded-full border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Share Series"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleToggleWatchlist}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isInWatchlist
                  ? 'bg-pink-600 text-white border-pink-500 shadow-lg shadow-pink-600/30'
                  : 'border-white/10 text-white/80 hover:text-white hover:bg-white/10'
              }`}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Save to Watchlist'}
            >
              <Bookmark className={`w-4 h-4 ${isInWatchlist ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. CINEMATIC BACKSTAGE HERO */}
      <section className="relative z-10 overflow-hidden border-b border-purple-500/20">
        <div className="absolute inset-0 z-0 pointer-events-none">
          {series.cover_url && (
            <Image
              src={series.cover_url}
              alt={series.title}
              fill
              className="object-cover opacity-20 filter blur-3xl scale-110"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080214] via-[#080214]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080214] via-[#080214]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-10 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left Column: Vertical Poster */}
            <div className="md:col-span-4 lg:col-span-3.5 flex justify-center md:justify-start">
              <div className="relative w-[240px] sm:w-[270px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-2 border-purple-400/40 group">
                <Image
                  src={series.cover_url}
                  alt={series.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md">
                    {series.category}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/20">
                    4K Vertical
                  </span>
                </div>

                <div
                  onClick={() => firstEp && setActiveVideoModal(firstEp)}
                  className="absolute inset-0 flex items-center justify-center cursor-pointer group-hover:bg-black/30 transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-xl shadow-purple-900/60 group-hover:scale-115 transition-transform">
                    <Play className="w-6 h-6 fill-white ml-1" />
                  </div>
                </div>

                <div className="absolute bottom-3 inset-x-3 text-center">
                  <span className="text-[11px] font-bold text-purple-200 bg-black/60 backdrop-blur-md py-1 px-3 rounded-full border border-white/10">
                    {series.episodes.length} Episodes Available
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Series Meta */}
            <div className="md:col-span-8 lg:col-span-8.5 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-600/30 text-purple-300 border border-purple-500/40">
                  {series.category}
                </span>
                {(series.tags || []).slice(0, 4).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/5 text-purple-200 border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
                  {series.title}
                </h1>
                <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
                  {series.description}
                </p>
              </div>

              {/* Creator Attribution */}
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/5 border border-purple-500/20 backdrop-blur-md max-w-md">
                <div className="relative w-11 h-11 rounded-full overflow-hidden border border-purple-400 shrink-0 bg-purple-950">
                  <Image
                    src={series.creator?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={series.creator?.display_name || 'Creator'}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white truncate">
                      {series.creator?.display_name || 'Studio Creator'}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  </div>
                  <span className="text-xs text-purple-300">
                    @{series.creator?.username || 'creator'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsFollowing(!isFollowing);
                    showToast(isFollowing ? 'Unfollowed creator' : 'Now following creator! 🔔');
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isFollowing
                      ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                      : 'bg-white text-purple-950 hover:bg-purple-100'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>

              {/* Metrics & Ratings */}
              <div className="flex flex-wrap items-center gap-5 sm:gap-8 pt-1 text-xs sm:text-sm text-purple-200">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-white text-base">{averageRating}</span>
                  <span className="opacity-70">({reviews.length} reviews)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white">{series.episodes.length}</span>
                  <span className="opacity-70">Episodes</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-white">
                    {series.episodes.reduce((acc, ep) => acc + (ep.views_count || 0), 0).toLocaleString()}
                  </span>
                  <span className="opacity-70">Views</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="opacity-70">~1m 30s / ep</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => firstEp && setActiveVideoModal(firstEp)}
                  className="px-7 py-3 rounded-full text-xs sm:text-sm font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-xl shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Watching Ep 1</span>
                </button>

                <button
                  onClick={() => firstEp && setActiveVideoModal(firstEp)}
                  className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider border border-white/20 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer flex items-center gap-2"
                >
                  <Tv className="w-4 h-4 text-purple-300" />
                  <span>Watch Trailer</span>
                </button>

                <button
                  onClick={handleToggleWatchlist}
                  className={`px-5 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-2 ${
                    isInWatchlist
                      ? 'bg-pink-600/30 border-pink-500 text-pink-300'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/90'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isInWatchlist ? 'fill-pink-400 text-pink-400' : ''}`} />
                  <span>{isInWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('reviews');
                    const revSection = document.getElementById('series-tabs');
                    if (revSection) revSection.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-5 py-3 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider border border-white/10 bg-white/5 hover:bg-white/10 text-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>Rate Series</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TABBED NAVIGATION */}
      <div id="series-tabs" className="sticky top-[61px] z-30 bg-[#080214]/90 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
          {[
            { id: 'episodes', label: `Episodes (${series.episodes.length})`, icon: Film },
            { id: 'premise', label: 'Premise & Story', icon: Sparkles },
            { id: 'reviews', label: `Reviews (${reviews.length})`, icon: Star },
            { id: 'comments', label: `Discussion (${comments.length})`, icon: MessageSquare },
            { id: 'related', label: `Related (${relatedSeriesList.length})`, icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-purple-200/80 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. TAB CONTENTS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
        {/* TAB 1: EPISODE GUIDE */}
        {activeTab === 'episodes' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-500/15">
              <div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                  Episode Guide
                </h2>
                <p className="text-xs sm:text-sm text-purple-200/80 mt-0.5">
                  Episodes 1-5 are completely FREE to stream! Later episodes can be unlocked with Coins or VIP subscription.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <Unlock className="w-3 h-3" />
                  <span>First 5 Free</span>
                </span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  <span>10 Coins / Locked Ep</span>
                </span>
              </div>
            </div>

            {/* Episodes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {series.episodes.map((ep) => {
                const isFree = ep.episode_number <= 5;
                const durMin = Math.floor(ep.duration_seconds / 60);
                const durSec = ep.duration_seconds % 60;
                const durDisplay = `${durMin}:${durSec < 10 ? '0' : ''}${durSec}`;

                return (
                  <div
                    key={ep.id}
                    onClick={() => setActiveVideoModal(ep)}
                    className="group relative rounded-2xl border border-purple-500/25 bg-[#120728]/80 hover:bg-[#180B34] p-3.5 transition-all duration-300 hover:scale-[1.02] hover:border-purple-400 cursor-pointer shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/60 mb-3">
                        <Image
                          src={ep.thumbnail_url || series.cover_url}
                          alt={ep.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/20">
                            EP {ep.episode_number < 10 ? `0${ep.episode_number}` : ep.episode_number}
                          </span>
                        </div>

                        <div className="absolute top-2 right-2">
                          {isFree ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md flex items-center gap-1">
                              <Unlock className="w-2.5 h-2.5" />
                              <span>Free</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black shadow-md flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>10 Coins</span>
                            </span>
                          )}
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-purple-600 transition-all">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>

                        <div className="absolute bottom-2 right-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white">
                            {durDisplay}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                        {ep.title}
                      </h3>
                      <p className="text-xs text-purple-200/70 line-clamp-2 mt-1 leading-relaxed">
                        {ep.description || `Episode ${ep.episode_number} of ${series.title}.`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-[11px] text-purple-200/80">
                      <span>{(ep.views_count || 0).toLocaleString()} views</span>
                      <span className="text-purple-400 font-bold group-hover:underline">
                        Watch Now →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PREMISE & STORY */}
        {activeTab === 'premise' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-purple-500/20 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>The Narrative Arc</span>
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                  Story Premise & Background
                </h2>
                <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed">
                  {series.description}
                </p>
                <p className="text-sm text-purple-200/80 leading-relaxed">
                  Engineered specifically for short-form vertical screens, this original series delivers high narrative velocity, psychological stakes, and character-driven cliffhangers.
                </p>
              </div>

              <div className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-purple-500/20 backdrop-blur-md space-y-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">
                  Why You'll Love It
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      title: 'Addictive Cliffhangers',
                      desc: 'Each episode leaves you on the edge of your seat with dramatic plot revelations.',
                    },
                    {
                      title: '4K Cinematic Framing',
                      desc: 'Vertical 9:16 cinematography tailored for seamless mobile absorption.',
                    },
                    {
                      title: 'Original Scoring',
                      desc: 'Bespoke atmospheric soundtrack amplifying tension in every beat.',
                    },
                    {
                      title: 'Bite-Sized Pacing',
                      desc: 'Crisp dialogue and rapid character evolution across micro-chapters.',
                    },
                  ].map((feat, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-pink-400 shrink-0" />
                        <h4 className="font-bold text-sm text-white">{feat.title}</h4>
                      </div>
                      <p className="text-xs text-purple-200/70 pl-6 leading-relaxed">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 rounded-3xl bg-white/5 border border-purple-500/20 backdrop-blur-md space-y-4">
                <h3 className="text-base font-black uppercase tracking-tight text-white border-b border-white/10 pb-3">
                  Production Specs
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-purple-300">Creator</span>
                    <span className="font-bold text-white">{series.creator?.display_name || 'Studio Creator'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Total Episodes</span>
                    <span className="font-bold text-white">{series.episodes.length} Episodes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Release Status</span>
                    <span className="font-bold text-emerald-400">Available to Stream</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Resolution</span>
                    <span className="font-bold text-white">4K Vertical HDR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-300">Category</span>
                    <span className="font-bold text-white">{series.category}</span>
                  </div>
                </div>
              </div>

              {/* Tags Cloud */}
              <div className="p-6 rounded-3xl bg-white/5 border border-purple-500/20 backdrop-blur-md space-y-3">
                <h3 className="text-base font-black uppercase tracking-tight text-white">
                  Content Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(series.tags || []).map((t, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-600/20 text-purple-300 border border-purple-500/30"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REVIEWS & RATINGS */}
        {activeTab === 'reviews' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#1C0B36] to-[#100624] border border-purple-500/30 text-center space-y-4">
                <span className="text-xs uppercase font-bold text-purple-300 tracking-wider">
                  Audience Rating Score
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl font-black text-white">{averageRating}</span>
                  <div className="text-left">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-5 h-5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs text-purple-200">{reviews.length} Ratings Submitted</span>
                  </div>
                </div>
              </div>

              {/* Write Review */}
              <div className="p-6 rounded-3xl bg-white/5 border border-purple-500/20 backdrop-blur-md space-y-4">
                <h3 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Write Your Review</span>
                </h3>

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                      Your Rating
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(0)}
                          onClick={() => setReviewRating(star)}
                          className="p-1 cursor-pointer transition-transform hover:scale-125"
                        >
                          <Star
                            className={`w-7 h-7 ${
                              star <= (reviewHoverRating || reviewRating)
                                ? 'fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                                : 'text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-purple-200 mb-1">
                      Review Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Absolutely hooked from Ep 1!"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-purple-200 mb-1">
                      Review Thoughts
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Share your thoughts on the acting, plot twists, and cinematography..."
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-400 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Submit Review
                  </button>
                </form>
              </div>
            </div>

            {/* Reviews Feed */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                  Community Reviews ({reviews.length})
                </h3>
              </div>

              {reviews.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                  <Star className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-sm font-semibold text-white">No Reviews Yet</p>
                  <p className="text-xs text-purple-200/70">
                    Be the first viewer to write a review and rate this series!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 rounded-2xl bg-white/5 border border-purple-500/15 backdrop-blur-md space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-900 flex items-center justify-center font-bold text-xs text-white">
                            {rev.user_name[0]}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">{rev.user_name}</span>
                            <span className="text-[10px] text-purple-300">{rev.created_at}</span>
                          </div>
                        </div>

                        <div className="flex text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-white">{rev.title}</h4>
                      <p className="text-xs text-purple-100/80 leading-relaxed">{rev.content}</p>

                      <div className="pt-2 flex items-center justify-between text-[11px] text-purple-300">
                        <button
                          onClick={() => handleToggleHelpful(rev.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                            rev.is_helpful
                              ? 'bg-purple-600/30 text-pink-300 border border-purple-400/40'
                              : 'hover:bg-white/10 text-purple-200'
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${rev.is_helpful ? 'fill-pink-400' : ''}`} />
                          <span>Helpful ({rev.helpful_count})</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: COMMENTS & DISCUSSION */}
        {activeTab === 'comments' && (
          <div className="max-w-3xl space-y-6">
            <div className="p-6 rounded-3xl bg-white/5 border border-purple-500/20 backdrop-blur-md space-y-4">
              <h3 className="text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>Join the Series Discussion</span>
              </h3>
              <p className="text-xs text-purple-200/80">
                Discuss plot theories, secret clues, and character motives with other fans.
              </p>

              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Share your thoughts on the plot, character motives, theories..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-400 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>
            </div>

            {/* Comments List */}
            {comments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <MessageSquare className="w-8 h-8 text-purple-400 mx-auto" />
                <p className="text-sm font-semibold text-white">No Comments Yet</p>
                <p className="text-xs text-purple-200/70">
                  Start the discussion! Share your predictions and impressions about this series.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-900 shrink-0 flex items-center justify-center font-bold text-xs text-white">
                      {comm.user_name[0]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{comm.user_name}</span>
                        <span className="text-[10px] text-purple-300">{comm.created_at}</span>
                      </div>
                      <p className="text-xs text-purple-100/90 leading-relaxed">{comm.content}</p>

                      <div className="pt-2">
                        <button
                          onClick={() => handleToggleCommentLike(comm.id)}
                          className={`inline-flex items-center gap-1 text-[11px] transition-colors cursor-pointer ${
                            comm.user_liked ? 'text-pink-400 font-bold' : 'text-purple-300 hover:text-white'
                          }`}
                        >
                          <Heart className={`w-3 h-3 ${comm.user_liked ? 'fill-pink-400' : ''}`} />
                          <span>{comm.likes_count} likes</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: RELATED SERIES */}
        {activeTab === 'related' && (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              More Series In {series.category}
            </h2>

            {relatedSeriesList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center space-y-2">
                <Film className="w-8 h-8 text-purple-400 mx-auto" />
                <p className="text-sm font-semibold text-white">No other series in this category yet</p>
                <p className="text-xs text-purple-200/70">
                  Browse the complete series catalog to discover stories across all categories!
                </p>
                <div className="pt-2">
                  <Link
                    href="/series"
                    className="inline-flex px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider text-white"
                  >
                    Browse Catalog
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {relatedSeriesList.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/series/${rel.id}`}
                    className="group relative rounded-2xl overflow-hidden border border-purple-500/25 bg-[#120728] aspect-[9/14] flex flex-col justify-end p-3.5 transition-all duration-300 hover:scale-[1.03] hover:border-purple-400 shadow-xl"
                  >
                    <Image
                      src={rel.cover_url || '/images/reel_whispers.jpg'}
                      alt={rel.title}
                      fill
                      className="object-cover group-hover:scale-108 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    <div className="relative z-10 text-white">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-600/80 text-white">
                        {rel.category}
                      </span>
                      <h4 className="font-bold text-sm mt-1 line-clamp-1 group-hover:text-purple-300 transition-colors">
                        {rel.title}
                      </h4>
                      <span className="text-[11px] text-purple-200 block mt-0.5">
                        {rel.total_episodes || 1} Episodes
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 5. VIDEO TRAILER POPUP MODAL */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-slate-950 border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/90 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-600 text-white">
                  Episode {activeVideoModal.episode_number}
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

            <div className="relative aspect-video bg-black flex items-center justify-center">
              <video
                src={activeVideoModal.video_url}
                poster={activeVideoModal.thumbnail_url || series.cover_url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-4 bg-slate-900/90 border-t border-white/10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs text-purple-300 font-semibold">
                  {series.title} • Episode {activeVideoModal.episode_number}
                </span>
                <p className="text-xs text-slate-400">
                  {activeVideoModal.episode_number <= 5 ? 'Free Episode' : 'Premium Episode'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/videos/${activeVideoModal.id}`}
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Open Full Player →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-purple-500/40 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-300 text-xs font-bold">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
