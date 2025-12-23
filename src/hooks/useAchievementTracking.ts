import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trophy } from 'lucide-react';

interface AchievementNotification {
  id: string;
  name: string;
  icon: string;
  points: number;
}

export const useAchievementTracking = () => {
  const trackEvent = useCallback(async (eventType: string, eventData?: Record<string, any>) => {
    try {
      const { data, error } = await supabase.functions.invoke('track-achievement-event', {
        body: { event_type: eventType, event_data: eventData }
      });

      if (error) {
        console.error('Error tracking event:', error);
        return;
      }

      // Show notifications for newly awarded achievements
      if (data?.newly_awarded && Array.isArray(data.newly_awarded)) {
        data.newly_awarded.forEach((achievement: AchievementNotification) => {
          toast.success(
            `🎉 Achievement Unlocked: ${achievement.name}`,
            {
              description: `+${achievement.points} points`,
              duration: 5000
            }
          );
        });
      }
    } catch (error) {
      console.error('Error in trackEvent:', error);
    }
  }, []);

  return { trackEvent };
};