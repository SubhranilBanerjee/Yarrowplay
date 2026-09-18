'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { Video, Comment } from '@/types/database';
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  MessageSquare,
  Sparkles,
  Check,
  Send,
  Film,
  Trash2,
  Loader2,
  LogIn,
  ChevronDown,
  ChevronUp,
  Lock,
  X,
  Play,
} from 'lucide-react';
import { BottomToast } from '@/components/ui/BottomToast';

// ─── Auth-Gate Modal ──────────────────────────────────────────────────────────
function AuthGateModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5 relative backdrop-blur-xl border"
        style={{
          background: 'var(--glass-surface-heavy)',
          borderColor: 'var(--glass-border-light)',
          boxShadow: 'var(--shadow-card-hover)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border"
            style={{
              background: 'var(--neon-purple-glow)',
              borderColor: 'var(--neon-purple-border)',
            }}
          >
            <LogIn className="w-7 h-7 text-[var(--color-pink-light)]" />
          </div>
          <h3 className="text-white font-bold text-lg">Sign in to Continue</h3>
          <p className="text-[var(--text-secondary)] text-sm mt-2 leading-relaxed">
            Create a free account to like, comment, save, and interact with content on Yarrowplay.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <Link
            href={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
            className="w-full py-3 px-4 rounded-xl text-white text-sm font-semibold text-center transition-all active:scale-[0.99]"
            style={{
              background: 'var(--gradient-neon)',
              boxShadow: 'var(--glow-purple)',
            }}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="w-full py-3 px-4 rounded-xl text-white text-sm font-semibold text-center transition-all border"
            style={{
              background: 'var(--glass-surface)',
              borderColor: 'var(--glass-border)',
            }}
          >
            Create Free Account
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({
  video,
  onClose,
  onSuccess,
}: {
  video: Video;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: video.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) throw new Error('Payment gateway failed to load. Please refresh and try again.');

      const rzp = new Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'Yarrowplay',
        description: data.video_title,
        order_id: data.order_id,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              video_id: video.id,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setError(verifyData.error || 'Payment verification failed');
          } else {
            onSuccess();
          }
        },
        prefill: {},
        theme: { color: '#7C00FF' },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
          },
        },
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div
        className="rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-5 relative backdrop-blur-xl border"
        style={{
          background: 'var(--glass-surface-heavy)',
          borderColor: 'var(--glass-border-light)',
          boxShadow: 'var(--shadow-card-hover)',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border"
            style={{
              background: 'var(--neon-purple-glow)',
              borderColor: 'var(--neon-purple-border)',
            }}
          >
            <Lock className="w-7 h-7 text-[var(--color-pink-light)]" />
          </div>
          <h3 className="text-white font-bold text-lg">Unlock Episode</h3>
          <p className="text-[var(--text-secondary)] text-sm mt-2 leading-relaxed line-clamp-2">
            {video.title}
          </p>
          {video.price_inr && video.price_inr > 0 && (
            <p
              className="font-extrabold text-3xl mt-3"
              style={{
                background: 'var(--gradient-text)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ₹{(video.price_inr as number).toFixed(2)}
            </p>
          )}
          <p className="text-[11px] text-[var(--text-muted)] mt-1">One-time payment · Instant access</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl text-white text-sm font-semibold transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            background: 'var(--gradient-neon)',
            boxShadow: 'var(--glow-purple)',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Opening Payment...
            </>
          ) : (
            'Pay with Razorpay'
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const isAdmin = !!user?.email && (
    user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    user.email === 'admin@dramabox.stream'
  );

  const [video, setVideo] = useState<Video | null>(null);
  const [seriesEpisodes, setSeriesEpisodes] = useState<Video[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);

  // UI state
  const [commentsOpen, setCommentsOpen] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const fetchVideoData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch the main video record with its creator profile
      const { data: vid, error: vidErr } = await supabase
        .from('videos')
        .select('*, creator:profiles(*)')
        .eq('id', videoId)
        .maybeSingle();

      if (vidErr) {
        console.error('Error fetching video:', vidErr);
      }

      if (vid) {
        // Fallback: If creator profile wasn't populated by join, fetch directly
        if (!vid.creator && vid.creator_id) {
          try {
            const { data: prof } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', vid.creator_id)
              .maybeSingle();
            if (prof) (vid as any).creator = prof;
          } catch {
            // ignore profile fallback error
          }
        }

        // Fetch series metadata if part of a series
        if (vid.series_id) {
          try {
            const { data: ser } = await supabase
              .from('content_series')
              .select('*')
              .eq('id', vid.series_id)
              .maybeSingle();
            if (ser) (vid as any).series = ser;

            // Fetch other episodes of this series
            const { data: eps } = await supabase
              .from('videos')
              .select('*')
              .eq('series_id', vid.series_id)
              .order('episode_number', { ascending: true });
            setSeriesEpisodes((eps as Video[]) || []);
          } catch {
            // ignore series fetch error
          }
        }

        setVideo(vid as Video);
        setLikesCount(vid.likes_count || 0);
        setDislikesCount(vid.dislikes_count || 0);

        // Fetch recommended videos (same category/tags, different id)
        try {
          const recQuery = supabase
            .from('videos')
            .select('*, creator:profiles(*)')
            .eq('status', 'published')
            .eq('visibility', 'public')
            .neq('id', videoId)
            .order('views_count', { ascending: false })
            .limit(8);

          if (vid.category) {
            recQuery.eq('category', vid.category);
          }

          const { data: recs } = await recQuery;
          setRecommendedVideos((recs as Video[]) || []);
        } catch {
          // ignore recommendations error
        }
      }

      // 2. Fetch comments separately (won't fail video if empty or restricted)
      try {
        const { data: comms } = await supabase
          .from('comments')
          .select('*, user:profiles(*)')
          .eq('content_type', 'video')
          .eq('content_id', videoId)
          .order('created_at', { ascending: false });
        setComments((comms as Comment[]) || []);
      } catch (cErr) {
        console.warn('Comments fetch error:', cErr);
      }

      // 3. User-specific social interactions (only if logged in)
      if (user) {
        const [
          { data: reaction },
          { data: fav },
          { data: watchItem },
          { data: purchase },
        ] = await Promise.all([
          supabase.from('reactions').select('reaction_type').eq('user_id', user.id).eq('content_type', 'video').eq('content_id', videoId).maybeSingle(),
          supabase.from('favorites').select('id').eq('user_id', user.id).eq('content_type', 'video').eq('content_id', videoId).maybeSingle(),
          supabase.from('watchlists').select('id').eq('user_id', user.id).eq('video_id', videoId).maybeSingle(),
          supabase.from('video_purchases').select('id').eq('user_id', user.id).eq('video_id', videoId).eq('status', 'paid').maybeSingle(),
        ]);

        if (reaction) setUserReaction(reaction.reaction_type as any);
        setIsFavorite(!!fav);
        setIsWatchlisted(!!watchItem);
        setIsPurchased(!!purchase);
      } else {
        setUserReaction(null);
        setIsFavorite(false);
        setIsWatchlisted(false);
        setIsPurchased(false);
      }
    } catch (err) {
      console.error('Video fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [videoId, user, supabase]);

  useEffect(() => {
    if (!videoId) return;
    fetchVideoData();
  }, [fetchVideoData]);

  const requireAuth = (action: () => void) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    action();
  };

  const handleReaction = (type: 'like' | 'dislike') => {
    requireAuth(async () => {
      try {
        const res = await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_type: 'video', content_id: videoId, reaction_type: type }),
        });
        if (res.ok) {
          const data = await res.json();
          setUserReaction(data.userReaction);
          setLikesCount(data.likesCount);
          setDislikesCount(data.dislikesCount);
        }
      } catch { /* ignore */ }
    });
  };

  const handleToggleFavorite = () => {
    requireAuth(async () => {
      try {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_type: 'video', content_id: videoId }),
        });
        if (res.ok) {
          const data = await res.json();
          setIsFavorite(data.isFavorite);
        }
      } catch { /* ignore */ }
    });
  };

  const handleToggleWatchlist = () => {
    requireAuth(async () => {
      try {
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_type: 'video', content_id: videoId }),
        });
        if (res.ok) {
          const data = await res.json();
          setIsWatchlisted(data.isWatchlisted);
        }
      } catch { /* ignore */ }
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareText = 'Check out this content on Yarrowplay!';
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.title || 'Watch on Yarrowplay',
          text: shareText,
          url,
        });
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_type: 'video', content_id: videoId, creator_id: video?.creator_id, event_type: 'share' }),
        }).catch(() => {});
        return;
      } catch { /* fallback */ }
    }
    // Clipboard fallback
    await navigator.clipboard.writeText(`${shareText}\n${url}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    requireAuth(async () => {
      if (!newComment.trim()) return;
      try {
        const res = await fetch('/api/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content_type: 'video', content_id: videoId, content: newComment.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.comment) {
            setComments((prev) => [data.comment, ...prev]);
            setNewComment('');
          }
        }
      } catch { /* ignore */ }
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
      if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch { /* ignore */ }
  };

  const handleDeleteVideo = async () => {
    if (!user || !video) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/videos?id=${videoId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete video');
      router.push('/home');
    } catch (err: any) {
      const msg = err.message || 'Failed to delete video';
      setDeleteError(msg);
      setToastMsg({ type: 'error', text: msg });
      setIsDeleting(false);
    }
  };

  // Determine if video is locked for this user
  const isLocked = !!video?.is_locked && !isPurchased && user?.id !== video?.creator_id && !isAdmin;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 max-w-sm mx-auto w-full">
            <div
              className="aspect-[9/16] w-full rounded-2xl animate-pulse"
              style={{ background: 'var(--glass-surface)' }}
            />
          </div>
          <div
            className="w-full lg:w-72 rounded-2xl animate-pulse h-64"
            style={{ background: 'var(--glass-surface)' }}
          />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div
        className="max-w-md mx-auto px-6 py-16 text-center my-12 rounded-2xl border"
        style={{
          background: 'var(--glass-surface)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <Film className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Video Not Found</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-6">This video may have been unpublished or removed.</p>
        <Link
          href="/home"
          className="px-5 py-2.5 rounded-xl text-white text-xs font-semibold inline-block transition-all"
          style={{
            background: 'var(--gradient-neon)',
            boxShadow: 'var(--glow-purple)',
          }}
        >
          Return to Home Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ── Main layout: vertical player + episode list side by side ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Left column: vertical player + metadata + comments + recommended ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] flex-wrap">
            <Link href="/home" className="hover:text-white transition-colors">Home</Link>
            {video.series && (
              <>
                <span>/</span>
                <span className="text-[var(--text-secondary)]">{video.series.title}</span>
              </>
            )}
            <span>/</span>
            <span className="text-white truncate max-w-[200px]">{video.title}</span>
          </nav>

          {/* Vertical Video Player — centered, max width for portrait */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              <VideoPlayer
                videoId={video.id}
                creatorId={video.creator_id}
                videoUrl={video.video_url}
                title={video.title}
                posterUrl={video.thumbnail_url}
                locked={isLocked}
                priceInr={video.price_inr as number | undefined}
                onUnlockRequest={() => {
                  if (!user) {
                    setShowAuthModal(true);
                  } else {
                    setShowPaymentModal(true);
                  }
                }}
              />
            </div>
          </div>

          {/* Title & Actions */}
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {video.title}
              {video.episode_number && (
                <span className="ml-2 text-sm font-normal text-[var(--text-muted)]">
                  · Episode {video.episode_number}
                </span>
              )}
            </h1>

            <div
              className="flex flex-wrap items-center justify-between gap-3 mt-3 pb-4 border-b"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              {/* Creator Info */}
              <div className="flex items-center gap-2.5">
                <div
                  className="relative w-9 h-9 rounded-full overflow-hidden border shrink-0"
                  style={{
                    background: 'var(--glass-surface-heavy)',
                    borderColor: 'var(--neon-purple-border)',
                  }}
                >
                  {video.creator?.avatar_url ? (
                    <Image src={video.creator.avatar_url} alt={video.creator.display_name || 'Creator'} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--color-pink-light)]">
                      {video.creator?.display_name?.[0] || 'C'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{video.creator?.display_name || 'Creator'}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {video.views_count || 0} views · {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Like / Dislike */}
                <div
                  className="flex items-center rounded-xl border overflow-hidden backdrop-blur-md"
                  style={{
                    background: 'var(--glass-surface)',
                    borderColor: 'var(--glass-border)',
                  }}
                >
                  <button
                    onClick={() => handleReaction('like')}
                    title="Like"
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all ${
                      userReaction === 'like'
                        ? 'text-white shadow-inner'
                        : 'text-[var(--text-secondary)] hover:text-white'
                    }`}
                    style={
                      userReaction === 'like'
                        ? { background: 'var(--neon-purple-glow)', color: 'var(--color-pink-light)' }
                        : undefined
                    }
                  >
                    <ThumbsUp className={`w-4 h-4 ${userReaction === 'like' ? 'fill-current' : ''}`} />
                    <span>{likesCount}</span>
                  </button>
                  <div className="w-px h-5 bg-white/10" />
                  <button
                    onClick={() => handleReaction('dislike')}
                    title="Dislike"
                    className={`px-3 py-2 text-xs font-semibold transition-all ${
                      userReaction === 'dislike'
                        ? 'text-red-400 bg-red-500/20'
                        : 'text-[var(--text-secondary)] hover:text-white'
                    }`}
                  >
                    <ThumbsDown className={`w-4 h-4 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Favorite */}
                <button
                  onClick={handleToggleFavorite}
                  title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  className="p-2 rounded-xl border transition-all cursor-pointer"
                  style={{
                    background: isFavorite ? 'var(--gradient-neon)' : 'var(--glass-surface)',
                    borderColor: isFavorite ? 'var(--color-pink)' : 'var(--glass-border)',
                    boxShadow: isFavorite ? 'var(--glow-pink)' : 'none',
                    color: isFavorite ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>

                {/* Watchlist */}
                <button
                  onClick={handleToggleWatchlist}
                  title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  className="p-2 rounded-xl border transition-all cursor-pointer"
                  style={{
                    background: isWatchlisted ? 'var(--gradient-neon)' : 'var(--glass-surface)',
                    borderColor: isWatchlisted ? 'var(--color-pink)' : 'var(--glass-border)',
                    boxShadow: isWatchlisted ? 'var(--glow-pink)' : 'none',
                    color: isWatchlisted ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
                </button>

                {/* Share — available to all users */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer"
                  style={{
                    background: 'var(--glass-surface)',
                    borderColor: 'var(--glass-border)',
                  }}
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied!' : 'Share'}</span>
                </button>

                {/* Locked purchase button (when logged in but not purchased) */}
                {video.is_locked && !isPurchased && user && user.id !== video.creator_id && !isAdmin && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-semibold transition-all shadow-lg"
                    style={{
                      background: 'var(--gradient-neon)',
                      boxShadow: 'var(--glow-purple)',
                    }}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>₹{(video.price_inr as number)?.toFixed(0)}</span>
                  </button>
                )}

                {/* Delete (creator or admin) */}
                {user && (user.id === video.creator_id || isAdmin) && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    title="Delete Video"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Description */}
            <div
              className="rounded-2xl p-4 mt-4 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border backdrop-blur-md"
              style={{
                background: 'var(--glass-surface)',
                borderColor: 'var(--glass-border)',
              }}
            >
              <p className="whitespace-pre-line">{video.description}</p>
              {video.tags && video.tags.length > 0 && (
                <div
                  className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t"
                  style={{ borderColor: 'var(--glass-border)' }}
                >
                  {video.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                      style={{
                        background: 'var(--neon-purple-glow)',
                        borderColor: 'var(--neon-purple-border)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Collapsible Comments Section ── */}
          <div
            className="rounded-2xl overflow-hidden border backdrop-blur-md"
            style={{
              background: 'var(--glass-surface)',
              borderColor: 'var(--glass-border)',
            }}
          >
            <button
              onClick={() => setCommentsOpen((o) => !o)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--color-pink-light)]" />
                Comments ({comments.length})
              </span>
              {commentsOpen ? (
                <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </button>

            {commentsOpen && (
              <div
                className="px-4 pb-4 space-y-4 border-t"
                style={{ borderColor: 'var(--glass-border)' }}
              >
                {/* Comment Input */}
                {user ? (
                  <form onSubmit={handlePostComment} className="space-y-2 pt-4">
                    <div className="relative">
                      <textarea
                        rows={2}
                        placeholder="Add a public comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full text-white text-xs rounded-xl p-3 border focus:outline-none transition-all resize-none"
                        style={{
                          background: 'var(--glass-surface-heavy)',
                          borderColor: 'var(--glass-border)',
                        }}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer shadow-md"
                        style={{
                          background: 'var(--gradient-neon)',
                          boxShadow: 'var(--glow-purple)',
                        }}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Post Comment</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div
                    className="pt-4 flex items-center justify-between gap-3 p-3 rounded-xl border my-2"
                    style={{
                      background: 'var(--glass-surface-heavy)',
                      borderColor: 'var(--glass-border)',
                    }}
                  >
                    <p className="text-xs text-[var(--text-muted)]">Sign in to join the conversation</p>
                    <button
                      onClick={() => setShowAuthModal(true)}
                      className="text-xs font-semibold text-[var(--color-pink-light)] hover:underline shrink-0"
                    >
                      Sign In
                    </button>
                  </div>
                )}

                {/* Comment Thread */}
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] text-center py-4">No comments yet. Start the conversation!</p>
                  ) : (
                    comments.map((comm) => (
                      <div
                        key={comm.id}
                        className="p-3 rounded-xl border text-xs"
                        style={{
                          background: 'var(--glass-surface-heavy)',
                          borderColor: 'var(--glass-border)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-semibold text-white">{comm.user?.display_name || 'Viewer'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {new Date(comm.created_at).toLocaleDateString()}
                            </span>
                            {user && (user.id === comm.user_id || user.id === video?.creator_id || isAdmin) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comm.id)}
                                title="Delete comment"
                                className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-[var(--text-secondary)] leading-relaxed">{comm.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Recommended Videos ── */}
          {recommendedVideos.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[var(--color-pink-light)]" />
                Recommended
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {recommendedVideos.map((rv) => (
                  <Link
                    key={rv.id}
                    href={`/videos/${rv.id}`}
                    className="group relative rounded-xl overflow-hidden border transition-all shadow-sm"
                    style={{
                      background: 'var(--glass-surface)',
                      borderColor: 'var(--glass-border)',
                    }}
                  >
                    <div className="relative aspect-video bg-black/40 overflow-hidden">
                      {rv.thumbnail_url ? (
                        <Image src={rv.thumbnail_url} alt={rv.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                          <Play className="w-6 h-6" />
                        </div>
                      )}
                      {rv.is_locked && (
                        <div className="absolute top-1.5 right-1.5 bg-black/80 backdrop-blur p-1 rounded-md">
                          <Lock className="w-3 h-3 text-[var(--color-pink-light)]" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-white text-xs font-semibold line-clamp-2 group-hover:text-[var(--color-pink-light)] transition-colors leading-tight">
                        {rv.title}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">{rv.creator?.display_name || 'Creator'}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Sidebar: Episode List (grid of numbers) ── */}
        {video.series && seriesEpisodes.length > 0 && (
          <div className="w-full lg:w-72 shrink-0">
            <div
              className="rounded-2xl p-4 sticky top-4 border backdrop-blur-md"
              style={{
                background: 'var(--glass-surface)',
                borderColor: 'var(--glass-border)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Episodes</h3>
                <span className="text-xs text-[var(--text-muted)]">
                  {video.episode_number}/{seriesEpisodes.length}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3 truncate">{video.series.title}</p>

              {/* Episode Number Grid */}
              <div className="grid grid-cols-5 gap-1.5 max-h-[70vh] overflow-y-auto pr-1 scrollbar-thin">
                {seriesEpisodes.map((ep) => {
                  const isCurrent = ep.id === video.id;
                  const epLocked = !!ep.is_locked && !isPurchased && user?.id !== video.creator_id && !isAdmin;
                  return (
                    <Link
                      key={ep.id}
                      href={`/videos/${ep.id}`}
                      title={ep.title}
                      className="relative aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all border"
                      style={
                        isCurrent
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
                      {epLocked ? (
                        <Lock className="w-3 h-3 text-[var(--color-pink-light)]" />
                      ) : (
                        ep.episode_number || '?'
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAuthModal && <AuthGateModal onClose={() => setShowAuthModal(false)} />}

      {showPaymentModal && video && (
        <PaymentModal
          video={video}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            setIsPurchased(true);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border backdrop-blur-xl"
            style={{
              background: 'var(--glass-surface-heavy)',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Video</h3>
                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">"{video.title}"</strong>? All associated comments, reactions, and history will be permanently deleted.
            </p>
            {deleteError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {deleteError}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => { setShowDeleteModal(false); setDeleteError(null); }}
                className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteVideo}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {isDeleting ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Deleting...</>
                ) : (
                  <><Trash2 className="w-3.5 h-3.5" />Permanently Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Toast */}
      <BottomToast message={toastMsg} onClose={() => setToastMsg(null)} />
    </div>
  );
}
