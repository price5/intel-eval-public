import React, { useState, useRef, useEffect } from 'react';
import { X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MentionAutocomplete } from './MentionAutocomplete';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useModerationStatus } from '@/hooks/useModerationStatus';
import { toast } from '@/hooks/use-toast';

interface ReplyingToMessage {
  id: string;
  content: string;
  sender?: {
    full_name: string;
  };
}

interface ChatInputProps {
  channelId: string;
  onSend: (message: string) => void;
  disabled?: boolean;
  replyingTo?: ReplyingToMessage;
  onCancelReply?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  channelId,
  onSend, 
  disabled,
  replyingTo,
  onCancelReply 
}) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { moderationStatus } = useModerationStatus();
  const [message, setMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ bottom: 0, left: 0, width: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [canSend, setCanSend] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { setTyping, clearTyping } = useTypingIndicator(channelId, user?.id || '');

  // Check if user is moderated
  const isModerated = moderationStatus.isSuspended || moderationStatus.isBanned;

  // Fetch users for mentions
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

    fetchUsers();
  }, []);

  // Check send permissions
  useEffect(() => {
    checkSendPermission();
  }, [channelId, user]);

  const checkSendPermission = async () => {
    if (!user || !channelId) {
      setCanSend(false);
      return;
    }

    const { data, error } = await supabase.rpc('can_send_message', {
      _user_id: user.id,
      _channel_id: channelId,
    });

    if (error) {
      console.error('Error checking send permission:', error);
      setCanSend(false);
    } else {
      setCanSend(data === true);
    }
  };

  // Detect @mentions
  useEffect(() => {
    if (!textareaRef.current) return;

    const el = textareaRef.current;
    const pos = el.selectionStart;
    const text = el.value;
    const before = text.slice(0, pos);
    const atIndex = before.lastIndexOf('@');

    if (atIndex >= 0 && (atIndex === 0 || /\s/.test(before[atIndex - 1]))) {
      const query = before.slice(atIndex + 1);
      
      // Check if there's a space after the @ (means mention is complete)
      if (query.includes(' ')) {
        setShowMentions(false);
        return;
      }

      setMentionQuery(query);
      
      // Calculate position for mention popup relative to textarea
      const rect = textareaRef.current?.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (rect && containerRect) {
        setMentionPosition({
          bottom: window.innerHeight - rect.top + 8, // 8px gap above textarea
          left: containerRect.left + 16, // 16px gap from left
          width: containerRect.width - 32, // Full width minus gaps (16px on each side)
        });
      }
      
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }, [message]);

  const handleMentionSelect = (user: any) => {
    if (!textareaRef.current) return;

    const el = textareaRef.current;
    const pos = el.selectionStart;
    const text = el.value;
    const before = text.slice(0, pos);
    const after = text.slice(pos);
    const atIndex = before.lastIndexOf('@');

    const mentionText = `@${user.username} `;
    const newText = before.slice(0, atIndex) + mentionText + after;
    
    setMessage(newText);
    setShowMentions(false);

    // Set cursor position after the mention
    setTimeout(() => {
      const newPos = atIndex + mentionText.length;
      el.setSelectionRange(newPos, newPos);
      el.focus();
    }, 0);
  };

  const handleSubmit = () => {
    if (isModerated) {
      return; // Block moderated users from sending
    }
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      setShowMentions(false);
      // Clear typing indicator
      clearTyping(profile?.username || 'Anonymous', profile?.avatar_url);
      // Cancel reply after sending
      if (onCancelReply) {
        onCancelReply();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't handle Enter if mention autocomplete is open
    if (showMentions && (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Tab')) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }

    if (e.key === 'Escape' && showMentions) {
      setShowMentions(false);
    }
  };

  if (!canSend) {
    return (
      <div className="bg-muted/60 relative">
        <div className="px-4 py-3 flex items-center justify-center gap-2 bg-muted/30">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            You don't have permission to send messages in this channel
          </span>
        </div>
      </div>
    );
  }

  // Show moderation message if user is moderated
  const handleModerationClick = () => {
    toast({
      title: moderationStatus.isBanned ? "Account Banned" : "Account Suspended",
      description: moderationStatus.isBanned 
        ? `Your account has been permanently banned. ${moderationStatus.reason ? `Reason: ${moderationStatus.reason}` : ''}` 
        : `Your account is suspended and you cannot send messages. ${moderationStatus.reason ? `Reason: ${moderationStatus.reason}` : ''}${moderationStatus.expiresAt ? ` This suspension expires on ${new Date(moderationStatus.expiresAt).toLocaleDateString()}.` : ''}`,
      variant: "destructive",
    });
  };

  if (isModerated) {
    return (
      <div className="bg-muted/60 relative">
        <div 
          className="px-4 py-3 flex items-center justify-center gap-2 bg-destructive/10 cursor-pointer hover:bg-destructive/20 transition-colors"
          onClick={handleModerationClick}
          role="button"
          tabIndex={0}
        >
          <Lock className="h-4 w-4 text-destructive" />
          <span className="text-sm text-destructive">
            {moderationStatus.isBanned 
              ? 'Your account has been banned. Click for details.' 
              : 'Your account is suspended. Click for details.'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-muted/60 relative">
      {/* Reply preview */}
      {replyingTo && (
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 bg-muted/30">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">
              Replying to {replyingTo.sender?.full_name || 'Unknown User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {replyingTo.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="px-4 py-3">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            console.log('[ChatInput] Message changed, length:', e.target.value.length);
            // Broadcast typing status
            if (e.target.value.length > 0) {
              console.log('[ChatInput] Calling setTyping');
              setTyping(true, profile?.username || 'Anonymous', profile?.avatar_url);
            } else {
              console.log('[ChatInput] Calling clearTyping');
              clearTyping(profile?.username || 'Anonymous', profile?.avatar_url);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={replyingTo ? "Write a reply... (use @ to mention)" : "Type a message... (use @ to mention)"}
          className="min-h-[48px] max-h-[120px] resize-none w-full"
          disabled={disabled}
        />
      </div>

      {/* Mention autocomplete */}
      {showMentions && (
        <MentionAutocomplete
          users={users}
          query={mentionQuery}
          onSelect={handleMentionSelect}
          position={mentionPosition}
        />
      )}
    </div>
  );
};
