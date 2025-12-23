import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Ban, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface ModerationBannerProps {
  isSuspended: boolean;
  isBanned: boolean;
  reason: string | null;
  expiresAt: string | null;
}

export const ModerationBanner: React.FC<ModerationBannerProps> = ({
  isSuspended,
  isBanned,
  reason,
  expiresAt,
}) => {
  if (isBanned) {
    return (
      <Alert variant="destructive" className="mb-6">
        <Ban className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold">Account Banned</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-2">
            Your account has been permanently banned from this platform.
          </p>
          {reason && (
            <p className="text-sm bg-destructive/10 p-3 rounded-md border border-destructive/20">
              <strong>Reason:</strong> {reason}
            </p>
          )}
          <p className="mt-3 text-sm">
            If you believe this is a mistake, please contact the administrators.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  if (isSuspended) {
    return (
      <Alert variant="destructive" className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950/20">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <AlertTitle className="text-lg font-semibold text-orange-900 dark:text-orange-400">
          Account Suspended
        </AlertTitle>
        <AlertDescription className="mt-2 text-orange-800 dark:text-orange-300">
          <p className="mb-2">
            Your account is currently suspended. You have limited access to platform features.
          </p>
          {reason && (
            <p className="text-sm bg-orange-100 dark:bg-orange-900/30 p-3 rounded-md border border-orange-200 dark:border-orange-800 mb-2">
              <strong>Reason:</strong> {reason}
            </p>
          )}
          {expiresAt ? (
            <div className="flex items-center gap-2 text-sm mt-2">
              <Clock className="h-4 w-4" />
              <span>
                Suspension expires on: {format(new Date(expiresAt), 'PPP p')}
              </span>
            </div>
          ) : (
            <p className="text-sm mt-2">
              This suspension is indefinite. Please contact administrators for more information.
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};