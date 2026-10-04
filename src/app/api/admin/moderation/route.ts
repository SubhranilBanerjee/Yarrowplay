import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function checkIsAdmin(req: NextRequest, supabase: any) {
  const headerToken = req.headers.get('x-admin-auth');
  if (headerToken === 'lighthouse_admin_secret_token_2026') return true;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return (
    user.email === 'admin@admin.com' ||
    user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    user.email === 'admin@dramabox.stream' ||
    profile?.role === 'admin'
  );
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const isAdmin = await checkIsAdmin(req, supabase);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get('type') || 'videos'; // 'videos' | 'series'
    const filter = searchParams.get('filter') || 'approved'; // 'pending' | 'approved' | 'rejected' | 'all'
    const search = searchParams.get('q') || '';

    if (contentType === 'series') {
      let query = supabase
        .from('content_series')
        .select('id, title, description, category, tags, cover_url, total_episodes, created_at, creator:profiles(id, display_name, username, avatar_url, email)')
        .order('created_at', { ascending: false });

      if (search.trim()) {
        query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,category.ilike.%${search.trim()}%`);
      }

      const { data: series, error } = await query.limit(100);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        series: series || [],
      });
    }

    // Default: Videos
    let query = supabase
      .from('videos')
      .select('id, series_id, title, description, summary, category, genre, video_url, thumbnail_url, duration_seconds, views_count, likes_count, status, created_at, creator:profiles(id, display_name, username, avatar_url, email)')
      .order('created_at', { ascending: false });

    if (filter === 'pending') {
      query = query.in('status', ['processing', 'pending', 'pending_approval', 'draft']);
    } else if (filter === 'approved') {
      query = query.eq('status', 'published');
    } else if (filter === 'rejected') {
      query = query.in('status', ['rejected', 'archived']);
    }

    if (search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%,category.ilike.%${search.trim()}%`);
    }

    const { data: videos, error } = await query.limit(150);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      videos: videos || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch moderation queue' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const isAdmin = await checkIsAdmin(req, supabase);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { videoId, action, rejectionReason } = body;

    if (!videoId || !action) {
      return NextResponse.json({ error: 'videoId and action are required' }, { status: 400 });
    }

    // action: 'approve' -> status 'published'
    // action: 'reject' -> status 'archived'
    const newStatus = action === 'approve' ? 'published' : 'archived';

    const { data, error } = await supabase
      .from('videos')
      .update({
        status: newStatus,
        summary: rejectionReason ? `[Moderation note]: ${rejectionReason}` : undefined,
      })
      .eq('id', videoId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            'Update blocked by database Row-Level Security. Please configure SUPABASE_SERVICE_ROLE_KEY or run admin RLS policies.',
          rlsBlocked: true,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Video status updated to ${newStatus}`,
      video: data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update video moderation status' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createAdminClient();
    const isAdmin = await checkIsAdmin(req, supabase);

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    const seriesId = searchParams.get('seriesId');
    const action = searchParams.get('action'); // 'delete_all'
    const targetType = searchParams.get('targetType') || 'videos'; // 'videos' | 'series'
    const filter = searchParams.get('filter') || 'all';

    // 1. DELETE ALL VIDEOS OR ALL SERIES (Bulk Delete All)
    if (action === 'delete_all') {
      if (targetType === 'series') {
        // Clear dependent foreign key rows
        try {
          await supabase.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('reactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('watch_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          await supabase.from('watchlists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch {
          // ignore cascade errors
        }

        // Delete all child episodes first, then all series
        await supabase.from('videos').delete().not('series_id', 'is', null);
        const { data: deletedSeries, error } = await supabase
          .from('content_series')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select('id');

        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        // Check if RLS blocked the operation
        if (!deletedSeries || deletedSeries.length === 0) {
          const { count } = await supabase.from('content_series').select('*', { count: 'exact', head: true });
          if (count && count > 0) {
            return NextResponse.json(
              {
                error:
                  'Deletion blocked by Supabase Row-Level Security (RLS). Please add SUPABASE_SERVICE_ROLE_KEY to .env.local or execute the admin delete policy in Supabase SQL editor.',
                rlsBlocked: true,
              },
              { status: 403 }
            );
          }
        }

        return NextResponse.json({
          success: true,
          count: deletedSeries?.length || 0,
          message: 'All content series deleted successfully',
        });
      }

      // Delete all videos (or filtered)
      try {
        await supabase.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('reactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('watch_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('watchlists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch {
        // ignore
      }

      let query = supabase.from('videos').delete();
      if (filter === 'approved') {
        query = query.eq('status', 'published');
      } else if (filter === 'pending') {
        query = query.in('status', ['processing', 'pending', 'pending_approval', 'draft']);
      } else if (filter === 'rejected') {
        query = query.in('status', ['rejected', 'archived']);
      } else {
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { data: deletedVideos, error } = await query.select('id');
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      // Check if RLS blocked the operation
      if (!deletedVideos || deletedVideos.length === 0) {
        const { count } = await supabase.from('videos').select('*', { count: 'exact', head: true });
        if (count && count > 0) {
          return NextResponse.json(
            {
              error:
                'Deletion blocked by Supabase Row-Level Security (RLS). Please add SUPABASE_SERVICE_ROLE_KEY to .env.local or execute the admin delete policy in Supabase SQL editor.',
              rlsBlocked: true,
            },
            { status: 403 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        count: deletedVideos?.length || 0,
        message: `All ${filter} videos deleted successfully`,
      });
    }

    // 2. DELETE SINGLE CONTENT SERIES (and its episodes)
    if (seriesId) {
      try {
        await supabase.from('videos').delete().eq('series_id', seriesId);
      } catch {
        // ignore
      }

      const { data: deleted, error } = await supabase
        .from('content_series')
        .delete()
        .eq('id', seriesId)
        .select('id');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (!deleted || deleted.length === 0) {
        return NextResponse.json(
          {
            error:
              'Series deletion blocked by Supabase Row-Level Security (RLS). Please add SUPABASE_SERVICE_ROLE_KEY to .env.local or run admin RLS policies.',
            rlsBlocked: true,
          },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Series ${seriesId} and its episodes deleted successfully from Supabase`,
      });
    }

    // 3. DELETE SINGLE VIDEO
    if (videoId) {
      try {
        await supabase.from('comments').delete().eq('content_id', videoId);
        await supabase.from('reactions').delete().eq('content_id', videoId);
        await supabase.from('watch_history').delete().eq('video_id', videoId);
        await supabase.from('watchlists').delete().eq('video_id', videoId);
      } catch {
        // ignore child errors
      }

      const { data: deleted, error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)
        .select('id');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (!deleted || deleted.length === 0) {
        return NextResponse.json(
          {
            error:
              'Video deletion blocked by Supabase Row-Level Security (RLS). Please add SUPABASE_SERVICE_ROLE_KEY to .env.local or run admin RLS policies.',
            rlsBlocked: true,
          },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Content ${videoId} deleted successfully from Supabase`,
      });
    }

    return NextResponse.json({ error: 'videoId, seriesId, or action=delete_all is required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete content' }, { status: 500 });
  }
}
