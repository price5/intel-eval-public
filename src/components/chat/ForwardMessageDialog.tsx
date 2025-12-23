import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Hash, Mail, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Channel {
  id: string;
  name: string;
  category_id: string;
}

interface User {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageContent: string;
  messageId: string;
}

export const ForwardMessageDialog: React.FC<ForwardMessageDialogProps> = ({
  open,
  onOpenChange,
  messageContent,
  messageId,
}) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadChannelsAndUsers();
    }
  }, [open]);

  const loadChannelsAndUsers = async () => {
    try {
      setLoading(true);
      
      // Load channels
      const { data: channelsData, error: channelsError } = await supabase
        .from('chat_channels')
        .select('id, name, category_id')
        .order('name');

      if (channelsError) throw channelsError;
      setChannels(channelsData || []);

      // Load users (excluding current user)
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, username, full_name, avatar_url')
        .neq('user_id', user?.id)
        .order('username');

      if (usersError) throw usersError;
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load channels and users');
    } finally {
      setLoading(false);
    }
  };

  const handleForwardToChannel = async (channelId: string, channelName: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: channelId,
          user_id: user?.id,
          content: messageContent,
          is_forwarded: true,
        });

      if (error) throw error;
      toast.success(`Message forwarded to #${channelName}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error('Failed to forward message');
    }
  };

  const handleForwardToUser = async (recipientId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user?.id,
          recipient_id: recipientId,
          content: messageContent,
          is_forwarded: true,
        });

      if (error) throw error;
      toast.success(`Message forwarded to @${username}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error forwarding message:', error);
      toast.error('Failed to forward message');
    }
  };

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels or users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading...
              </div>
            ) : (
              <div className="space-y-4">
                {/* Channels */}
                {filteredChannels.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">
                      Channels
                    </h3>
                    <div className="space-y-1">
                      {filteredChannels.map((channel) => (
                        <button
                          key={channel.id}
                          onClick={() => handleForwardToChannel(channel.id, channel.name)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <Hash className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{channel.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users */}
                {filteredUsers.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">
                      Direct Messages
                    </h3>
                    <div className="space-y-1">
                      {filteredUsers.map((userItem) => (
                        <button
                          key={userItem.user_id}
                          onClick={() => handleForwardToUser(userItem.user_id, userItem.username)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={userItem.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {userItem.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start">
                            <span className="text-sm font-medium">{userItem.username}</span>
                            <span className="text-xs text-muted-foreground">{userItem.full_name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredChannels.length === 0 && filteredUsers.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    No results found
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
