import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { channelManager } from '@/lib/realtimeChannelManager';

interface DirectMessageContextType {
  selectedRecipientId: string | null;
  setSelectedRecipient: (userId: string) => void;
  clearSelectedRecipient: () => void;
  unreadDMCount: number;
  markDMAsRead: (userId: string) => void;
}

const DirectMessageContext = createContext<DirectMessageContextType | undefined>(undefined);

export const DirectMessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [unreadDMCount, setUnreadDMCount] = useState(0);

  const setSelectedRecipient = useCallback((userId: string) => {
    setSelectedRecipientId(userId);
  }, []);

  const clearSelectedRecipient = useCallback(() => {
    setSelectedRecipientId(null);
  }, []);

  const markDMAsRead = useCallback(async (userId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', userId)
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      
      // Update count immediately
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking DMs as read:', error);
    }
  }, [user]);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setUnreadDMCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread DM count:', error);
    }
  }, [user]);

  // Load initial unread count
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user, fetchUnreadCount]);

  // Subscribe to new DMs
  useEffect(() => {
    if (!user) return;

    const channelName = 'dm-unread-tracker';

    const init = async () => {
      try {
        await channelManager.getOrCreateChannel(
          channelName,
          (ch) => ch
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'direct_messages',
                filter: `recipient_id=eq.${user.id}`,
              },
              () => {
                fetchUnreadCount();
              }
            )
            .subscribe()
        );
      } catch (error) {
        console.error('[DirectMessageContext] Error setting up channel:', error);
      }
    };

    init();

    return () => {
      channelManager.removeChannel(channelName);
    };
  }, [user, fetchUnreadCount]);

  return (
    <DirectMessageContext.Provider
      value={{
        selectedRecipientId,
        setSelectedRecipient,
        clearSelectedRecipient,
        unreadDMCount,
        markDMAsRead,
      }}
    >
      {children}
    </DirectMessageContext.Provider>
  );
};

export const useDirectMessage = () => {
  const context = useContext(DirectMessageContext);
  if (context === undefined) {
    throw new Error('useDirectMessage must be used within a DirectMessageProvider');
  }
  return context;
};