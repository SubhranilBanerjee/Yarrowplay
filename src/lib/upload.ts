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

export const MAX_EPISODE_DURATION_SECONDS = 120; // 2 minutes maximum

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !file.type.startsWith('video/')) {
      resolve(0);
      return;
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration || 0);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
  });
}

export async function uploadMedia(
  file: File,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto',
  folder = 'yarrowplay',
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  try {
    const isVideo = resourceType === 'video' || file.type.startsWith('video/');

    // Phase 14: Client-side validation: Reject videos longer than 2 minutes before upload
    if (isVideo && typeof window !== 'undefined') {
      const clientDuration = await getVideoDuration(file);
      if (clientDuration > MAX_EPISODE_DURATION_SECONDS) {
        const mins = Math.floor(clientDuration / 60);
        const secs = Math.round(clientDuration % 60);
        throw new Error(
          `Episode duration (${mins}m ${secs}s) exceeds the maximum allowed limit of 2 minutes (120s). Upload rejected.`
        );
      }
    }

    // Direct client-side unsigned upload to Cloudinary using unsigned preset 'Yarrowplay'
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dramabox-stream';
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Yarrowplay';

    const targetResourceType = resourceType === 'auto'
      ? (file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'video' : 'image')
      : resourceType;

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${targetResourceType}/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    if (folder) {
      formData.append('folder', folder);
    }

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
            if (isVideo && res.duration && res.duration > MAX_EPISODE_DURATION_SECONDS) {
              reject(
                new Error(
                  `Episode length (${Math.round(res.duration)} seconds) exceeds the maximum allowed 2 minutes limit.`
                )
              );
              return;
            }
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
          } catch (err: any) {
            reject(err instanceof Error ? err : new Error('Failed to parse Cloudinary response'));
          }
        } else {
          let errorMsg = `Upload failed with status ${xhr.status}`;
          try {
            const errRes = JSON.parse(xhr.responseText);
            if (errRes.error?.message) {
              errorMsg = errRes.error.message;
            }
          } catch {
            // keep default errorMsg
          }
          reject(new Error(errorMsg));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload to Cloudinary. Check your internet connection and Cloudinary configuration.'));
      };

      xhr.send(formData);
    });
  } catch (err: any) {
    throw new Error(err?.message || 'Media upload failed');
  }
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
