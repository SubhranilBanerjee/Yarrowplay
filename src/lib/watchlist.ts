export async function toggleWatchlist(
  contentType: 'series' | 'video' | 'audio',
  contentId: string
): Promise<boolean> {
  const res = await fetch('/api/watchlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content_type: contentType, content_id: contentId }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update watchlist');
  }

  const data = await res.json();
  return Boolean(data.isWatchlisted);
}

export async function checkWatchlist(
  contentType: 'series' | 'video' | 'audio',
  contentId: string
): Promise<boolean> {
  try {
    const res = await fetch(`/api/watchlist?content_type=${contentType}&content_id=${contentId}`);
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.isWatchlisted);
  } catch {
    return false;
  }
}
