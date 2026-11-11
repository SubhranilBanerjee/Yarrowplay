import fs from 'fs';
import path from 'path';
import {
  Competition,
  CompetitionTheme,
  DEFAULT_COMPETITION,
  DEFAULT_THEMES,
} from './competition';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'competitions-data.json');

export interface CompetitionsStoreState {
  activeCompetition: Competition;
  competitions: Competition[];
  themes: CompetitionTheme[];
  updatedAt: string;
}

function getDefaultStoreState(): CompetitionsStoreState {
  return {
    activeCompetition: DEFAULT_COMPETITION,
    competitions: [DEFAULT_COMPETITION],
    themes: DEFAULT_THEMES,
    updatedAt: new Date().toISOString(),
  };
}

export function readCompetitionsStore(): CompetitionsStoreState {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.activeCompetition && Array.isArray(parsed.themes)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Competitions store read warning, using default:', err);
  }

  const defaultState = getDefaultStoreState();
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(defaultState, null, 2), 'utf-8');
  } catch (writeErr) {
    console.warn('Competitions store write warning:', writeErr);
  }
  return defaultState;
}

export function writeCompetitionsStore(state: CompetitionsStoreState): void {
  try {
    state.updatedAt = new Date().toISOString();
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write competitions store:', err);
  }
}

export function getActiveCompetition(): Competition {
  const store = readCompetitionsStore();
  return store.activeCompetition || DEFAULT_COMPETITION;
}

export function getAllThemes(): CompetitionTheme[] {
  const store = readCompetitionsStore();
  return store.themes && store.themes.length > 0 ? store.themes : DEFAULT_THEMES;
}

export function getAllCompetitions(): Competition[] {
  const store = readCompetitionsStore();
  return store.competitions || [DEFAULT_COMPETITION];
}

export function createNewTheme(data: {
  name: string;
  tagline?: string;
  description: string;
  category: string;
  bannerGradient?: string;
  accentColor?: string;
  badgeEmoji?: string;
  rules?: string[];
}): CompetitionTheme {
  const store = readCompetitionsStore();
  const themeId = `theme-${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

  const newTheme: CompetitionTheme = {
    id: themeId,
    name: data.name.trim(),
    tagline: data.tagline?.trim() || `${data.category} Original Narrative Theme`,
    description: data.description.trim(),
    category: data.category.trim() || 'General',
    bannerGradient: data.bannerGradient || 'from-[#1E0B36] via-[#120726] to-[#080214]',
    accentColor: data.accentColor || '#A855F7',
    badgeEmoji: data.badgeEmoji || '🎬',
    rules: data.rules && data.rules.length > 0
      ? data.rules
      : [
          'Vertical 9:16 aspect ratio format required',
          'Original creator-owned content with approved audio rights',
          'Adheres to platform community standards',
        ],
    createdAt: new Date().toISOString(),
  };

  store.themes = [newTheme, ...(store.themes || [])];
  writeCompetitionsStore(store);
  return newTheme;
}

export function launchNewCompetition(data: {
  title: string;
  themeId?: string;
  customThemeName?: string;
  description?: string;
  seasonNumber?: number;
  prizeCoins?: number;
  prizeCashInr?: number;
  endDate?: string;
  durationDays?: number;
}): Competition {
  const store = readCompetitionsStore();
  const themes = store.themes || DEFAULT_THEMES;

  let selectedTheme: CompetitionTheme | undefined;
  if (data.themeId) {
    selectedTheme = themes.find((t) => t.id === data.themeId);
  }

  if (!selectedTheme && data.customThemeName) {
    selectedTheme = themes.find(
      (t) => t.name.toLowerCase() === data.customThemeName!.toLowerCase()
    );
  }

  if (!selectedTheme) {
    selectedTheme = themes[0] || DEFAULT_THEMES[0];
  }

  // Calculate season number
  const nextSeason =
    data.seasonNumber ||
    Math.max(...(store.competitions || []).map((c) => c.season_number || 1), 0) + 1;

  // Calculate end date
  let calculatedEndDate: string;
  if (data.endDate) {
    calculatedEndDate = new Date(data.endDate).toISOString();
  } else {
    const days = data.durationDays && data.durationDays > 0 ? data.durationDays : 14;
    calculatedEndDate = new Date(Date.now() + days * 86400000).toISOString();
  }

  const competitionId = `comp-season-${nextSeason}-${Date.now()}`;

  const newCompetition: Competition = {
    id: competitionId,
    title: data.title?.trim() || `${selectedTheme.name} Championship`,
    description:
      data.description?.trim() ||
      `Theme: ${selectedTheme.name}. ${selectedTheme.description}`,
    season_number: nextSeason,
    theme_id: selectedTheme.id,
    theme_name: selectedTheme.name,
    theme: selectedTheme,
    prize_coins: data.prizeCoins !== undefined ? data.prizeCoins : 50000,
    prize_cash_inr: data.prizeCashInr !== undefined ? data.prizeCashInr : 50000,
    start_date: new Date().toISOString(),
    end_date: calculatedEndDate,
    status: 'active',
    total_votes: 0,
    entries_count: 0,
    created_at: new Date().toISOString(),
  };

  // Mark previous active competition as completed
  const updatedCompetitions = (store.competitions || []).map((c) => {
    if (c.status === 'active') {
      return { ...c, status: 'completed' as const };
    }
    return c;
  });

  store.competitions = [newCompetition, ...updatedCompetitions];
  store.activeCompetition = newCompetition;

  writeCompetitionsStore(store);
  return newCompetition;
}

