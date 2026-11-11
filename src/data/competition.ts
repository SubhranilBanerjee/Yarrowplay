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
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  season_number: number;
  theme_id?: string;
  theme_name?: string;
  theme?: CompetitionTheme;
  prize_coins: number;
  prize_cash_inr: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'upcoming';
  total_votes?: number;
  entries_count?: number;
  created_at: string;
}

export const DEFAULT_THEMES: CompetitionTheme[] = [
  {
    id: 'theme-cyberpunk',
    name: 'Cyberpunk 2099: Neon Syndicate',
    tagline: 'Futuristic High-Tech, Low-Life Cinematic Drama',
    description: 'Produce high-tension vertical stories set in dystopian megacities, neon-lit alleyways, or rogue AI underworlds.',
    category: 'Sci-Fi',
    bannerGradient: 'from-[#2A0845] via-[#1B053A] to-[#0A0216]',
    accentColor: '#EC4899',
    badgeEmoji: '🚀',
    rules: [
      'Vertical 9:16 format with high-contrast neon/synth aesthetic',
      'Original characters and storyline under 90 seconds',
      'Electronic or dark synthwave sound design recommended',
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'theme-monsoon',
    name: 'Monsoon Whispers: Rainy Romance',
    tagline: 'Heartfelt Connections In The Pouring Rain',
    description: 'Capture tender glances, bittersweet departures, and passionate reunions against atmospheric rainfall.',
    category: 'Romance',
    bannerGradient: 'from-[#3B0764] via-[#2E1065] to-[#17052E]',
    accentColor: '#F43F5E',
    badgeEmoji: '❤️',
    rules: [
      'Atmospheric rain or monsoon backdrop',
      'Emotionally driven dialogue or powerful visual storytelling',
      'Max duration 2 minutes',
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'theme-suspense',
    name: '60-Second Tension: Micro-Thriller',
    tagline: 'Heart-Pounding Suspense & Shocking Twists',
    description: 'Deliver pulse-pounding mystery, ticking-clock scenarios, and jaw-dropping cliffhangers in one minute.',
    category: 'Thriller',
    bannerGradient: 'from-[#291804] via-[#1C0F02] to-[#0A0501]',
    accentColor: '#F59E0B',
    badgeEmoji: '⚡',
    rules: [
      'Strictly 60 to 90 seconds maximum duration',
      'Must contain a narrative turning point or unexpected reveal',
      'High cinematic suspense and tension',
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'theme-comedy',
    name: 'Bite-Sized Laughs: Viral Sketch Fest',
    tagline: 'Witty Banter, Relatable Tropes & Viral Humor',
    description: 'Lighthearted comedic sketches, hilarious misunderstandings, and witty short-form humor that goes viral.',
    category: 'Comedy',
    bannerGradient: 'from-[#064E3B] via-[#022C22] to-[#051610]',
    accentColor: '#10B981',
    badgeEmoji: '😄',
    rules: [
      'Humorous original sketch or witty micro-episode',
      'Family-friendly community standard humor',
      'Clean punchy comedic timing',
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'theme-action',
    name: 'Velocity Protocol: Stunts & Chase',
    tagline: 'Relentless Pace, Martial Stunts & Kinetic Energy',
    description: 'Showcase adrenaline-fueled foot chases, martial arts choreography, and edge-of-your-seat dynamic camerawork.',
    category: 'Action',
    bannerGradient: 'from-[#450A0A] via-[#2A0505] to-[#0F0202]',
    accentColor: '#EF4444',
    badgeEmoji: '🔥',
    rules: [
      'Fast-paced dynamic camera motion and editing',
      'Safe stunt choreography or action drama',
      'Original sound effects and impactful foley',
    ],
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_COMPETITION: Competition = {
  id: 'comp-season-1',
  title: 'Cyberpunk 2099 Creator Championship',
  description: 'Viewers choose the champion! Create and vote for your favorite vertical reels under the Cyberpunk 2099 theme. Highest voted creator takes the seasonal bounty!',
  season_number: 1,
  theme_id: 'theme-cyberpunk',
  theme_name: 'Cyberpunk 2099: Neon Syndicate',
  theme: DEFAULT_THEMES[0],
  prize_coins: 50000,
  prize_cash_inr: 50000,
  start_date: new Date().toISOString(),
  end_date: new Date(Date.now() + 18 * 86400000).toISOString(),
  status: 'active',
  total_votes: 0,
  entries_count: 0,
  created_at: new Date().toISOString(),
};

// Strictly dynamic items (no static mock fallbacks)
export const DEFAULT_COMPETITION_ITEMS: CompetingReel[] = [];
