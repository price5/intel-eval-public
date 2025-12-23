import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  username: string;
  college: string;
  usn: string;
  role: string;
  bio?: string;
  avatar_url?: string;
  streak_count: number;
  days_active?: number;
  last_login_date?: string;
  created_at: string;
  updated_at: string;
  achievement_role?: string;
  highest_rank_overall?: number;
  highest_rank_code?: number;
  highest_rank_explanation?: number;
  inactivity_timeout?: number;
  custom_status_text?: string;
  custom_status_emoji?: string;
  custom_status_expires_at?: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Handle user login streak update
      await supabase.rpc('handle_user_login', { user_id_param: user.id });

      // Calculate and update achievement role
      await supabase.rpc('calculate_user_achievement_role', { user_id_param: user.id });

      // Clear expired custom status if needed
      await supabase.rpc('clear_expired_custom_statuses');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    setLoading(true);
    await fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return { profile, loading, error, refetch };
};