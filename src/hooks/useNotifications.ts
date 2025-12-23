import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type NotificationType = 
  | 'assessment_graded'
  | 'assessment_deadline'
  | 'achievement_unlocked'
  | 'rank_change'
  | 'message_mention'
  | 'message_reply'
  | 'direct_message'
  | 'feedback_response'
  | 'system_announcement'
  | 'moderation_action';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

export const useNotifications = () => {
  const createNotification = useCallback(async (params: CreateNotificationParams) => {
    try {
      const { data, error } = await supabase
        .rpc('create_notification', {
          p_user_id: params.userId,
          p_type: params.type,
          p_title: params.title,
          p_message: params.message,
          p_link: params.link || null,
          p_metadata: {
            ...params.metadata,
            source_id: params.metadata?.source_id || params.userId,
            source_name: params.metadata?.source_name || 'System'
          }
        });

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      toast.error('Failed to create notification');
      return null;
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all as read');
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }, []);

  const fetchNotifications = useCallback(async (userId: string, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }, []);

  const getUnreadCount = useCallback(async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }, []);

  return {
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    getUnreadCount
  };
};
