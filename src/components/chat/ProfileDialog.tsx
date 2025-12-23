import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProfilePopup } from '@/components/profile/ProfilePopup';
import { UserProfile } from '@/hooks/useProfile';

interface ProfileDialogProps {
  profile: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileDialog: React.FC<ProfileDialogProps> = ({
  profile,
  open,
  onOpenChange,
}) => {
  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card/95 backdrop-blur-sm border-border/50 animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-foreground">User Profile</DialogTitle>
        </DialogHeader>
        <ProfilePopup profile={profile} />
      </DialogContent>
    </Dialog>
  );
};
