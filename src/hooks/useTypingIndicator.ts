import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface TypingUser {
  userId: string;
  username: string;
  avatarUrl?: string;
}

export const useTypingIndicator = (channelId: string, currentUserId: string) => {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!channelId || !currentUserId) {
      console.log('[TypingIndicator] Missing channelId or currentUserId');
      return;
    }

    console.log('[TypingIndicator] Setting up channel:', channelId);
    const channelName = `typing-${channelId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('[TypingIndicator] Presence sync, state:', state);
        const users: TypingUser[] = [];
        
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((presence) => {
            // Show all typing users including current user
            if (presence.typing) {
              users.push({
                userId: presence.userId,
                username: presence.username,
                avatarUrl: presence.avatarUrl,
              });
            }
          });
        });
        
        console.log('[TypingIndicator] Setting typing users:', users);
        setTypingUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('[TypingIndicator] User joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('[TypingIndicator] User left:', leftPresences);
      })
      .subscribe((status) => {
        console.log('[TypingIndicator] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
          console.log('[TypingIndicator] Successfully subscribed!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[TypingIndicator] Channel error');
          setIsSubscribed(false);
        } else if (status === 'TIMED_OUT') {
          console.error('[TypingIndicator] Channel timed out');
          setIsSubscribed(false);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('[TypingIndicator] Cleaning up channel');
      setIsSubscribed(false);
      supabase.removeChannel(channel);
    };
  }, [channelId, currentUserId]);

  const setTyping = useCallback(async (isTyping: boolean, username: string, avatarUrl?: string) => {
    if (!channelRef.current || !isSubscribed) {
      console.log('[TypingIndicator] Cannot set typing - not subscribed');
      return;
    }

    console.log('[TypingIndicator] Setting typing:', isTyping, 'for', username);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await channelRef.current.track({
      userId: currentUserId,
      username,
      avatarUrl,
      typing: isTyping,
      timestamp: new Date().toISOString(),
    });

    if (isTyping) {
      // Auto-clear typing after 3 seconds of no activity
      typingTimeoutRef.current = setTimeout(() => {
        console.log('[TypingIndicator] Auto-clearing typing for', username);
        channelRef.current?.track({
          userId: currentUserId,
          username,
          avatarUrl,
          typing: false,
          timestamp: new Date().toISOString(),
        });
      }, 3000);
    }
  }, [currentUserId, isSubscribed]);

  const clearTyping = useCallback(async (username: string, avatarUrl?: string) => {
    if (!channelRef.current || !isSubscribed) {
      console.log('[TypingIndicator] Cannot clear typing - not subscribed');
      return;
    }

    console.log('[TypingIndicator] Clearing typing for', username);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await channelRef.current.track({
      userId: currentUserId,
      username,
      avatarUrl,
      typing: false,
      timestamp: new Date().toISOString(),
    });
  }, [currentUserId, isSubscribed]);

  return { typingUsers, setTyping, clearTyping };
};
