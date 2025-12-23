import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TypingUser {
  userId: string;
  username: string;
  avatarUrl?: string;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  console.log('[TypingIndicator Component] Received typingUsers:', typingUsers);
  if (typingUsers.length === 0) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing`;
    } else {
      return `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing`;
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border-t border-primary/20 backdrop-blur-sm animate-fade-in">
      <div className="flex -space-x-3">
        {typingUsers.slice(0, 3).map((user) => (
          <Avatar key={user.userId} className="h-7 w-7 border-2 border-background ring-2 ring-primary/30 transition-all duration-200 hover:scale-110">
            <AvatarImage src={user.avatarUrl} alt={user.username} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {getInitials(user.username)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground font-medium">{getTypingText()}</span>
        <div className="flex gap-0.5">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};
