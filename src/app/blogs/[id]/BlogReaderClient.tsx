'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Loader2,
  Sparkles,
} from 'lucide-react';
import { estimateReadingTime } from '@/lib/seo';

interface BlogReaderClientProps {
  initialBlog: Blog | null;
  blogId: string;
}

export default function BlogReaderClient({ initialBlog, blogId }: BlogReaderClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const isAdmin =
    !!user?.email &&
    (user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      user.email === 'admin@dramabox.stream');

  const [blog, setBlog] = useState<Blog | null>(initialBlog);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const [likesCount, setLikesCount] = useState(initialBlog?.likes_count || 0);
  const [dislikesCount, setDislikesCount] = useState(initialBlog?.dislikes_count || 0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialBlog);

  // Blog deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!blogId) return;

    const fetchBlogData = async () => {
      if (!blog) {
        setIsLoading(true);
      }
      try {
        const blogPromise = !blog
          ? supabase
              .from('blogs')
              .select('*, author:profiles(*)')
              .eq('id', blogId)
              .single()
          : Promise.resolve({ data: blog });

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
        if (reaction) setUserReaction((reaction as any).reaction_type);
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

  const handleDeleteBlog = async () => {
    if (!blog) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/blogs?id=${blog.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete article');
      }
      router.push('/blogs');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete article');
      setIsDeleting(false);
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
        <div
          className="h-64 rounded-2xl animate-pulse"
          style={{ background: 'var(--bg-surface, #141D26)' }}
        />
        <div
          className="h-8 rounded w-3/4 animate-pulse"
          style={{ background: 'var(--bg-surface, #141D26)' }}
        />
      </div>
    );
  }

  if (!blog) {
    return (
      <div
        className="max-w-md mx-auto px-6 py-16 text-center my-12 rounded-2xl border"
        style={{
          background: 'var(--bg-card, #111A22)',
          borderColor: 'var(--border-subtle, rgba(255, 255, 255, 0.08))',
        }}
      >
        <BookOpen className="w-12 h-12 text-[#8E9AA7] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-[#F5F1E8] mb-2">Article Not Found</h2>
        <p className="text-xs text-[#8E9AA7] mb-6">
          This article might have been archived or removed by its author.
        </p>
        <Link
          href="/blogs"
          className="px-5 py-2.5 rounded-xl text-[#070B0F] text-xs font-semibold inline-block transition-all shadow-md hover:brightness-110"
          style={{
            background: 'var(--gold-primary, #F4C95D)',
            boxShadow: '0 4px 14px rgba(244, 201, 93, 0.25)',
          }}
        >
          Return to Blogs
        </Link>
      </div>
    );
  }

  const readingTime = estimateReadingTime(blog.body);

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Category Pill & Reading Time */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {blog.category && (
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
            style={{
              background: 'rgba(244, 201, 93, 0.1)',
              borderColor: 'rgba(244, 201, 93, 0.25)',
              color: '#F4C95D',
            }}
          >
            {blog.category}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-xs text-[#8E9AA7]">
          <Clock className="w-3.5 h-3.5 text-[#F4C95D]" />
          {readingTime.label}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-4xl font-extrabold text-[#F5F1E8] tracking-tight leading-tight mb-4">
        {blog.title}
      </h1>

      {/* Author & Meta */}
      <div
        className="flex items-center justify-between gap-4 py-4 border-y mb-6"
        style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="relative w-10 h-10 rounded-full overflow-hidden border shrink-0"
            style={{
              background: '#141D26',
              borderColor: 'rgba(244, 201, 93, 0.3)',
            }}
          >
            {blog.author?.avatar_url ? (
              <Image src={blog.author.avatar_url} alt="Author" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#F4C95D]">
                {blog.author?.display_name?.[0] || 'A'}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#F5F1E8]">{blog.author?.display_name || 'Lighthouse Creator'}</p>
            <p className="text-[11px] text-[#8E9AA7] flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-[#8E9AA7]" />
              Published {new Date(blog.published_at || blog.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center rounded-xl border overflow-hidden backdrop-blur-md"
            style={{
              background: '#111A22',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <button
              onClick={() => handleReaction('like')}
              title="Like"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                userReaction === 'like'
                  ? 'text-[#F4C95D] bg-[rgba(244,201,93,0.12)]'
                  : 'text-[#8E9AA7] hover:text-[#F5F1E8]'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${userReaction === 'like' ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={() => handleReaction('dislike')}
              title="Dislike"
              className={`px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                userReaction === 'dislike' ? 'text-red-400 bg-red-500/20' : 'text-[#8E9AA7] hover:text-[#F5F1E8]'
              }`}
            >
              <ThumbsDown className={`w-4 h-4 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
            </button>
          </div>

          <button
            onClick={handleToggleFavorite}
            title={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            className="p-2 rounded-xl border transition-all cursor-pointer"
            style={{
              background: isFavorite ? '#F4C95D' : '#111A22',
              borderColor: isFavorite ? '#F4C95D' : 'rgba(255, 255, 255, 0.08)',
              color: isFavorite ? '#070B0F' : '#8E9AA7',
              boxShadow: isFavorite ? '0 0 16px rgba(244, 201, 93, 0.3)' : 'none',
            }}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl border text-[#8E9AA7] hover:text-[#F5F1E8] transition-all cursor-pointer"
            style={{
              background: '#111A22',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Author or Admin Delete Button */}
          {user && (user.id === blog.author_id || isAdmin) && (
            <button
              onClick={() => setShowDeleteModal(true)}
              title="Delete article"
              className="p-2 rounded-xl text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 transition-colors cursor-pointer"
              style={{ background: 'rgba(239, 68, 68, 0.12)' }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cover Image */}
      {blog.cover_url && (
        <div
          className="relative aspect-video w-full rounded-2xl overflow-hidden mb-8 border"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          <Image src={blog.cover_url} alt={blog.title} fill className="object-cover" priority />
        </div>
      )}

      {/* Article Body */}
      <div className="prose prose-invert max-w-none text-sm sm:text-base text-[#C2C9D1] leading-relaxed whitespace-pre-line space-y-4 mb-12">
        {blog.body}
      </div>

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div
          className="flex flex-wrap gap-2 pb-8 border-b mb-8"
          style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          {blog.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-lg text-xs border font-medium text-[#8E9AA7] hover:text-[#F4C95D] transition-colors"
              style={{
                background: '#111A22',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Comments Section */}
      <div
        className="rounded-2xl p-6 space-y-4 border backdrop-blur-xl"
        style={{
          background: 'var(--bg-card, #111A22)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <h3 className="text-base font-bold text-[#F5F1E8] flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#F4C95D]" />
          Discussion ({comments.length})
        </h3>

        <form onSubmit={handlePostComment} className="space-y-2">
          <textarea
            rows={2}
            placeholder={user ? 'Write a thoughtful response...' : 'Sign in to join the discussion'}
            disabled={!user}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full text-[#F5F1E8] placeholder:text-[#5A6672] text-xs rounded-xl p-3 border focus:outline-none focus:border-[#F4C95D]/50 transition-all resize-none"
            style={{
              background: '#0D141C',
              borderColor: 'rgba(255, 255, 255, 0.08)',
            }}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!user || !newComment.trim()}
              className="px-4 py-2 rounded-xl text-[#070B0F] text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer shadow-md hover:brightness-110"
              style={{
                background: '#F4C95D',
                boxShadow: '0 4px 14px rgba(244, 201, 93, 0.25)',
              }}
            >
              Post Comment
            </button>
          </div>
        </form>

        <div className="space-y-3 pt-3">
          {comments.length === 0 ? (
            <p className="text-xs text-[#8E9AA7] text-center py-4">No comments yet. Start the conversation!</p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl border text-xs"
                style={{
                  background: '#0D141C',
                  borderColor: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-[#F5F1E8]">{c.user?.display_name || 'Reader'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8E9AA7]">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    {user && (user.id === c.user_id || user.id === blog?.author_id || isAdmin) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        title="Delete comment"
                        className="text-[#8E9AA7] hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[#C2C9D1] leading-relaxed">{c.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border backdrop-blur-xl"
            style={{
              background: '#111A22',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F5F1E8]">Delete Article</h3>
                <p className="text-xs text-[#8E9AA7]">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-[#C2C9D1] leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">"{blog.title}"</strong>? All associated comments and reactions will be permanently deleted.
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
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-[#8E9AA7] hover:text-[#F5F1E8] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteBlog}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-lg"
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
    </article>
  );
}
