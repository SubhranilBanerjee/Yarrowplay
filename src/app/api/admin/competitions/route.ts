import { NextRequest, NextResponse } from 'next/server';
import {
  getActiveCompetitionFromDb,
  getAllCompetitionsFromDb,
  getAllThemesFromDb,
  createThemeInDb,
  launchCompetitionInDb,
  deleteCompetitionInDb,
  deleteThemeInDb,
  getCompetitionVotesAuditFromDb,
  getCompetitionEntriesFromDb,
  declareCompetitionResultsInDb,
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

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // ─── 1. AUDIT VOTES: Who voted, when, for which video ────────────────────
    if (action === 'votes' || searchParams.get('votes') === 'true') {
      const competitionId = searchParams.get('competitionId') || undefined;
      const videoId = searchParams.get('videoId') || undefined;
      const limit = parseInt(searchParams.get('limit') || '500', 10);

      const auditData = await getCompetitionVotesAuditFromDb({
        competitionId,
        videoId,
        limit,
      });

      return NextResponse.json({
        success: true,
        votes: auditData.votes,
        stats: auditData.stats,
      });
    }

    // ─── 1b. FETCH ENTRIES FOR A COMPETITION (for Admin Result Declaration) ──
    if (action === 'entries') {
      const competitionId = searchParams.get('competitionId');
      if (!competitionId) {
        return NextResponse.json({ error: 'competitionId is required' }, { status: 400 });
      }
      const entries = await getCompetitionEntriesFromDb(competitionId);
      return NextResponse.json({ success: true, entries });
    }

    // ─── 2. DEFAULT: Load all competitions, active season, and themes ────────
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

    if (action === 'declare_results') {
      const { competitionId, winnerVideoId } = body;
      if (!competitionId || !winnerVideoId) {
        return NextResponse.json({ error: 'competitionId and winnerVideoId are required.' }, { status: 400 });
      }

      const res = await declareCompetitionResultsInDb(competitionId, winnerVideoId);
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to declare results.' }, { status: 500 });
      }

      const competitions = await getAllCompetitionsFromDb();
      const activeCompetition = await getActiveCompetitionFromDb();
      return NextResponse.json({
        success: true,
        message: 'Official competition results declared and published!',
        competition: res.competition,
        activeCompetition,
        competitions,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported: create_theme, launch_competition, declare_results' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to process admin competition request' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminAuth = await verifyAdminSession(req);
    if (!adminAuth.isAdmin) {
      return NextResponse.json(
        { error: adminAuth.error || 'Admin privileges required' },
        { status: adminAuth.status || 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const competitionId = searchParams.get('id') || searchParams.get('competitionId');
    const themeId = searchParams.get('themeId');

    if (competitionId) {
      const res = await deleteCompetitionInDb(competitionId);
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to delete competition' }, { status: 500 });
      }

      const competitions = await getAllCompetitionsFromDb();
      const active = await getActiveCompetitionFromDb();
      return NextResponse.json({
        success: true,
        message: 'Competition season and all associated entries and votes permanently deleted.',
        competitions,
        activeCompetition: active,
      });
    }

    if (themeId) {
      const res = await deleteThemeInDb(themeId);
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to delete theme' }, { status: 500 });
      }

      const themes = await getAllThemesFromDb();
      return NextResponse.json({
        success: true,
        message: 'Theme deleted from Supabase successfully.',
        themes,
      });
    }

    return NextResponse.json(
      { error: 'id (competitionId) or themeId query parameter is required for DELETE' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete competition resource' },
      { status: 500 }
    );
  }
}
