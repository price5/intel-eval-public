import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { channelManager } from '@/lib/realtimeChannelManager';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, Mail, X, Smile, Reply as ReplyIcon, Search, ChevronUp, ChevronDown, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { ContextMenu } from './ContextMenu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EmojiPicker } from './EmojiPicker';
import { useDMReactions } from '@/hooks/useDMReactions';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { HighlightedText } from './HighlightedText';
import { useDMBookmarks } from '@/hooks/useDMBookmarks';
import { useDirectMessage } from '@/contexts/DirectMessageContext';

interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  is_edited?: boolean;
  edited_at?: string | null;
  is_forwarded?: boolean;
  parent_id?: string | null;
  sender?: {
    full_name: string;
    avatar_url?: string;
    username: string;
  };
  recipient?: {
    full_name: string;
    avatar_url?: string;
    username: string;
  };
  parent?: DirectMessage;
}

interface Conversation {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  username: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

// Message Item Component with Reactions
interface DMMessageItemProps {
  message: DirectMessage;
  isOwn: boolean;
  user: any;
  selectedUser: Conversation | undefined;
  onContextMenu: (e: React.MouseEvent, messageId: string) => void;
  onReply: () => void;
  searchQuery?: string;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

const DMMessageItem: React.FC<DMMessageItemProps> = ({
  message,
  isOwn,
  user,
  selectedUser,
  onContextMenu,
  onReply,
  searchQuery = '',
  onBookmark,
  isBookmarked = false,
}) => {
  const { reactions, topEmojis, toggleReaction } = useDMReactions(message.id);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const senderName = isOwn ? 'You' : selectedUser?.full_name || 'Unknown';
  const avatarUrl = isOwn ? user?.user_metadata?.avatar_url : selectedUser?.avatar_url;

  return (
    <div
      className="group/dmitem relative flex gap-3 px-4 py-1.5 hover:bg-muted/30"
      onContextMenu={(e) => onContextMenu(e, message.id)}
    >
      <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
        <AvatarImage
          src={avatarUrl}
          alt={senderName}
        />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {getInitials(senderName)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        {/* Sender name and timestamp */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">
            {senderName}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {message.is_edited && ' (edited)'}
          </span>
        </div>

        <div className="relative">
          {/* Reply preview */}
          {message.parent && (
            <div className="mb-2 pb-2 pl-3 border-l-2 border-muted-foreground/30 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <ReplyIcon className="h-3 w-3" />
                <span className="font-semibold">
                  {message.parent.sender_id === user?.id ? 'You' : message.parent.sender?.full_name}
                </span>
              </div>
              <p className="truncate opacity-70 mt-0.5">
                <HighlightedText text={message.parent.content} highlight={searchQuery} />
              </p>
            </div>
          )}

          {/* Forwarded indicator */}
          {message.is_forwarded && (
            <div className="flex items-center gap-1 mb-2 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <p className="text-xs italic">Forwarded</p>
            </div>
          )}

          <div className="text-sm text-foreground break-words">
            <HighlightedText text={message.content} highlight={searchQuery} />
          </div>

          {/* Reactions display */}
          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  onClick={() => toggleReaction(reaction.emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                    reaction.hasReacted
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-muted hover:bg-accent/50 border border-border'
                  }`}
                >
                  <span>{reaction.emoji}</span>
                  <span className="font-medium">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Hover action bar */}
          <div className="absolute -top-2.5 right-2 opacity-0 group-hover/dmitem:opacity-100 transition-opacity flex items-center gap-0.5 bg-card/98 backdrop-blur-md border border-border/50 rounded-md shadow-lg px-1 py-0.5">
            {/* Top 3 emojis */}
            {topEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className="p-0.5 hover:bg-accent/60 active:scale-90 rounded transition-all duration-150"
                title={`React with ${emoji}`}
              >
                <span className="text-xs leading-none">{emoji}</span>
              </button>
            ))}
            
            {/* Emoji picker */}
            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-0.5 hover:bg-accent/60 active:scale-90 rounded transition-all duration-150"
                  title="Add reaction"
                >
                  <Smile className="h-3 w-3 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0" align="end">
                <EmojiPicker onEmojiSelect={(emoji) => {
                  toggleReaction(emoji);
                  setEmojiPickerOpen(false);
                }} />
              </PopoverContent>
            </Popover>

            {/* Reply button */}
            <button
              onClick={onReply}
              className="p-0.5 hover:bg-accent/60 active:scale-90 rounded transition-all duration-150"
              title="Reply"
            >
              <ReplyIcon className="h-3 w-3 text-muted-foreground" />
            </button>

            {/* Bookmark button */}
            {onBookmark && (
              <button
                onClick={onBookmark}
                className="p-0.5 hover:bg-accent/60 active:scale-90 rounded transition-all duration-150"
                title={isBookmarked ? "Remove bookmark" : "Bookmark"}
              >
                <Bookmark className={`h-3 w-3 ${isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface DirectMessagesProps {
  initialRecipientId?: string;
}

export const DirectMessages: React.FC<DirectMessagesProps> = ({ initialRecipientId }) => {
  const { user, onlineUsers } = useAuth();
  const { toggleBookmark, isBookmarked } = useDMBookmarks(user?.id);
  const { markDMAsRead } = useDirectMessage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(initialRecipientId || null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ messageId: string; rect: DOMRect } | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<DirectMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const getInitials = (name?: string) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    if (user) {
      loadConversations();
      const cleanup = subscribeToMessages();
      return cleanup;
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation && user) {
      loadMessages(selectedConversation);
      markMessagesAsRead(selectedConversation);
      // Also mark in context for badge
      markDMAsRead(selectedConversation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation, user?.id]);

  // Auto-scroll to bottom when messages load or change
  useEffect(() => {
    if (!loading && messages.length > 0) {
      const scrollToBottom = () => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      };
      
      // Initial scroll
      setTimeout(scrollToBottom, 150);
      // Follow-up scroll to catch any late-loading reactions
      setTimeout(scrollToBottom, 400);
    }
  }, [messages, loading]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data: messages, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch sender and recipient profiles separately
      const userIds = new Set<string>();
      messages?.forEach((msg: any) => {
        userIds.add(msg.sender_id);
        userIds.add(msg.recipient_id);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, username')
        .in('user_id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const conversationsMap = new Map<string, Conversation>();

      messages?.forEach((msg: any) => {
        const otherUserId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
        const otherUser = profileMap.get(otherUserId);

        if (otherUser && !conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            user_id: otherUserId,
            full_name: otherUser.full_name || 'Unknown User',
            avatar_url: otherUser.avatar_url,
            username: otherUser.username || 'unknown',
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: 0,
          });
        }

        if (msg.recipient_id === user.id && !msg.is_read) {
          conversationsMap.get(otherUserId)!.unread_count++;
        }
      });

      setConversations(Array.from(conversationsMap.values()));
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender and recipient profiles
      const userIds = [user.id, otherUserId];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Attach sender/recipient data and parent messages
      const messagesWithProfiles = await Promise.all(
        data?.map(async (msg) => {
          let parentMessage = null;
          if (msg.parent_id) {
            const { data: parentData } = await supabase
              .from('direct_messages')
              .select('*')
              .eq('id', msg.parent_id)
              .single();
            
            if (parentData) {
              parentMessage = {
                ...parentData,
                sender: profileMap.get(parentData.sender_id),
                recipient: profileMap.get(parentData.recipient_id),
              };
            }
          }
          
          return {
            ...msg,
            sender: profileMap.get(msg.sender_id),
            recipient: profileMap.get(msg.recipient_id),
            parent: parentMessage,
          };
        }) || []
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const markMessagesAsRead = async (otherUserId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('sender_id', otherUserId)
        .eq('recipient_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!user) return () => {};

    const channelName = 'direct-messages';
    console.log('[DirectMessages] Setting up channel subscription');

    const init = async () => {
      try {
        await channelManager.getOrCreateChannel(
          channelName,
          (ch) => ch
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages',
                filter: `recipient_id=eq.${user.id}`,
              },
              (payload) => {
                // Check if message already exists (from optimistic update)
                const messageExists = messages.some(m => m.id === payload.new.id);
                if (!messageExists) {
                  loadConversations();
                  if (payload.new.sender_id === selectedConversation) {
                    loadMessages(selectedConversation);
                    markMessagesAsRead(selectedConversation);
                  }
                }
              }
            )
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'direct_messages',
                filter: `sender_id=eq.${user.id}`,
              },
              (payload) => {
                // Check if message already exists (from optimistic update)
                const messageExists = messages.some(m => m.id === payload.new.id);
                if (!messageExists) {
                  loadConversations();
                  if (payload.new.recipient_id === selectedConversation) {
                    loadMessages(selectedConversation);
                  }
                }
              }
            )
            .subscribe((status) => {
              console.log('[DirectMessages] Subscription status:', status);
            })
        );
      } catch (error) {
        console.error('[DirectMessages] Error setting up channel:', error);
      }
    };

    init();

    return () => {
      console.log('[DirectMessages] Cleaning up channel subscription');
      channelManager.removeChannel(channelName);
    };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      if (editingMessage) {
        // Update existing message
        const { error } = await supabase
          .from('direct_messages')
          .update({
            content: newMessage.trim(),
            is_edited: true,
            edited_at: new Date().toISOString(),
          })
          .eq('id', editingMessage);

        if (error) throw error;
        toast.success('Message updated');
        setEditingMessage(null);
        loadMessages(selectedConversation);
      } else {
        // Get user profiles for optimistic update
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar_url')
          .eq('user_id', user.id)
          .single();

        const { data: recipientProfile } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, avatar_url')
          .eq('user_id', selectedConversation)
          .single();

        // Fetch parent message if replying
        let parentMessage = null;
        if (replyingTo?.id) {
          const { data: parent } = await supabase
            .from('direct_messages')
            .select('id, content, sender_id')
            .eq('id', replyingTo.id)
            .single();

          if (parent) {
            const { data: parentSenderProfile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('user_id', parent.sender_id)
              .single();

            parentMessage = {
              id: parent.id,
              content: parent.content,
              sender_id: parent.sender_id,
              sender: parentSenderProfile,
            };
          }
        }

        // Optimistic UI update
        const tempId = `temp-${Date.now()}`;
        const optimisticMessage: DirectMessage = {
          id: tempId,
          sender_id: user.id,
          recipient_id: selectedConversation,
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
          is_read: false,
          sender: senderProfile,
          recipient: recipientProfile,
          parent_id: replyingTo?.id || null,
          parent: parentMessage,
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        // Send new message
        const { data: insertedMessage, error } = await supabase
          .from('direct_messages')
          .insert({
            sender_id: user.id,
            recipient_id: selectedConversation,
            content: newMessage.trim(),
            parent_id: replyingTo?.id || null,
          })
          .select()
          .single();

        if (error) {
          // Remove optimistic message on error
          setMessages((prev) => prev.filter(m => m.id !== tempId));
          throw error;
        }

        // Replace temp message with real one
        setMessages((prev) => 
          prev.map(m => m.id === tempId ? { ...optimisticMessage, id: insertedMessage.id } : m)
        );

        setReplyingTo(null);
        loadConversations();
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessage(messageId);
    setNewMessage(content);
    setContextMenu(null);
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageToDelete);

      if (error) throw error;

      toast.success('Message deleted');
      loadMessages(selectedConversation);
      loadConversations();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    setContextMenu({ messageId, rect: target.getBoundingClientRect() });
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Message copied to clipboard');
  };

  const contextMenuItems = contextMenu ? (() => {
    const message = messages.find(m => m.id === contextMenu.messageId);
    if (!message) return [];

    const isOwn = message.sender_id === user?.id;
    const messageIsBookmarked = isBookmarked(message.id);
    
    return [
      ...(isOwn ? [{
        id: 'edit',
        label: 'Edit',
        onClick: () => handleEditMessage(contextMenu.messageId, message.content),
      }] : []),
      {
        id: 'reply',
        label: 'Reply',
        onClick: () => setReplyingTo(message),
      },
      {
        id: messageIsBookmarked ? 'unbookmark' : 'bookmark',
        label: messageIsBookmarked ? 'Remove Bookmark' : 'Bookmark',
        icon: <Bookmark className="h-3 w-3" />,
        onClick: () => toggleBookmark(message.id),
      },
      {
        id: 'copy',
        label: 'Copy Text',
        onClick: () => handleCopyMessage(message.content),
      },
      ...(isOwn ? [{
        id: 'delete',
        label: 'Delete',
        onClick: () => {
          setMessageToDelete(contextMenu.messageId);
          setDeleteDialogOpen(true);
        },
        dangerous: true,
      }] : []),
    ];
  })() : [];

  const selectedUser = conversations.find(c => c.user_id === selectedConversation);

  // Filter messages based on search query
  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Get all message IDs that match search for navigation
  const searchResultIds = searchQuery.trim()
    ? messages
        .filter(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(msg => msg.id)
    : [];

  // Navigate to specific search result
  const scrollToSearchResult = (index: number) => {
    if (searchResultIds.length === 0) return;
    
    const messageId = searchResultIds[index];
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        messageElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
  };

  const handleNextResult = () => {
    if (searchResultIds.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResultIds.length;
    setCurrentSearchIndex(nextIndex);
    scrollToSearchResult(nextIndex);
  };

  const handlePreviousResult = () => {
    if (searchResultIds.length === 0) return;
    const prevIndex = currentSearchIndex === 0 ? searchResultIds.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    scrollToSearchResult(prevIndex);
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  // Reset search index when query changes
  useEffect(() => {
    setCurrentSearchIndex(0);
  }, [searchQuery]);

  // Track scroll position to show/hide jump to bottom button
  useEffect(() => {
    if (!selectedConversation) return;
    
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      // Show button if scrolled up more than 200px from bottom
      setShowScrollButton(distanceFromBottom > 200);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [selectedConversation]);

  return (
    <div className="flex h-full w-full bg-background border border-border rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-border bg-muted/30 h-full`}>
        <div className="p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold text-foreground">Direct Messages</h2>
        </div>
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-2 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading conversations...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No conversations yet. Right-click on a user to start chatting!
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => setSelectedConversation(conv.user_id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    selectedConversation === conv.user_id
                      ? 'bg-accent/50 text-foreground'
                      : 'hover:bg-accent/30'
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.avatar_url || undefined} alt={conv.full_name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(conv.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {onlineUsers.some(u => u.user_id === conv.user_id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{conv.full_name}</p>
                      {conv.unread_count > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-xs opacity-70 truncate">{conv.last_message}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col h-full relative">
          {/* Header */}
          <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSelectedConversation(null)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedUser?.avatar_url || undefined} alt={selectedUser?.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(selectedUser?.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{selectedUser?.full_name}</p>
              <p className="text-xs text-muted-foreground">@{selectedUser?.username}</p>
            </div>
            {searchMode ? (
              <>
                <div className="flex items-center gap-1">
                  <Input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-32"
                    autoFocus
                  />
                  {searchResultIds.length > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground whitespace-nowrap px-1">
                        {currentSearchIndex + 1}/{searchResultIds.length}
                      </span>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handlePreviousResult}
                          className="h-7 w-7"
                          title="Previous result"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleNextResult}
                          className="h-7 w-7"
                          title="Next result"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchMode(false);
                    setSearchQuery('');
                    setCurrentSearchIndex(0);
                  }}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchMode(true)}
                className="h-8 w-8"
                title="Search messages"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>

          {loading && messages.length === 0 ? (
            <div className="flex-1 relative">
              <FallingPattern 
                className="absolute inset-0 z-10" 
                duration={120}
                blurIntensity="0.8em"
              />
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">Loading messages...</h3>
                  <p className="text-sm text-muted-foreground">Please wait</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 overflow-auto">
                {searchQuery && (
                  <div className="sticky top-0 z-10 bg-accent/50 backdrop-blur-sm px-3 py-2 rounded-md mb-3">
                    <p className="text-sm text-muted-foreground">
                      {filteredMessages.length} {filteredMessages.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                    </p>
                  </div>
                )}
                <div className="space-y-4">
                  {filteredMessages.map((msg) => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        id={`message-${msg.id}`}
                        ref={(el) => {
                          messageRefs.current[msg.id] = el;
                        }}
                      >
                        <DMMessageItem
                          message={msg}
                          isOwn={isOwn}
                          user={user}
                          selectedUser={selectedUser}
                          onContextMenu={handleContextMenu}
                          onReply={() => setReplyingTo(msg)}
                          searchQuery={searchQuery}
                          onBookmark={() => toggleBookmark(msg.id)}
                          isBookmarked={isBookmarked(msg.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Jump to latest message button */}
              {showScrollButton && (
                <Button
                  onClick={scrollToBottom}
                  className="absolute bottom-24 right-6 rounded-full shadow-lg z-10 h-12 w-12 p-0"
                  variant="default"
                  title="Jump to latest message"
                >
                  <ChevronDown className="h-5 w-5" />
                </Button>
              )}

              {/* Input */}
              <div className="p-4 border-t border-border bg-muted/30">
                {editingMessage && (
                  <div className="mb-2 text-xs text-muted-foreground flex items-center justify-between bg-accent/50 p-2 rounded-md">
                    <span>Editing message</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingMessage(null);
                        setNewMessage('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {replyingTo && (
                  <div className="mb-2 text-xs text-muted-foreground flex items-center justify-between bg-accent/50 p-2 rounded-md">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ReplyIcon className="h-3 w-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">
                          Replying to {replyingTo.sender_id === user?.id ? 'yourself' : replyingTo.sender?.full_name}
                        </p>
                        <p className="truncate opacity-70">{replyingTo.content}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">Select a conversation</p>
            <p className="text-sm">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          anchorRect={contextMenu.rect}
          items={contextMenuItems}
          onClose={() => setContextMenu(null)}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMessage}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};