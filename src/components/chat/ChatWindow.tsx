import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { channelManager } from '@/lib/realtimeChannelManager';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { MessageGroup } from './MessageGroup';
import { ChatInput } from './ChatInput';
import { PinnedMessages } from './PinnedMessages';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useRealtimeConnection } from '@/hooks/useRealtimeConnection';
import { ReconnectionPopup } from './ReconnectionPopup';
import { UserProfile } from '@/hooks/useProfile';
import { Users, ChevronLeft, ChevronRight, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { StatusSelector } from './StatusSelector';
import { TypingIndicator } from './TypingIndicator';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { useAdminRole } from '@/hooks/useAdminRole';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { useMessageBookmarks } from '@/hooks/useMessageBookmarks';

interface Message {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  parent_id?: string | null;
  is_edited?: boolean;
  edited_at?: string | null;
  mentions?: string[];
  is_pinned?: boolean;
  pinned_at?: string | null;
  pinned_by?: string | null;
  is_forwarded?: boolean;
  sender?: {
    full_name: string;
    avatar_url?: string;
  };
  parent?: {
    id: string;
    userId: string;
    senderName: string;
    content: string;
    avatarUrl?: string;
  } | null;
}

interface MessageGroupData {
  userId: string;
  userName: string;
  userAvatar?: string;
  messages: Message[];
}

interface ChatWindowProps {
  channelId: string;
  showOnlineUsers?: boolean;
  setShowOnlineUsers?: (show: boolean) => void;
  onOpenOnlineUsersPanel?: () => void;
  onUserClick?: (userId: string) => void;
  isMobile?: boolean;
  highlightMessageId?: string | null;
  onClearHighlight?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  channelId, 
  showOnlineUsers = false,
  setShowOnlineUsers,
  onOpenOnlineUsersPanel,
  onUserClick,
  isMobile = false,
  highlightMessageId,
  onClearHighlight
}) => {
  const { user, onlineUsersCount } = useAuth();
  const { markAsRead, setIsInChat, markChannelAsRead } = useChat();
  const { isAdmin } = useAdminRole();
  const { toggleBookmark, isBookmarked } = useMessageBookmarks(user?.id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string | null>(null);
  const [replyToMessageId, setReplyToMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const channelName = `chat-messages-${channelId}`;
  const { isReconnecting, justReconnected } = useRealtimeConnection(channelRef.current, channelName);
  const { typingUsers } = useTypingIndicator(channelId, user?.id || '');

  // Load last read timestamp from localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`chat_last_read_${user.id}_${channelId}`);
      setLastReadTimestamp(stored);
    }
  }, [user, channelId]);

  // Mark as in chat and mark messages as read when viewing
  // Mark as in chat when entering channel
  useEffect(() => {
    setIsInChat(true);
    markChannelAsRead(channelId);
    
    return () => {
      setIsInChat(false);
    };
  }, [setIsInChat, channelId, markChannelAsRead]);

  // Update last read timestamp when messages change
  useEffect(() => {
    if (messages.length > 0 && user) {
      const latestTimestamp = messages[messages.length - 1].created_at;
      localStorage.setItem(`chat_last_read_${user.id}_${channelId}`, latestTimestamp);
      setLastReadTimestamp(latestTimestamp);
    }
  }, [messages.length, user, channelId]);

  // Auto-scroll to bottom when new messages arrive or loading completes
  useEffect(() => {
    if (!loading) {
      // Use longer timeout to ensure reactions have fully loaded
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

  // Reset search index when query changes
  useEffect(() => {
    setCurrentSearchIndex(0);
  }, [searchQuery]);

  // Track scroll position to show/hide jump to bottom button
  useEffect(() => {
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
  }, []);

  const fetchMessages = useCallback(async () => {
    // Only show loading state on initial load
    if (!initialLoadComplete) {
      setLoading(true);
    }
    
    try {
      const { data: messagesData, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          channel_id,
          user_id,
          content,
          created_at,
          updated_at,
          parent_id,
          is_edited,
          edited_at,
          mentions,
          is_pinned,
          pinned_at,
          pinned_by,
          is_forwarded
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (messagesData) {
        // Fetch sender profiles with avatars
        const userIds = [...new Set(messagesData.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        // Fetch parent messages for replies
        const parentIds = messagesData
          .filter(m => m.parent_id)
          .map(m => m.parent_id) as string[];
        
        let parentMessagesMap = new Map();
        if (parentIds.length > 0) {
          const { data: parentMessages } = await supabase
            .from('chat_messages')
            .select('id, user_id, content')
            .in('id', parentIds);
          
          if (parentMessages) {
            parentMessagesMap = new Map(
              parentMessages.map(pm => {
                const profile = profilesMap.get(pm.user_id);
                return [
                  pm.id,
                  {
                    id: pm.id,
                    userId: pm.user_id,
                    senderName: profile?.full_name || 'Unknown User',
                    content: pm.content,
                    avatarUrl: profile?.avatar_url,
                  },
                ];
              })
            );
          }
        }
        
        const enrichedMessages = messagesData.map(msg => ({
          ...msg,
          sender: profilesMap.get(msg.user_id),
          parent: msg.parent_id ? parentMessagesMap.get(msg.parent_id) || null : null,
        }));

        setMessages(enrichedMessages);
        
        // Separate pinned messages
        const pinned = enrichedMessages.filter(m => m.is_pinned);
        setPinnedMessages(pinned);
      }
    } catch (error) {
      toast.error('Failed to load messages');
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  }, [channelId, initialLoadComplete]);

  const handleSendMessage = async (content: string) => {
    if (!user) return;

    // Parse @mentions from the content
    const mentionPattern = /@(\w+)/g;
    const mentionedUsernames = [...content.matchAll(mentionPattern)].map(match => match[1]);
    
    // Fetch user IDs for mentioned usernames
    let mentionedUserIds: string[] = [];
    if (mentionedUsernames.length > 0) {
      const { data: mentionedUsers } = await supabase
        .from('profiles')
        .select('user_id')
        .in('username', mentionedUsernames);
      
      if (mentionedUsers) {
        mentionedUserIds = mentionedUsers.map(u => u.user_id);
      }
    }

    // Fetch parent message info if replying
    let parentInfo = null;
    if (replyToMessageId) {
      const { data: parentMsg } = await supabase
        .from('chat_messages')
        .select('id, user_id, content')
        .eq('id', replyToMessageId)
        .single();
      
      if (parentMsg) {
        const { data: parentProfile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', parentMsg.user_id)
          .single();
        
        parentInfo = {
          id: parentMsg.id,
          userId: parentMsg.user_id,
          senderName: parentProfile?.full_name || 'Unknown User',
          content: parentMsg.content,
          avatarUrl: parentProfile?.avatar_url,
        };
      }
    }

    const messageData: any = {
      channel_id: channelId,
      user_id: user.id,
      content,
      mentions: mentionedUserIds,
    };

    // Add parent_id if replying
    if (replyToMessageId) {
      messageData.parent_id = replyToMessageId;
    }

    // Optimistic UI update - add message immediately with temporary ID
    const tempId = `temp-${Date.now()}`;
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .eq('user_id', user.id)
      .single();

    const optimisticMessage: Message = {
      id: tempId,
      channel_id: channelId,
      user_id: user.id,
      content,
      created_at: new Date().toISOString(),
      mentions: mentionedUserIds,
      sender: profile || undefined,
      parent: parentInfo,
      parent_id: replyToMessageId || null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    const { data: insertedMessage, error } = await supabase
      .from('chat_messages')
      .insert(messageData)
      .select()
      .single();

    if (error) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      toast.error('Failed to send message');
      console.error(error);
    } else {
      // Replace temp message with real one
      setMessages((prev) => 
        prev.map(m => m.id === tempId ? { ...optimisticMessage, id: insertedMessage.id } : m)
      );
      // Clear reply state after successful send
      setReplyToMessageId(null);
    }
  };

  const handlePinMessage = async (messageId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('chat_messages')
      .update({
        is_pinned: true,
        pinned_at: new Date().toISOString(),
        pinned_by: user.id,
      })
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to pin message');
      console.error(error);
    } else {
      toast.success('Message pinned');
    }
  };

  const handleUnpinMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        is_pinned: false,
        pinned_at: null,
        pinned_by: null,
      })
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to unpin message');
      console.error(error);
    } else {
      toast.success('Message unpinned');
    }
  };

  const handleNavigateToPinned = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add highlight effect
      element.classList.add('message-highlight');
      setTimeout(() => {
        element.classList.remove('message-highlight');
      }, 3000);
    }
  };

  // Scroll to and highlight message when highlightMessageId changes
  useEffect(() => {
    if (highlightMessageId) {
      // Retry logic to ensure message is in DOM
      const attemptHighlight = (attempts = 0) => {
        const element = document.getElementById(`message-${highlightMessageId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('message-highlight');
          setTimeout(() => {
            element.classList.remove('message-highlight');
            onClearHighlight?.();
          }, 3000);
        } else if (attempts < 10) {
          // Retry up to 10 times with 200ms intervals
          setTimeout(() => attemptHighlight(attempts + 1), 200);
        }
      };
      
      // Start attempting after a small delay
      setTimeout(() => attemptHighlight(), 100);
    }
  }, [highlightMessageId, onClearHighlight]);


  useEffect(() => {
    if (!channelId || !user) return;

    fetchMessages();

    const init = async () => {
      try {
        // Use channel manager to get or create channel
        const channel = await channelManager.getOrCreateChannel(
          channelName,
          (ch) => ch
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `channel_id=eq.${channelId}`,
              },
              async (payload) => {
                try {
                  // Fetch sender profile with avatar
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('user_id, full_name, avatar_url')
                    .eq('user_id', payload.new.user_id)
                    .single();

                  // Fetch parent message if this is a reply
                  let parentInfo = null;
                  if (payload.new.parent_id) {
                    const { data: parentMsg } = await supabase
                      .from('chat_messages')
                      .select('id, user_id, content')
                      .eq('id', payload.new.parent_id)
                      .single();
                    
                    if (parentMsg) {
                      const { data: parentProfile } = await supabase
                        .from('profiles')
                        .select('full_name, avatar_url')
                        .eq('user_id', parentMsg.user_id)
                        .single();
                      
                      parentInfo = {
                        id: parentMsg.id,
                        userId: parentMsg.user_id,
                        senderName: parentProfile?.full_name || 'Unknown User',
                        content: parentMsg.content,
                        avatarUrl: parentProfile?.avatar_url,
                      };
                    }
                  }

                  const newMessage: Message = {
                    id: payload.new.id,
                    channel_id: payload.new.channel_id,
                    user_id: payload.new.user_id,
                    content: payload.new.content,
                    created_at: payload.new.created_at,
                    updated_at: payload.new.updated_at,
                    parent_id: payload.new.parent_id,
                    is_edited: payload.new.is_edited,
                    edited_at: payload.new.edited_at,
                    mentions: payload.new.mentions || [],
                    is_pinned: payload.new.is_pinned,
                    pinned_at: payload.new.pinned_at,
                    pinned_by: payload.new.pinned_by,
                    sender: profile || undefined,
                    parent: parentInfo,
                  };

                  // Use functional update to avoid duplicates (optimistic + realtime)
                  setMessages((prev) => {
                    const exists = prev.some(m => m.id === payload.new.id);
                    if (exists) {
                      console.log('[ChatWindow] Message already exists (realtime), skipping');
                      return prev;
                    }
                    return [...prev, newMessage];
                  });

                  if (newMessage.is_pinned) {
                    setPinnedMessages(prev => {
                      const exists = prev.some(m => m.id === payload.new.id);
                      if (exists) return prev;
                      return [...prev, newMessage];
                    });
                  }
                } catch (error) {
                  console.error('Error handling new message:', error);
                }
              }
            )
            .on(
              'postgres_changes',
              {
                event: 'UPDATE',
                schema: 'public',
                table: 'chat_messages',
                filter: `channel_id=eq.${channelId}`,
              },
              async (payload) => {
                try {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === payload.new.id
                        ? {
                            ...msg,
                            content: payload.new.content,
                            is_edited: payload.new.is_edited,
                            edited_at: payload.new.edited_at,
                            updated_at: payload.new.updated_at,
                            is_pinned: payload.new.is_pinned,
                            pinned_at: payload.new.pinned_at,
                            pinned_by: payload.new.pinned_by,
                          }
                        : msg
                    )
                  );
                  
                  // Update pinned messages
                  if (payload.new.is_pinned) {
                    setPinnedMessages(prev => {
                      const exists = prev.some(m => m.id === payload.new.id);
                      if (!exists) {
                        const updated = prev.find(m => m.id === payload.new.id);
                        return updated ? prev : [...prev, payload.new as Message];
                      }
                      return prev;
                    });
                  } else {
                    setPinnedMessages(prev => prev.filter(m => m.id !== payload.new.id));
                  }
                } catch (error) {
                  console.error('Error handling message update:', error);
                }
              }
            )
            .on(
              'postgres_changes',
              {
                event: 'DELETE',
                schema: 'public',
                table: 'chat_messages',
                filter: `channel_id=eq.${channelId}`,
              },
              (payload) => {
                setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
              }
            )
            .subscribe(async (status, err) => {
              console.log('[ChatWindow] Subscription status:', status);
              if (status === 'SUBSCRIBED') {
                console.log('[ChatWindow] Successfully subscribed to chat messages');
              } else if (status === 'CHANNEL_ERROR') {
                console.error('[ChatWindow] Error subscribing to chat messages:', err);
              } else if (status === 'TIMED_OUT') {
                console.warn('[ChatWindow] Subscription timed out');
              }
            })
        );

        channelRef.current = channel;
      } catch (error) {
        console.error('[ChatWindow] Error setting up channel:', error);
        toast.error('Failed to connect to chat');
      }
    };

    init();

    return () => {
      console.log('[ChatWindow] Component unmounting, cleaning up channel');
      if (channelName) {
        channelManager.removeChannel(channelName);
      }
      channelRef.current = null;
    };
  }, [channelId, user, fetchMessages, channelName]);

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to delete message');
      console.error(error);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ 
        content: newContent,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to edit message');
      console.error(error);
      throw error;
    }
  };

  const handleReplyToMessage = (messageId: string) => {
    setReplyToMessageId(messageId);
    // Optionally scroll to input or focus it
  };

  const handleUsernameClick = async (userId?: string) => {
    console.log('[ChatWindow] handleUsernameClick called with userId:', userId);
    if (onUserClick && userId) {
      onUserClick(userId);
    }
  };

  const handleMentionClick = (usernameOrId: string) => {
    if (onUserClick) {
      onUserClick(usernameOrId);
    }
  };

  // Only show loading state on initial load with no messages
  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

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
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
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

  // Group consecutive messages from same user
  const groupMessages = (messages: Message[]): MessageGroupData[] => {
    const groups: MessageGroupData[] = [];
    
    messages.forEach((msg, index) => {
      const prevMsg = messages[index - 1];
      const shouldGroup = 
        prevMsg && 
        prevMsg.user_id === msg.user_id && 
        new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 5 * 60 * 1000; // 5 minutes

      if (shouldGroup) {
        groups[groups.length - 1].messages.push(msg);
      } else {
        groups.push({
          userId: msg.user_id,
          userName: msg.sender?.full_name || 'Unknown User',
          userAvatar: msg.sender?.avatar_url,
          messages: [msg],
        });
      }
    });

    return groups;
  };

  // Helper to render date separators
  const renderDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateText: string;
    if (date.toDateString() === today.toDateString()) {
      dateText = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateText = 'Yesterday';
    } else {
      dateText = date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    }
    
    return (
      <div className="flex items-center gap-3 my-4 px-4" key={`date-${date.toISOString()}`}>
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-medium text-muted-foreground px-2">
          {dateText}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  };

  // Helper to render NEW message divider
  const renderNewMessageDivider = () => {
    return (
      <div 
        className="flex items-center gap-3 my-2 px-4 animate-in fade-in duration-300" 
        key="new-messages-divider"
      >
        <div className="flex-1 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
        <span className="text-xs font-bold text-red-500 px-2 tracking-wide">
          NEW
        </span>
      </div>
    );
  };

  // Create groups with date separators and NEW divider
  const renderMessageGroupsWithDates = () => {
    const groupsWithDates: React.ReactNode[] = [];
    let lastDate: string | null = null;
    let newDividerAdded = false;
    
    messageGroups.forEach((group) => {
      const messageDate = new Date(group.messages[0].created_at);
      const messageDateString = messageDate.toDateString();
      
      // Add date separator if date changed
      if (messageDateString !== lastDate) {
        groupsWithDates.push(renderDateSeparator(messageDate));
        lastDate = messageDateString;
      }
      
      // Add NEW divider before first unread message group
      if (!newDividerAdded && lastReadTimestamp) {
        const firstMessageTime = new Date(group.messages[0].created_at).getTime();
        const lastReadTime = new Date(lastReadTimestamp).getTime();
        
        if (firstMessageTime > lastReadTime) {
          groupsWithDates.push(renderNewMessageDivider());
          newDividerAdded = true;
        }
      }
      
      // Add message group
      groupsWithDates.push(
        <MessageGroup
          key={`${group.userId}-${group.messages[0].id}`}
          messages={group.messages}
          senderName={group.userName}
          senderAvatar={group.userAvatar}
          userId={group.userId}
          currentUserId={user?.id || ''}
          isOwnGroup={group.userId === user?.id}
          isCurrentUserMentioned={group.messages.some(msg => 
            msg.mentions?.includes(user?.id || '')
          )}
          onDelete={handleDeleteMessage}
          onEdit={handleEditMessage}
          onReply={handleReplyToMessage}
          onPin={handlePinMessage}
          onUnpin={handleUnpinMessage}
          onUsernameClick={() => handleUsernameClick(group.userId)}
          onMentionClick={handleMentionClick}
          searchQuery={searchQuery}
          onBookmark={toggleBookmark}
          isMessageBookmarked={isBookmarked}
        />
      );
    });
    
    return groupsWithDates;
  };

  const messageGroups = groupMessages(filteredMessages);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
        <FallingPattern 
          className="absolute inset-0 z-10" 
          duration={120}
          blurIntensity="0.8em"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-foreground">Loading chat...</h3>
            <p className="text-sm text-muted-foreground">Please wait while we load messages</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
      <ReconnectionPopup
        isReconnecting={isReconnecting}
        justReconnected={justReconnected}
      />
      
      <div className="p-4 border-b border-border flex items-center justify-between gap-2 flex-shrink-0">
        <h3 className="text-lg font-semibold">General Chat</h3>
        <div className="flex items-center gap-2">
          {searchMode ? (
            <>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-32 md:w-48"
                  autoFocus
                />
                {searchResultIds.length > 0 && (
                  <>
                    <span className="text-xs text-muted-foreground whitespace-nowrap px-2">
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
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchMode(true)}
                    className="h-8 w-8"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Search messages</TooltipContent>
              </Tooltip>
              <StatusSelector />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full bg-muted/50 border border-border/50 transition-all duration-300 hover:bg-muted/70">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                <span className="text-xs md:text-sm font-medium tabular-nums transition-all duration-300">
                  {onlineUsersCount}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {onlineUsersCount} {onlineUsersCount === 1 ? 'user' : 'users'} online now
            </TooltipContent>
          </Tooltip>

          {isMobile ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenOnlineUsersPanel}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View online users</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowOnlineUsers?.(!showOnlineUsers)}
                  className="h-8 w-8 transition-all duration-200"
                >
                  {showOnlineUsers ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showOnlineUsers ? 'Hide' : 'Show'} online users</TooltipContent>
            </Tooltip>
          )}
            </>
          )}
        </div>
      </div>
      
      <PinnedMessages
        messages={pinnedMessages}
        onUnpin={handleUnpinMessage}
        onNavigate={handleNavigateToPinned}
        canUnpin={isAdmin}
      />
      
      <ScrollArea ref={scrollAreaRef} className="flex-1 bg-muted/60 overflow-auto">
        <div className="py-2 md:py-4 px-0">
          {searchQuery && (
            <div className="sticky top-0 z-10 bg-accent/50 backdrop-blur-sm px-4 py-2 mx-4 rounded-md mb-2">
              <p className="text-sm text-muted-foreground">
                {filteredMessages.length} {filteredMessages.length === 1 ? 'result' : 'results'} for "{searchQuery}"
              </p>
            </div>
          )}
          {messageGroups.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            renderMessageGroupsWithDates()
          )}
          <div ref={messagesEndRef} />
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

      <TypingIndicator typingUsers={typingUsers} />
      <ChatInput 
        channelId={channelId}
        onSend={handleSendMessage} 
        disabled={!user}
        replyingTo={replyToMessageId ? messages.find(m => m.id === replyToMessageId) : undefined}
        onCancelReply={() => setReplyToMessageId(null)}
      />
    </div>
  );
};
