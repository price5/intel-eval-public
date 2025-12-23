import React from 'react';
import { X, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface PinnedMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface PinnedMessagesProps {
  messages: PinnedMessage[];
  onUnpin: (messageId: string) => void;
  onNavigate: (messageId: string) => void;
  canUnpin: boolean;
}

export const PinnedMessages: React.FC<PinnedMessagesProps> = ({ 
  messages, 
  onUnpin, 
  onNavigate,
  canUnpin 
}) => {
  if (messages.length === 0) return null;

  return (
    <div className="border-b border-border bg-accent/30 backdrop-blur-sm">
      <div className="px-4 py-2 space-y-2 max-h-48 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className="flex items-start gap-2 p-2 rounded-lg bg-background/60 border border-border/50 hover:bg-background/80 transition-colors cursor-pointer group"
            onClick={() => onNavigate(message.id)}
          >
            <Pin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={message.sender?.avatar_url} />
                  <AvatarFallback className="text-[10px]">
                    {message.sender?.full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-foreground">
                  {message.sender?.full_name || 'Unknown User'}
                </span>
              </div>
              <p className="text-sm text-foreground/80 line-clamp-2 break-words">
                {message.content}
              </p>
            </div>

            {canUnpin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnpin(message.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
