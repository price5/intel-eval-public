import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageItem } from './MessageItem';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_edited?: boolean;
  edited_at?: string | null;
  mentions?: string[];
  parent?: {
    id: string;
    userId: string;
    senderName: string;
    content: string;
    avatarUrl?: string;
  } | null;
}

interface MessageGroupProps {
  messages: Message[];
  senderName: string;
  senderAvatar?: string;
  userId: string;
  currentUserId: string;
  isOwnGroup: boolean;
  isCurrentUserMentioned: boolean;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => Promise<void>;
  onReply: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
  onUsernameClick: (userId?: string) => void;
  onMentionClick: (userId: string) => void;
  searchQuery?: string;
  onBookmark?: (messageId: string) => void;
  isMessageBookmarked?: (messageId: string) => boolean;
}

export const MessageGroup: React.FC<MessageGroupProps> = ({
  messages,
  senderName,
  senderAvatar,
  userId,
  currentUserId,
  isOwnGroup,
  isCurrentUserMentioned,
  onDelete,
  onEdit,
  onReply,
  onPin,
  onUnpin,
  onUsernameClick,
  onMentionClick,
  searchQuery = '',
  onBookmark,
  isMessageBookmarked,
}) => {
  const groupRef = useRef<HTMLDivElement>(null);

  if (messages.length === 0) return null;

  const firstMessage = messages[0];
  
  // Format timestamp based on when message was sent
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd-MM-yyyy HH:mm');
    }
  };

  return (
    <motion.div
      ref={groupRef}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="group relative pl-4 pr-4 py-1.5"
    >
      {/* Render all messages in the group */}
      <div className="space-y-0">
        {messages.map((message, index) => (
          <div key={message.id} className="group/msg relative">
            {/* Timestamp for subsequent messages - shown on individual hover */}
            {index > 0 && (
              <div className="absolute left-4 top-0 bottom-0 w-10 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover/msg:opacity-100 transition-opacity">
                  {format(new Date(message.created_at), 'HH:mm')}
                </span>
              </div>
            )}
            <MessageItem
              message={message}
              isOwnMessage={isOwnGroup}
              isFirstInGroup={index === 0}
              isMentioned={message.mentions?.includes(currentUserId) || false}
            onDelete={onDelete}
            onEdit={onEdit}
            onReply={onReply}
            onPin={onPin}
            onUnpin={onUnpin}
            senderName={senderName}
              senderAvatar={senderAvatar}
              onMentionClick={onMentionClick}
              userId={userId}
              onUsernameClick={onUsernameClick}
              formatTimestamp={formatTimestamp}
              searchQuery={searchQuery}
              onBookmark={onBookmark}
              isBookmarked={isMessageBookmarked ? isMessageBookmarked(message.id) : false}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
};
