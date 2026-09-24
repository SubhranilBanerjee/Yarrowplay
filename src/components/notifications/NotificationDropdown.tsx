'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Heart,
  ThumbsDown,
  MessageSquare,
  Star,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Notification } from '@/types/database';

function formatRelativeTime(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function NotificationDropdown() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications?limit=25');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);

    // Supabase Realtime subscription
    let channel: any;
    try {
      const supabase = createClient();
      channel = supabase
        .channel(`user-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();
    } catch (err) {
      console.error('Realtime subscription error:', err);
    }

    return () => {
      clearInterval(interval);
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [user]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

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

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

    // Navigate to appropriate target
    if (notification.content_type === 'video' && notification.content_id) {
      router.push(`/videos/${notification.content_id}`);
    } else if (notification.content_type === 'blog' && notification.content_id) {
      router.push(`/blogs/${notification.content_id}`);
    } else if (notification.content_type === 'audio' && notification.content_id) {
      router.push(`/home`);
    } else {
      router.push('/notifications');
    }
  };

  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.is_read : true
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'like':
        return (
          <div className="w-5 h-5 rounded-full bg-[#D96868]/20 text-[#D96868] flex items-center justify-center border border-[#D96868]/30">
            <Heart className="w-3 h-3 fill-[#D96868] text-[#D96868]" />
          </div>
        );
      case 'dislike':
        return (
          <div className="w-5 h-5 rounded-full bg-[#7E9BB5]/20 text-[#7E9BB5] flex items-center justify-center border border-[#7E9BB5]/30">
            <ThumbsDown className="w-3 h-3 text-[#7E9BB5]" />
          </div>
        );
      case 'comment':
        return (
          <div className="w-5 h-5 rounded-full bg-[#7E9BB5]/20 text-[#7E9BB5] flex items-center justify-center border border-[#7E9BB5]/30">
            <MessageSquare className="w-3 h-3 fill-[#7E9BB5]/30 text-[#7E9BB5]" />
          </div>
        );
      case 'favorite':
        return (
          <div className="w-5 h-5 rounded-full bg-[#F4C95D]/20 text-[#F4C95D] flex items-center justify-center border border-[#F4C95D]/30">
            <Star className="w-3 h-3 fill-[#F4C95D] text-[#F4C95D]" />
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-[#7E9BB5]/20 text-[#7E9BB5] flex items-center justify-center border border-[#7E9BB5]/30">
            <Bell className="w-3 h-3 text-[#7E9BB5]" />
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
            <strong className="text-[#F5F1E8] font-medium">{actorName}</strong> liked your {typeLabel}{' '}
            {n.content_title && <span className="text-[#F4C95D]">"{n.content_title}"</span>}
          </span>
        );
      case 'dislike':
        return (
          <span>
            <strong className="text-[#F5F1E8] font-medium">{actorName}</strong> gave feedback on your {typeLabel}{' '}
            {n.content_title && <span className="text-[#7E9BB5]">"{n.content_title}"</span>}
          </span>
        );
      case 'comment':
        return (
          <span>
            <strong className="text-[#F5F1E8] font-medium">{actorName}</strong> commented on your {typeLabel}{' '}
            {n.content_title && <span className="text-[#F4C95D]">"{n.content_title}"</span>}
          </span>
        );
      case 'favorite':
        return (
          <span>
            <strong className="text-[#F5F1E8] font-medium">{actorName}</strong> favorited your {typeLabel}{' '}
            {n.content_title && <span className="text-[#F4C95D]">"{n.content_title}"</span>}
          </span>
        );
      default:
        return (
          <span>
            <strong className="text-[#F5F1E8] font-medium">{actorName}</strong> interacted with your {typeLabel}
          </span>
        );
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        aria-label="Notifications"
        onClick={handleToggle}
        className={`relative w-9 h-9 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
          isOpen
            ? 'border-[#F4C95D] text-[#F4C95D] bg-[#141D26]'
            : 'border-[#27313A] text-[#B7BEC6] hover:text-[#F5F1E8] hover:border-[#F4C95D]/40 bg-[#111A22]'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#F4C95D] text-[#0B0F13] text-[10px] font-black rounded-full flex items-center justify-center shadow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Glassmorphic Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#101820] border border-[#27313A] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#27313A] flex items-center justify-between bg-[#151F28]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#F5F1E8] flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F4C95D]/20 text-[#F4C95D] border border-[#F4C95D]/40">
                    {unreadCount} new
                  </span>
                )}
              </h3>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#F4C95D] hover:underline flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center px-4 py-2 border-b border-[#1C252D] gap-2 bg-[#0B1117]">
            <button
              onClick={() => setFilter('all')}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#F4C95D] text-[#0B0F13] font-bold shadow'
                  : 'text-[#B7BEC6] hover:text-[#F5F1E8] hover:bg-[#151F28]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                filter === 'unread'
                  ? 'bg-[#F4C95D] text-[#0B0F13] font-bold shadow'
                  : 'text-[#B7BEC6] hover:text-[#F5F1E8] hover:bg-[#151F28]'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#0B0F13] text-[#F4C95D] text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[#1C252D]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#151F28] border border-[#27313A] flex items-center justify-center text-[#7F8993] mb-3">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-[#F5F1E8]">No notifications</p>
                <p className="text-xs text-[#7F8993] mt-1">
                  {filter === 'unread'
                    ? "You have read all your notifications!"
                    : "You'll be notified when someone likes, comments, or interacts with your content."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                    notification.is_read
                      ? 'hover:bg-[#151F28]'
                      : 'bg-[#141D26] hover:bg-[#151F28] border-l-2 border-l-[#F4C95D]'
                  }`}
                >
                  {/* Actor Avatar with Action Badge */}
                  <div className="relative shrink-0 mt-0.5">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#151F28] border border-[#27313A] flex items-center justify-center text-xs font-bold text-[#F4C95D]">
                      {notification.actor?.avatar_url ? (
                        <Image
                          src={notification.actor.avatar_url}
                          alt={notification.actor.display_name || 'User'}
                          fill
                          sizes="40px"
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

                  {/* Body Text */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#B7BEC6] leading-relaxed">
                      {getActionText(notification)}
                    </div>

                    {/* Comment preview if applicable */}
                    {notification.message && (
                      <p className="mt-1 text-xs text-[#7F8993] bg-[#0B1117] px-2.5 py-1.5 rounded-lg border border-[#1C252D] italic line-clamp-2">
                        "{notification.message}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-[#7F8993]">
                        {formatRelativeTime(notification.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => markAsRead(notification.id, e)}
                        title="Mark as read"
                        className="p-1 rounded-md text-[#7F8993] hover:text-[#F5F1E8] hover:bg-[#151F28]"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => deleteNotification(notification.id, e)}
                      title="Delete notification"
                      className="p-1 rounded-md text-[#7F8993] hover:text-[#D96868] hover:bg-[#D96868]/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {!notification.is_read && (
                    <div className="w-2 h-2 rounded-full bg-[#F4C95D] shrink-0 self-center group-hover:hidden" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-[#27313A] bg-[#151F28] text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-[#F4C95D] hover:underline transition-colors flex items-center justify-center gap-1.5 py-1"
            >
              <span>View all notifications</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
