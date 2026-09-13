'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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
  Clock,
  Sparkles,
  Check,
  Send,
  Layers,
  Film,
  Trash2,
  Loader2,
} from 'lucide-react';

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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentTimestamp, setCommentTimestamp] = useState<number | null>(null);

  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Video deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;

    const fetchVideoData = async () => {
      setIsLoading(true);
      try {
        // Parallelize primary queries: video record, comments, and user-specific states
        const videoPromise = supabase
          .from('videos')
          .select('*, creator:profiles(*), series:content_series(*)')
          .eq('id', videoId)
          .single();

        const commentsPromise = supabase
          .from('comments')
          .select('*, user:profiles(*)')
          .eq('content_type', 'video')
          .eq('content_id', videoId)
          .order('created_at', { ascending: false });

        const reactionPromise = user
          ? supabase
              .from('reactions')
              .select('reaction_type')
              .eq('user_id', user.id)
              .eq('content_type', 'video')
              .eq('content_id', videoId)
              .maybeSingle()
          : Promise.resolve({ data: null });

        const favoritePromise = user
          ? supabase
              .from('favorites')
              .select('id')
              .eq('user_id', user.id)
              .eq('content_type', 'video')
              .eq('content_id', videoId)
              .maybeSingle()
          : Promise.resolve({ data: null });

        const watchlistPromise = user
          ? supabase
              .from('watchlists')
              .select('id')
              .eq('user_id', user.id)
              .eq('video_id', videoId)
              .maybeSingle()
          : Promise.resolve({ data: null });

        const [
          { data: vid },
          { data: comms },
          { data: reaction },
          { data: fav },
          { data: watchItem },
        ] = await Promise.all([
          videoPromise,
          commentsPromise,
          reactionPromise,
          favoritePromise,
          watchlistPromise,
        ]);

        if (vid) {
          setVideo(vid as Video);
          setLikesCount(vid.likes_count || 0);
          setDislikesCount(vid.dislikes_count || 0);

          // If part of series, fetch other episodes
          if (vid.series_id) {
            const { data: eps } = await supabase
              .from('videos')
              .select('*')
              .eq('series_id', vid.series_id)
              .order('episode_number', { ascending: true });
            setSeriesEpisodes((eps as Video[]) || []);
          }
        }

        setComments((comms as Comment[]) || []);
        if (reaction) setUserReaction(reaction.reaction_type as any);
        setIsFavorite(!!fav);
        setIsWatchlisted(!!watchItem);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideoData();
  }, [videoId, user]);

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!user) {
      window.location.href = `/login?redirect=/videos/${videoId}`;
      return;
    }

    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'video',
          content_id: videoId,
          reaction_type: type,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserReaction(data.userReaction);
        setLikesCount(data.likesCount);
        setDislikesCount(data.dislikesCount);
      }
    } catch {
      // ignore
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      window.location.href = `/login?redirect=/videos/${videoId}`;
      return;
    }

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'video',
          content_id: videoId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsFavorite(data.isFavorite);
      }
    } catch {
      // ignore
    }
  };

  const handleToggleWatchlist = async () => {
    if (!user) {
      window.location.href = `/login?redirect=/videos/${videoId}`;
      return;
    }

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'video',
          content_id: videoId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsWatchlisted(data.isWatchlisted);
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteVideo = async () => {
    if (!user || !video) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/videos?id=${videoId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete video');
      }
      router.push('/home');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete video');
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.title || 'Watch on Yarrowplay',
          url,
        });
        // Track share in analytics
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_type: 'video',
            content_id: videoId,
            creator_id: video?.creator_id,
            event_type: 'share',
          }),
        }).catch(() => {});
        return;
      } catch {
        // user cancelled or failed, fallback to clipboard
      }
    }

    // Fallback: copy link
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = `/login?redirect=/videos/${videoId}`;
      return;
    }

    if (!newComment.trim()) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'video',
          content_id: videoId,
          content: newComment.trim(),
          timestamp_seconds: commentTimestamp,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setComments((prev) => [data.comment, ...prev]);
          setNewComment('');
          setCommentTimestamp(null);
        }
      }
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="aspect-video w-full bg-[#333336] rounded-2xl animate-pulse" />
        <div className="h-6 bg-[#333336] rounded w-1/3 mt-6 animate-pulse" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Film className="w-12 h-12 text-[#85858B] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Video Not Found</h2>
        <p className="text-xs text-[#85858B] mb-6">
          This video may have been unpublished or removed.
        </p>
        <Link
          href="/home"
          className="px-5 py-2.5 rounded-xl bg-[#FF0080] text-white text-xs font-semibold"
        >
          Return to Home Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Video & Discussion (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Custom Video Player */}
          <VideoPlayer
            videoId={video.id}
            creatorId={video.creator_id}
            videoUrl={video.video_url}
            title={video.title}
            posterUrl={video.thumbnail_url}
          />

          {/* Title & Metadata */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {video.title}
            </h1>

            <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pb-4 border-b border-[#454549]">
              {/* Creator Info */}
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#3A3A3E] border border-[#454549]">
                  {video.creator?.avatar_url ? (
                    <Image
                      src={video.creator.avatar_url}
                      alt={video.creator.display_name || 'Creator'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#FF0080]">
                      {video.creator?.display_name?.[0] || 'C'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {video.creator?.display_name || 'Creator'}
                  </p>
                  <p className="text-[11px] text-[#85858B]">
                    {video.views_count || 0} views • {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Like / Dislike Group */}
                <div className="flex items-center bg-[#333336] rounded-xl border border-[#454549] overflow-hidden">
                  <button
                    onClick={() => handleReaction('like')}
                    title="Like"
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
                      userReaction === 'like'
                        ? 'text-[#FF0080] bg-[#FF0080]/15'
                        : 'text-[#B8B8BD] hover:text-white'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${userReaction === 'like' ? 'fill-current' : ''}`} />
                    <span>{likesCount}</span>
                  </button>
                  <div className="w-px h-5 bg-[#454549]" />
                  <button
                    onClick={() => handleReaction('dislike')}
                    title="Dislike"
                    className={`px-3 py-2 text-xs font-semibold transition-colors ${
                      userReaction === 'dislike'
                        ? 'text-[#EF4444] bg-[#EF4444]/15'
                        : 'text-[#B8B8BD] hover:text-white'
                    }`}
                  >
                    <ThumbsDown className={`w-4 h-4 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Favorite */}
                <button
                  onClick={handleToggleFavorite}
                  title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  className={`p-2 rounded-xl border transition-colors ${
                    isFavorite
                      ? 'bg-[#FF0080] text-white border-[#FF0080]'
                      : 'bg-[#333336] border-[#454549] text-[#B8B8BD] hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>

                {/* Watchlist */}
                <button
                  onClick={handleToggleWatchlist}
                  title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  className={`p-2 rounded-xl border transition-colors ${
                    isWatchlisted
                      ? 'bg-[#FF0080] text-white border-[#FF0080]'
                      : 'bg-[#333336] border-[#454549] text-[#B8B8BD] hover:text-white'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#333336] border border-[#454549] text-xs font-semibold text-[#B8B8BD] hover:text-white transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Share'}</span>
                </button>

                {/* Delete Video (Creator or Admin) */}
                {user && (user.id === video.creator_id || isAdmin) && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    title="Delete Video"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] hover:bg-[#EF4444] hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Description */}
            <div className="bg-[#333336] border border-[#454549] rounded-2xl p-4 mt-4 text-xs sm:text-sm text-[#B8B8BD] leading-relaxed">
              <p className="whitespace-pre-line">{video.description}</p>
              {video.tags && video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#454549]">
                  {video.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-[#3A3A3E] text-[11px] text-[#85858B]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="bg-[#333336] border border-[#454549] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#FF0080]" />
                Comments ({comments.length})
              </h3>
            </div>

            {/* Comment Input */}
            <form onSubmit={handlePostComment} className="space-y-2">
              <div className="relative">
                <textarea
                  rows={2}
                  placeholder={user ? 'Add a public comment...' : 'Sign in to comment'}
                  disabled={!user}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-[#2B2B2D] text-white text-xs rounded-xl p-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!user || !newComment.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </button>
              </div>
            </form>

            {/* Comment Thread List */}
            <div className="space-y-3 pt-2">
              {comments.length === 0 ? (
                <p className="text-xs text-[#85858B] text-center py-4">
                  No comments yet. Start the conversation!
                </p>
              ) : (
                comments.map((comm) => (
                  <div key={comm.id} className="p-3 bg-[#2B2B2D] rounded-xl border border-[#454549] text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-white">
                        {comm.user?.display_name || 'Viewer'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#85858B]">
                          {new Date(comm.created_at).toLocaleDateString()}
                        </span>
                        {user && (user.id === comm.user_id || user.id === video?.creator_id || isAdmin) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comm.id)}
                            title="Delete comment"
                            className="text-[#85858B] hover:text-[#EF4444] transition-colors p-0.5 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[#B8B8BD] leading-relaxed">{comm.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Series Episodes or Recommended (1 column) */}
        <div className="space-y-4">
          {video.series && (
            <div className="bg-[#333336] border border-[#454549] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-[#FF0080]" />
                <h3 className="text-sm font-bold text-white truncate">{video.series.title}</h3>
              </div>
              <p className="text-xs text-[#85858B] mb-4">
                Series Episodes ({seriesEpisodes.length})
              </p>

              <div className="space-y-2">
                {seriesEpisodes.map((ep) => {
                  const isCurrent = ep.id === video.id;
                  return (
                    <Link
                      key={ep.id}
                      href={`/videos/${ep.id}`}
                      className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                        isCurrent
                          ? 'bg-[#FF0080]/20 border border-[#FF0080]/40 text-white'
                          : 'hover:bg-[#3A3A3E] text-[#B8B8BD]'
                      }`}
                    >
                      <div className="relative w-16 h-10 rounded-lg overflow-hidden bg-[#2B2B2D] shrink-0 border border-[#454549]">
                        {ep.thumbnail_url && (
                          <Image src={ep.thumbnail_url} alt={ep.title} fill className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate text-white">{ep.title}</p>
                        <p className="text-[10px] text-[#85858B]">
                          Episode {ep.episode_number || 1}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#2B2B2D] border border-[#454549] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#EF4444]">
              <div className="p-3 bg-[#EF4444]/10 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Video</h3>
                <p className="text-xs text-[#85858B]">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-[#B8B8BD] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">"{video.title}"</strong>? All associated comments, reactions, and history will be permanently deleted.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-xs text-[#EF4444]">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#85858B] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteVideo}
                className="px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
