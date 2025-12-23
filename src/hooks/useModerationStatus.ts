import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ModerationStatus {
  isSuspended: boolean;
  isBanned: boolean;
  reason: string | null;
  expiresAt: string | null;
  isModerated: boolean;
}

export const useModerationStatus = () => {
  const { user } = useAuth();
  const [moderationStatus, setModerationStatus] = useState<ModerationStatus>({
    isSuspended: false,
    isBanned: false,
    reason: null,
    expiresAt: null,
    isModerated: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkModerationStatus();
      
      // Subscribe to profile changes to get real-time moderation updates
      const channel = supabase
        .channel('moderation-status')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const profile = payload.new;
            setModerationStatus({
              isSuspended: profile.is_suspended || false,
              isBanned: profile.is_banned || false,
              reason: profile.moderation_reason || null,
              expiresAt: profile.moderation_expires_at || null,
              isModerated: profile.is_suspended || profile.is_banned || false,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkModerationStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_suspended, is_banned, moderation_reason, moderation_expires_at')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        // Check if temporary suspension has expired
        const hasExpired = data.moderation_expires_at && 
          new Date(data.moderation_expires_at) < new Date();

        const status: ModerationStatus = {
          isSuspended: data.is_suspended && !hasExpired,
          isBanned: data.is_banned || false,
          reason: data.moderation_reason || null,
          expiresAt: data.moderation_expires_at || null,
          isModerated: (data.is_suspended && !hasExpired) || data.is_banned || false,
        };

        setModerationStatus(status);

        // If expired, update the database to clear suspension
        if (hasExpired && data.is_suspended) {
          await supabase
            .from('profiles')
            .update({
              is_suspended: false,
              moderation_reason: null,
              moderation_expires_at: null,
            })
            .eq('user_id', user.id);
        }
      }
    } catch (error) {
      console.error('Error checking moderation status:', error);
    } finally {
      setLoading(false);
    }
  };

  return { moderationStatus, loading, refetch: checkModerationStatus };
};