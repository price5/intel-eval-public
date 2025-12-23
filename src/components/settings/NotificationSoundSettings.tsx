import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Bell, BellOff } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const NotificationSoundSettings: React.FC = () => {
  const { 
    soundSettings, 
    updateSoundSettings,
    pushNotificationPermission,
    requestPushPermission,
    isPushEnabled 
  } = useNotifications();

  const handleTestSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+Dyv');
    audio.volume = soundSettings.volume;
    audio.play().catch(err => console.log('Audio play failed:', err));
    
    if ('vibrate' in navigator && soundSettings.enabled) {
      navigator.vibrate(200);
    }

    toast.success('Test notification', {
      description: 'This is how notifications will sound and feel',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {soundSettings.enabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
          Notification Sounds
        </CardTitle>
        <CardDescription>
          Configure sound and vibration for notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Sounds */}
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <Label className="text-base font-medium">
              Enable Sounds & Vibration
            </Label>
            <p className="text-sm text-muted-foreground">
              Play sound and vibrate on new notifications
            </p>
          </div>
          <Switch
            checked={soundSettings.enabled}
            onCheckedChange={(checked) =>
              updateSoundSettings({ ...soundSettings, enabled: checked })
            }
          />
        </div>

        <Separator />

        {/* Volume Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Volume
            </Label>
            <span className="text-xs text-muted-foreground">
              {Math.round(soundSettings.volume * 100)}%
            </span>
          </div>
          <Slider
            value={[soundSettings.volume * 100]}
            onValueChange={([value]) =>
              updateSoundSettings({ ...soundSettings, volume: value / 100 })
            }
            max={100}
            step={1}
            disabled={!soundSettings.enabled}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Test Button */}
        <Button
          onClick={handleTestSound}
          variant="outline"
          className="w-full"
          disabled={!soundSettings.enabled}
        >
          Test Sound & Vibration
        </Button>

        <Separator />

        {/* Push Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Label className="text-base font-medium">
                  Push Notifications
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive notifications even when the app is closed
              </p>
            </div>
            <Switch
              checked={isPushEnabled}
              onCheckedChange={async (checked) => {
                if (checked) {
                  await requestPushPermission();
                }
              }}
            />
          </div>

          {pushNotificationPermission === 'denied' && (
            <Alert variant="destructive">
              <BellOff className="h-4 w-4" />
              <AlertDescription>
                Push notifications are blocked. Please enable them in your browser settings.
              </AlertDescription>
            </Alert>
          )}

          {pushNotificationPermission === 'default' && !isPushEnabled && (
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                Enable push notifications to receive updates even when the app is closed.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
