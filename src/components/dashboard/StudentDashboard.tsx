import React, { useState } from 'react';
import { PracticeTab } from './PracticeTab';
import { AssessmentTab } from './AssessmentTab';
import { StudentAssessmentHistory } from './StudentAssessmentHistory';
import { WeeklyLeaderboardTab } from './WeeklyLeaderboardTab';
import { VerticalNav, NavItem } from '@/components/ui/VerticalNav';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useChat } from '@/contexts/ChatContext';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { AccountSettings } from '@/pages/AccountSettings';
import { DirectMessages } from '@/components/chat/DirectMessages';
import { useDirectMessage } from '@/contexts/DirectMessageContext';

interface StudentDashboardProps {
  profileName: string;
  onSettingsClick: () => void;
  settingsNavTrigger?: number;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ profileName, onSettingsClick, settingsNavTrigger }) => {
  const [activePanel, setActivePanel] = useState<NavItem | 'settings'>('practice');
  const { confirmNavigation, isAssessmentActive } = useAssessment();
  const { unreadCount } = useChat();
  const { selectedRecipientId, clearSelectedRecipient, unreadDMCount } = useDirectMessage();

  // Handle settings navigation from ProfileDropdown
  React.useEffect(() => {
    if (settingsNavTrigger && settingsNavTrigger > 0) {
      setActivePanel('settings');
    }
  }, [settingsNavTrigger]);

  // Handle DM navigation when a recipient is selected
  React.useEffect(() => {
    if (selectedRecipientId) {
      setActivePanel('dm');
    }
  }, [selectedRecipientId]);

  const handlePanelChange = async (newPanel: NavItem | 'settings') => {
    // If assessment is active and user tries to switch panels
    if (isAssessmentActive && newPanel !== activePanel) {
      const canNavigate = await confirmNavigation();
      if (canNavigate) {
        setActivePanel(newPanel);
      }
    } else {
      setActivePanel(newPanel);
    }
  };

  const renderContent = () => {
    switch (activePanel) {
      case 'practice':
        return <PracticeTab />;
      case 'assessment':
        return <AssessmentTab />;
      case 'history':
        return <StudentAssessmentHistory />;
      case 'leaderboard':
        return <WeeklyLeaderboardTab />;
      case 'chat':
        return <ChatContainer />;
      case 'dm':
        return <DirectMessages initialRecipientId={selectedRecipientId || undefined} />;
      case 'settings':
        return <AccountSettings />;
      default:
        return <PracticeTab />;
    }
  };

  const showGreeting = activePanel === 'practice' || activePanel === 'assessment';
  const isFullHeight = activePanel === 'chat' || activePanel === 'dm' || activePanel === 'settings';

  return (
    <>
      <VerticalNav 
        activeItem={activePanel === 'settings' ? null : activePanel} 
        onItemClick={handlePanelChange} 
        role="student" 
        chatUnreadCount={unreadCount}
        dmUnreadCount={unreadDMCount}
      />
      <div className={`animate-fade-in ${!isFullHeight ? 'px-8 py-6 max-w-screen-2xl mx-auto' : 'h-[calc(100vh-73px)] w-full'}`}>
        <div className={!isFullHeight ? 'max-w-7xl mx-auto' : 'h-full w-full'}>
          {showGreeting && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Welcome, {profileName}
              </h1>
              <p className="text-muted-foreground mt-2">
                Ready to practice and test your coding skills?
              </p>
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </>
  );
};