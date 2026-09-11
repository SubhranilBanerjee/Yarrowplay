import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const resourceType = (formData.get('resourceType') as string) || 'auto';
    const folder = (formData.get('folder') as string) || 'yarrowplay';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dramabox-stream';
    const apiKey = process.env.CLOUDINARY_API_KEY || '729329983158373';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '729329983158373';

    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', timestamp.toString());
    cloudinaryFormData.append('signature', signature);
    cloudinaryFormData.append('folder', folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: result.error?.message || 'Upload failed' }, { status: 400 });
    }

    return NextResponse.json({
      secure_url: result.secure_url,
      public_id: result.public_id,
      duration: result.duration || 0,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      resource_type: result.resource_type,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal upload error' }, { status: 500 });
  }
}
