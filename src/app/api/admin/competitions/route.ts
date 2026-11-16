import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveCompetitionFromDb,
  getAllCompetitionsFromDb,
  getAllThemesFromDb,
  createThemeInDb,
  launchCompetitionInDb,
} from '@/lib/supabase/competitionService';
import { verifyAdminSession } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const adminAuth = await verifyAdminSession(req);
    if (!adminAuth.isAdmin) {
      return NextResponse.json(
        { error: adminAuth.error || 'Admin privileges required' },
        { status: adminAuth.status || 403 }
      );
    }

    const active = await getActiveCompetitionFromDb();
    const competitions = await getAllCompetitionsFromDb();
    const themes = await getAllThemesFromDb();

    return NextResponse.json({
      success: true,
      activeCompetition: active,
      competitions,
      themes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to load competitions from database' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminAuth = await verifyAdminSession(req);
    if (!adminAuth.isAdmin) {
      return NextResponse.json(
        { error: adminAuth.error || 'Admin privileges required' },
        { status: adminAuth.status || 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'create_theme') {
      const { name, tagline, description, category, bannerGradient, accentColor, badgeEmoji, rules } = body;

      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Theme name is required' }, { status: 400 });
      }

      const newTheme = await createThemeInDb({
        name,
        tagline,
        description: description || `Original ${category || 'Creative'} stories and reels`,
        category: category || 'General',
        bannerGradient,
        accentColor,
        badgeEmoji,
        rules,
      });

      if (!newTheme) {
        return NextResponse.json({ error: 'Failed to create theme in database.' }, { status: 500 });
      }

      const themes = await getAllThemesFromDb();
      return NextResponse.json({
        success: true,
        message: `Theme "${newTheme.name}" created and stored in Supabase!`,
        theme: newTheme,
        themes,
      });
    }

    if (action === 'launch_competition') {
      const { title, themeId, description, seasonNumber, prizeCoins, prizeCashInr, durationDays } = body;

      const newComp = await launchCompetitionInDb({
        title,
        themeId,
        description,
        seasonNumber: Number(seasonNumber) || 1,
        prizeCoins: Number(prizeCoins) || 50000,
        prizeCashInr: Number(prizeCashInr) || 50000,
        durationDays: Number(durationDays) || 14,
      });

      if (!newComp) {
        return NextResponse.json({ error: 'Failed to launch competition in database.' }, { status: 500 });
      }

      const competitions = await getAllCompetitionsFromDb();
      return NextResponse.json({
        success: true,
        message: `Season ${newComp.season_number} ("${newComp.title}") launched in Supabase!`,
        competition: newComp,
        activeCompetition: newComp,
        competitions,
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
