import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useOnboarding = () => {
  const [shouldShowTour, setShouldShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        // Show tour if onboarding not completed
        setShouldShowTour(!data?.onboarding_completed);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setShouldShowTour(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user]);

  const completeTour = () => {
    setShouldShowTour(false);
  };

  return {
    shouldShowTour,
    isLoading,
    completeTour,
  };
};
