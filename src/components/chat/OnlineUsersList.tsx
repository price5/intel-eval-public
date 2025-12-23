import React, { useState } from 'react';
import { useAuth, type UserStatus } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineTypingIndicator } from './InlineTypingIndicator';
import { useDirectMessage } from '@/contexts/DirectMessageContext';
import { ContextMenu } from './ContextMenu';

interface TypingUser {
  userId: string;
  username: string;
  avatarUrl?: string;
}

interface OnlineUsersListProps {
  onUserClick: (userId: string) => void;
  typingUsers?: TypingUser[];
}

export const OnlineUsersList: React.FC<OnlineUsersListProps> = ({ onUserClick, typingUsers = [] }) => {
  const { onlineUsers, loading } = useAuth();
  const { setSelectedRecipient } = useDirectMessage();
  const [contextMenu, setContextMenu] = useState<{ userId: string; rect: DOMRect } | null>(null);
  
  const isUserTyping = (userId: string) => {
    return typingUsers.some(tu => tu.userId === userId);
  };

  // Sort users alphabetically and add logging
  const sortedUsers = React.useMemo(() => {
    console.log('OnlineUsersList received users:', onlineUsers);
    return [...onlineUsers].sort((a, b) => {
      const nameA = a.full_name || 'Anonymous';
      const nameB = b.full_name || 'Anonymous';
      return nameA.localeCompare(nameB);
    });
  }, [onlineUsers]);

  const getInitials = (name?: string) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-muted-foreground/50';
    }
  };

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      default:
        return 'Online';
    }
  };

  if (loading) {
    return (
      <div className="w-60 border-l border-border bg-muted/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-60 border-l border-border bg-muted/50 flex flex-col h-full">
      <div className="p-4 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-foreground">
          Online Users ({onlineUsers.length})
        </h2>
      </div>
      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-2 space-y-1">
          {sortedUsers.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No users online
            </div>
          ) : (
            sortedUsers.map((user) => (
              <button
                key={`${user.user_id}-${user.online_at}`}
                onClick={() => onUserClick(user.user_id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ userId: user.user_id, rect: e.currentTarget.getBoundingClientRect() });
                }}
                className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors text-left"
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.full_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-background`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.full_name || 'Anonymous'}
                    </p>
                    {isUserTyping(user.user_id) && <InlineTypingIndicator />}
                  </div>
                  {(user.custom_status_emoji || user.custom_status_text) && 
                   (!user.custom_status_expires_at || new Date(user.custom_status_expires_at) > new Date()) ? (
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      {user.custom_status_emoji && <span>{user.custom_status_emoji}</span>}
                      {user.custom_status_text && <span>{user.custom_status_text}</span>}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">{getStatusLabel(user.status)}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {contextMenu && (
        <ContextMenu
          anchorRect={contextMenu.rect}
          items={[
            {
              id: 'dm',
              label: 'Send Direct Message',
              icon: 'Mail',
              onClick: () => {
                setSelectedRecipient(contextMenu.userId);
              },
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
