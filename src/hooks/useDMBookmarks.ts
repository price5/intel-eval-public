import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDMBookmarks = (userId: string | undefined) => {
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    loadBookmarks();
    subscribeToBookmarks();
  }, [userId]);

  const loadBookmarks = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('bookmarked_direct_messages')
        .select('message_id')
        .eq('user_id', userId);

      if (error) throw error;

      setBookmarks(new Set(data?.map(b => b.message_id) || []));
    } catch (error) {
      console.error('Error loading DM bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToBookmarks = () => {
    if (!userId) return;

    const channel = supabase
      .channel('dm-bookmarks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarked_direct_messages',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookmarks(prev => new Set([...prev, (payload.new as any).message_id]));
          } else if (payload.eventType === 'DELETE') {
            setBookmarks(prev => {
              const newSet = new Set(prev);
              newSet.delete((payload.old as any).message_id);
              return newSet;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const toggleBookmark = async (messageId: string) => {
    if (!userId) return;

    const isBookmarked = bookmarks.has(messageId);

    try {
      if (isBookmarked) {
        const { error } = await supabase
          .from('bookmarked_direct_messages')
          .delete()
          .eq('user_id', userId)
          .eq('message_id', messageId);

        if (error) throw error;
        toast.success('Bookmark removed');
      } else {
        const { error } = await supabase
          .from('bookmarked_direct_messages')
          .insert({
            user_id: userId,
            message_id: messageId,
          });

        if (error) throw error;
        toast.success('Message bookmarked');
      }
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      toast.error(error.message || 'Failed to update bookmark');
    }
  };

  return {
    bookmarks,
    loading,
    toggleBookmark,
    isBookmarked: (messageId: string) => bookmarks.has(messageId),
  };
};
