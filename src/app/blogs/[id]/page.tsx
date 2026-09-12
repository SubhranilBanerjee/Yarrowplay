'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Blog, Comment } from '@/types/database';
import {
  Heart,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  MessageSquare,
  BookOpen,
  Calendar,
  Clock,
  Check,
  Send,
  User,
  Trash2,
} from 'lucide-react';

export default function BlogReaderPage() {
  const params = useParams();
  const blogId = params?.id as string;
  const { user } = useAuth();
  const supabase = createClient();

  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!blogId) return;

    const fetchBlogData = async () => {
      setIsLoading(true);
      try {
        // Parallelize blog, comments, reaction, and favorite queries
        const blogPromise = supabase
          .from('blogs')
          .select('*, author:profiles(*)')
          .eq('id', blogId)
          .single();

        const commentsPromise = supabase
          .from('comments')
          .select('*, user:profiles(*)')
          .eq('content_type', 'blog')
          .eq('content_id', blogId)
          .order('created_at', { ascending: false });

        const reactionPromise = user
          ? supabase
              .from('reactions')
              .select('reaction_type')
              .eq('user_id', user.id)
              .eq('content_type', 'blog')
              .eq('content_id', blogId)
              .maybeSingle()
          : Promise.resolve({ data: null });

        const favoritePromise = user
          ? supabase
              .from('favorites')
              .select('id')
              .eq('user_id', user.id)
              .eq('content_type', 'blog')
              .eq('content_id', blogId)
              .maybeSingle()
          : Promise.resolve({ data: null });

        const [
          { data: b },
          { data: comms },
          { data: reaction },
          { data: fav },
        ] = await Promise.all([
          blogPromise,
          commentsPromise,
          reactionPromise,
          favoritePromise,
        ]);

        if (b) {
          setBlog(b as Blog);
          setLikesCount(b.likes_count || 0);
          setDislikesCount(b.dislikes_count || 0);
        }

        setComments((comms as Comment[]) || []);
        if (reaction) setUserReaction(reaction.reaction_type as any);
        setIsFavorite(!!fav);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogData();
  }, [blogId, user]);

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!user) {
      window.location.href = `/login?redirect=/blogs/${blogId}`;
      return;
    }

    try {
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'blog',
          content_id: blogId,
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

  const handleToggleFavorite = async () => {
    if (!user) {
      window.location.href = `/login?redirect=/blogs/${blogId}`;
      return;
    }

    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'blog',
          content_id: blogId,
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
        await navigator.share({ title: blog?.title, url });
        return;
      } catch {
        // fallback
      }
    }
    await navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'blog',
          content_id: blogId,
          content: newComment.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setComments((prev) => [data.comment, ...prev]);
          setNewComment('');
        }
      }
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <div className="h-64 bg-[#333336] rounded-2xl animate-pulse" />
        <div className="h-8 bg-[#333336] rounded w-3/4 animate-pulse" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <BookOpen className="w-12 h-12 text-[#85858B] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Blog Not Found</h2>
        <Link href="/blogs" className="px-5 py-2.5 rounded-xl bg-[#FF0080] text-white text-xs font-semibold">
          Return to Blogs
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Category Pill */}
      {blog.category && (
        <span className="inline-block px-3 py-1 rounded-full bg-[#FF0080]/15 text-[#FF0080] text-xs font-bold uppercase tracking-wider mb-4">
          {blog.category}
        </span>
      )}

      {/* Title */}
      <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
        {blog.title}
      </h1>

      {/* Author & Meta */}
      <div className="flex items-center justify-between gap-4 py-4 border-y border-[#454549] mb-6">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#3A3A3E] border border-[#454549]">
            {blog.author?.avatar_url ? (
              <Image src={blog.author.avatar_url} alt="Author" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#FF0080]">
                {blog.author?.display_name?.[0] || 'A'}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{blog.author?.display_name || 'Creator'}</p>
            <p className="text-[11px] text-[#85858B]">
              Published {new Date(blog.published_at || blog.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#333336] rounded-xl border border-[#454549] overflow-hidden">
            <button
              onClick={() => handleReaction('like')}
              title="Like"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                userReaction === 'like' ? 'text-[#FF0080] bg-[#FF0080]/15' : 'text-[#B8B8BD] hover:text-white'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${userReaction === 'like' ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>
            <div className="w-px h-4 bg-[#454549]" />
            <button
              onClick={() => handleReaction('dislike')}
              title="Dislike"
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                userReaction === 'dislike' ? 'text-[#EF4444] bg-[#EF4444]/15' : 'text-[#B8B8BD] hover:text-white'
              }`}
            >
              <ThumbsDown className={`w-4 h-4 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
            </button>
          </div>

          <button
            onClick={handleToggleFavorite}
            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            className={`p-2 rounded-xl border transition-colors ${
              isFavorite ? 'bg-[#FF0080] text-white border-[#FF0080]' : 'bg-[#333336] border-[#454549] text-[#B8B8BD] hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-[#333336] border border-[#454549] text-[#B8B8BD] hover:text-white"
          >
            {copiedLink ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Cover Image */}
      {blog.cover_url && (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-8 border border-[#454549]">
          <Image src={blog.cover_url} alt={blog.title} fill className="object-cover" priority />
        </div>
      )}

      {/* Article Body */}
      <div className="prose prose-invert max-w-none text-sm sm:text-base text-[#B8B8BD] leading-relaxed whitespace-pre-line space-y-4 mb-12">
        {blog.body}
      </div>

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pb-8 border-b border-[#454549] mb-8">
          {blog.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-lg bg-[#333336] border border-[#454549] text-xs text-[#85858B]">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Comments Section */}
      <div className="bg-[#333336] border border-[#454549] rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#FF0080]" />
          Discussion ({comments.length})
        </h3>

        <form onSubmit={handlePostComment} className="space-y-2">
          <textarea
            rows={2}
            placeholder={user ? 'Write a thoughtful response...' : 'Sign in to join the discussion'}
            disabled={!user}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full bg-[#2B2B2D] text-white text-xs rounded-xl p-3 border border-[#454549] focus:outline-none focus:border-[#FF0080]"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!user || !newComment.trim()}
              className="px-4 py-2 rounded-xl bg-[#FF0080] hover:bg-[#E00071] text-white text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              Post Comment
            </button>
          </div>
        </form>

        <div className="space-y-3 pt-3">
          {comments.length === 0 ? (
            <p className="text-xs text-[#85858B] text-center py-4">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="p-3 bg-[#2B2B2D] rounded-xl border border-[#454549] text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">{c.user?.display_name || 'Reader'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#85858B]">{new Date(c.created_at).toLocaleDateString()}</span>
                    {user && (user.id === c.user_id || user.id === blog?.author_id) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        title="Delete comment"
                        className="text-[#85858B] hover:text-[#EF4444] transition-colors p-0.5 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[#B8B8BD]">{c.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </article>
  );
}
