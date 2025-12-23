import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  messagePreview?: string;
  senderName?: string;
  senderAvatar?: string;
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  messagePreview,
  senderName,
  senderAvatar,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 8, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 8, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.14 }}
        className="relative z-10 w-[min(540px,92%)] rounded-md border border-border bg-card p-6"
      >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">Delete message</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Are you sure you want to delete this message? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Sender info and message preview */}
            {senderName && (
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={senderAvatar} alt={senderName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(senderName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground mb-1">
                    {senderName}
                  </div>
                  {messagePreview && (
                    <div className="text-sm text-muted-foreground line-clamp-3 break-words">
                      {messagePreview}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-border bg-transparent text-foreground hover:bg-muted/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 rounded-md bg-destructive text-white hover:bg-destructive/90 transition-colors"
            >
              Delete
            </button>
          </div>
      </motion.div>
    </div>
  );
};
