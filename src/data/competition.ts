// Strictly strongly-typed data contracts for Supabase Competition & Voting System
// No hardcoded themes, competitions, or mock records are defined here.

export interface CompetingReel {
  id: string;
  videoId: string;
  title: string;
  subtitle: string;
  creator: string;
  handle: string;
  avatarUrl: string;
  category: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  views: string;
  votes: number;
  badge?: string;
  submittedAt?: string;
}

export interface CompetitionTheme {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  bannerGradient: string;
  accentColor: string;
  badgeEmoji: string;
  rules: string[];
  createdAt: string;
  active?: boolean;
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  season_number: number;
  theme_id?: string;
  theme_name?: string;
  theme_category?: string;
  theme_badge_emoji?: string;
  theme_gradient?: string;
  theme_description?: string;
  theme_rules?: string[];
  theme?: CompetitionTheme;
  prize_coins: number;
  prize_cash_inr: number;
  duration_days?: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'upcoming';
  winner_video_id?: string | null;
  winner_video?: {
    id: string;
    title: string;
    thumbnail_url?: string;
    creator_name?: string;
    votes_count?: number;
  } | null;
  total_votes?: number;
  entries_count?: number;
  created_at: string;
}

export interface CompetitionEntryRecord {
  id: string;
  competition_id: string;
  video_id: string;
  creator_id?: string;
  votes_count: number;
  status: 'approved' | 'pending' | 'rejected';
  created_at: string;
}

export interface CompetitionVoteRecord {
  id: string;
  competition_id: string;
  video_id: string;
  user_id: string;
  created_at: string;
}
