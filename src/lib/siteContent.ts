// Dynamic Site Text Configuration Store for Lighthouse Reels

export interface SiteContent {
  hero: {
    badgeText: string;
    headlineLine1: string;
    headlineLine2: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    feature1Title: string;
    feature1Subtitle: string;
    feature2Title: string;
    feature2Subtitle: string;
    feature3Title: string;
    feature3Subtitle: string;
    stat1Value: string;
    stat1Label: string;
    stat2Value: string;
    stat2Label: string;
    stat3Value: string;
    stat3Label: string;
    stat4Value: string;
    stat4Label: string;
  };
  categories: {
    sectionTitle: string;
    sectionSubtitle: string;
  };
  creatorCard: {
    badge: string;
    title: string;
    subtitle: string;
    perk1: string;
    perk2: string;
    perk3: string;
    perk4: string;
    ctaText: string;
  };
  advertiserCard: {
    badge: string;
    title: string;
    subtitle: string;
    perk1: string;
    perk2: string;
    perk3: string;
    perk4: string;
    ctaText: string;
  };
  footer: {
    brandTagline: string;
    mission: string;
    copyright: string;
    contactEmail: string;
  };
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    badgeText: 'Dive into Short Reels',
    headlineLine1: 'Watch. Discover.',
    headlineLine2: 'Shine.',
    subtitle: 'Dive into bite-sized stories that light up your world.',
    ctaPrimary: 'Start Watching',
    ctaSecondary: 'Watch Trailer',
    feature1Title: 'Creator Friendly',
    feature1Subtitle: 'Empowering Creators',
    feature2Title: 'Fast & Trending',
    feature2Subtitle: 'Fresh Content Daily',
    feature3Title: 'Safe & Curated',
    feature3Subtitle: 'Family-Friendly',
    stat1Value: '10K+',
    stat1Label: 'Active Creators',
    stat2Value: '100K+',
    stat2Label: 'Short Videos',
    stat3Value: '50M+',
    stat3Label: 'Monthly Views',
    stat4Value: '4.9',
    stat4Label: 'User Rating',
  },
  categories: {
    sectionTitle: 'Trending Categories & Reels',
    sectionSubtitle: 'Binge the most captivating mini-series and viral short stories on the web',
  },
  creatorCard: {
    badge: 'Creator Studio',
    title: 'Share Your Story, Earn 70% Revenue',
    subtitle: 'Upload high-impact vertical series, build an obsessed global following, and monetize every single view.',
    perk1: 'Instant creator dashboard & episode retention graphs',
    perk2: '70% creator revenue share on coin unlocks & tips',
    perk3: 'Global CDN streaming with 4K HDR playback',
    perk4: 'Direct viewer comments and VIP subscriber communities',
    ctaText: 'Become a Creator',
  },
  advertiserCard: {
    badge: 'Brand Solutions',
    title: 'Reach Engaged Gen-Z & Millennial Viewers',
    subtitle: 'Command 100% viewer attention with non-intrusive, native in-stream vertical video ad units.',
    perk1: 'Over 85% verified video completion rate (VCR)',
    perk2: 'Laser-focused category & demographic targeting',
    perk3: '100% brand-safe, human-moderated content catalog',
    perk4: 'Self-serve campaign portal & real-time analytics',
    ctaText: 'Launch Ad Campaign',
  },
  footer: {
    brandTagline: 'Bite-Sized Stories That Light Up Your World',
    mission: 'Lighthouse Reels is the next-generation micro-drama and short-form video platform connecting visionary storytellers with millions of engaged viewers worldwide.',
    copyright: '© 2026 LightHouse Reels Inc. All rights reserved.',
    contactEmail: 'contact@lighthousereels.com',
  },
};

const STORAGE_KEY = 'lighthouse_site_content_v1';

export function getStoredSiteContent(): SiteContent {
  if (typeof window === 'undefined') return DEFAULT_SITE_CONTENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONTENT;
    const parsed = JSON.parse(raw);
    return {
      hero: { ...DEFAULT_SITE_CONTENT.hero, ...(parsed.hero || {}) },
      categories: { ...DEFAULT_SITE_CONTENT.categories, ...(parsed.categories || {}) },
      creatorCard: { ...DEFAULT_SITE_CONTENT.creatorCard, ...(parsed.creatorCard || {}) },
      advertiserCard: { ...DEFAULT_SITE_CONTENT.advertiserCard, ...(parsed.advertiserCard || {}) },
      footer: { ...DEFAULT_SITE_CONTENT.footer, ...(parsed.footer || {}) },
    };
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
}

export function saveStoredSiteContent(content: SiteContent): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
    window.dispatchEvent(new Event('lighthouse_site_content_updated'));
  } catch (err) {
    console.error('Failed to save site content to localStorage', err);
  }
}

export function resetStoredSiteContent(): SiteContent {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('lighthouse_site_content_updated'));
  }
  return DEFAULT_SITE_CONTENT;
}
