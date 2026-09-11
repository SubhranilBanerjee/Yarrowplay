'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { Video, Comment } from '@/types/database';
import {
  Heart,
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
} from 'lucide-react';

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params?.id as string;
  const { user } = useAuth();
  const supabase = createClient();

  const [video, setVideo] = useState<Video | null>(null);
  const [seriesEpisodes, setSeriesEpisodes] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentTimestamp, setCommentTimestamp] = useState<number | null>(null);

  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!videoId) return;

    const fetchVideoData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch video record
        const { data: vid } = await supabase
          .from('videos')
          .select('*, creator:profiles(*), series:content_series(*)')
          .eq('id', videoId)
          .single();

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

        // 2. Fetch comments
        const { data: comms } = await supabase
          .from('comments')
          .select('*, user:profiles(*)')
          .eq('content_type', 'video')
          .eq('content_id', videoId)
          .order('created_at', { ascending: false });
        setComments((comms as Comment[]) || []);

        // 3. If logged in, fetch user's reaction & favorite
        if (user) {
          const { data: reaction } = await supabase
            .from('reactions')
            .select('reaction_type')
            .eq('user_id', user.id)
            .eq('content_type', 'video')
            .eq('content_id', videoId)
            .maybeSingle();

          if (reaction) {
            setUserReaction(reaction.reaction_type as any);
          }

          const { data: fav } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('content_type', 'video')
            .eq('content_id', videoId)
            .maybeSingle();

          setIsFavorite(!!fav);
        }
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
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${
                      userReaction === 'like'
                        ? 'text-[#FF0080] bg-[#FF0080]/15'
                        : 'text-[#B8B8BD] hover:text-white'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    <span>{likesCount}</span>
                  </button>
                  <div className="w-px h-5 bg-[#454549]" />
                  <button
                    onClick={() => handleReaction('dislike')}
                    className={`px-3 py-2 text-xs font-semibold transition-colors ${
                      userReaction === 'dislike'
                        ? 'text-[#EF4444] bg-[#EF4444]/15'
                        : 'text-[#B8B8BD] hover:text-white'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Favorite */}
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-xl border transition-colors ${
                    isFavorite
                      ? 'bg-[#FF0080] text-white border-[#FF0080]'
                      : 'bg-[#333336] border-[#454549] text-[#B8B8BD] hover:text-white'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                </button>

                {/* Share */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#333336] border border-[#454549] text-xs font-semibold text-[#B8B8BD] hover:text-white transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Share'}</span>
                </button>
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
                      <span className="text-[10px] text-[#85858B]">
                        {new Date(comm.created_at).toLocaleDateString()}
                      </span>
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
    </div>
  );
}
