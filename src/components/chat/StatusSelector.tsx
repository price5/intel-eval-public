import React, { useState } from 'react';
import { useAuth, type UserStatus } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Circle, Edit2, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_STATUS_LENGTH = 50;

export const StatusSelector: React.FC = () => {
  const { userStatus, setUserStatus } = useAuth();
  const { profile, refetch } = useProfile();
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customEmoji, setCustomEmoji] = useState(profile?.custom_status_emoji || '');
  const [customText, setCustomText] = useState(profile?.custom_status_text || '');
  const [expiresIn, setExpiresIn] = useState<'1h' | '4h' | 'eod' | 'never'>('never');
  const [saving, setSaving] = useState(false);

  const statusOptions: { value: UserStatus; label: string; color: string }[] = [
    { value: 'online', label: 'Online', color: 'text-green-500' },
    { value: 'away', label: 'Away', color: 'text-yellow-500' },
    { value: 'busy', label: 'Busy', color: 'text-red-500' },
  ];

  const currentStatus = statusOptions.find((s) => s.value === userStatus);

  const handleSaveCustomStatus = async () => {
    if (!profile) return;

    // Validate text length
    if (customText.length > MAX_STATUS_LENGTH) {
      toast.error(`Status text must be ${MAX_STATUS_LENGTH} characters or less`);
      return;
    }

    setSaving(true);
    try {
      // Calculate expiration time
      let expiresAt: string | null = null;
      if (expiresIn !== 'never') {
        const now = new Date();
        if (expiresIn === '1h') {
          expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        } else if (expiresIn === '4h') {
          expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
        } else if (expiresIn === 'eod') {
          // Set to end of day (23:59:59)
          const endOfDay = new Date(now);
          endOfDay.setHours(23, 59, 59, 999);
          expiresAt = endOfDay.toISOString();
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          custom_status_text: customText.trim() || null,
          custom_status_emoji: customEmoji.trim() || null,
          custom_status_expires_at: expiresAt,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      await refetch();
      setShowCustomDialog(false);
      toast.success('Custom status updated');
    } catch (error) {
      console.error('Error updating custom status:', error);
      toast.error('Failed to update custom status');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCustomStatus = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          custom_status_text: null,
          custom_status_emoji: null,
          custom_status_expires_at: null,
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;

      await refetch();
      setCustomEmoji('');
      setCustomText('');
      setExpiresIn('never');
      toast.success('Custom status cleared');
    } catch (error) {
      console.error('Error clearing custom status:', error);
      toast.error('Failed to clear custom status');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-2 px-2 hover:bg-muted/50"
          >
            <Circle className={`h-3 w-3 fill-current ${currentStatus?.color}`} />
            <div className="flex flex-col items-start">
              <span className="text-sm">{currentStatus?.label}</span>
              {profile?.custom_status_text && (
                <span className="text-xs text-muted-foreground">
                  {profile.custom_status_emoji} {profile.custom_status_text}
                </span>
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {statusOptions.map((status) => (
            <DropdownMenuItem
              key={status.value}
              onClick={() => setUserStatus(status.value)}
              className="cursor-pointer"
            >
              <Circle className={`h-3 w-3 mr-2 fill-current ${status.color}`} />
              <span>{status.label}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCustomEmoji(profile?.custom_status_emoji || '');
              setCustomText(profile?.custom_status_text || '');
              setShowCustomDialog(true);
            }}
            className="cursor-pointer"
          >
            <Edit2 className="h-3 w-3 mr-2" />
            <span>Set Custom Status</span>
          </DropdownMenuItem>
          {profile?.custom_status_text && (
            <DropdownMenuItem
              onClick={handleClearCustomStatus}
              className="cursor-pointer text-destructive"
              disabled={saving}
            >
              <Circle className="h-3 w-3 mr-2" />
              <span>Clear Custom Status</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Custom Status</DialogTitle>
            <DialogDescription>
              Add an emoji and message to show alongside your status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emoji">Emoji</Label>
              <Input
                id="emoji"
                placeholder="🌴"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                maxLength={2}
                className="text-2xl"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="status-text">Status Message</Label>
                <span className={`text-xs ${customText.length > MAX_STATUS_LENGTH ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {customText.length}/{MAX_STATUS_LENGTH}
                </span>
              </div>
              <Input
                id="status-text"
                placeholder="On vacation"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                maxLength={MAX_STATUS_LENGTH}
              />
            </div>
            <div className="space-y-2">
              <Label>Clear Status After</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {expiresIn === '1h' && '1 hour'}
                      {expiresIn === '4h' && '4 hours'}
                      {expiresIn === 'eod' && 'End of day'}
                      {expiresIn === 'never' && 'Never'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem onClick={() => setExpiresIn('1h')}>
                    1 hour
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setExpiresIn('4h')}>
                    4 hours
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setExpiresIn('eod')}>
                    End of day
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setExpiresIn('never')}>
                    Never
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCustomDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCustomStatus} disabled={saving}>
              {saving ? 'Saving...' : 'Save Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
