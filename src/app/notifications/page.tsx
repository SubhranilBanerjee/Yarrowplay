'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Heart,
  ThumbsDown,
  MessageSquare,
  Star,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Notification } from '@/types/database';

function formatRelativeTime(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

type FilterCategory = 'all' | 'unread' | 'reactions' | 'comments' | 'favorites';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<FilterCategory>('all');

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch('/api/notifications?limit=100');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const target = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm('Are you sure you want to delete all notifications?')) return;
    try {
      setNotifications([]);
      setUnreadCount(0);

      await fetch('/api/notifications?all=true', {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (notification.content_type === 'video' && notification.content_id) {
      router.push(`/videos/${notification.content_id}`);
    } else if (notification.content_type === 'blog' && notification.content_id) {
      router.push(`/blogs/${notification.content_id}`);
    } else if (notification.content_type === 'audio' && notification.content_id) {
      router.push('/home');
    }
  };

  const filtered = notifications.filter((n) => {
    if (category === 'unread') return !n.is_read;
    if (category === 'reactions') return n.action_type === 'like' || n.action_type === 'dislike';
    if (category === 'comments') return n.action_type === 'comment';
    if (category === 'favorites') return n.action_type === 'favorite';
    return true;
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'like':
        return (
          <div className="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
            <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-400" />
          </div>
        );
      case 'dislike':
        return (
          <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <ThumbsDown className="w-3.5 h-3.5 text-cyan-400" />
          </div>
        );
      case 'comment':
        return (
          <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <MessageSquare className="w-3.5 h-3.5 fill-purple-400/30 text-purple-400" />
          </div>
        );
      case 'favorite':
        return (
          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
            <Bell className="w-3.5 h-3.5 text-violet-400" />
          </div>
        );
    }
  };

  const getActionText = (n: Notification) => {
    const actorName = n.actor?.display_name || n.actor?.username || 'Someone';
    const typeLabel = n.content_type || 'content';

    switch (n.action_type) {
      case 'like':
        return (
          <span>
            <strong className="text-white font-semibold">{actorName}</strong> liked your {typeLabel}{' '}
            {n.content_title && <span className="text-[var(--color-pink)]">"{n.content_title}"</span>}
          </span>
        );
      case 'dislike':
        return (
          <span>
            <strong className="text-white font-semibold">{actorName}</strong> gave feedback on your {typeLabel}{' '}
            {n.content_title && <span className="text-cyan-400">"{n.content_title}"</span>}
          </span>
        );
      case 'comment':
        return (
          <span>
            <strong className="text-white font-semibold">{actorName}</strong> commented on your {typeLabel}{' '}
            {n.content_title && <span className="text-[var(--color-pink)]">"{n.content_title}"</span>}
          </span>
        );
      case 'favorite':
        return (
          <span>
            <strong className="text-white font-semibold">{actorName}</strong> favorited your {typeLabel}{' '}
            {n.content_title && <span className="text-amber-400">"{n.content_title}"</span>}
          </span>
        );
      default:
        return (
          <span>
            <strong className="text-white font-semibold">{actorName}</strong> interacted with your {typeLabel}
          </span>
        );
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] mx-auto flex items-center justify-center text-[var(--text-muted)] mb-4">
          <Bell className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Sign in to view notifications</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Stay connected with comments, likes, and feedback on your content.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 theme-neon-button px-6 py-2.5 rounded-full text-sm font-semibold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--glass-border)]">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className="p-2 rounded-full bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-purple-bright)]/20 text-[var(--color-pink)] border border-[var(--color-purple-bright)]/40 shadow-[0_0_10px_rgba(224,0,255,0.3)]">
                  {unreadCount} unread
                </span>
              )}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1.5 ml-11">
            Realtime activity feed for likes, dislikes, comments, and favorites on your content.
          </p>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto ml-11 sm:ml-0">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] hover:border-[var(--color-magenta)] text-xs font-semibold text-[var(--color-pink)] hover:text-white transition-all cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border)] hover:border-red-500/40 text-xs font-semibold text-[var(--text-muted)] hover:text-red-400 transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none border-b border-[var(--glass-border-subtle)]">
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'unread', label: `Unread (${unreadCount})` },
            { key: 'reactions', label: 'Likes & Dislikes' },
            { key: 'comments', label: 'Comments' },
            { key: 'favorites', label: 'Favorites' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategory(tab.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              category === tab.key
                ? 'bg-[var(--color-purple-bright)] text-white shadow-[0_0_15px_rgba(157,0,255,0.4)]'
                : 'bg-[var(--glass-surface-subtle)] border border-[var(--glass-border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--glass-border)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="mt-4 space-y-2.5">
        {loading ? (
          <div className="space-y-3 py-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-[var(--glass-surface-subtle)] border border-[var(--glass-border-subtle)] animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center theme-glass-card rounded-3xl border border-[var(--glass-border)] mt-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-purple-bright)]/10 border border-[var(--color-purple-bright)]/30 mx-auto flex items-center justify-center text-[var(--color-pink)] mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No notifications found</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              {category === 'unread'
                ? "You're all caught up! There are no unread notifications right now."
                : 'Activity such as likes, comments, and favorites on your content will appear here.'}
            </p>
          </div>
        ) : (
          filtered.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group flex items-start gap-4 ${
                notification.is_read
                  ? 'bg-[var(--glass-surface-subtle)] border-[var(--glass-border-subtle)] hover:bg-[var(--glass-surface-elevated)] hover:border-[var(--glass-border)]'
                  : 'bg-[var(--color-purple-bright)]/10 border-[var(--color-magenta)]/30 hover:bg-[var(--color-purple-bright)]/15 shadow-[0_0_15px_rgba(224,0,255,0.08)]'
              }`}
            >
              {/* Actor Avatar */}
              <div className="relative shrink-0 mt-0.5">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--color-purple-bright)]/20 border border-[var(--glass-border)] flex items-center justify-center text-sm font-bold text-[var(--color-pink)]">
                  {notification.actor?.avatar_url ? (
                    <Image
                      src={notification.actor.avatar_url}
                      alt={notification.actor.display_name || 'User'}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    notification.actor?.display_name?.[0]?.toUpperCase() ||
                    notification.actor?.username?.[0]?.toUpperCase() ||
                    'U'
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1">
                  {getActionIcon(notification.action_type)}
                </div>
              </div>

              {/* Content text */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {getActionText(notification)}
                </div>

                {notification.message && (
                  <div className="mt-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-primary)]/80 p-3 rounded-xl border border-[var(--glass-border-subtle)] italic max-w-2xl">
                    "{notification.message}"
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-[var(--text-muted)]">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                  {notification.content_type && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[var(--glass-surface-subtle)] text-[var(--text-muted)] border border-[var(--glass-border-subtle)]">
                      {notification.content_type}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0 self-center">
                {!notification.is_read ? (
                  <button
                    onClick={(e) => markAsRead(notification.id, e)}
                    title="Mark as read"
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-[var(--glass-surface-elevated)] transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-[11px] text-[var(--text-muted)] font-medium hidden sm:inline-block">
                    Read
                  </span>
                )}
                <button
                  onClick={(e) => deleteNotification(notification.id, e)}
                  title="Delete"
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
