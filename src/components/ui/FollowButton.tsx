'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

interface FollowButtonProps {
  creatorId: string;
  initialIsFollowing?: boolean;
  initialFollowersCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onFollowChange?: (isFollowing: boolean, count: number) => void;
  onRequireAuth?: () => void;
}

function formatFollowerCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return count.toString();
}

export function FollowButton({
  creatorId,
  initialIsFollowing,
  initialFollowersCount,
  showCount = true,
  size = 'md',
  className = '',
  onFollowChange,
  onRequireAuth,
}: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState<boolean>(!!initialIsFollowing);
  const [followersCount, setFollowersCount] = useState<number>(initialFollowersCount ?? 0);
  const [isLoading, setIsLoading] = useState<boolean>(initialIsFollowing === undefined);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const isSelf = user?.id === creatorId;

  // Query status if not supplied
  useEffect(() => {
    if (!creatorId) return;
    if (initialIsFollowing !== undefined && initialFollowersCount !== undefined) {
      setIsFollowing(initialIsFollowing);
      setFollowersCount(initialFollowersCount);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    fetch(`/api/creators/follow?creator_id=${creatorId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setIsFollowing(!!data.isFollowing);
        setFollowersCount(data.followersCount || 0);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [creatorId, initialIsFollowing, initialFollowersCount]);

  if (isSelf) {
    return null;
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      onRequireAuth?.();
      return;
    }

    if (isSubmitting) return;

    // Optimistic toggle
    const prevFollowing = isFollowing;
    const prevCount = followersCount;
    const nextFollowing = !isFollowing;
    const nextCount = nextFollowing ? prevCount + 1 : Math.max(0, prevCount - 1);

    setIsFollowing(nextFollowing);
    setFollowersCount(nextCount);
    onFollowChange?.(nextFollowing, nextCount);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/creators/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creator_id: creatorId }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Rollback
        setIsFollowing(prevFollowing);
        setFollowersCount(prevCount);
        onFollowChange?.(prevFollowing, prevCount);
      } else {
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.followersCount);
        onFollowChange?.(data.isFollowing, data.followersCount);
      }
    } catch {
      // Rollback on network failure
      setIsFollowing(prevFollowing);
      setFollowersCount(prevCount);
      onFollowChange?.(prevFollowing, prevCount);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1 rounded-lg',
    md: 'text-xs px-3.5 py-1.5 gap-1.5 rounded-xl',
    lg: 'text-sm px-5 py-2.5 gap-2 rounded-2xl font-bold',
  }[size];

  return (
    <button
      type="button"
      onClick={handleToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading || isSubmitting}
      className={`inline-flex items-center font-semibold transition-all duration-200 cursor-pointer select-none active:scale-95 disabled:opacity-60 ${sizeClasses} ${
        isFollowing
          ? isHovered
            ? 'bg-red-500/15 border border-red-500/40 text-red-400'
            : 'bg-white/10 border border-white/15 text-white hover:bg-white/15'
          : 'text-white border border-transparent shadow-md'
      } ${className}`}
      style={
        !isFollowing
          ? {
              background: 'var(--gradient-neon)',
              boxShadow: 'var(--glow-purple)',
            }
          : undefined
      }
    >
      {isSubmitting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isFollowing ? (
        isHovered ? (
          <span>Unfollow</span>
        ) : (
          <>
            <UserCheck className="w-3.5 h-3.5 text-[var(--color-pink-light)]" />
            <span>Following</span>
          </>
        )
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          <span>Follow</span>
        </>
      )}

      {showCount && followersCount > 0 && (
        <span
          className={`ml-1 text-[11px] font-normal px-1.5 py-0.2 rounded-full ${
            isFollowing ? 'bg-white/10 text-[var(--text-muted)]' : 'bg-black/25 text-white/90'
          }`}
        >
          {formatFollowerCount(followersCount)}
        </span>
      )}
    </button>
  );
}
