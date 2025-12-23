import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
  users: Array<{ user_id: string; username?: string }>;
}

interface MessageReactionsProps {
  reactions: Reaction[];
  onReactionClick: (emoji: string) => void;
  className?: string;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  reactions,
  onReactionClick,
  className,
}) => {
  if (reactions.length === 0) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex flex-wrap gap-1 mt-1", className)}>
        {reactions.map((reaction) => (
          <Tooltip key={reaction.emoji}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReactionClick(reaction.emoji)}
                className={cn(
                  "h-6 px-2 py-0 text-sm border rounded-md transition-all duration-150 cursor-pointer",
                  reaction.userReacted
                    ? "bg-primary/10 border-primary/40 hover:bg-primary/15"
                    : "bg-muted/50 border-border/50 hover:bg-muted"
                )}
              >
                <span className="text-base leading-none">{reaction.emoji}</span>
                <span className="ml-1 text-xs font-medium">{reaction.count}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="text-xs">
                {reaction.users.map(u => u.username || 'Unknown').join(', ')}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};
