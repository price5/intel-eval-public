import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Pencil, Reply, Smile, Pin, PinOff, Mail, Bookmark } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ContextMenu } from './ContextMenu';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MentionAutocomplete } from './MentionAutocomplete';
import { EmojiPicker } from './EmojiPicker';
import { MessageReactions } from './MessageReactions';
import { useMessageReactions } from '@/hooks/useMessageReactions';
import { supabase } from '@/integrations/supabase/client';
import { useDirectMessage } from '@/contexts/DirectMessageContext';
import { ForwardMessageDialog } from './ForwardMessageDialog';

import { HighlightedText } from './HighlightedText';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  is_edited?: boolean;
  edited_at?: string | null;
  mentions?: string[];
  is_pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
  is_forwarded?: boolean;
  parent?: {
    id: string;
    userId: string;
    senderName: string;
    content: string;
    avatarUrl?: string;
  } | null;
}

interface MessageItemProps {
  message: Message;
  isOwnMessage: boolean;
  isFirstInGroup: boolean;
  isMentioned: boolean;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => Promise<void>;
  onReply: (messageId: string) => void;
  onPin: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
  senderName: string;
  senderAvatar?: string;
  onMentionClick: (userId: string) => void;
  userId: string;
  onUsernameClick: (userId?: string) => void;
  formatTimestamp: (dateString: string) => string;
  searchQuery?: string;
  onBookmark?: (messageId: string) => void;
  isBookmarked?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwnMessage,
  isFirstInGroup,
  isMentioned,
  onDelete,
  onEdit,
  onReply,
  onPin,
  onUnpin,
  senderName,
  senderAvatar,
  onMentionClick,
  userId,
  onUsernameClick,
  formatTimestamp,
  searchQuery = '',
  onBookmark,
  isBookmarked = false,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ bottom: 0, left: 0, width: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);
  const { isAdmin } = useAdminRole();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const { reactions, topEmojis, toggleReaction } = useMessageReactions(message.id);
  const { setSelectedRecipient } = useDirectMessage();
  const [dmContextMenu, setDmContextMenu] = useState<{ userId: string; rect: DOMRect } | null>(null);

  const canDelete = isAdmin || isOwnMessage;
  const canEdit = isOwnMessage;
  const isReplyToMe = message.parent && currentUser && message.parent.userId === currentUser.id;

  useEffect(() => {
    setEditText(message.content);
  }, [message.content]);

  // Fetch users for mentions when editing
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .limit(50);
      
      if (data) {
        setUsers(data);
      }
    };

    if (editing) {
      fetchUsers();
    }
  }, [editing]);

  // Detect @mentions in edit mode
  useEffect(() => {
    if (!editing || !editTextareaRef.current) return;

    const el = editTextareaRef.current;
    const pos = el.selectionStart;
    const text = el.value;
    const before = text.slice(0, pos);
    const atIndex = before.lastIndexOf('@');

    if (atIndex >= 0 && (atIndex === 0 || /\s/.test(before[atIndex - 1]))) {
      const query = before.slice(atIndex + 1);
      
      if (query.includes(' ')) {
        setShowMentions(false);
        return;
      }

      setMentionQuery(query);
      
      const rect = editTextareaRef.current?.getBoundingClientRect();
      const containerRect = editContainerRef.current?.getBoundingClientRect();
      if (rect && containerRect) {
        setMentionPosition({
          bottom: window.innerHeight - rect.top + 8,
          left: containerRect.left + 16,
          width: containerRect.width - 32,
        });
      }
      
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }, [editText, editing]);

  useEffect(() => {
    if (!menuOpen) setMenuAnchor(null);
  }, [menuOpen]);

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    // For right-click, use cursor position; for button click, use button position
    if (e.type === 'contextmenu') {
      const rect = new DOMRect(e.clientX, e.clientY, 0, 0);
      setMenuAnchor(rect);
    } else {
      const rect = menuBtnRef.current?.getBoundingClientRect() ?? null;
      setMenuAnchor(rect);
    }
    setMenuOpen(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast({ title: 'Copied to clipboard' });
  };

  const handleDeleteConfirm = async () => {
    try {
      onDelete(message.id);
    } catch (err) {
      console.error('Delete failed', err);
      toast({ 
        title: 'Failed to delete message',
        variant: 'destructive'
      });
    }
  };

  const handleSaveEdit = async () => {
    const trimmedText = editText.trim();
    if (!trimmedText || trimmedText === message.content.trim()) {
      setEditing(false);
      setEditText(message.content);
      return;
    }

    try {
      await onEdit(message.id, trimmedText);
      setEditing(false);
      toast({ title: 'Message updated' });
    } catch (err) {
      console.error('Edit failed', err);
      toast({ 
        title: 'Failed to edit message',
        variant: 'destructive'
      });
      setEditText(message.content);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditText(message.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't interfere with mention autocomplete
    if (showMentions && (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Tab')) {
      return;
    }

    if (e.key === 'Escape') {
      if (showMentions) {
        setShowMentions(false);
      } else {
        handleCancelEdit();
      }
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSaveEdit();
    }
  };

  const handleMentionSelect = (user: any) => {
    if (!editTextareaRef.current) return;

    const el = editTextareaRef.current;
    const pos = el.selectionStart;
    const text = el.value;
    const before = text.slice(0, pos);
    const after = text.slice(pos);
    const atIndex = before.lastIndexOf('@');

    const mentionText = `@${user.username} `;
    const newText = before.slice(0, atIndex) + mentionText + after;
    
    setEditText(newText);
    setShowMentions(false);

    setTimeout(() => {
      const newPos = atIndex + mentionText.length;
      el.setSelectionRange(newPos, newPos);
      el.focus();
    }, 0);
  };

  // Parse message content to make @mentions clickable with right-click DM
  const renderMessageContent = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention with highlighting
      if (match.index > lastIndex) {
        const textBefore = content.substring(lastIndex, match.index);
        parts.push(
          <HighlightedText 
            key={`text-${lastIndex}`} 
            text={textBefore} 
            highlight={searchQuery}
          />
        );
      }

      // Add clickable mention with right-click DM
      const username = match[1];
      parts.push(
        <span
          key={match.index}
          role="button"
          tabIndex={0}
          onClick={async (e) => {
            e.stopPropagation();
            console.log('[MessageItem] Mention clicked:', username);
            // Look up userId from username (case-insensitive)
            const { data } = await supabase
              .from('profiles')
              .select('user_id')
              .ilike('username', username)
              .single();
            
            console.log('[MessageItem] Looked up user_id for', username, ':', data?.user_id);
            
            if (data) {
              console.log('[MessageItem] Calling onMentionClick with userId:', data.user_id);
              onMentionClick(data.user_id);
            }
          }}
          onContextMenu={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Look up userId from username for DM
            const { data } = await supabase
              .from('profiles')
              .select('user_id')
              .ilike('username', username)
              .single();
            
            if (data) {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setDmContextMenu({ userId: data.user_id, rect });
            }
          }}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              // Look up userId from username (case-insensitive)
              const { data } = await supabase
                .from('profiles')
                .select('user_id')
                .ilike('username', username)
                .single();
              
              if (data) {
                onMentionClick(data.user_id);
              }
            }
          }}
          className="inline text-primary hover:bg-primary/15 font-semibold cursor-pointer rounded-[2px] transition-colors duration-200 leading-none align-baseline"
        >
          @{username}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text with highlighting
    if (lastIndex < content.length) {
      const remainingText = content.substring(lastIndex);
      parts.push(
        <HighlightedText 
          key={`text-${lastIndex}`} 
          text={remainingText} 
          highlight={searchQuery}
        />
      );
    }

    return parts.length > 0 ? parts : (
      <HighlightedText text={content} highlight={searchQuery} />
    );
  };

  const handleEmojiSelect = async (emoji: string) => {
    await toggleReaction(emoji);
    setEmojiPickerOpen(false);
  };

  const menuItems = [
    ...(canEdit ? [{
      id: 'edit',
      label: 'Edit',
      onClick: () => setEditing(true),
    }] : []),
    {
      id: 'reply',
      label: 'Reply',
      onClick: () => onReply(message.id),
    },
    {
      id: 'add-reaction',
      label: 'Add Reaction',
      onClick: () => setEmojiPickerOpen(true),
    },
    ...(message.is_pinned ? [{
      id: 'unpin',
      label: 'Unpin Message',
      icon: <PinOff className="h-3 w-3" />,
      onClick: () => onUnpin(message.id),
    }] : [{
      id: 'pin',
      label: 'Pin Message',
      icon: <Pin className="h-3 w-3" />,
      onClick: () => onPin(message.id),
    }]),
    ...(onBookmark ? [{
      id: isBookmarked ? 'unbookmark' : 'bookmark',
      label: isBookmarked ? 'Remove Bookmark' : 'Bookmark',
      icon: <Bookmark className="h-3 w-3" />,
      onClick: () => onBookmark(message.id),
    }] : []),
    {
      id: 'copy',
      label: 'Copy Text',
      onClick: handleCopy,
    },
    {
      id: 'forward',
      label: 'Forward Message',
      onClick: () => setForwardDialogOpen(true),
    },
    ...(canDelete ? [{
      id: 'delete',
      label: 'Delete',
      onClick: () => setDeleteModalOpen(true),
      dangerous: true,
    }] : []),
  ];

  // Helper to generate initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div 
      id={`message-${message.id}`}
      className={cn(
        "relative group/item rounded-[1px] transition-colors duration-200",
        menuOpen
          ? isMentioned || isReplyToMe
            ? "bg-blue-400/10 border-l-2 border-l-blue-500/40"
            : "bg-accent/5 border border-border/30"
          : isMentioned || isReplyToMe
            ? "bg-blue-500/5 border-l-2 border-l-blue-500/40 hover:bg-blue-400/10"
            : "hover:bg-accent/5 border border-transparent hover:border-border/30",
        isFirstInGroup ? "px-3 pt-0 pb-1" : "pl-3 pr-3 py-2"
      )}
      onContextMenu={(e) => {
        e.preventDefault();
        openMenu(e);
      }}
    >
      {/* Reply preview - shown above username if message has parent */}
      {isFirstInGroup && message.parent && (
        <div className="ml-[52px] mb-[-6px]">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors duration-200 hover:text-foreground/90">
            <Avatar className="w-4 h-4">
              <AvatarImage src={message.parent.avatarUrl} alt={message.parent.senderName} />
              <AvatarFallback className="bg-primary/10 text-primary text-[8px]">
                {message.parent.senderName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => onUsernameClick(message.parent!.userId)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setDmContextMenu({ userId: message.parent!.userId, rect });
              }}
              className="font-semibold hover:underline cursor-pointer text-foreground/80"
            >
              {message.parent.senderName}
            </button>
            <span className="line-clamp-1 flex-1 opacity-80">
              {renderMessageContent(message.parent.content)}
            </span>
          </div>
        </div>
      )}

      {/* Connecting line from main avatar to reply preview */}
      {isFirstInGroup && message.parent && (
        <div 
          className="absolute left-[32px] top-[22px] w-[28px] h-[26px] pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute inset-0 border-l-2 border-t-2 border-muted-foreground/20 rounded-tl-md" />
        </div>
      )}

      {/* First message header with avatar */}
      {isFirstInGroup && (
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 mt-3">
            <Avatar
              className="w-10 h-10 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onUsernameClick(userId)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setDmContextMenu({ userId, rect });
              }}
            >
              <AvatarImage src={senderAvatar} alt={senderName} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {getInitials(senderName)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-2.5">
              <button
                onClick={() => onUsernameClick(userId)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  setDmContextMenu({ userId, rect });
                }}
                className="font-semibold text-[15px] hover:underline cursor-pointer text-foreground leading-none py-0"
              >
                {senderName}
              </button>
              <span className="text-[11px] text-muted-foreground font-medium leading-none">
                {formatTimestamp(message.created_at)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Message content */}
      <div className={cn("flex items-center ml-[52px]", isFirstInGroup && "-mt-6")}>
        {!editing ? (
          <div className="group/content flex-1 min-w-0">
            {message.is_forwarded && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground italic mb-1.5 pb-1 border-b border-border/30">
                <Mail className="h-3 w-3" />
                <span>Forwarded</span>
              </div>
            )}
            <div className="text-[15px] leading-[1.375rem] text-foreground break-words whitespace-pre-wrap">
              {renderMessageContent(message.content)}
              {message.is_edited && (
                <span className="text-[10px] text-muted-foreground/60 ml-1 italic">(edited)</span>
              )}
            </div>
            {/* Reactions display */}
            <MessageReactions
              reactions={reactions}
              onReactionClick={toggleReaction}
            />
          </div>
        ) : (
          <div ref={editContainerRef} className="space-y-2 flex-1 relative">
            <Textarea
              ref={editTextareaRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[72px] text-sm resize-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                onClick={handleCancelEdit}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                size="sm"
                disabled={!editText.trim()}
              >
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Esc to cancel • Ctrl+Enter to save • Use @ to mention
            </p>
            
            {/* Mention autocomplete for edit mode */}
            {showMentions && (
              <MentionAutocomplete
                users={users}
                query={mentionQuery}
                onSelect={handleMentionSelect}
                position={mentionPosition}
              />
            )}
          </div>
        )}
      </div>

      {/* Discord-style action bar - compact, top-right corner */}
      {!editing && (
        <div className="absolute -top-[14px] right-3 opacity-0 group-hover/item:opacity-100 transition-all duration-200 ease-out scale-[0.72] origin-top-right flex items-center gap-1 bg-card/98 backdrop-blur-md border border-border/50 rounded-md shadow-lg px-0.5 py-0.5">
          {/* Top 3 emojis for quick reactions */}
          {topEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => toggleReaction(emoji)}
              className="p-1 hover:bg-accent/60 active:scale-90 rounded-md transition-all duration-150 group/btn flex items-center justify-center"
              title={`React with ${emoji}`}
              aria-label={`React with ${emoji}`}
            >
              <span className="text-[14px] leading-none">{emoji}</span>
            </button>
          ))}
          
          {/* Add reaction button with emoji picker */}
          <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <button
                className="p-1 hover:bg-accent/60 active:scale-90 rounded-md transition-all duration-150 group/btn flex items-center justify-center"
                title="Add reaction"
                aria-label="Add reaction"
              >
                <Smile className="h-[14px] w-[14px] text-muted-foreground group-hover/btn:text-foreground transition-colors" strokeWidth={2.5} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0" align="end">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </PopoverContent>
          </Popover>

          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="p-1 hover:bg-accent/60 active:scale-90 rounded-md transition-all duration-150 group/btn flex items-center justify-center"
              title="Edit message"
              aria-label="Edit message"
            >
              <Pencil className="h-[14px] w-[14px] text-muted-foreground group-hover/btn:text-foreground transition-colors" strokeWidth={2.5} />
            </button>
          )}
          <button
            onClick={() => onReply(message.id)}
            className="p-1 hover:bg-accent/60 active:scale-90 rounded-md transition-all duration-150 group/btn flex items-center justify-center"
            title="Reply"
            aria-label="Reply to message"
          >
            <Reply className="h-[14px] w-[14px] text-muted-foreground group-hover/btn:text-foreground transition-colors" strokeWidth={2.5} />
          </button>
          {onBookmark && (
            <button
              onClick={() => onBookmark(message.id)}
              className={cn(
                "p-1 hover:bg-accent/60 active:scale-90 rounded-md transition-all duration-150 group/btn flex items-center justify-center",
                isBookmarked && "text-primary"
              )}
              title={isBookmarked ? "Remove bookmark" : "Bookmark message"}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark message"}
            >
              <Bookmark 
                className={cn(
                  "h-[14px] w-[14px] transition-colors",
                  isBookmarked ? "fill-current text-primary" : "text-muted-foreground group-hover/btn:text-foreground"
                )} 
                strokeWidth={2.5} 
              />
            </button>
          )}
          <button
            ref={menuBtnRef}
            onClick={openMenu}
            className="p-1 hover:bg-accent/60 active:scale-90 rounded-md transition-all duration-150 group/btn flex items-center justify-center"
            title="More options"
            aria-label="More options"
          >
            <MoreHorizontal className="h-[14px] w-[14px] text-muted-foreground group-hover/btn:text-foreground transition-colors" strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Context menu */}
      {menuOpen && menuAnchor && (
        <ContextMenu
          anchorRect={menuAnchor}
          items={menuItems}
          onClose={() => setMenuOpen(false)}
        />
      )}

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        messagePreview={message.content}
        senderName={senderName}
        senderAvatar={senderAvatar}
      />

      {/* DM context menu for mentions */}
      {dmContextMenu && (
        <ContextMenu
          anchorRect={dmContextMenu.rect}
          items={[
            {
              id: 'dm',
              label: 'Send Direct Message',
              icon: 'Mail',
              onClick: () => {
                setSelectedRecipient(dmContextMenu.userId);
              },
            },
          ]}
          onClose={() => setDmContextMenu(null)}
        />
      )}

      {/* Forward message dialog */}
      <ForwardMessageDialog
        open={forwardDialogOpen}
        onOpenChange={setForwardDialogOpen}
        messageContent={message.content}
        messageId={message.id}
      />
    </div>
  );
};
