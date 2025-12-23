import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Reaction {
  id: string;
  direct_message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export const useDMReactions = (messageId: string) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<ReactionGroup[]>([]);
  const [topEmojis, setTopEmojis] = useState<string[]>(['👍', '❤️', '😊']);

  useEffect(() => {
    if (!messageId) return;

    loadReactions();
    loadTopEmojis();

    // Subscribe to realtime changes
    const channel: RealtimeChannel = supabase
      .channel(`dm-reactions:${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_message_reactions',
          filter: `direct_message_id=eq.${messageId}`,
        },
        () => {
          loadReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [messageId, user?.id]);

  const loadReactions = async () => {
    const { data, error } = await supabase
      .from('direct_message_reactions')
      .select('*')
      .eq('direct_message_id', messageId);

    if (error) {
      console.error('Error loading DM reactions:', error);
      return;
    }

    // Group reactions by emoji
    const grouped = (data as Reaction[]).reduce((acc, reaction) => {
      const existing = acc.find((g) => g.emoji === reaction.emoji);
      if (existing) {
        existing.count++;
        existing.users.push(reaction.user_id);
        if (reaction.user_id === user?.id) {
          existing.hasReacted = true;
        }
      } else {
        acc.push({
          emoji: reaction.emoji,
          count: 1,
          users: [reaction.user_id],
          hasReacted: reaction.user_id === user?.id,
        });
      }
      return acc;
    }, [] as ReactionGroup[]);

    setReactions(grouped);
  };

  const loadTopEmojis = async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from('direct_message_reactions')
      .select('emoji')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      // Get frequency of each emoji
      const frequency = data.reduce((acc, { emoji }) => {
        acc[emoji] = (acc[emoji] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Sort by frequency and get top 3
      const top = Object.entries(frequency)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([emoji]) => emoji);

      if (top.length > 0) {
        setTopEmojis(top);
      }
    }
  };

  const toggleReaction = async (emoji: string) => {
    if (!user?.id) return;

    const existingReaction = reactions.find(
      (r) => r.emoji === emoji && r.hasReacted
    );

    if (existingReaction) {
      // Remove reaction
      const { error } = await supabase
        .from('direct_message_reactions')
        .delete()
        .eq('direct_message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (error) {
        console.error('Error removing DM reaction:', error);
      }
    } else {
      // Add reaction
      const { error } = await supabase
        .from('direct_message_reactions')
        .insert({
          direct_message_id: messageId,
          user_id: user.id,
          emoji,
        });

      if (error) {
        console.error('Error adding DM reaction:', error);
      }
    }
  };

  return { reactions, topEmojis, toggleReaction };
};
