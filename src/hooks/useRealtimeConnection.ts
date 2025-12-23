import { useEffect, useState, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

export const useRealtimeConnection = (channel: RealtimeChannel | null, channelName?: string) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const [initialConnectionMade, setInitialConnectionMade] = useState(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastReconnectAttempt = useRef<number>(0);

  useEffect(() => {
    if (!channel) {
      setIsConnected(true);
      setIsReconnecting(false);
      setInitialConnectionMade(false);
      return;
    }

    const checkAndReconnect = async () => {
      const state = channel.state;
      
      // Mark initial connection as made when we first join
      if (state === 'joined' && !initialConnectionMade) {
        console.log(`[Reconnection] Initial connection established for ${channelName || 'channel'}`);
        setInitialConnectionMade(true);
        setIsConnected(true);
        setIsReconnecting(false);
        return;
      }

      // Only show disconnected if we've made initial connection and channel is in bad state
      if (initialConnectionMade && (state === 'closed' || state === 'errored')) {
        setIsConnected(false);
        setIsReconnecting(true);
        setJustReconnected(false);
        
        // Debounce reconnection attempts (minimum 3 seconds between attempts)
        const now = Date.now();
        if (now - lastReconnectAttempt.current > 3000) {
          lastReconnectAttempt.current = now;
          console.log(`[Reconnection] Attempting to resubscribe ${channelName || 'channel'}...`);
          
          try {
            await channel.unsubscribe();
            await new Promise(resolve => setTimeout(resolve, 500));
            await channel.subscribe();
          } catch (error) {
            console.error('[Reconnection] Failed to reconnect:', error);
          }
        }
      } else if (state === 'joined' && isReconnecting) {
        console.log(`[Reconnection] Successfully reconnected ${channelName || 'channel'}`);
        setIsConnected(true);
        setIsReconnecting(false);
        setJustReconnected(true);
        setTimeout(() => setJustReconnected(false), 3000);
      }
    };

    // Check immediately
    checkAndReconnect();

    // Then check every 3 seconds
    const statusInterval = setInterval(checkAndReconnect, 3000);

    return () => {
      clearInterval(statusInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [channel, isReconnecting, initialConnectionMade, channelName]);

  return { isConnected, isReconnecting, justReconnected };
};
