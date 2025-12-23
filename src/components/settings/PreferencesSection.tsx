import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, RotateCcw } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NotificationPreferencesCard } from './NotificationPreferencesCard';
import { NotificationSoundSettings } from './NotificationSoundSettings';
import { Button } from '@/components/ui/button';

export const PreferencesSection: React.FC = () => {
  const { profile, refetch } = useProfile();
  const [updating, setUpdating] = useState(false);
  const [resettingOnboarding, setResettingOnboarding] = useState(false);

  const handleTimeoutChange = async (value: string) => {
    if (!profile) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ inactivity_timeout: parseInt(value) })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast.success('Inactivity timeout updated');
      await refetch();
    } catch (error) {
      console.error('Error updating timeout:', error);
      toast.error('Failed to update timeout');
    } finally {
      setUpdating(false);
    }
  };

  const handleResetOnboarding = async () => {
    if (!profile) return;
    
    setResettingOnboarding(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: false,
          onboarding_completed_at: null 
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      toast.success('Onboarding tour reset! Refresh the page to see it again.');
      await refetch();
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      toast.error('Failed to reset onboarding tour');
    } finally {
      setResettingOnboarding(false);
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activity & Status</CardTitle>
          <CardDescription>Configure how your status updates based on activity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Inactivity Timeout
            </Label>
            <Select
              value={profile.inactivity_timeout?.toString() || '5'}
              onValueChange={handleTimeoutChange}
              disabled={updating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timeout duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Automatically change your status to 'Away' after this period of inactivity
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Tour</CardTitle>
          <CardDescription>Replay the platform introduction tour</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">
                Want to see the platform tour again? Reset the onboarding to review key features.
              </p>
              <p className="text-xs text-muted-foreground">
                After resetting, refresh your dashboard to start the tour.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetOnboarding}
              disabled={resettingOnboarding}
              className="shrink-0"
            >
              <RotateCcw className={`h-4 w-4 mr-2 ${resettingOnboarding ? 'animate-spin' : ''}`} />
              {resettingOnboarding ? 'Resetting...' : 'Replay Tour'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <NotificationPreferencesCard />
      
      <NotificationSoundSettings />
    </div>
  );
};
