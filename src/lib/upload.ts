export interface UploadProgressCallback {
  (percentage: number): void;
}

export interface UploadResult {
  secure_url: string;
  public_id: string;
  duration?: number;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  resource_type?: string;
}

export async function uploadMedia(
  file: File,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  folder = 'yarrowplay',
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  try {
    // 1. Get signed credentials from server
    const signRes = await fetch('/api/upload/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder }),
    });

    if (signRes.ok) {
      const signData = await signRes.json();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp.toString());
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      const targetResourceType = resourceType === 'auto'
        ? (file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'video' : 'image')
        : resourceType;

      const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/${targetResourceType}/upload`;

      return await new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl);

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve({
                secure_url: res.secure_url,
                public_id: res.public_id,
                duration: res.duration || 0,
                width: res.width,
                height: res.height,
                format: res.format,
                bytes: res.bytes,
                resource_type: res.resource_type,
              });
            } catch (e) {
              reject(new Error('Failed to parse Cloudinary response'));
            }
          } else {
            // Fall back to server upload
            fallbackUpload(file, resourceType, folder, onProgress).then(resolve).catch(reject);
          }
        };

        xhr.onerror = () => {
          fallbackUpload(file, resourceType, folder, onProgress).then(resolve).catch(reject);
        };

        xhr.send(formData);
      });
    }
  } catch {
    // If sign endpoint failed, attempt fallback upload
  }

  return fallbackUpload(file, resourceType, folder, onProgress);
}

async function fallbackUpload(
  file: File,
  resourceType: string,
  folder: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('resourceType', resourceType);
  formData.append('folder', folder);

  onProgress?.(50);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Media upload failed');
  }

  onProgress?.(100);
  return await res.json();
}
