export interface VideoItem {
  id: string;
  title: string;
  creator: {
    name: string;
    avatar: string | null;
    handle: string;
    verified?: boolean;
  };
  category: string;
  thumbnailUrl: string | null;
  views: string;
  duration: string;
  likes?: string;
}

export interface CreatorItem {
  id: string;
  name: string;
  avatar: string | null;
  handle: string;
  followers: string;
  verified?: boolean;
}

export interface CategorySection {
  id: string;
  name: string;
  subtitle?: string;
  viewAllHref?: string;
  items: VideoItem[];
}

// ─── Helpers to map dynamic Supabase data into strongly-typed models ─────────────

export function formatViewsCount(count?: number | null): string {
  if (!count || count === 0) return '0';
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return `${count}`;
}

export function formatDurationSeconds(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function mapSupabaseVideoToItem(v: any): VideoItem {
  const creatorProfile = v.creator || {};
  const creatorName =
    creatorProfile.display_name ||
    creatorProfile.username ||
    'Creator';
  const creatorHandle = creatorProfile.username
    ? `@${creatorProfile.username}`
    : creatorName;

  return {
    id: v.id,
    title: v.title || 'Untitled Video',
    creator: {
      name: creatorName,
      avatar: creatorProfile.avatar_url || null,
      handle: creatorHandle,
      verified: creatorProfile.role === 'creator',
    },
    category: v.category || v.genre || 'General',
    thumbnailUrl: v.thumbnail_url || null,
    views: formatViewsCount(v.views_count),
    duration: formatDurationSeconds(v.duration_seconds),
    likes: formatViewsCount(v.likes_count),
  };
}

export function mapSupabaseProfileToCreator(p: any): CreatorItem {
  const name = p.display_name || p.username || 'Creator';
  const handle = p.username ? `@${p.username}` : name;

  return {
    id: p.id,
    name,
    avatar: p.avatar_url || null,
    handle,
    followers: p.sub_role ? `${p.sub_role} Creator` : 'Active Creator',
    verified: true,
  };
}
