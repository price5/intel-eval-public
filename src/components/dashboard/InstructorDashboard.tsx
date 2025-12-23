import React, { useState } from 'react';
import { AssessmentManagement } from './AssessmentManagement';
import { InstructorAssessmentHistory } from './InstructorAssessmentHistory';
import { InstructorClassPerformance } from './InstructorClassPerformance';
import { VerticalNav, NavItem } from '@/components/ui/VerticalNav';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { DirectMessages } from '@/components/chat/DirectMessages';
import { useChat } from '@/contexts/ChatContext';
import { useDirectMessage } from '@/contexts/DirectMessageContext';
import { AccountSettings } from '@/pages/AccountSettings';

interface InstructorDashboardProps {
  profileName: string;
  onSettingsClick: () => void;
  settingsNavTrigger?: number;
}

export const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ profileName, onSettingsClick, settingsNavTrigger }) => {
  const [activePanel, setActivePanel] = useState<NavItem | 'settings'>('assessment');
  const { unreadCount } = useChat();
  const { selectedRecipientId, clearSelectedRecipient, unreadDMCount } = useDirectMessage();

  // Handle DM navigation when recipient is selected
  React.useEffect(() => {
    if (selectedRecipientId) {
      setActivePanel('dm');
    }
  }, [selectedRecipientId]);

  // Clear selected recipient when leaving DM panel
  React.useEffect(() => {
    if (activePanel !== 'dm') {
      clearSelectedRecipient();
    }
  }, [activePanel]);

  // Handle settings navigation from ProfileDropdown
  React.useEffect(() => {
    if (settingsNavTrigger && settingsNavTrigger > 0) {
      setActivePanel('settings');
    }
  }, [settingsNavTrigger]);

  const renderContent = () => {
    switch (activePanel) {
      case 'assessment':
        return <AssessmentManagement />;
      case 'history':
        return <InstructorAssessmentHistory />;
      case 'leaderboard':
        return <InstructorClassPerformance />;
      case 'chat':
        return <ChatContainer />;
      case 'dm':
        return <DirectMessages initialRecipientId={selectedRecipientId || undefined} />;
      case 'settings':
        return <AccountSettings />;
      default:
        return <AssessmentManagement />;
    }
  };

  const isFullHeight = activePanel === 'chat' || activePanel === 'dm' || activePanel === 'settings';

  return (
    <>
      <VerticalNav 
        activeItem={activePanel === 'settings' ? null : activePanel} 
        onItemClick={setActivePanel} 
        role="instructor" 
        chatUnreadCount={unreadCount}
        dmUnreadCount={unreadDMCount}
      />
      <div className={`animate-fade-in ${!isFullHeight ? 'px-8 py-6' : 'h-[calc(100vh-80px)]'}`}>
        <div className={!isFullHeight ? 'max-w-7xl mx-auto' : 'h-full'}>
          {!isFullHeight && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Welcome, {profileName}
              </h1>
              <p className="text-muted-foreground mt-2">
                Create and manage assessments for your students
              </p>
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </>
  );
};