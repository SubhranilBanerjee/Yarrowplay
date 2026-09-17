'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
} from 'lucide-react';

export default function BlogReaderPage() {
  const params = useParams();
  const blogId = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const isAdmin = !!user?.email && (
    user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    user.email === 'admin@dramabox.stream'
  );

  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [dislikesCount, setDislikesCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Blog deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
          style={{ background: 'var(--glass-surface)' }}
        />
        <div
          className="h-8 rounded w-3/4 animate-pulse"
          style={{ background: 'var(--glass-surface)' }}
        />
      </div>
    );
  }

  if (!blog) {
    return (
      <div
        className="max-w-md mx-auto px-6 py-16 text-center my-12 rounded-2xl border"
        style={{
          background: 'var(--glass-surface)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <BookOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Blog Not Found</h2>
        <Link
          href="/blogs"
          className="px-5 py-2.5 rounded-xl text-white text-xs font-semibold inline-block transition-all shadow-md"
          style={{
            background: 'var(--gradient-neon)',
            boxShadow: 'var(--glow-purple)',
          }}
        >
          Return to Blogs
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Category Pill */}
      {blog.category && (
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border"
          style={{
            background: 'var(--neon-purple-glow)',
            borderColor: 'var(--neon-purple-border)',
            color: 'var(--color-pink-light)',
          }}
        >
          {blog.category}
        </span>
      )}

      {/* Title */}
      <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
        {blog.title}
      </h1>

      {/* Author & Meta */}
      <div
        className="flex items-center justify-between gap-4 py-4 border-y mb-6"
        style={{ borderColor: 'var(--glass-border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="relative w-10 h-10 rounded-full overflow-hidden border shrink-0"
            style={{
              background: 'var(--glass-surface-heavy)',
              borderColor: 'var(--neon-purple-border)',
            }}
          >
            {blog.author?.avatar_url ? (
              <Image src={blog.author.avatar_url} alt="Author" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[var(--color-pink-light)]">
                {blog.author?.display_name?.[0] || 'A'}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{blog.author?.display_name || 'Creator'}</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Published {new Date(blog.published_at || blog.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all ${
                userReaction === 'like'
                  ? 'text-[var(--color-pink-light)] shadow-inner'
                  : 'text-[var(--text-secondary)] hover:text-white'
              }`}
              style={userReaction === 'like' ? { background: 'var(--neon-purple-glow)' } : undefined}
            >
              <ThumbsUp className={`w-4 h-4 ${userReaction === 'like' ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={() => handleReaction('dislike')}
              title="Dislike"
              className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                userReaction === 'dislike' ? 'text-red-400 bg-red-500/20' : 'text-[var(--text-secondary)] hover:text-white'
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
              background: isFavorite ? 'var(--gradient-neon)' : 'var(--glass-surface)',
              borderColor: isFavorite ? 'var(--color-pink)' : 'var(--glass-border)',
              color: isFavorite ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: isFavorite ? 'var(--glow-pink)' : 'none',
            }}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl border text-[var(--text-secondary)] hover:text-white transition-all cursor-pointer"
            style={{
              background: 'var(--glass-surface)',
              borderColor: 'var(--glass-border)',
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
          style={{ borderColor: 'var(--glass-border)' }}
        >
          <Image src={blog.cover_url} alt={blog.title} fill className="object-cover" priority />
        </div>
      )}

      {/* Article Body */}
      <div className="prose prose-invert max-w-none text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed whitespace-pre-line space-y-4 mb-12">
        {blog.body}
      </div>

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div
          className="flex flex-wrap gap-2 pb-8 border-b mb-8"
          style={{ borderColor: 'var(--glass-border)' }}
        >
          {blog.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-lg text-xs border font-medium"
              style={{
                background: 'var(--glass-surface)',
                borderColor: 'var(--glass-border)',
                color: 'var(--text-secondary)',
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
          background: 'var(--glass-surface)',
          borderColor: 'var(--glass-border)',
        }}
      >
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[var(--color-pink-light)]" />
          Discussion ({comments.length})
        </h3>

        <form onSubmit={handlePostComment} className="space-y-2">
          <textarea
            rows={2}
            placeholder={user ? 'Write a thoughtful response...' : 'Sign in to join the discussion'}
            disabled={!user}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full text-white text-xs rounded-xl p-3 border focus:outline-none transition-all resize-none"
            style={{
              background: 'var(--glass-surface-heavy)',
              borderColor: 'var(--glass-border)',
            }}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!user || !newComment.trim()}
              className="px-4 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer shadow-md"
              style={{
                background: 'var(--gradient-neon)',
                boxShadow: 'var(--glow-purple)',
              }}
            >
              Post Comment
            </button>
          </div>
        </form>

        <div className="space-y-3 pt-3">
          {comments.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] text-center py-4">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl border text-xs"
                style={{
                  background: 'var(--glass-surface-heavy)',
                  borderColor: 'var(--glass-border)',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white">{c.user?.display_name || 'Reader'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-muted)]">{new Date(c.created_at).toLocaleDateString()}</span>
                    {user && (user.id === c.user_id || user.id === blog?.author_id || isAdmin) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        title="Delete comment"
                        className="text-[var(--text-muted)] hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed">{c.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

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
                <h3 className="text-lg font-bold text-white">Delete Article</h3>
                <p className="text-xs text-[var(--text-muted)]">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
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
                className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-white transition-colors cursor-pointer"
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
