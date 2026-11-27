import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { CompetingReel } from '@/data/competition';
import {
  getActiveCompetitionFromDb,
  getAllCompetitionsFromDb,
  getAllThemesFromDb,
  createThemeInDb,
  launchCompetitionInDb,
  getCompetitionEntriesFromDb,
  submitVideoToCompetitionInDb,
  getUserVotesTodayFromDb,
  castVoteInDb,
  deleteCompetitionInDb,
  deleteThemeInDb,
  getCompetitionVotesAuditFromDb,
  declareCompetitionResultsInDb,
} from '@/lib/supabase/competitionService';
import { verifyAdminSession } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);

    // Admin Vote Audit Request
    if (searchParams.get('audit_votes') === 'true') {
      const adminAuth = await verifyAdminSession(req);
      if (!adminAuth.isAdmin) {
        return NextResponse.json({ error: 'Admin access required to view vote audit' }, { status: 403 });
      }

      const compId = searchParams.get('competitionId') || undefined;
      const vidId = searchParams.get('videoId') || undefined;
      const audit = await getCompetitionVotesAuditFromDb({
        competitionId: compId,
        videoId: vidId,
      });

      return NextResponse.json({
        success: true,
        votes: audit.votes,
        stats: audit.stats,
      });
    }

    // 1. Fetch active competition directly from Supabase
    const activeCompetition = await getActiveCompetitionFromDb();
    const allThemes = await getAllThemesFromDb();
    const allCompetitions = await getAllCompetitionsFromDb();

    let items: CompetingReel[] = [];
    let userVotedIds: string[] = [];

    if (activeCompetition) {
      // 2. Fetch live entries strictly from competition_entries (no catalog substitutions)
      items = await getCompetitionEntriesFromDb(activeCompetition.id);

      // 3. User's voted videos today
      if (user) {
        userVotedIds = await getUserVotesTodayFromDb(user.id, activeCompetition.id);
      }
    }

    const totalVotes = items.reduce((sum, item) => sum + item.votes, 0);

    return NextResponse.json({
      competition: activeCompetition
        ? {
            ...activeCompetition,
            total_votes: totalVotes,
            entries_count: items.length,
          }
        : null,
      items,
      themes: allThemes,
      competitions: allCompetitions,
      userVotedIds,
    });
  } catch (error: any) {
    console.error('GET /api/competition error:', error);
    return NextResponse.json(
      {
        competition: null,
        items: [],
        themes: [],
        competitions: [],
        userVotedIds: [],
        error: error?.message || 'Failed to load competition data from database',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { action } = body;

    // ─── 1. CREATOR ACTION: Explicitly Submit a Video to the Active Competition ───
    if (action === 'submit_entry') {
      if (!user) {
        return NextResponse.json({ error: 'You must be signed in to submit a video.' }, { status: 401 });
      }

      const { competitionId, videoId } = body;
      if (!competitionId || !videoId) {
        return NextResponse.json({ error: 'competitionId and videoId are required.' }, { status: 400 });
      }

      const adminAuth = await verifyAdminSession(req);
      const res = await submitVideoToCompetitionInDb({
        competitionId,
        videoId,
        userId: user.id,
        isAdmin: adminAuth.isAdmin,
      });

      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }

      const updatedEntries = await getCompetitionEntriesFromDb(competitionId);
      return NextResponse.json({
        success: true,
        message: 'Video successfully entered into the championship arena!',
        entryId: res.entryId,
        items: updatedEntries,
      });
    }

    // ─── 2. VOTER ACTION: Vote for a Competing Reel ───────────────────────────
    if (action === 'vote' || !action) {
      if (!user) {
        return NextResponse.json(
          { error: 'You must be signed in to cast a vote for your favorite reel.' },
          { status: 401 }
        );
      }

      const { competitionId, videoId } = body;
      if (!videoId) {
        return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
      }

      let activeCompId = competitionId;
      if (!activeCompId) {
        const activeComp = await getActiveCompetitionFromDb();
        if (!activeComp) {
          return NextResponse.json({ error: 'No active championship season found.' }, { status: 400 });
        }
        activeCompId = activeComp.id;
      }

      const voteResult = await castVoteInDb({
        competitionId: activeCompId,
        videoId,
        userId: user.id,
      });

      if (!voteResult.success) {
        return NextResponse.json(
          { error: voteResult.error || 'Failed to register vote.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Vote successfully registered in the database! Thank you for supporting the creator.',
        videoId,
        remainingVotes: voteResult.remainingVotes,
        totalVotes: voteResult.totalVotes,
      });
    }

    // ─── 3. ADMIN ACTION: Create a New Creative Theme ─────────────────────────
    if (action === 'create_theme') {
      const adminAuth = await verifyAdminSession(req);
      if (!adminAuth.isAdmin) {
        return NextResponse.json({ error: adminAuth.error || 'Admin privileges required' }, { status: adminAuth.status || 403 });
      }

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
        message: `Theme "${newTheme.name}" created and stored in Supabase successfully!`,
        theme: newTheme,
        themes,
      });
    }

    // ─── 4. ADMIN ACTION: Launch New Competition Season ───────────────────────
    if (action === 'launch_competition') {
      const adminAuth = await verifyAdminSession(req);
      if (!adminAuth.isAdmin) {
        return NextResponse.json({ error: adminAuth.error || 'Admin privileges required' }, { status: adminAuth.status || 403 });
      }

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

      const allCompetitions = await getAllCompetitionsFromDb();
      return NextResponse.json({
        success: true,
        message: `Season ${newComp.season_number} ("${newComp.title}") launched in Supabase!`,
        competition: newComp,
        activeCompetition: newComp,
        competitions: allCompetitions,
      });
    }

    // ─── 5. ADMIN ACTION: Delete Competition Season ───────────────────────────
    if (action === 'delete_competition') {
      const adminAuth = await verifyAdminSession(req);
      if (!adminAuth.isAdmin) {
        return NextResponse.json({ error: adminAuth.error || 'Admin privileges required' }, { status: adminAuth.status || 403 });
      }

      const { competitionId } = body;
      if (!competitionId) {
        return NextResponse.json({ error: 'competitionId is required' }, { status: 400 });
      }

      const res = await deleteCompetitionInDb(competitionId);
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to delete competition' }, { status: 500 });
      }

      const allCompetitions = await getAllCompetitionsFromDb();
      const activeCompetition = await getActiveCompetitionFromDb();
      return NextResponse.json({
        success: true,
        message: 'Competition season and its votes deleted successfully.',
        activeCompetition,
        competitions: allCompetitions,
      });
    }

    // ─── 6. ADMIN ACTION: Declare Official Results / Winner ─────────────────
    if (action === 'declare_results') {
      const adminAuth = await verifyAdminSession(req);
      if (!adminAuth.isAdmin) {
        return NextResponse.json({ error: adminAuth.error || 'Admin privileges required' }, { status: adminAuth.status || 403 });
      }

      const { competitionId, winnerVideoId } = body;
      if (!competitionId || !winnerVideoId) {
        return NextResponse.json({ error: 'competitionId and winnerVideoId are required.' }, { status: 400 });
      }

      const res = await declareCompetitionResultsInDb(competitionId, winnerVideoId);
      if (!res.success) {
        return NextResponse.json({ error: res.error || 'Failed to publish results' }, { status: 500 });
      }

      const allCompetitions = await getAllCompetitionsFromDb();
      const activeCompetition = await getActiveCompetitionFromDb();
      return NextResponse.json({
        success: true,
        message: 'Official competition results declared and published!',
        competition: res.competition,
        activeCompetition,
        competitions: allCompetitions,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/competition error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process competition request' },
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

    if (!competitionId) {
      return NextResponse.json({ error: 'competitionId is required' }, { status: 400 });
    }

    const res = await deleteCompetitionInDb(competitionId);
    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Failed to delete competition' }, { status: 500 });
    }

    const allCompetitions = await getAllCompetitionsFromDb();
    const active = await getActiveCompetitionFromDb();

    return NextResponse.json({
      success: true,
      message: 'Competition season permanently deleted.',
      competitions: allCompetitions,
      activeCompetition: active,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to delete competition' },
      { status: 500 }
    );
  }
}
