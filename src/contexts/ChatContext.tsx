import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { channelManager } from '@/lib/realtimeChannelManager';
import { useAuth } from './AuthContext';

interface ChatContextType {
  unreadCount: number;
  markAsRead: () => void;
  incrementUnread: () => void;
  isInChat: boolean;
  setIsInChat: (value: boolean) => void;
  unreadByChannel: Record<string, number>;
  markChannelAsRead: (channelId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInChat, setIsInChat] = useState(false);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string | null>(null);
  const [unreadByChannel, setUnreadByChannel] = useState<Record<string, number>>({});
  const [currentChannelId, setCurrentChannelId] = useState<string | null>(null);

  // Load last read timestamp from localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`chat_last_read_${user.id}`);
      setLastReadTimestamp(stored || new Date().toISOString());
      
      // Load unread counts per channel
      const storedUnread = localStorage.getItem(`chat_unread_by_channel_${user.id}`);
      if (storedUnread) {
        setUnreadByChannel(JSON.parse(storedUnread));
      }
    }
  }, [user]);

  // Consolidated global listener for ALL chat messages (no filter) to track unread counts
  // This replaces the old per-channel approach, reducing channels significantly
  useEffect(() => {
    if (!user || !lastReadTimestamp) return;

    const channelName = 'chat-messages-global';
    console.log('[ChatContext] Setting up consolidated global chat messages channel for unread tracking');

    const init = async () => {
      try {
        await channelManager.getOrCreateChannel(
          channelName,
          (ch) => ch
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                // NO FILTER - listen to all channels globally
              },
              (payload) => {
                // Don't count own messages
                if (payload.new.user_id !== user.id) {
                  const messageTime = new Date(payload.new.created_at).getTime();
                  const lastReadTime = new Date(lastReadTimestamp).getTime();
                  const channelId = payload.new.channel_id;
                  
                  if (messageTime > lastReadTime) {
                    // Don't increment if user is viewing this channel
                    if (currentChannelId !== channelId) {
                      setUnreadCount(prev => prev + 1);
                      setUnreadByChannel(prev => {
                        const newUnread = {
                          ...prev,
                          [channelId]: (prev[channelId] || 0) + 1
                        };
                        localStorage.setItem(`chat_unread_by_channel_${user.id}`, JSON.stringify(newUnread));
                        return newUnread;
                      });
                    }
                  }
                }
              }
            )
            .subscribe((status) => {
              console.log('[ChatContext] Global chat messages subscription status:', status);
            })
        );
      } catch (error) {
        console.error('[ChatContext] Error setting up consolidated channel:', error);
      }
    };

    init();

    return () => {
      console.log('[ChatContext] Cleaning up global chat messages channel');
      channelManager.removeChannel(channelName);
    };
  }, [user, lastReadTimestamp, currentChannelId]);

  const markAsRead = useCallback(() => {
    if (user) {
      const now = new Date().toISOString();
      localStorage.setItem(`chat_last_read_${user.id}`, now);
      setLastReadTimestamp(now);
      setUnreadCount(0);
    }
  }, [user]);

  const markChannelAsRead = useCallback((channelId: string) => {
    if (user) {
      setCurrentChannelId(channelId);
      setUnreadByChannel(prev => {
        const newUnread = { ...prev };
        const channelUnread = newUnread[channelId] || 0;
        delete newUnread[channelId];
        
        // Decrease total unread count
        setUnreadCount(curr => Math.max(0, curr - channelUnread));
        
        localStorage.setItem(`chat_unread_by_channel_${user.id}`, JSON.stringify(newUnread));
        return newUnread;
      });
    }
  }, [user]);

  const incrementUnread = useCallback(() => {
    setUnreadCount(prev => prev + 1);
  }, []);

  return (
    <ChatContext.Provider value={{ 
      unreadCount, 
      markAsRead, 
      incrementUnread, 
      isInChat, 
      setIsInChat,
      unreadByChannel,
      markChannelAsRead
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
