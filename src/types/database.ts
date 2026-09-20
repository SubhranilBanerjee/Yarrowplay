export type UserRole = 'viewer' | 'creator' | 'advertiser';
export type CreatorSubRole = 'Professional' | 'Student' | 'Hobbyist';

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  role: UserRole;
  sub_role: CreatorSubRole | null;
  company_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  coins_balance?: number;
  vip_tier?: 'none' | 'weekly' | 'monthly' | 'annual';
  vip_expires_at?: string | null;
  last_check_in_date?: string | null;
  check_in_streak?: number;
  created_at: string;
  updated_at: string;
}

export type CoinTransactionType = 'purchase' | 'reward_ad' | 'daily_check_in' | 'episode_unlock' | 'bonus';

export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: CoinTransactionType;
  description: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface EpisodeUnlock {
  id: string;
  user_id: string;
  video_id: string;
  series_id: string | null;
  coins_spent: number;
  created_at: string;
}

export interface CoinPack {
  id: string;
  coins: number;
  bonus_coins: number;
  price_usd: number;
  price_inr: number;
  popular?: boolean;
  best_value?: boolean;
  tag?: string;
}

export interface ContentSeries {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string | null;
  tags: string[];
  cover_url: string | null;
  cover_public_id: string | null;
  total_episodes: number;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  episodes?: Video[];
}

export interface Video {
  id: string;
  creator_id: string;
  series_id: string | null;
  episode_number: number | null;
  title: string;
  description: string;
  summary: string | null;
  category: string | null;
  genre: string | null;
  tags: string[];
  video_url: string;
  video_public_id: string | null;
  thumbnail_url: string | null;
  thumbnail_public_id: string | null;
  duration_seconds: number;
  visibility: 'public' | 'unlisted' | 'draft';
  status: 'processing' | 'published' | 'archived' | 'draft';
  views_count: number;
  likes_count: number;
  dislikes_count: number;
  shares_count: number;
  comments_count: number;
  is_locked: boolean;
  price_inr: number | null;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  series?: ContentSeries;
  boosted?: boolean;
}

export interface AudioAlbum {
  id: string;
  creator_id: string;
  title: string;
  artist_name: string;
  genre: string | null;
  description: string | null;
  cover_url: string | null;
  cover_public_id: string | null;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  tracks?: AudioTrack[];
}

export interface AudioTrack {
  id: string;
  creator_id: string;
  album_id: string | null;
  track_number: number | null;
  title: string;
  artist_name: string;
  genre: string | null;
  description: string | null;
  audio_url: string;
  audio_public_id: string | null;
  cover_url: string | null;
  cover_public_id: string | null;
  lyrics: string | null;
  duration_seconds: number;
  visibility: 'public' | 'draft';
  status: 'published' | 'draft';
  views_count: number;
  likes_count: number;
  dislikes_count: number;
  shares_count: number;
  created_at: string;
  creator?: Profile;
  album?: AudioAlbum;
}

export interface Blog {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  cover_url: string | null;
  cover_public_id: string | null;
  body: string;
  category: string | null;
  tags: string[];
  status: 'draft' | 'published';
  published_at: string;
  views_count: number;
  likes_count: number;
  dislikes_count: number;
  shares_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface Reaction {
  id: string;
  user_id: string;
  content_type: 'video' | 'audio' | 'blog';
  content_id: string;
  reaction_type: 'like' | 'dislike';
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  content_type: 'video' | 'audio' | 'blog';
  content_id: string;
  created_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  video_id?: string | null;
  audio_id?: string | null;
  created_at: string;
  video?: Video;
  audio?: AudioTrack;
}

export interface Comment {
  id: string;
  user_id: string;
  content_type: 'video' | 'audio' | 'blog';
  content_id: string;
  timestamp_seconds: number | null;
  content: string;
  created_at: string;
  user?: Profile;
}

export interface VideoBoost {
  id: string;
  video_id: string;
  creator_id: string;
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
  budget: number;
  priority: number;
  created_at: string;
  video?: Video;
}

export interface AdvertiserCampaign {
  id: string;
  advertiser_id: string;
  title: string;
  description: string | null;
  media_type: 'image' | 'video';
  media_url: string;
  media_public_id: string | null;
  target_url: string;
  headline: string;
  cta_label: string;
  status: 'active' | 'paused' | 'completed';
  impressions: number;
  clicks: number;
  start_date: string;
  end_date: string;
  created_at: string;
  advertiser?: Profile;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string | null;
  creator_id: string | null;
  content_type: 'video' | 'audio' | 'blog' | 'ad';
  content_id: string;
  event_type: 'view' | 'watch_time' | 'like' | 'share' | 'comment' | 'click';
  duration_seconds: number;
  created_at: string;
}

export interface CreatorEarning {
  id: string;
  creator_id: string;
  content_id: string;
  amount: number;
  currency: string;
  source: string;
  status: string;
  created_at: string;
}

export type NotificationAction = 'like' | 'dislike' | 'comment' | 'favorite' | 'system';

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string;
  action_type: NotificationAction;
  content_type?: 'video' | 'audio' | 'blog' | null;
  content_id?: string | null;
  content_title?: string | null;
  message?: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
}

