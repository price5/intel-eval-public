import React, { useState } from 'react';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { OnlineUsersList } from './OnlineUsersList';
import { ProfileDialog } from './ProfileDialog';
import { BookmarkedMessages } from './BookmarkedMessages';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';

export const ChatContainer: React.FC = () => {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(() => {
    const stored = localStorage.getItem('chat-show-online-users');
    return stored ? JSON.parse(stored) : false;
  });
  const [onlineUsersPanelOpen, setOnlineUsersPanelOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { typingUsers } = useTypingIndicator(selectedChannelId || '', user?.id || '');
  
  const handleShowOnlineUsersChange = (show: boolean) => {
    setShowOnlineUsers(show);
    localStorage.setItem('chat-show-online-users', JSON.stringify(show));
  };

  const handleChannelSelect = (channelId: string) => {
    setSelectedChannelId(channelId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleUserClick = async (userId: string) => {
    console.log('[ChatContainer] handleUserClick called with userId:', userId);
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('[ChatContainer] Fetched profile:', profile);
    
    if (profile) {
      setSelectedProfile(profile as UserProfile);
      setProfileDialogOpen(true);
      if (isMobile) {
        setOnlineUsersPanelOpen(false);
      }
    }
  };

  const handleNavigateToBookmark = (channelId: string, messageId: string) => {
    setSelectedChannelId(channelId);
    setHighlightMessageId(messageId);
    // Close sidebar on mobile after navigation
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleClearHighlight = () => {
    setHighlightMessageId(null);
  };

  const handleNavigateToDMBookmark = (userId: string, messageId: string) => {
    // This would need DirectMessages component integration
    console.log('Navigate to DM:', userId, messageId);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      <ProfileDialog
        profile={selectedProfile}
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
      
      {isMobile ? (
        <>
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 z-10 md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <ChatSidebar
                selectedChannelId={selectedChannelId}
                onChannelSelect={handleChannelSelect}
                onNavigateToBookmark={handleNavigateToBookmark}
                onNavigateToDM={handleNavigateToDMBookmark}
              />
            </SheetContent>
          </Sheet>
          
          <Sheet open={onlineUsersPanelOpen} onOpenChange={setOnlineUsersPanelOpen}>
            <SheetContent side="right" className="p-0 w-72">
              <OnlineUsersList onUserClick={handleUserClick} typingUsers={typingUsers} />
            </SheetContent>
          </Sheet>
          
          {selectedChannelId ? (
            <ChatWindow
              channelId={selectedChannelId}
              showOnlineUsers={showOnlineUsers}
              setShowOnlineUsers={handleShowOnlineUsersChange}
              onOpenOnlineUsersPanel={() => setOnlineUsersPanelOpen(true)}
              onUserClick={handleUserClick}
              isMobile={true}
              highlightMessageId={highlightMessageId}
              onClearHighlight={handleClearHighlight}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground px-4 text-center">
              <p>Tap the menu icon to select a channel</p>
            </div>
          )}
        </>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel
            defaultSize={18}
            minSize={15}
            maxSize={25}
            className="min-w-[200px]"
          >
            <ChatSidebar
              selectedChannelId={selectedChannelId}
              onChannelSelect={handleChannelSelect}
              onNavigateToBookmark={handleNavigateToBookmark}
              onNavigateToDM={handleNavigateToDMBookmark}
            />
          </ResizablePanel>
          
          <ResizableHandle withHandle className="w-1 bg-border/60 hover:bg-border transition-colors" />
          
          <ResizablePanel defaultSize={82} minSize={50} className="flex flex-row">
            {selectedChannelId ? (
              <>
                <div className="flex-1 flex flex-col min-w-0">
                  <ChatWindow
                    channelId={selectedChannelId}
                    showOnlineUsers={showOnlineUsers}
                    setShowOnlineUsers={handleShowOnlineUsersChange}
                    onUserClick={handleUserClick}
                    isMobile={false}
                    highlightMessageId={highlightMessageId}
                    onClearHighlight={handleClearHighlight}
                  />
                </div>
                {showOnlineUsers && (
                  <div className="flex-shrink-0">
                    <OnlineUsersList onUserClick={handleUserClick} typingUsers={typingUsers} />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Select a channel to start chatting</p>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
};
