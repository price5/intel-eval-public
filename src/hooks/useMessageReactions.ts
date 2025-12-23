import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
  users: Array<{ user_id: string; username?: string }>;
}

interface RawReaction {
  id: string;
  emoji: string;
  user_id: string;
  message_id: string;
  created_at: string;
}

export const useMessageReactions = (messageId: string) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [topEmojis, setTopEmojis] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch reactions for the message
  const fetchReactions = useCallback(async () => {
    if (!messageId) return;

    try {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('id, emoji, user_id, message_id, created_at')
        .eq('message_id', messageId);

      if (error) throw error;

      // Fetch usernames for all reactors
      const userIds = [...new Set(data?.map(r => r.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const usernameMap = new Map(
        profiles?.map(p => [p.user_id, p.username]) || []
      );

      // Group reactions by emoji
      const grouped = (data || []).reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            userReacted: false,
            users: [],
          };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push({
          user_id: reaction.user_id,
          username: usernameMap.get(reaction.user_id),
        });
        if (user && reaction.user_id === user.id) {
          acc[reaction.emoji].userReacted = true;
        }
        return acc;
      }, {} as Record<string, Reaction>);

      setReactions(Object.values(grouped));
    } catch (error) {
      console.error('[useMessageReactions] Error fetching reactions:', error);
    }
  }, [messageId, user]);

  // Fetch user's top emojis
  const fetchTopEmojis = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_top_emojis', { user_id_param: user.id, limit_count: 3 });

      if (error) throw error;

      setTopEmojis(data?.map((d: any) => d.emoji) || []);
    } catch (error) {
      console.error('[useMessageReactions] Error fetching top emojis:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchReactions();
    fetchTopEmojis();
  }, [fetchReactions, fetchTopEmojis]);

  // Subscribe to realtime changes for reactions
  useEffect(() => {
    if (!messageId) return;

    const channel = supabase
      .channel(`message-reactions-${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`,
        },
        () => {
          // Immediately refetch reactions on any change
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId, fetchReactions]);

  // Subscribe to realtime changes for top emojis updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-reactions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refetch top emojis when user adds/removes any reaction
          fetchTopEmojis();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchTopEmojis]);

  // Add or remove a reaction
  const toggleReaction = useCallback(async (emoji: string) => {
    if (!user?.id) return;

    try {
      // Check if user already reacted with this emoji
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .maybeSingle();

      if (existing) {
        // Remove reaction - optimistically update UI
        setReactions(prev => {
          const updated = prev.map(r => {
            if (r.emoji === emoji) {
              return {
                ...r,
                count: r.count - 1,
                userReacted: false,
                users: r.users.filter(u => u.user_id !== user.id)
              };
            }
            return r;
          }).filter(r => r.count > 0);
          return updated;
        });

        await supabase
          .from('message_reactions')
          .delete()
          .eq('id', existing.id);
      } else {
        // Add reaction - optimistically update UI
        setReactions(prev => {
          const existingReaction = prev.find(r => r.emoji === emoji);
          if (existingReaction) {
            return prev.map(r => {
              if (r.emoji === emoji) {
                return {
                  ...r,
                  count: r.count + 1,
                  userReacted: true,
                  users: [...r.users, { user_id: user.id, username: undefined }]
                };
              }
              return r;
            });
          } else {
            return [...prev, {
              emoji,
              count: 1,
              userReacted: true,
              users: [{ user_id: user.id, username: undefined }]
            }];
          }
        });

        await supabase
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            emoji,
          });
      }
    } catch (error) {
      console.error('[useMessageReactions] Error toggling reaction:', error);
      // Refetch on error to ensure consistency
      fetchReactions();
    }
  }, [messageId, user?.id, fetchReactions]);

  return {
    reactions,
    topEmojis,
    loading,
    toggleReaction,
    refetch: fetchReactions,
  };
};
