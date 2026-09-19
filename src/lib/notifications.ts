import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationAction } from '@/types/database';

export interface SendNotificationParams {
  recipient_id: string;
  actor_id: string;
  action_type: NotificationAction;
  content_type?: 'video' | 'audio' | 'blog' | null;
  content_id?: string | null;
  content_title?: string | null;
  message?: string | null;
}

/**
 * Resolves the creator/author id and content title for a given content item.
 */
export async function resolveContentOwnerAndTitle(
  supabase: SupabaseClient,
  content_type: 'video' | 'audio' | 'blog',
  content_id: string
): Promise<{ owner_id: string | null; title: string | null }> {
  try {
    if (content_type === 'video') {
      const { data } = await supabase
        .from('videos')
        .select('creator_id, title')
        .eq('id', content_id)
        .maybeSingle();
      return { owner_id: data?.creator_id || null, title: data?.title || null };
    }

    if (content_type === 'audio') {
      const { data } = await supabase
        .from('audios')
        .select('creator_id, title')
        .eq('id', content_id)
        .maybeSingle();
      return { owner_id: data?.creator_id || null, title: data?.title || null };
    }

    if (content_type === 'blog') {
      const { data } = await supabase
        .from('blogs')
        .select('author_id, title')
        .eq('id', content_id)
        .maybeSingle();
      return { owner_id: data?.author_id || null, title: data?.title || null };
    }
  } catch (error) {
    console.error('Error resolving content owner:', error);
  }

  return { owner_id: null, title: null };
}

/**
 * Creates an activity notification for a recipient user.
 * Silently ignores self-notifications (when actor is recipient).
 */
export async function createNotification(
  supabase: SupabaseClient,
  params: SendNotificationParams
): Promise<boolean> {
  const { recipient_id, actor_id, action_type, content_type, content_id, content_title, message } = params;

  // Do not send notification to oneself
  if (!recipient_id || !actor_id || recipient_id === actor_id) {
    return false;
  }

  try {
    const { error } = await supabase.from('notifications').insert({
      recipient_id,
      actor_id,
      action_type,
      content_type: content_type || null,
      content_id: content_id || null,
      content_title: content_title || null,
      message: message ? message.slice(0, 300) : null,
      is_read: false,
    });

    if (error) {
      console.error('Failed to create notification:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error creating notification:', error);
    return false;
  }
}
