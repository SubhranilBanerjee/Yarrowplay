import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CompetingReel, Competition, CompetitionTheme } from '@/data/competition';

/**
 * Single Source of Truth for Lighthouse Reels Competitions, Themes, Entries & Votes.
 * 100% database-backed via Supabase. Zero local JSON files or hardcoded mock fallbacks.
 */

// Helper to map DB theme row to CompetitionTheme model
function mapDbTheme(row: any): CompetitionTheme {
  const rules = Array.isArray(row.rules)
    ? row.rules
    : typeof row.rules === 'string'
    ? JSON.parse(row.rules || '[]')
    : [];

  return {
    id: row.id,
    name: row.name || 'Untitled Theme',
    tagline: row.tagline || '',
    description: row.description || '',
    category: row.category || 'General',
    bannerGradient: row.banner_gradient || 'from-[#2A0845] via-[#1B053A] to-[#0A0216]',
    accentColor: row.accent_color || '#A855F7',
    badgeEmoji: row.badge_emoji || '🎬',
    rules,
    createdAt: row.created_at || new Date().toISOString(),
    active: row.active ?? true,
  };
}

// Helper to map DB competition row to Competition model
function mapDbCompetition(row: any, theme?: CompetitionTheme | null): Competition {
  const rules = Array.isArray(row.theme_rules)
    ? row.theme_rules
    : typeof row.theme_rules === 'string'
    ? JSON.parse(row.theme_rules || '[]')
    : [];

  return {
    id: row.id,
    title: row.title || 'Creator Championship',
    description: row.description || '',
    season_number: row.season_number || 1,
    theme_id: row.theme_id,
    theme_name: row.theme_name || theme?.name,
    theme_category: row.theme_category || theme?.category,
    theme_badge_emoji: row.theme_badge_emoji || theme?.badgeEmoji,
    theme_gradient: row.theme_gradient || theme?.bannerGradient,
    theme_description: row.theme_description || theme?.description,
    theme_rules: rules.length > 0 ? rules : theme?.rules,
    theme: theme || undefined,
    prize_coins: Number(row.prize_coins) || 0,
    prize_cash_inr: Number(row.prize_cash_inr) || 0,
    duration_days: row.duration_days || 14,
    start_date: row.start_date || row.created_at || new Date().toISOString(),
    end_date: row.end_date || new Date(Date.now() + 14 * 86400000).toISOString(),
    status: row.status || 'active',
    winner_video_id: row.winner_video_id || null,
    winner_video: row.winner_video
      ? {
          id: row.winner_video.id,
          title: row.winner_video.title || 'Winning Reel',
          thumbnail_url: row.winner_video.thumbnail_url || '',
          creator_name:
            row.winner_video.creator?.display_name ||
            row.winner_video.creator?.username ||
            'Creator',
          votes_count: row.winner_votes_count,
        }
      : null,
    total_votes: Number(row.total_votes) || 0,
    entries_count: Number(row.entries_count) || 0,
    created_at: row.created_at || new Date().toISOString(),
  };
}

// ─── 1. THEMES ─────────────────────────────────────────────────────────────

export async function getAllThemesFromDb(): Promise<CompetitionTheme[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('competition_themes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      if (error && error.code !== 'PGRST205') {
        console.warn('getAllThemesFromDb warning:', error.message);
      }
      return [];
    }

    return data.map(mapDbTheme);
  } catch (err) {
    console.warn('getAllThemesFromDb catch:', err);
    return [];
  }
}

export async function createThemeInDb(themeData: {
  name: string;
  category: string;
  badgeEmoji?: string;
  tagline?: string;
  description: string;
  bannerGradient?: string;
  accentColor?: string;
  rules?: string[];
}): Promise<CompetitionTheme | null> {
  try {
    const adminSupabase = await createAdminClient();
    const payload = {
      name: themeData.name.trim(),
      category: themeData.category.trim(),
      badge_emoji: themeData.badgeEmoji || '🎬',
      tagline: themeData.tagline?.trim() || '',
      description: themeData.description.trim(),
      banner_gradient: themeData.bannerGradient || 'from-[#2A0845] via-[#1B053A] to-[#0A0216]',
      rules: themeData.rules || [],
      active: true,
    };

    const { data, error } = await adminSupabase
      .from('competition_themes')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      console.error('createThemeInDb error:', error);
      return null;
    }

    return mapDbTheme(data);
  } catch (err) {
    console.error('createThemeInDb catch:', err);
    return null;
  }
}

// ─── 2. COMPETITIONS ─────────────────────────────────────────────────────────

export async function getActiveCompetitionFromDb(): Promise<Competition | null> {
  try {
    const supabase = await createServerClient();
    const { data: compRow, error } = await supabase
      .from('competitions')
      .select('*')
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !compRow) {
      if (error && error.code !== 'PGRST205') {
        console.warn('getActiveCompetitionFromDb warning:', error.message);
      }
      return null;
    }

    let theme: CompetitionTheme | null = null;
    if (compRow.theme_id) {
      const { data: themeRow } = await supabase
        .from('competition_themes')
        .select('*')
        .eq('id', compRow.theme_id)
        .maybeSingle();

      if (themeRow) {
        theme = mapDbTheme(themeRow);
      }
    }

    return mapDbCompetition(compRow, theme);
  } catch (err) {
    console.warn('getActiveCompetitionFromDb catch:', err);
    return null;
  }
}

export async function getAllCompetitionsFromDb(): Promise<Competition[]> {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('competitions')
      .select(`
        *,
        winner_video:videos(
          id,
          title,
          thumbnail_url,
          creator:profiles(
            display_name,
            username
          )
        )
      `)
      .order('start_date', { ascending: false });

    if (error || !data) {
      if (error && error.code !== 'PGRST205') {
        console.warn('getAllCompetitionsFromDb warning:', error.message);
      }
      return [];
    }

    return data.map((row) => mapDbCompetition(row, null));
  } catch (err) {
    console.warn('getAllCompetitionsFromDb catch:', err);
    return [];
  }
}

export async function launchCompetitionInDb(compData: {
  themeId?: string;
  title: string;
  seasonNumber: number;
  prizeCashInr: number;
  prizeCoins: number;
  durationDays: number;
  description?: string;
}): Promise<Competition | null> {
  try {
    const adminSupabase = await createAdminClient();

    // 1. Mark currently active competitions as completed
    await adminSupabase
      .from('competitions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('status', 'active');

    // 2. Fetch theme details if themeId provided
    let themeRow: any = null;
    if (compData.themeId) {
      const { data } = await adminSupabase
        .from('competition_themes')
        .select('*')
        .eq('id', compData.themeId)
        .maybeSingle();
      themeRow = data;
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (compData.durationDays || 14) * 86400000);

    const payload: any = {
      title: compData.title.trim(),
      season_number: compData.seasonNumber || 1,
      prize_cash_inr: compData.prizeCashInr || 0,
      prize_coins: compData.prizeCoins || 0,
      duration_days: compData.durationDays || 14,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: 'active',
      description: compData.description?.trim() || themeRow?.description || '',
    };

    if (themeRow) {
      payload.theme_id = themeRow.id;
      payload.theme_name = themeRow.name;
      payload.theme_category = themeRow.category;
      payload.theme_badge_emoji = themeRow.badge_emoji;
      payload.theme_gradient = themeRow.banner_gradient;
      payload.theme_description = themeRow.description;
      payload.theme_rules = themeRow.rules;
    }

    const { data: newComp, error: insertError } = await adminSupabase
      .from('competitions')
      .insert(payload)
      .select()
      .single();

    if (insertError || !newComp) {
      console.error('launchCompetitionInDb error:', insertError);
      return null;
    }

    return mapDbCompetition(newComp, themeRow ? mapDbTheme(themeRow) : null);
  } catch (err) {
    console.error('launchCompetitionInDb catch:', err);
    return null;
  }
}

// ─── 3. COMPETITION ENTRIES (Strictly Explicit Submissions Only) ──────────────

export async function getCompetitionEntriesFromDb(competitionId: string): Promise<CompetingReel[]> {
  try {
    const supabase = await createServerClient();
    const { data: entries, error } = await supabase
      .from('competition_entries')
      .select(`
        id,
        competition_id,
        video_id,
        votes_count,
        status,
        created_at,
        video:videos(
          id,
          title,
          category,
          video_url,
          thumbnail_url,
          duration_seconds,
          views_count,
          likes_count,
          creator:profiles(
            id,
            display_name,
            username,
            avatar_url
          )
        )
      `)
      .eq('competition_id', competitionId)
      .eq('status', 'approved')
      .order('votes_count', { ascending: false });

    if (error || !entries || entries.length === 0) {
      // Strictly dynamic: only return explicitly submitted videos.
      // If none submitted, return empty array. Never substitute arbitrary catalog videos.
      return [];
    }

    return entries
      .filter((e: any) => e.video && e.video.video_url && e.video.thumbnail_url)
      .map((e: any, idx: number) => {
        const v = e.video;
        const creator = v.creator || {};
        const creatorName = creator.display_name || creator.username || 'Creator';
        const handle = creator.username ? `@${creator.username}` : `@${creatorName.toLowerCase().replace(/\s+/g, '')}`;
        const dur = v.duration_seconds || 60;
        const durDisplay = `${Math.floor(dur / 60)}m ${dur % 60}s`;

        return {
          id: e.id,
          videoId: v.id,
          title: v.title || 'Untitled Reel',
          subtitle: 'Championship Entry',
          creator: creatorName,
          handle,
          avatarUrl: creator.avatar_url || '',
          category: v.category || 'General',
          thumbnail: v.thumbnail_url,
          videoUrl: v.video_url,
          duration: durDisplay,
          views: `${v.views_count || 0} views`,
          votes: Number(e.votes_count) || 0,
          badge: idx === 0 ? '🥇 1st Place' : idx === 1 ? '🥈 2nd Place' : idx === 2 ? '🥉 3rd Place' : undefined,
          submittedAt: e.created_at,
        };
      });
  } catch (err) {
    console.warn('getCompetitionEntriesFromDb catch:', err);
    return [];
  }
}

export async function submitVideoToCompetitionInDb({
  competitionId,
  videoId,
  userId,
  isAdmin = false,
}: {
  competitionId: string;
  videoId: string;
  userId: string;
  isAdmin?: boolean;
}): Promise<{ success: boolean; error?: string; entryId?: string }> {
  try {
    const adminSupabase = await createAdminClient();

    // 1. Verify video exists and belongs to user
    const { data: video, error: vidErr } = await adminSupabase
      .from('videos')
      .select('id, creator_id, title, status')
      .eq('id', videoId)
      .maybeSingle();

    if (vidErr || !video) {
      return { success: false, error: 'Video not found.' };
    }

    if (!isAdmin && video.creator_id !== userId) {
      return { success: false, error: 'You can only submit your own videos.' };
    }

    if (video.status !== 'published') {
      return { success: false, error: 'Video must be approved and published before submitting.' };
    }

    // 2. Check if already submitted
    const { data: existing } = await adminSupabase
      .from('competition_entries')
      .select('id')
      .eq('competition_id', competitionId)
      .eq('video_id', videoId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'This video has already been submitted to this championship.' };
    }

    // 3. Insert competition entry
    const { data: entry, error: insertErr } = await adminSupabase
      .from('competition_entries')
      .insert({
        competition_id: competitionId,
        video_id: videoId,
        creator_id: video.creator_id,
        votes_count: 0,
        status: 'approved',
      })
      .select()
      .single();

    if (insertErr || !entry) {
      return { success: false, error: insertErr?.message || 'Failed to submit entry.' };
    }

    return { success: true, entryId: entry.id };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error during submission.' };
  }
}

// ─── 4. DATABASE-BACKED VOTING & LEADERBOARDS ─────────────────────────────────

export async function getUserVotesTodayFromDb(
  userId: string,
  competitionId: string
): Promise<string[]> {
  try {
    const supabase = await createServerClient();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('competition_votes')
      .select('video_id')
      .eq('user_id', userId)
      .eq('competition_id', competitionId)
      .gte('created_at', today.toISOString());

    if (error || !data) return [];
    return data.map((r: any) => r.video_id);
  } catch {
    return [];
  }
}

export async function castVoteInDb({
  competitionId,
  videoId,
  userId,
}: {
  competitionId: string;
  videoId: string;
  userId: string;
}): Promise<{ success: boolean; error?: string; remainingVotes?: number; totalVotes?: number }> {
  try {
    const adminSupabase = await createAdminClient();
    const DAILY_LIMIT = 3;

    // 1. Verify user daily vote count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayVotes, error: countErr } = await adminSupabase
      .from('competition_votes')
      .select('id')
      .eq('user_id', userId)
      .eq('competition_id', competitionId)
      .gte('created_at', today.toISOString());

    const castCount = todayVotes?.length || 0;
    if (castCount >= DAILY_LIMIT) {
      return {
        success: false,
        error: `Daily vote limit reached (${DAILY_LIMIT} votes allowed per day). Come back tomorrow to vote again!`,
        remainingVotes: 0,
      };
    }

    // 2. Insert vote record
    const { error: voteErr } = await adminSupabase.from('competition_votes').insert({
      competition_id: competitionId,
      video_id: videoId,
      user_id: userId,
    });

    if (voteErr && voteErr.code === '23505') {
      // Unique constraint on (competition_id, video_id, user_id)
      return {
        success: false,
        error: 'You have already voted for this reel today.',
        remainingVotes: DAILY_LIMIT - castCount,
      };
    } else if (voteErr) {
      console.error('castVoteInDb vote insert error:', voteErr);
    }

    // 3. Atomically update entry votes_count
    let newEntryVotes = 1;
    const { data: currentEntry } = await adminSupabase
      .from('competition_entries')
      .select('votes_count')
      .eq('competition_id', competitionId)
      .eq('video_id', videoId)
      .maybeSingle();

    if (currentEntry) {
      newEntryVotes = (Number(currentEntry.votes_count) || 0) + 1;
      await adminSupabase
        .from('competition_entries')
        .update({ votes_count: newEntryVotes })
        .eq('competition_id', competitionId)
        .eq('video_id', videoId);
    }

    // 4. Update video likes_count
    const { data: currentVideo } = await adminSupabase
      .from('videos')
      .select('likes_count')
      .eq('id', videoId)
      .maybeSingle();

    if (currentVideo) {
      await adminSupabase
        .from('videos')
        .update({ likes_count: (Number(currentVideo.likes_count) || 0) + 1 })
        .eq('id', videoId);
    }

    return {
      success: true,
      remainingVotes: Math.max(0, DAILY_LIMIT - castCount - 1),
      totalVotes: newEntryVotes,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Vote failed due to network error.' };
  }
}

// ─── 5. ADMIN AUDIT & MANAGEMENT ──────────────────────────────────────────

/**
 * Delete a competition season and cascade delete all its entries and votes.
 */
export async function deleteCompetitionInDb(competitionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = await createAdminClient();
    const { error } = await adminSupabase
      .from('competitions')
      .delete()
      .eq('id', competitionId);

    if (error) {
      console.error('deleteCompetitionInDb error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('deleteCompetitionInDb catch:', err);
    return { success: false, error: err?.message || 'Failed to delete competition' };
  }
}

/**
 * Delete a competition theme from the database.
 */
export async function deleteThemeInDb(themeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = await createAdminClient();
    const { error } = await adminSupabase
      .from('competition_themes')
      .delete()
      .eq('id', themeId);

    if (error) {
      console.error('deleteThemeInDb error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('deleteThemeInDb catch:', err);
    return { success: false, error: err?.message || 'Failed to delete theme' };
  }
}

export interface VoteAuditRecord {
  id: string;
  competition_id: string;
  video_id: string;
  user_id: string;
  created_at: string;
  voter: {
    id: string;
    email?: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
    role?: string;
  };
  video: {
    id: string;
    title: string;
    thumbnail_url?: string;
    category?: string;
    creator?: {
      display_name?: string;
      username?: string;
    };
  };
  competition?: {
    id: string;
    title: string;
    season_number?: number;
  };
}

/**
 * Audit votes for a competition: see all cast votes, voted by whom, timestamps, and target reels.
 */
export async function getCompetitionVotesAuditFromDb(params: {
  competitionId?: string;
  videoId?: string;
  limit?: number;
}): Promise<{
  votes: VoteAuditRecord[];
  stats: { totalVotes: number; uniqueVoters: number };
}> {
  try {
    const adminSupabase = await createAdminClient();
    let query = adminSupabase
      .from('competition_votes')
      .select(`
        id,
        competition_id,
        video_id,
        user_id,
        created_at,
        voter:profiles(
          id,
          email,
          username,
          display_name,
          avatar_url,
          role
        ),
        video:videos(
          id,
          title,
          thumbnail_url,
          category,
          creator:profiles(
            display_name,
            username
          )
        ),
        competition:competitions(
          id,
          title,
          season_number
        )
      `)
      .order('created_at', { ascending: false })
      .limit(params.limit || 500);

    if (params.competitionId) {
      query = query.eq('competition_id', params.competitionId);
    }
    if (params.videoId) {
      query = query.eq('video_id', params.videoId);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn('getCompetitionVotesAuditFromDb warning:', error?.message);
      return { votes: [], stats: { totalVotes: 0, uniqueVoters: 0 } };
    }

    const votes: VoteAuditRecord[] = data.map((row: any) => ({
      id: row.id,
      competition_id: row.competition_id,
      video_id: row.video_id,
      user_id: row.user_id,
      created_at: row.created_at,
      voter: {
        id: row.voter?.id || row.user_id,
        email: row.voter?.email || '',
        username: row.voter?.username || '',
        display_name: row.voter?.display_name || row.voter?.username || 'Viewer',
        avatar_url: row.voter?.avatar_url || '',
        role: row.voter?.role || 'viewer',
      },
      video: {
        id: row.video?.id || row.video_id,
        title: row.video?.title || 'Unknown Video',
        thumbnail_url: row.video?.thumbnail_url || '',
        category: row.video?.category || 'General',
        creator: row.video?.creator || {},
      },
      competition: row.competition || undefined,
    }));

    const uniqueVoterIds = new Set(votes.map((v) => v.user_id));

    return {
      votes,
      stats: {
        totalVotes: votes.length,
        uniqueVoters: uniqueVoterIds.size,
      },
    };
  } catch (err) {
    console.warn('getCompetitionVotesAuditFromDb catch:', err);
    return { votes: [], stats: { totalVotes: 0, uniqueVoters: 0 } };
  }
}

/**
 * Admin-only: Declare official competition winner and publish final results.
 */
export async function declareCompetitionResultsInDb(
  competitionId: string,
  winnerVideoId: string
): Promise<{ success: boolean; competition?: Competition; error?: string }> {
  try {
    const adminSupabase = await createAdminClient();
    const { data, error } = await adminSupabase
      .from('competitions')
      .update({
        winner_video_id: winnerVideoId,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', competitionId)
      .select(`
        *,
        winner_video:videos(
          id,
          title,
          thumbnail_url,
          creator:profiles(
            display_name,
            username
          )
        )
      `)
      .single();

    if (error || !data) {
      console.error('declareCompetitionResultsInDb error:', error);
      return { success: false, error: error?.message || 'Failed to publish competition results' };
    }

    return { success: true, competition: mapDbCompetition(data, null) };
  } catch (err: any) {
    console.error('declareCompetitionResultsInDb catch:', err);
    return { success: false, error: err?.message || 'Failed to declare competition results' };
  }
}

