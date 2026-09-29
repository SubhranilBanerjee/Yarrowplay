import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin =
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      user.email === 'admin@dramabox.stream' ||
      profile?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parallel fetch real database aggregates
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalUsers },
      { count: newUsers30d },
      { count: totalCreators },
      { count: totalVIPs },
      { data: allProfiles },
      { count: totalSeries },
      { count: totalVideos },
      { data: topVideos },
      { count: totalBlogs },
      { count: totalComments },
      { count: totalFollows },
      { data: topSeries },
      { data: paymentsData },
    ] = await Promise.all([
      // Users count
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      // New users in 30d
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      // Creators count
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'creator'),
      // VIPs count
      supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('vip_tier', 'free').not('vip_tier', 'is', null),
      // All profiles for subscription breakdown and active estimates
      supabase.from('profiles').select('id, vip_tier, created_at, role, display_name, username'),
      // Total Series
      supabase.from('content_series').select('*', { count: 'exact', head: true }),
      // Total Videos
      supabase.from('videos').select('*', { count: 'exact', head: true }),
      // Top Videos
      supabase
        .from('videos')
        .select('id, title, views_count, likes_count, duration_seconds, thumbnail_url, creator:profiles(display_name, username)')
        .order('views_count', { ascending: false })
        .limit(10),
      // Total Blogs
      supabase.from('blogs').select('*', { count: 'exact', head: true }),
      // Total Comments
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      // Total Follows
      supabase.from('creator_follows').select('*', { count: 'exact', head: true }),
      // Top Series
      supabase
        .from('content_series')
        .select('id, title, category, cover_url, creator:profiles(display_name, username)')
        .limit(8),
      // Payments if table exists
      supabase.from('payments').select('amount, status, created_at').limit(100),
    ]);

    // Aggregate Views & Likes from topVideos or sum
    let totalViews = 0;
    let totalLikes = 0;
    let totalShorts = 0;
    let totalStandardVideos = 0;

    (topVideos || []).forEach((v: any) => {
      totalViews += v.views_count || 0;
      totalLikes += v.likes_count || 0;
      if (v.duration_seconds && v.duration_seconds <= 120) {
        totalShorts++;
      } else {
        totalStandardVideos++;
      }
    });

    // Breakdown subscriptions
    const subBreakdown = {
      weekly: 0,
      monthly: 0,
      yearly: 0,
      free: 0,
    };

    (allProfiles || []).forEach((p: any) => {
      const tier = p.vip_tier?.toLowerCase();
      if (tier === 'weekly') subBreakdown.weekly++;
      else if (tier === 'monthly') subBreakdown.monthly++;
      else if (tier === 'yearly') subBreakdown.yearly++;
      else subBreakdown.free++;
    });

    // Estimate Revenue from payments data
    let totalRevenue = 0;
    if (paymentsData && Array.isArray(paymentsData)) {
      paymentsData.forEach((pay: any) => {
        if (pay.status === 'captured' || pay.status === 'success') {
          totalRevenue += Number(pay.amount) || 0;
        }
      });
    }
    // If payments amount is in paise/cents, convert to standard currency units if > 1000
    if (totalRevenue > 10000) {
      totalRevenue = Math.round(totalRevenue / 100);
    }

    return NextResponse.json({
      analytics: {
        users: {
          total: totalUsers || (allProfiles?.length || 0),
          newIn30d: newUsers30d || 0,
          activeEstimates: Math.max(1, Math.round((totalUsers || 10) * 0.45)),
          creators: totalCreators || 0,
        },
        content: {
          series: totalSeries || 0,
          videos: totalVideos || (topVideos?.length || 0),
          blogs: totalBlogs || 0,
          shortsEstimate: totalShorts,
        },
        engagement: {
          totalViews,
          totalLikes,
          totalComments: totalComments || 0,
          totalFollows: totalFollows || 0,
        },
        subscriptions: {
          totalActive: totalVIPs || 0,
          breakdown: subBreakdown,
          estimatedRevenue: totalRevenue,
        },
        topContent: topVideos || [],
        topSeries: topSeries || [],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch analytics' }, { status: 500 });
  }
}
