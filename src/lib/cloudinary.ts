import crypto from 'crypto';

export interface CloudinarySignatureParams {
  timestamp: number;
  folder?: string;
  public_id?: string;
  eager?: string;
  source?: string;
}

export function generateCloudinarySignature(params: CloudinarySignatureParams): {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
} {
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '729329983158373';
  const apiKey = process.env.CLOUDINARY_API_KEY || '729329983158373';
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dramabox-stream';

  // Sort parameter keys alphabetically
  const sortedKeys = Object.keys(params).sort() as (keyof CloudinarySignatureParams)[];
  const stringToSign = sortedKeys
    .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
    .map((k) => `${k}=${params[k]}`)
    .join('&') + apiSecret;

  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  return {
    signature,
    timestamp: params.timestamp,
    apiKey,
    cloudName,
  };
}
