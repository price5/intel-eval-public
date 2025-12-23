import React, { useEffect, useState } from 'react';
import { useVersion } from '@/contexts/VersionContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sparkles } from 'lucide-react';

export const UpdateNotificationDialog: React.FC = () => {
  const { updateAvailable, dismissUpdate, applyUpdate } = useVersion();
  const { isAssessmentActive } = useAssessment();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show dialog when update is available and assessment is not active
    if (updateAvailable && !isAssessmentActive) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [updateAvailable, isAssessmentActive]);

  const handleUpdateNow = () => {
    setOpen(false);
    applyUpdate();
  };

  const handleDismiss = () => {
    setOpen(false);
    dismissUpdate();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="bg-card/95 backdrop-blur-sm border-border/50">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">New Update Available!</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            A new version of the application is available. Update now to get the latest features, improvements, and bug fixes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDismiss} className="border-border/50">
            Later
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdateNow} className="bg-primary hover:bg-primary/90">
            Update Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
