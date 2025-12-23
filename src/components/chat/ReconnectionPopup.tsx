import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ReconnectionPopupProps {
  isReconnecting: boolean;
  justReconnected: boolean;
}

export const ReconnectionPopup: React.FC<ReconnectionPopupProps> = ({ 
  isReconnecting, 
  justReconnected 
}) => {
  if (!isReconnecting && !justReconnected) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top">
      {isReconnecting ? (
        <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            Reconnecting to chat...
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200 flex items-center gap-2">
            Successfully reconnected
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
