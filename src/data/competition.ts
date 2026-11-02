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
}

// Strictly dynamic items (no static mock fallbacks)
export const DEFAULT_COMPETITION_ITEMS: CompetingReel[] = [];
