import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveCompetition,
  getAllCompetitions,
  getAllThemes,
  createNewTheme,
  launchNewCompetition,
} from '@/data/competitionsStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const active = getActiveCompetition();
    const competitions = getAllCompetitions();
    const themes = getAllThemes();

    return NextResponse.json({
      success: true,
      activeCompetition: active,
      competitions,
      themes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load competitions' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'create_theme') {
      const { name, tagline, description, category, bannerGradient, accentColor, badgeEmoji, rules } = body;

      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Theme name is required' }, { status: 400 });
      }

      const newTheme = createNewTheme({
        name,
        tagline,
        description: description || `Original ${category || 'Creative'} stories and reels`,
        category: category || 'General',
        bannerGradient,
        accentColor,
        badgeEmoji,
        rules,
      });

      return NextResponse.json({
        success: true,
        message: `Theme "${newTheme.name}" created successfully!`,
        theme: newTheme,
        themes: getAllThemes(),
      });
    }

    if (action === 'launch_competition') {
      const { title, themeId, customThemeName, description, seasonNumber, prizeCoins, prizeCashInr, endDate, durationDays } = body;

      const newComp = launchNewCompetition({
        title,
        themeId,
        customThemeName,
        description,
        seasonNumber,
        prizeCoins: Number(prizeCoins) || 50000,
        prizeCashInr: Number(prizeCashInr) || 50000,
        endDate,
        durationDays: Number(durationDays) || 14,
      });

      return NextResponse.json({
        success: true,
        message: `Season ${newComp.season_number} ("${newComp.title}") launched successfully!`,
        competition: newComp,
        activeCompetition: newComp,
        competitions: getAllCompetitions(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported: create_theme, launch_competition' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process admin competition request' },
      { status: 500 }
    );
  }
}

