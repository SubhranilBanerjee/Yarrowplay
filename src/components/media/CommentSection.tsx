'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Comment } from '@/types/database';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  CornerDownRight,
  Edit2,
  Trash2,
  Flag,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  X,
  Check,
  Sparkles,
} from 'lucide-react';

interface CommentSectionProps {
  contentType: 'video' | 'audio' | 'blog';
  contentId: string;
  creatorId?: string;
  onRequireAuth?: () => void;
}

function formatRelativeTime(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return past.toLocaleDateString();
}

interface CommentItemProps {
  comment: Comment;
  depth: number;
  contentCreatorId?: string;
  onReply: (parentId: string, text: string) => Promise<void>;
  onEdit: (commentId: string, newText: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReact: (commentId: string, type: 'like' | 'dislike') => Promise<void>;
  onReport: (commentId: string) => void;
  onRequireAuth?: () => void;
}

function CommentItem({
  comment,
  depth,
  contentCreatorId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onReport,
  onRequireAuth,
}: CommentItemProps) {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const [showReplies, setShowReplies] = useState(true);

  const isOwner = user?.id === comment.user_id;
  const isContentCreator = user?.id === contentCreatorId;
  const isAdmin = !!user?.email && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const canDelete = isOwner || isContentCreator || isAdmin;

  // Max visual indentation to prevent mobile squishing (clamped at 3 indent levels)
  const visualIndentClass = depth === 0 ? '' : depth === 1 ? 'ml-3 sm:ml-6' : depth === 2 ? 'ml-6 sm:ml-10' : 'ml-8 sm:ml-12';

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth?.();
      return;
    }
    if (!replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText('');
      setIsReplying(false);
      setShowReplies(true);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim() || editText.trim() === comment.content) {
      setIsEditing(false);
      return;
    }
    setIsSubmittingEdit(true);
    try {
      await onEdit(comment.id, editText.trim());
      setIsEditing(false);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  return (
    <div className={`group/comment relative ${visualIndentClass} transition-all`}>
      {/* Visual thread line for nested replies */}
      {depth > 0 && (
        <div className="absolute -left-2.5 sm:-left-4 top-0 bottom-3 w-px bg-[#27313A] group-hover/comment:bg-[#F4C95D]/50 transition-colors" />
      )}

      <div
        className={`p-3 sm:p-4 rounded-2xl border text-xs transition-all ${
          comment.is_deleted
            ? 'bg-black/20 border-white/5 opacity-65 italic'
            : 'bg-[#111A22] border-[#27313A] hover:border-[#27313A]/90'
        }`}
      >
        {/* Author Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar */}
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-[#27313A] shrink-0">
              {comment.user?.avatar_url ? (
                <Image src={comment.user.avatar_url} alt="" fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-[#F4C95D] bg-[#151F28] text-[10px]">
                  {comment.user?.display_name?.[0] || 'U'}
                </div>
              )}
            </div>

            {/* Name & Handle */}
            <div className="min-w-0 truncate">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-[#F5F1E8] truncate text-xs sm:text-sm">
                  {comment.user?.display_name || comment.user?.username || 'Viewer'}
                </span>
                {comment.user?.role === 'creator' && (
                  <span className="px-1.5 py-0.2 rounded-md bg-[#F4C95D]/15 border border-[#F4C95D]/40 text-[9px] font-bold text-[#F4C95D] uppercase tracking-wider">
                    Creator
                  </span>
                )}
                {contentCreatorId && comment.user_id === contentCreatorId && (
                  <span className="px-1.5 py-0.2 rounded-md bg-[#7E9BB5]/20 border border-[#7E9BB5]/40 text-[9px] font-bold text-[#9DB9D0] uppercase tracking-wider">
                    Author
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#7F8993]">
                {formatRelativeTime(comment.created_at)}
                {comment.is_edited && ' · (edited)'}
              </span>
            </div>
          </div>

          {/* Action Menu (Edit / Delete / Report) */}
          <div className="flex items-center gap-1 opacity-80 group-hover/comment:opacity-100 transition-opacity">
            {!comment.is_deleted && isOwner && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                title="Edit Comment"
                className="p-1 hover:text-[#F5F1E8] text-[#7F8993] transition-colors rounded-lg hover:bg-white/5"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            {!comment.is_deleted && canDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                title="Delete Comment"
                className="p-1 hover:text-[#D96868] text-[#7F8993] transition-colors rounded-lg hover:bg-white/5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {!comment.is_deleted && !isOwner && (
              <button
                onClick={() => onReport(comment.id)}
                title="Report Comment"
                className="p-1 hover:text-[#E8B84A] text-[#7F8993] transition-colors rounded-lg hover:bg-white/5"
              >
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Comment Body */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="mt-2 space-y-2">
            <textarea
              rows={2}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full text-[#F5F1E8] text-xs rounded-xl p-2.5 border bg-[#141D26] border-[#27313A] focus:outline-none focus:border-[#F4C95D] transition-all resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 rounded-lg text-xs text-[#7F8993] hover:text-[#F5F1E8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingEdit || !editText.trim()}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-[#0B0F13] bg-[#F4C95D] hover:bg-[#FFD978] disabled:opacity-50"
              >
                {isSubmittingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-[#F5F1E8]/90 leading-relaxed break-words whitespace-pre-wrap pl-0.5">
            {comment.content}
          </p>
        )}

        {/* Bottom Bar: Like, Dislike, Reply */}
        {!comment.is_deleted && (
          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-[#27313A]/60 text-[11px] text-[#7F8993]">
            {/* Like */}
            <button
              onClick={() => {
                if (!user) {
                  onRequireAuth?.();
                  return;
                }
                onReact(comment.id, 'like');
              }}
              className={`flex items-center gap-1 hover:text-[#F5F1E8] transition-colors cursor-pointer ${
                comment.user_reaction === 'like' ? 'text-[#F4C95D] font-bold' : ''
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${comment.user_reaction === 'like' ? 'fill-current' : ''}`} />
              <span>{comment.likes_count || 0}</span>
            </button>

            {/* Dislike */}
            <button
              onClick={() => {
                if (!user) {
                  onRequireAuth?.();
                  return;
                }
                onReact(comment.id, 'dislike');
              }}
              className={`flex items-center gap-1 hover:text-[#F5F1E8] transition-colors cursor-pointer ${
                comment.user_reaction === 'dislike' ? 'text-[#D96868] font-bold' : ''
              }`}
            >
              <ThumbsDown className={`w-3.5 h-3.5 ${comment.user_reaction === 'dislike' ? 'fill-current' : ''}`} />
            </button>

            {/* Reply Button */}
            <button
              onClick={() => {
                if (!user) {
                  onRequireAuth?.();
                  return;
                }
                setIsReplying(!isReplying);
              }}
              className="flex items-center gap-1 text-[#F4C95D] hover:underline font-semibold ml-2 cursor-pointer"
            >
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>Reply</span>
            </button>
          </div>
        )}

        {/* Inline Reply Form */}
        {isReplying && (
          <form onSubmit={handleSendReply} className="mt-3 pt-3 border-t border-[#27313A] space-y-2">
            <div className="flex items-start gap-2">
              <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 mt-1 border border-[#27313A]">
                {user?.user_metadata?.avatar_url ? (
                  <Image src={user.user_metadata.avatar_url} alt="" fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#151F28] text-[10px] text-[#F4C95D] flex items-center justify-center font-bold">
                    U
                  </div>
                )}
              </div>
              <textarea
                rows={2}
                autoFocus
                placeholder={`Reply to ${comment.user?.display_name || 'user'}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full text-[#F5F1E8] text-xs rounded-xl p-2.5 border bg-[#141D26] border-[#27313A] focus:outline-none focus:border-[#F4C95D] transition-all resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReplying(false)}
                className="px-3 py-1 rounded-lg text-xs text-[#7F8993] hover:text-[#F5F1E8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReply || !replyText.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0F13] text-xs font-semibold disabled:opacity-40 shadow-md"
              >
                {isSubmittingReply ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Reply</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Nested Replies List */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {/* Toggle show/hide replies */}
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="text-[11px] text-[#7E9BB5] hover:text-[#9DB9D0] font-semibold flex items-center gap-1.5 my-1 ml-4 cursor-pointer"
          >
            {showReplies ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>
              {showReplies
                ? `Hide ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`
                : `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
            </span>
          </button>

          {showReplies &&
            comment.replies.map((child) => (
              <CommentItem
                key={child.id}
                comment={child}
                depth={depth + 1}
                contentCreatorId={contentCreatorId}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onReact={onReact}
                onReport={onReport}
                onRequireAuth={onRequireAuth}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Report Comment Modal ───────────────────────────────────────────────────
function ReportModal({
  commentId,
  onClose,
  onSuccess,
}: {
  commentId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState('Spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/comments/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId, reason, details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit report');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Report submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 relative bg-[#101820] border border-[#27313A]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#7F8993] hover:text-[#F5F1E8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-[#F5F1E8] font-bold text-base flex items-center gap-2">
          <Flag className="w-4 h-4 text-[#E8B84A]" />
          Report Comment
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-[#7F8993] uppercase mb-1">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#141D26] text-[#F5F1E8] text-xs rounded-xl p-2.5 border border-[#27313A] focus:outline-none focus:border-[#F4C95D]"
            >
              <option value="Spam">Spam or unwanted commercial content</option>
              <option value="Harassment">Harassment or bullying</option>
              <option value="Hate Speech">Hate speech or offensive content</option>
              <option value="Misinformation">Misinformation</option>
              <option value="Other">Other reason</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#7F8993] uppercase mb-1">Additional details (optional)</label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more context..."
              className="w-full bg-[#141D26] text-[#F5F1E8] text-xs rounded-xl p-2.5 border border-[#27313A] focus:outline-none focus:border-[#F4C95D] resize-none"
            />
          </div>

          {error && <p className="text-xs text-[#D96868]">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs text-[#7F8993] hover:text-[#F5F1E8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-[#0B0F13] text-xs font-semibold bg-[#E8B84A] hover:bg-[#FFD978] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main CommentSection Component ─────────────────────────────────────────
export function CommentSection({
  contentType,
  contentId,
  creatorId,
  onRequireAuth,
}: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOrder, setSortOrder] = useState<'newest' | 'top'>('newest');
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportSuccessNotice, setReportSuccessNotice] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/comments?content_type=${contentType}&content_id=${contentId}&sort=${sortOrder}`
      );
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [contentType, contentId, sortOrder]);

  useEffect(() => {
    if (!contentId) return;
    setIsLoading(true);
    fetchComments();
  }, [fetchComments, contentId]);

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth?.();
      return;
    }
    if (!newComment.trim()) return;

    setIsPosting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          content: newComment.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setComments((prev) => [data.comment, ...prev]);
          setTotalCount((prev) => prev + 1);
          setNewComment('');
        }
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleReply = async (parentId: string, text: string) => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content_type: contentType,
        content_id: contentId,
        content: text,
        parent_id: parentId,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.comment) {
        // Deeply insert reply into comment tree
        const insertReplyInTree = (list: Comment[]): Comment[] => {
          return list.map((item) => {
            if (item.id === parentId) {
              return {
                ...item,
                replies: [...(item.replies || []), data.comment],
                reply_count: (item.reply_count || 0) + 1,
              };
            }
            if (item.replies && item.replies.length > 0) {
              return {
                ...item,
                replies: insertReplyInTree(item.replies),
              };
            }
            return item;
          });
        };

        setComments((prev) => insertReplyInTree(prev));
        setTotalCount((prev) => prev + 1);
      }
    }
  };

  const handleEdit = async (commentId: string, newText: string) => {
    const res = await fetch('/api/comments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: commentId, content: newText }),
    });

    if (res.ok) {
      const updateTextInTree = (list: Comment[]): Comment[] => {
        return list.map((item) => {
          if (item.id === commentId) {
            return { ...item, content: newText, is_edited: true };
          }
          if (item.replies && item.replies.length > 0) {
            return { ...item, replies: updateTextInTree(item.replies) };
          }
          return item;
        });
      };
      setComments((prev) => updateTextInTree(prev));
    }
  };

  const handleDelete = async (commentId: string) => {
    const res = await fetch(`/api/comments?id=${commentId}`, { method: 'DELETE' });
    if (res.ok) {
      const data = await res.json();
      if (data.softDeleted) {
        // Soft delete update
        const softDeleteInTree = (list: Comment[]): Comment[] => {
          return list.map((item) => {
            if (item.id === commentId) {
              return { ...item, content: '[This comment was deleted by user]', is_deleted: true };
            }
            if (item.replies && item.replies.length > 0) {
              return { ...item, replies: softDeleteInTree(item.replies) };
            }
            return item;
          });
        };
        setComments((prev) => softDeleteInTree(prev));
      } else {
        // Hard remove
        const removeInTree = (list: Comment[]): Comment[] => {
          return list
            .filter((item) => item.id !== commentId)
            .map((item) => ({
              ...item,
              replies: item.replies ? removeInTree(item.replies) : [],
            }));
        };
        setComments((prev) => removeInTree(prev));
        setTotalCount((prev) => Math.max(0, prev - 1));
      }
    }
  };

  const handleReact = async (commentId: string, type: 'like' | 'dislike') => {
    const res = await fetch('/api/comments/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId, reaction_type: type }),
    });

    if (res.ok) {
      const data = await res.json();
      const updateReactionInTree = (list: Comment[]): Comment[] => {
        return list.map((item) => {
          if (item.id === commentId) {
            return {
              ...item,
              user_reaction: data.userReaction,
              likes_count: data.likesCount,
              dislikes_count: data.dislikesCount,
            };
          }
          if (item.replies && item.replies.length > 0) {
            return { ...item, replies: updateReactionInTree(item.replies) };
          }
          return item;
        });
      };
      setComments((prev) => updateReactionInTree(prev));
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Sort Selector */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#27313A]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#F4C95D]" />
          <h2 className="text-sm sm:text-base font-bold text-[#F5F1E8]">
            Comments ({totalCount})
          </h2>
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-[#7F8993] hidden xs:inline">Sort:</span>
          <button
            onClick={() => setSortOrder('newest')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              sortOrder === 'newest'
                ? 'bg-[#151F28] border border-[#27313A] text-[#F4C95D] font-bold'
                : 'text-[#7F8993] hover:text-[#F5F1E8]'
            }`}
          >
            Newest
          </button>
          <button
            onClick={() => setSortOrder('top')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              sortOrder === 'top'
                ? 'bg-[#151F28] border border-[#27313A] text-[#F4C95D] font-bold'
                : 'text-[#7F8993] hover:text-[#F5F1E8]'
            }`}
          >
            Top Liked
          </button>
        </div>
      </div>

      {/* Main Comment Box */}
      {user ? (
        <form onSubmit={handleCreateComment} className="space-y-2">
          <div className="relative">
            <textarea
              rows={2}
              placeholder="Join the discussion... Type your comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full text-[#F5F1E8] placeholder:text-[#7F8993] text-xs sm:text-sm rounded-2xl p-3.5 border bg-[#141D26] border-[#27313A] focus:outline-none focus:border-[#F4C95D] transition-all resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPosting || !newComment.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0F13] text-xs sm:text-sm font-semibold disabled:opacity-40 transition-all cursor-pointer shadow-md active:scale-95"
            >
              {isPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Post Comment</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 rounded-2xl border bg-[#111A22] border-[#27313A] flex items-center justify-between gap-3 text-xs">
          <span className="text-[#7F8993]">Sign in to join the conversation and post a comment.</span>
          <button
            onClick={onRequireAuth}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#F4C95D] hover:bg-[#FFD978] text-[#0B0F13] transition-all shadow-md shrink-0 cursor-pointer"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Report Success Alert */}
      {reportSuccessNotice && (
        <div className="p-3 rounded-xl bg-[#68B88A]/10 border border-[#68B88A]/30 text-xs text-[#68B88A] flex items-center justify-between">
          <span>Thank you for reporting. Our moderation team will review it.</span>
          <button onClick={() => setReportSuccessNotice(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Comment Tree */}
      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-[#7F8993]">
          <Loader2 className="w-6 h-6 animate-spin text-[#F4C95D]" />
          <span className="text-xs">Loading comments...</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#7F8993] space-y-1">
          <MessageSquare className="w-8 h-8 text-[#7F8993]/30 mx-auto mb-2" />
          <p className="font-semibold text-[#F5F1E8]/80">No comments yet.</p>
          <p>Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-3 pt-2">
          {comments.map((rootComment) => (
            <CommentItem
              key={rootComment.id}
              comment={rootComment}
              depth={0}
              contentCreatorId={creatorId}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReact={handleReact}
              onReport={(id) => setReportingCommentId(id)}
              onRequireAuth={onRequireAuth}
            />
          ))}
        </div>
      )}

      {/* Report Modal */}
      {reportingCommentId && (
        <ReportModal
          commentId={reportingCommentId}
          onClose={() => setReportingCommentId(null)}
          onSuccess={() => {
            setReportingCommentId(null);
            setReportSuccessNotice(true);
            setTimeout(() => setReportSuccessNotice(false), 5000);
          }}
        />
      )}
    </div>
  );
}
