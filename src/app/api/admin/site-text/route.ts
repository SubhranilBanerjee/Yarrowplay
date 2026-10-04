import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_SITE_CONTENT } from '@/lib/siteContent';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'site_content')
      .maybeSingle();

    if (data && data.value) {
      return NextResponse.json({ content: data.value });
    }
  } catch {
    // fallback
  }

  return NextResponse.json({ content: DEFAULT_SITE_CONTENT });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 });
    }

    try {
      const supabase = await createClient();
      await supabase.from('site_settings').upsert({
        key: 'site_content',
        value: content,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // If table doesn't exist, it's still fine because client stores in localStorage
    }

    return NextResponse.json({ success: true, content });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update site content' }, { status: 500 });
  }
}
