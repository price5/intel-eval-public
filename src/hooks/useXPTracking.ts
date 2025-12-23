import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Zap, Flame, Star, Trophy } from 'lucide-react';

export const useXPTracking = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to XP transactions
    const xpChannel = supabase
      .channel('xp-tracking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'xp_transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const transaction = payload.new;
          
          // Show XP notification
          toast.success(
            `+${transaction.xp_amount} XP`,
            {
              description: transaction.description || 'XP earned',
              icon: '⚡',
              duration: 3000
            }
          );

          // Special notification for boosters
          if (transaction.multiplier > 1.0) {
            toast.success(
              `${transaction.multiplier}x XP Multiplier Active!`,
              {
                description: 'You\'re earning bonus XP',
                icon: '🔥',
                duration: 4000
              }
            );
          }
        }
      )
      .subscribe();

    // Subscribe to XP boosters for new booster notifications
    const boosterChannel = supabase
      .channel('xp-boosters')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_xp_boosters',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const booster = payload.new;
          
          // Show booster activation notification
          const boosterMessages: { [key: string]: { title: string; description: string; icon: string } } = {
            'streak_7day': {
              title: '🔥 7-Day Streak Bonus!',
              description: '+10% XP boost for 24 hours',
              icon: '🔥'
            },
            'streak_30day': {
              title: '🔥 30-Day Streak Bonus!',
              description: '+20% XP boost for 48 hours',
              icon: '🔥'
            },
            'streak_60day': {
              title: '🔥 60-Day Streak Bonus!',
              description: '+30% XP boost for 72 hours',
              icon: '🔥'
            },
            'streak_100day': {
              title: '🔥 100-Day Streak Bonus!',
              description: '+50% XP boost for 7 days!',
              icon: '🏆'
            },
            'weekend_challenge': {
              title: '🎉 Weekend Challenge Active!',
              description: '+25% XP boost all weekend',
              icon: '🎉'
            },
            'double_xp_hour': {
              title: '⚡ Double XP Hour!',
              description: '2x XP for the next hour!',
              icon: '⚡'
            }
          };

          const message = boosterMessages[booster.booster_type] || {
            title: 'XP Booster Active!',
            description: `${booster.multiplier}x XP multiplier`,
            icon: '✨'
          };

          toast.success(message.title, {
            description: message.description,
            icon: message.icon,
            duration: 5000
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(xpChannel);
      supabase.removeChannel(boosterChannel);
    };
  }, [user]);
};