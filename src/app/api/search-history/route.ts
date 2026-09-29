import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/search-history - Fetch user's recent searches
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ searches: [] });
    }

    const { data: rows, error } = await supabase
      .from('search_history')
      .select('id, query, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      // Table may not exist yet in live Supabase - return empty gracefully
      return NextResponse.json({ searches: [] });
    }

    return NextResponse.json({ searches: rows || [] });
  } catch (error: any) {
    return NextResponse.json({ searches: [] });
  }
}

// POST /api/search-history - Record a search query
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, guest: true });
    }

    const { query } = await req.json();
    const trimmed = (query || '').trim();

    if (!trimmed || trimmed.length < 2) {
      return NextResponse.json({ success: true, skipped: true });
    }

    try {
      // Avoid duplicate consecutive searches
      const { data: recent } = await supabase
        .from('search_history')
        .select('id, query')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recent && recent.query.toLowerCase() === trimmed.toLowerCase()) {
        return NextResponse.json({ success: true, duplicate: true });
      }

      await supabase.from('search_history').insert({
        user_id: user.id,
        query: trimmed,
      });
    } catch {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// DELETE /api/search-history - Clear all or remove a single search item
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clear_all') === 'true';

    if (clearAll) {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Search history cleared' });
    }

    if (id) {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id)
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ success: true, deletedId: id });
    }

    return NextResponse.json({ error: 'Specify id or clear_all=true' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to clear search history' }, { status: 500 });
  }
}
