import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useActivityStatus } from '@/hooks/useActivityStatus';


export type UserStatus = 'online' | 'away' | 'busy';

export interface OnlineUser {
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  online_at: string;
  status: UserStatus;
  custom_status_text?: string;
  custom_status_emoji?: string;
  custom_status_expires_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  onlineUsersCount: number;
  onlineUsers: OnlineUser[];
  userStatus: UserStatus;
  setUserStatus: (status: UserStatus) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  onlineUsersCount: 0,
  onlineUsers: [],
  userStatus: 'online',
  setUserStatus: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [userStatus, setUserStatus] = useState<UserStatus>('online');
  const [inactivityTimeout, setInactivityTimeout] = useState<number>(5);
  const presenceChannelRef = React.useRef<RealtimeChannel | null>(null);

  // Fetch inactivity timeout preference
  useEffect(() => {
    if (!user) return;
    
    const fetchTimeout = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('inactivity_timeout')
        .eq('user_id', user.id)
        .single();
      
      if (data?.inactivity_timeout) {
        setInactivityTimeout(data.inactivity_timeout);
      }
    };

    fetchTimeout();
  }, [user]);

  // Track activity and auto-update status
  useActivityStatus(userStatus, setUserStatus, inactivityTimeout);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Global presence tracking for all logged-in users
  useEffect(() => {
    if (!user) {
      setOnlineUsersCount(0);
      setOnlineUsers([]);

      // Clean up any existing presence channel when user logs out
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      return;
    }

    // Fetch current user's profile for presence tracking
    const fetchUserProfile = async () => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, custom_status_text, custom_status_emoji, custom_status_expires_at')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.warn('Profile fetch error:', error);
          // Fallback to user metadata
          return {
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            avatar_url: user.user_metadata?.avatar_url || null,
            custom_status_text: undefined,
            custom_status_emoji: undefined,
            custom_status_expires_at: undefined
          };
        }
        
        return profile;
      } catch (err) {
        console.error('Error fetching profile:', err);
        return {
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || null,
          custom_status_text: undefined,
          custom_status_emoji: undefined,
          custom_status_expires_at: undefined
        };
      }
    };

    const setupPresence = async () => {
      const profile = await fetchUserProfile();
      console.log('Setting up presence for user:', user.id, 'with profile:', profile);

      // Ensure we don't leak channels by cleaning up any existing one first
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }

      const channel = supabase.channel('global-presence', {
        config: {
          presence: {
            key: user.id,
          },
        },
      })
        .on('presence', { event: 'sync' }, async () => {
          console.log('Presence sync event triggered');
          const state = channel.presenceState();
          const allPresences = Object.values(state);
          const users: OnlineUser[] = allPresences.flatMap(presences => 
            (presences as any[]).map((p: any) => ({
              user_id: p.user_id,
              full_name: p.full_name,
              avatar_url: p.avatar_url,
              online_at: p.online_at,
              status: p.status || 'online',
              custom_status_text: p.custom_status_text,
              custom_status_emoji: p.custom_status_emoji,
              custom_status_expires_at: p.custom_status_expires_at
            }))
          );
          
          // Deduplicate by user_id, keeping the most recent entry
          const uniqueUsersMap = new Map<string, OnlineUser>();
          users.forEach(user => {
            const existing = uniqueUsersMap.get(user.user_id);
            if (!existing || new Date(user.online_at) > new Date(existing.online_at)) {
              uniqueUsersMap.set(user.user_id, user);
            }
          });
          const uniqueUsers = Array.from(uniqueUsersMap.values());
          
          // Fetch fresh profiles for all online users to ensure accuracy
          const userIds = uniqueUsers.map(u => u.user_id);
          if (userIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, full_name, avatar_url, custom_status_text, custom_status_emoji, custom_status_expires_at')
              .in('user_id', userIds);
            
            console.log('Fetched profiles for online users:', profiles);
            
            // Merge profile data with presence data
            const enrichedUsers = uniqueUsers.map(user => {
              const profile = profiles?.find(p => p.user_id === user.user_id);
              return {
                ...user,
                full_name: profile?.full_name || user.full_name || 'Anonymous',
                avatar_url: profile?.avatar_url || user.avatar_url || null,
                custom_status_text: profile?.custom_status_text || user.custom_status_text,
                custom_status_emoji: profile?.custom_status_emoji || user.custom_status_emoji,
                custom_status_expires_at: profile?.custom_status_expires_at || user.custom_status_expires_at,
              };
            });
            
            console.log('Enriched online users:', enrichedUsers);
            setOnlineUsers(enrichedUsers);
            setOnlineUsersCount(enrichedUsers.length);
          } else {
            setOnlineUsers([]);
            setOnlineUsersCount(0);
          }
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences);
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences);
        })
        .subscribe(async (status) => {
          console.log('Presence channel status:', status);
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              full_name: (profile as any)?.full_name || 'Anonymous',
              avatar_url: (profile as any)?.avatar_url || null,
              online_at: new Date().toISOString(),
              status: userStatus,
              custom_status_text: (profile as any)?.custom_status_text,
              custom_status_emoji: (profile as any)?.custom_status_emoji,
              custom_status_expires_at: (profile as any)?.custom_status_expires_at,
            });
            console.log('Tracked presence:', { user_id: user.id, full_name: (profile as any)?.full_name, status: userStatus });
          }
        });

      presenceChannelRef.current = channel;
    };

    setupPresence();

    return () => {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [user, userStatus]);

  const signOut = async () => {
    try {
      // Clear local state first for better UX
      setUser(null);
      setSession(null);
      
      // Attempt to sign out from server
      const { error } = await supabase.auth.signOut();
      
      // Don't throw error for session not found - user is already logged out
      if (error && !error.message.includes('Session not found')) {
        console.warn('Sign out warning:', error.message);
      }
      
      // Clear any remaining local auth data
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
      
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if sign out fails, clear local state
      setUser(null);
      setSession(null);
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    onlineUsersCount,
    onlineUsers,
    userStatus,
    setUserStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};