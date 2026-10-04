import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Check requested admin credentials
    const isTargetAdmin = cleanEmail === 'admin@admin.com' && cleanPassword === '123456';
    const isEnvAdmin =
      cleanEmail === (process.env.ADMIN_EMAIL || 'admin@dramabox.stream').toLowerCase() &&
      cleanPassword === (process.env.ADMIN_PASSWORD || 'Admin@DramaBox2026!');

    if (isTargetAdmin || isEnvAdmin) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'admin-super-id',
          email: cleanEmail,
          role: 'admin',
          display_name: 'Super Administrator',
        },
        token: 'lighthouse_admin_secret_token_2026',
      });
    }

    return NextResponse.json(
      { error: 'Invalid admin credentials. Use admin@admin.com and password 123456' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Admin authentication failed' }, { status: 500 });
  }
}
