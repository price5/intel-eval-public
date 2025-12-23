import React, { useEffect, useState } from 'react';
import { Hash, Settings, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { channelManager } from '@/lib/realtimeChannelManager';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Badge } from '@/components/ui/badge';
import { BookmarkedMessages } from './BookmarkedMessages';

interface Category {
  id: string;
  name: string;
  display_order: number;
}

interface Channel {
  id: string;
  category_id: string;
  name: string;
  display_order: number;
}

interface ChatSidebarProps {
  selectedChannelId: string | null;
  onChannelSelect: (channelId: string) => void;
  onNavigateToBookmark?: (channelId: string, messageId: string) => void;
  onNavigateToDM?: (userId: string, messageId: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ selectedChannelId, onChannelSelect, onNavigateToBookmark, onNavigateToDM }) => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const { user } = useAuth();
  const { unreadByChannel, markChannelAsRead } = useChat();
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [visibleChannels, setVisibleChannels] = useState<Set<string>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('collapsed-categories');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  const handleChannelSelect = (channelId: string) => {
    markChannelAsRead(channelId);
    onChannelSelect(channelId);
  };

  useEffect(() => {
    fetchCategoriesAndChannels();
  }, []);

  useEffect(() => {
    if (user && channels.length > 0) {
      checkChannelPermissions();
    }
  }, [user, channels]);

  useEffect(() => {
    const metadataChannelName = 'chat-metadata';

    const init = async () => {
      try {
        // Consolidated channel for categories AND channels metadata
        await channelManager.getOrCreateChannel(
          metadataChannelName,
          (ch) => ch
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'chat_categories',
              },
              () => {
                fetchCategoriesAndChannels();
              }
            )
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'chat_channels',
              },
              () => {
                fetchCategoriesAndChannels();
              }
            )
            .subscribe()
        );
      } catch (error) {
        console.error('[ChatSidebar] Error setting up consolidated metadata channel:', error);
      }
    };

    init();

    return () => {
      console.log('[ChatSidebar] Cleaning up metadata channel');
      channelManager.removeChannel(metadataChannelName);
    };
  }, []);

  const fetchCategoriesAndChannels = async () => {
    const { data: categoriesData } = await supabase
      .from('chat_categories')
      .select('*')
      .order('display_order');

    const { data: channelsData } = await supabase
      .from('chat_channels')
      .select('*')
      .order('display_order');

    if (categoriesData) setCategories(categoriesData);
    if (channelsData) {
      setChannels(channelsData);
      // Auto-select first channel if none selected
      if (!selectedChannelId && channelsData.length > 0) {
        onChannelSelect(channelsData[0].id);
      }
    }
  };

  const checkChannelPermissions = async () => {
    if (!user) return;

    const visible = new Set<string>();
    
    for (const channel of channels) {
      const { data, error } = await supabase.rpc('can_view_channel', {
        _user_id: user.id,
        _channel_id: channel.id,
      });
      
      if (!error && data === true) {
        visible.add(channel.id);
      }
    }
    
    setVisibleChannels(visible);
  };

  const getChannelsForCategory = (categoryId: string) => {
    return channels.filter(ch => ch.category_id === categoryId);
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      localStorage.setItem('collapsed-categories', JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const isCategoryOpen = (categoryId: string) => !collapsedCategories.has(categoryId);

  return (
    <div className="bg-muted/50 border-r border-border flex flex-col h-full w-60">
      <div className="p-4 border-b border-border/80 flex items-center justify-between flex-shrink-0">
        <h2 className="text-lg font-semibold tracking-tight">Channels</h2>
        <div className="flex items-center gap-1">
          <BookmarkedMessages 
            onNavigateToMessage={onNavigateToBookmark} 
            onNavigateToDM={onNavigateToDM}
          />
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              title="Admin Panel"
              className="h-8 w-8 hover:bg-accent/80"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-2 space-y-2">
          {categories.map(category => {
            const categoryChannels = getChannelsForCategory(category.id);
            const isOpen = isCategoryOpen(category.id);
            
            return (
              <Collapsible
                key={category.id}
                open={isOpen}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <CollapsibleTrigger className="w-full group/category">
                  <div className="flex items-center gap-1.5 px-2 py-2 rounded-md hover:bg-accent/50 transition-all duration-150">
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover/category:text-foreground transition-colors" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover/category:text-foreground transition-colors" />
                    )}
                    <span className="text-xs font-semibold text-muted-foreground group-hover/category:text-foreground uppercase tracking-wide transition-colors">
                      {category.name}
                    </span>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 mt-1">
                  {categoryChannels
                    .filter(channel => visibleChannels.has(channel.id))
                    .map(channel => {
                      const unreadCount = unreadByChannel[channel.id] || 0;
                      return (
                        <button
                          key={channel.id}
                          onClick={() => handleChannelSelect(channel.id)}
                          className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md transition-all duration-150 group/channel ${
                            selectedChannelId === channel.id 
                              ? 'bg-[hsl(210,20%,20%)] text-[hsl(213,25%,92%)] font-medium shadow-sm border border-[hsl(215,60%,60%)]/20' 
                              : 'text-foreground/80 hover:bg-gradient-to-r hover:from-[hsl(210,18%,16%)] hover:to-[hsl(210,20%,19%)] hover:text-foreground'
                          }`}
                        >
                          <Hash className={`h-4 w-4 flex-shrink-0 transition-transform duration-150 ${
                            selectedChannelId === channel.id ? 'text-primary' : 'text-muted-foreground group-hover/channel:text-foreground group-hover/channel:scale-110'
                          }`} />
                          <span className="text-sm truncate flex-1 text-left">{channel.name}</span>
                          {unreadCount > 0 && (
                            <Badge 
                              variant="default" 
                              className="ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center bg-primary text-primary-foreground text-xs font-semibold rounded-full"
                            >
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
