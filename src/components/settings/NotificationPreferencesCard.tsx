import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Bell, Mail, Trophy, TrendingUp, MessageSquare, Reply, Send, MessageCircle, AlertCircle, Megaphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

interface NotificationPreferences {
  email_notifications: boolean;
  assessment_graded: boolean;
  assessment_deadline: boolean;
  achievement_unlocked: boolean;
  rank_change: boolean;
  message_mention: boolean;
  message_reply: boolean;
  direct_message: boolean;
  feedback_response: boolean;
  system_announcement: boolean;
  moderation_action: boolean;
}

const notificationTypes = [
  {
    key: 'assessment_graded' as keyof NotificationPreferences,
    label: 'Assessment Graded',
    description: 'When your assessment has been evaluated',
    icon: Trophy,
  },
  {
    key: 'assessment_deadline' as keyof NotificationPreferences,
    label: 'Assessment Deadline',
    description: 'Reminders about upcoming assessment deadlines',
    icon: AlertCircle,
  },
  {
    key: 'achievement_unlocked' as keyof NotificationPreferences,
    label: 'Achievement Unlocked',
    description: 'When you earn a new achievement or badge',
    icon: Trophy,
  },
  {
    key: 'rank_change' as keyof NotificationPreferences,
    label: 'Rank Change',
    description: 'When your leaderboard rank improves',
    icon: TrendingUp,
  },
  {
    key: 'message_mention' as keyof NotificationPreferences,
    label: 'Message Mentions',
    description: 'When someone mentions you in a message',
    icon: MessageSquare,
  },
  {
    key: 'message_reply' as keyof NotificationPreferences,
    label: 'Message Replies',
    description: 'When someone replies to your message',
    icon: Reply,
  },
  {
    key: 'direct_message' as keyof NotificationPreferences,
    label: 'Direct Messages',
    description: 'When you receive a direct message',
    icon: Send,
  },
  {
    key: 'feedback_response' as keyof NotificationPreferences,
    label: 'Feedback Responses',
    description: 'When someone responds to your feedback',
    icon: MessageCircle,
  },
  {
    key: 'system_announcement' as keyof NotificationPreferences,
    label: 'System Announcements',
    description: 'Important updates and announcements',
    icon: Megaphone,
  },
  {
    key: 'moderation_action' as keyof NotificationPreferences,
    label: 'Moderation Actions',
    description: 'When moderation actions are taken on your account',
    icon: AlertCircle,
  },
];

export const NotificationPreferencesCard: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no preferences exist, create default ones
        if (error.code === 'PGRST116') {
          await createDefaultPreferences();
        } else {
          throw error;
        }
      } else {
        setPreferences(data as NotificationPreferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const defaultPrefs = {
        user_id: user.id,
        email_notifications: true,
        assessment_graded: true,
        assessment_deadline: true,
        achievement_unlocked: true,
        rank_change: true,
        message_mention: true,
        message_reply: true,
        direct_message: true,
        feedback_response: true,
        system_announcement: true,
        moderation_action: true,
      };

      const { data, error } = await supabase
        .from('notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data as NotificationPreferences);
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user || !preferences) return;

    setUpdating(key);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id);

      if (error) throw error;

      setPreferences({ ...preferences, [key]: value });
      toast.success('Notification preference updated');
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error('Failed to update preference');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading preferences...</p>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label className="flex items-center gap-2 text-base font-medium">
                <Mail className="h-4 w-4" />
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
              disabled={updating === 'email_notifications'}
            />
          </div>
        </div>

        <Separator />

        {/* Individual Notification Types */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Notification Types
          </h4>
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div key={type.key} className="flex items-center justify-between py-2">
                <div className="space-y-1 flex-1">
                  <Label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {type.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {type.description}
                  </p>
                </div>
                <Switch
                  checked={preferences[type.key]}
                  onCheckedChange={(checked) => updatePreference(type.key, checked)}
                  disabled={updating === type.key}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
