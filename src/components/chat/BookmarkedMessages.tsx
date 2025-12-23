import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Bookmark, X, MessageSquare, Mail } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BookmarkedMessage {
  id: string;
  message_id: string;
  created_at: string;
  message?: {
    id: string;
    content: string;
    created_at: string;
    channel_id: string;
    user_id: string;
    sender?: {
      full_name: string;
      avatar_url?: string;
    };
    channel?: {
      name: string;
    };
  };
}

interface BookmarkedDM {
  id: string;
  message_id: string;
  created_at: string;
  message?: {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    recipient_id: string;
    sender?: {
      full_name: string;
      avatar_url?: string;
    };
    recipient?: {
      full_name: string;
      avatar_url?: string;
    };
  };
}

interface BookmarkedMessagesProps {
  onNavigateToMessage?: (channelId: string, messageId: string) => void;
  onNavigateToDM?: (userId: string, messageId: string) => void;
}

export const BookmarkedMessages: React.FC<BookmarkedMessagesProps> = ({
  onNavigateToMessage,
  onNavigateToDM,
}) => {
  const { user } = useAuth();
  const [bookmarkedMessages, setBookmarkedMessages] = useState<BookmarkedMessage[]>([]);
  const [bookmarkedDMs, setBookmarkedDMs] = useState<BookmarkedDM[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user && open) {
      loadBookmarks();
    }
  }, [user, open]);

  const loadBookmarks = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load bookmarked channel messages
      const { data: channelBookmarks, error: channelError } = await supabase
        .from('bookmarked_messages')
        .select('id, message_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (channelError) throw channelError;

      // Fetch message details
      const messageIds = channelBookmarks?.map(b => b.message_id) || [];
      if (messageIds.length > 0) {
        const { data: messagesData } = await supabase
          .from('chat_messages')
          .select('id, content, created_at, channel_id, user_id')
          .in('id', messageIds);

        // Fetch profiles
        const userIds = [...new Set(messagesData?.map(m => m.user_id) || [])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', userIds);

        // Fetch channels
        const channelIds = [...new Set(messagesData?.map(m => m.channel_id) || [])];
        const { data: channels } = await supabase
          .from('chat_channels')
          .select('id, name')
          .in('id', channelIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]));
        const channelMap = new Map(channels?.map(c => [c.id, c]));

        const enrichedMessages = channelBookmarks?.map(bookmark => ({
          ...bookmark,
          message: messagesData?.find(m => m.id === bookmark.message_id)
            ? {
                ...messagesData.find(m => m.id === bookmark.message_id)!,
                sender: profileMap.get(messagesData.find(m => m.id === bookmark.message_id)!.user_id),
                channel: channelMap.get(messagesData.find(m => m.id === bookmark.message_id)!.channel_id),
              }
            : undefined,
        }));

        setBookmarkedMessages(enrichedMessages || []);
      } else {
        setBookmarkedMessages([]);
      }

      // Load bookmarked DMs
      const { data: dmBookmarks, error: dmError } = await supabase
        .from('bookmarked_direct_messages')
        .select('id, message_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dmError) throw dmError;

      // Fetch DM details
      const dmMessageIds = dmBookmarks?.map(b => b.message_id) || [];
      if (dmMessageIds.length > 0) {
        const { data: dmMessagesData } = await supabase
          .from('direct_messages')
          .select('id, content, created_at, sender_id, recipient_id')
          .in('id', dmMessageIds);

        // Fetch profiles for DMs
        const dmUserIds = [...new Set([
          ...(dmMessagesData?.map(m => m.sender_id) || []),
          ...(dmMessagesData?.map(m => m.recipient_id) || [])
        ])];
        const { data: dmProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', dmUserIds);

        const dmProfileMap = new Map(dmProfiles?.map(p => [p.user_id, p]));

        const enrichedDMs = dmBookmarks?.map(bookmark => ({
          ...bookmark,
          message: dmMessagesData?.find(m => m.id === bookmark.message_id)
            ? {
                ...dmMessagesData.find(m => m.id === bookmark.message_id)!,
                sender: dmProfileMap.get(dmMessagesData.find(m => m.id === bookmark.message_id)!.sender_id),
                recipient: dmProfileMap.get(dmMessagesData.find(m => m.id === bookmark.message_id)!.recipient_id),
              }
            : undefined,
        }));

        setBookmarkedDMs(enrichedDMs || []);
      } else {
        setBookmarkedDMs([]);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (bookmarkId: string, isChannelMessage: boolean) => {
    try {
      const table = isChannelMessage ? 'bookmarked_messages' : 'bookmarked_direct_messages';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;

      if (isChannelMessage) {
        setBookmarkedMessages(prev => prev.filter(b => b.id !== bookmarkId));
      } else {
        setBookmarkedDMs(prev => prev.filter(b => b.id !== bookmarkId));
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" title="View bookmarks">
          <Bookmark className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            Bookmarked Messages
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="channels" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Channels ({bookmarkedMessages.length})
            </TabsTrigger>
            <TabsTrigger value="dms" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              DMs ({bookmarkedDMs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="mt-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading bookmarks...
                </div>
              ) : bookmarkedMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bookmark className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No bookmarked messages yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookmarkedMessages.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={bookmark.message?.sender?.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(bookmark.message?.sender?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {bookmark.message?.sender?.full_name}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                #{bookmark.message?.channel?.name}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeBookmark(bookmark.id, true)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {bookmark.message?.content}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatDate(bookmark.message?.created_at || '')}
                            </span>
                            {onNavigateToMessage && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 text-xs"
                                onClick={() => {
                                  if (bookmark.message) {
                                    onNavigateToMessage(bookmark.message.channel_id, bookmark.message.id);
                                    setOpen(false);
                                  }
                                }}
                              >
                                Jump to message →
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="dms" className="mt-4">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading bookmarks...
                </div>
              ) : bookmarkedDMs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bookmark className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No bookmarked DMs yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookmarkedDMs.map((bookmark) => {
                    const otherUser = bookmark.message?.sender_id === user?.id
                      ? bookmark.message?.recipient
                      : bookmark.message?.sender;

                    return (
                      <div
                        key={bookmark.id}
                        className="p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={otherUser?.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(otherUser?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {otherUser?.full_name}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeBookmark(bookmark.id, false)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {bookmark.message?.content}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {formatDate(bookmark.message?.created_at || '')}
                              </span>
                              {onNavigateToDM && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 text-xs"
                                  onClick={() => {
                                    if (bookmark.message) {
                                      const otherUserId = bookmark.message.sender_id === user?.id
                                        ? bookmark.message.recipient_id
                                        : bookmark.message.sender_id;
                                      onNavigateToDM(otherUserId, bookmark.message.id);
                                      setOpen(false);
                                    }
                                  }}
                                >
                                  Jump to message →
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
