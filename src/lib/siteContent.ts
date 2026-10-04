// Dynamic Site Text Configuration Store for Lighthouse Reels / Yarrowplay

export interface SiteContent {
  hero: {
    badgeTags: string[];
    badgeText: string;
    headlineOutlined: string;
    headlineSolid: string;
    headlineLine1: string;
    headlineLine2: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    satisfiedClientsCount: string;
    clientLogos: string[];
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
  about: {
    badge: string;
    title: string;
    description: string;
    highlight1: string;
    highlight2: string;
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
  services: {
    badge: string;
    title: string;
    description: string;
  };
  whyChooseUs: {
    title: string;
    subtitle: string;
    feature1Title: string;
    feature2Title: string;
    feature3Title: string;
    feature4Title: string;
    feature5Title: string;
    feature6Title: string;
  };
  footer: {
    brandTagline: string;
    mission: string;
    copyright: string;
    contactEmail: string;
    quickLinksTitle: string;
    legalNotice: string;
  };
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    badgeTags: ['BRANDING & IDENTITY', 'EXCLUSIVE MICRO-SERIES', '4K VERTICAL REELS', 'CREATOR REWARDS'],
    badgeText: 'Dive into Short Reels',
    headlineOutlined: 'STORIES THAT',
    headlineSolid: 'IGNITE MINDS',
    headlineLine1: 'Watch. Discover.',
    headlineLine2: 'Shine.',
    subtitle: 'We Craft Bold Visuals, Seamless Digital Experiences, And Addictive Short-Form Entertainment That Helps Storytellers Stand Out, Connect, And Grow.',
    ctaPrimary: 'Start Watching',
    ctaSecondary: 'Explore Series',
    satisfiedClientsCount: '100+ Satisfied Partners & Studios',
    clientLogos: ['Catalyx', 'Propulse', 'Aether Media', 'Nova Studios', 'Kinetic Reels', 'Vortex Digital', 'Starlight Prod'],
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
  about: {
    badge: 'ABOUT OUR PLATFORM',
    title: 'WHO WE ARE',
    description: 'We Are A Next-Generation Short-Form Entertainment Platform Focused On Turning Passionate Ideas Into Impactful Visual Experiences. From Bite-Sized Dramas To Immersive Series, We Help Businesses And Creators Communicate Clearly And Look Unforgettable.',
    highlight1: 'Leading the future of vertical cinema and episodic storytelling.',
    highlight2: 'Connecting millions of engaged viewers with visionary talent across the globe.',
  },
  categories: {
    sectionTitle: 'Trending Categories & Reels',
    sectionSubtitle: 'Binge the most captivating mini-series and viral short stories on the web',
  },
  creatorCard: {
    badge: 'FOR CREATORS',
    title: 'JOIN AS A CREATOR',
    subtitle: 'Empower your storytelling. Upload high-impact episodic reels, retain 70% of coin unlocks, and cultivate an obsessed global fandom.',
    perk1: 'Instant creator dashboard & episode retention graphs',
    perk2: '70% creator revenue share on coin unlocks & tips',
    perk3: 'Global CDN streaming with 4K HDR playback',
    perk4: 'Direct viewer comments and VIP subscriber communities',
    ctaText: 'Creator Studio →',
  },
  advertiserCard: {
    badge: 'FOR ADVERTISERS',
    title: 'JOIN AS AN ADVERTISER',
    subtitle: 'Command 100% viewer attention with non-intrusive rewarded sponsor ads, brand placements, and high-conversion vertical campaigns.',
    perk1: 'Over 85% verified video completion rate (VCR)',
    perk2: 'Laser-focused category & demographic targeting',
    perk3: '100% brand-safe, human-moderated content catalog',
    perk4: 'Self-serve campaign portal & real-time analytics',
    ctaText: 'Partner With Us →',
  },
  services: {
    badge: 'OUR SHOWCASE',
    title: 'ORIGINAL DRAMAS & REELS',
    description: 'We Stream Bold Epics, Romantic Encounters, And Edge-Of-Your-Seat Thrillers Tailored For Modern Mobile Attention Spans.',
  },
  whyChooseUs: {
    title: 'WHY CHOOSE US',
    subtitle: "We Don't Just Stream Content, We Solve Problems Through Creativity.",
    feature1Title: 'Strategy-Driven Content',
    feature2Title: 'Clean, Modern Aesthetics',
    feature3Title: 'Client-Focused Approach',
    feature4Title: 'Fast Turnaround Time',
    feature5Title: 'Transparent Communication',
    feature6Title: 'Scalable Design Solutions',
  },
  footer: {
    brandTagline: 'Bite-Sized Stories That Light Up Your World',
    mission: 'Lighthouse Reels is the premier platform for cinematic micro-dramas and viral vertical reels, connecting visionary creators with millions of passionate viewers worldwide.',
    copyright: '© 2026 LightHouse Reels Inc. All rights reserved.',
    contactEmail: 'contact@lighthousereels.com',
    quickLinksTitle: 'Explore Content',
    legalNotice: 'All video series, trademarks, and logos are property of their respective creators.',
  },
};

const STORAGE_KEY = 'lighthouse_site_content_v2';

export function getStoredSiteContent(): SiteContent {
  if (typeof window === 'undefined') return DEFAULT_SITE_CONTENT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONTENT;
    const parsed = JSON.parse(raw);
    return {
      hero: { ...DEFAULT_SITE_CONTENT.hero, ...(parsed.hero || {}) },
      about: { ...DEFAULT_SITE_CONTENT.about, ...(parsed.about || {}) },
      categories: { ...DEFAULT_SITE_CONTENT.categories, ...(parsed.categories || {}) },
      creatorCard: { ...DEFAULT_SITE_CONTENT.creatorCard, ...(parsed.creatorCard || {}) },
      advertiserCard: { ...DEFAULT_SITE_CONTENT.advertiserCard, ...(parsed.advertiserCard || {}) },
      services: { ...DEFAULT_SITE_CONTENT.services, ...(parsed.services || {}) },
      whyChooseUs: { ...DEFAULT_SITE_CONTENT.whyChooseUs, ...(parsed.whyChooseUs || {}) },
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
