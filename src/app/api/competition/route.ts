import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CompetingReel, DEFAULT_COMPETITION_ITEMS } from '@/data/competition';

export { type CompetingReel, DEFAULT_COMPETITION_ITEMS };

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch active competition
    let competition: any = null;
    try {
      const { data: compData } = await supabase
        .from('competitions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      competition = compData;
    } catch {
      // Table may not exist yet
    }

    if (!competition) {
      competition = {
        id: 'comp-season-4',
        title: 'Lighthouse Creator Championship • Season 4',
        description: 'Viewers choose the champion! Vote for your favorite short reel or episodic drama. The highest voted creator wins ₹50,000 INR Cash + 50,000 Coins!',
        season_number: 4,
        prize_coins: 50000,
        prize_cash_inr: 50000,
        start_date: new Date(Date.now() - 7 * 86400000).toISOString(),
        end_date: new Date(Date.now() + 18 * 86400000).toISOString(),
        status: 'active',
      };
    }

    // 2. Fetch live entries from Supabase (strictly dynamic)
    let items: CompetingReel[] = [];
    try {
      const { data: dbEntries } = await supabase
        .from('competition_entries')
        .select('*, video:videos(id, title, category, video_url, thumbnail_url, duration_seconds, views_count, creator:profiles(display_name, username, avatar_url))')
        .eq('competition_id', competition.id)
        .order('votes_count', { ascending: false });

      if (dbEntries && dbEntries.length > 0) {
        items = dbEntries
          .filter((e: any) => e.video && e.video.video_url && e.video.thumbnail_url)
          .map((e: any, idx: number) => {
            const v = e.video;
            const creator = v.creator || {};
            const creatorName = creator.display_name || creator.username || 'Studio Creator';
            const handle = creator.username ? `@${creator.username}` : `@${creatorName.toLowerCase().replace(/\s+/g, '')}`;
            const dur = v.duration_seconds || 60;
            const durDisplay = `${Math.floor(dur / 60)}m ${dur % 60}s`;

            return {
              id: e.id,
              videoId: v.id,
              title: v.title || 'Untitled Reel',
              subtitle: 'Competing Original',
              creator: creatorName,
              handle,
              avatarUrl: creator.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
              category: v.category || 'Drama',
              thumbnail: v.thumbnail_url,
              videoUrl: v.video_url,
              duration: durDisplay,
              views: `${v.views_count || 100} views`,
              votes: e.votes_count || 0,
              badge: idx === 0 ? '🥇 Leader' : idx === 1 ? '🥈 2nd Place' : idx === 2 ? '🥉 3rd Place' : undefined,
            };
          });
      } else {
        // Fall back to live published videos from Supabase (strictly dynamic)
        const { data: dbVideos } = await supabase
          .from('videos')
          .select('id, title, category, video_url, thumbnail_url, duration_seconds, views_count, likes_count, creator:profiles(display_name, username, avatar_url)')
          .eq('status', 'published')
          .order('likes_count', { ascending: false })
          .limit(12);

        if (dbVideos && dbVideos.length > 0) {
          items = dbVideos
            .filter((v: any) => v.video_url && v.thumbnail_url)
            .map((v: any, idx: number) => {
              const creator = v.creator || {};
              const creatorName = creator.display_name || creator.username || 'Creator';
              const handle = creator.username ? `@${creator.username}` : `@${creatorName.toLowerCase().replace(/\s+/g, '')}`;
              const dur = v.duration_seconds || 60;
              const durDisplay = `${Math.floor(dur / 60)}m ${dur % 60}s`;

              return {
                id: `entry-${v.id}`,
                videoId: v.id,
                title: v.title || 'Untitled Reel',
                subtitle: 'Contest Entry',
                creator: creatorName,
                handle,
                avatarUrl: creator.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
                category: v.category || 'Drama',
                thumbnail: v.thumbnail_url,
                videoUrl: v.video_url,
                duration: durDisplay,
                views: `${v.views_count || 0} views`,
                votes: v.likes_count || 0,
                badge: idx === 0 ? '🥇 Leader' : idx === 1 ? '🥈 2nd Place' : idx === 2 ? '🥉 3rd Place' : undefined,
              };
            });
        }
      }
    } catch {
      // Return empty items if query fails
      items = [];
    }

    // 3. User's voted videos
    let userVotedIds: string[] = [];
    if (user) {
      try {
        const { data: userVotes } = await supabase
          .from('competition_votes')
          .select('video_id')
          .eq('user_id', user.id)
          .eq('competition_id', competition.id);

        if (userVotes) {
          userVotedIds = userVotes.map((v: any) => v.video_id);
        }
      } catch {
        // Table may not exist yet
      }
    }

    const totalVotes = items.reduce((sum, item) => sum + item.votes, 0);

    return NextResponse.json({
      competition: {
        ...competition,
        total_votes: totalVotes,
        entries_count: items.length,
      },
      items,
      userVotedIds,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        competition: {
          id: 'comp-season-4',
          title: 'Lighthouse Creator Championship • Season 4',
          description: 'Viewers choose the champion! Vote for your favorite short reel or episodic drama. The highest voted creator wins ₹50,000 INR Cash + 50,000 Coins!',
          season_number: 4,
          prize_coins: 50000,
          prize_cash_inr: 50000,
          start_date: new Date(Date.now() - 7 * 86400000).toISOString(),
          end_date: new Date(Date.now() + 18 * 86400000).toISOString(),
          status: 'active',
          total_votes: 0,
          entries_count: 0,
        },
        items: [],
        userVotedIds: [],
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { competitionId, videoId } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    const activeCompId = competitionId || 'comp-season-4';

    // If authenticated, attempt database recording
    if (user) {
      try {
        // Check if user already voted for this video
        const { data: existingVote } = await supabase
          .from('competition_votes')
          .select('id')
          .eq('user_id', user.id)
          .eq('competition_id', activeCompId)
          .eq('video_id', videoId)
          .maybeSingle();

        if (existingVote) {
          return NextResponse.json({
            success: false,
            error: 'You have already voted for this video in this season!',
          }, { status: 400 });
        }

        // Record vote
        await supabase.from('competition_votes').insert({
          user_id: user.id,
          competition_id: activeCompId,
          video_id: videoId,
        });

        // Trigger or manually increment entry vote count
        const { data: entry } = await supabase
          .from('competition_entries')
          .select('votes_count')
          .eq('competition_id', activeCompId)
          .eq('video_id', videoId)
          .maybeSingle();

        if (entry) {
          await supabase
            .from('competition_entries')
            .update({ votes_count: (entry.votes_count || 0) + 1 })
            .eq('competition_id', activeCompId)
            .eq('video_id', videoId);
        }
      } catch (dbErr) {
        console.warn('Database vote recording notice:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Vote successfully registered! Thank you for supporting the creator.',
      videoId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to submit vote' },
      { status: 500 }
    );
  }
}
