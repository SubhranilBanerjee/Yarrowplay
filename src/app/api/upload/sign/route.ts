import { NextRequest, NextResponse } from 'next/server';
import { generateCloudinarySignature } from '@/lib/cloudinary';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const folder = body.folder || 'yarrowplay';
    const timestamp = Math.round(new Date().getTime() / 1000);

    const signData = generateCloudinarySignature({
      timestamp,
      folder,
    });

    return NextResponse.json({
      timestamp,
      folder,
      signature: signData.signature,
      apiKey: signData.apiKey,
      cloudName: signData.cloudName,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Signature generation failed' }, { status: 500 });
  }
}
