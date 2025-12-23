import React, { useState } from 'react';
import { SettingsNav } from '@/components/settings/SettingsNav';
import { MyAccountSection } from '@/components/settings/MyAccountSection';
import { ProfileSettingsSection } from '@/components/settings/ProfileSettingsSection';
import { AchievementsSection } from '@/components/settings/AchievementsSection';
import { StatsSection } from '@/components/settings/StatsSection';
import { PreferencesSection } from '@/components/settings/PreferencesSection';
import { FeedbackSection } from '@/components/settings/FeedbackSection';
import { CommunityFeedbackSection } from '@/components/settings/CommunityFeedbackSection';
import { ModerationBanner } from '@/components/moderation/ModerationBanner';
import { useModerationStatus } from '@/hooks/useModerationStatus';

export type SettingsSection = 'account' | 'profile' | 'achievements' | 'stats' | 'preferences' | 'feedback';

export const AccountSettings: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');
  const { moderationStatus } = useModerationStatus();

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return <MyAccountSection />;
      case 'profile':
        return <ProfileSettingsSection />;
      case 'preferences':
        return <PreferencesSection />;
      case 'achievements':
        return <AchievementsSection />;
      case 'stats':
        return <StatsSection />;
      case 'feedback':
        return (
          <div className="space-y-6">
            <FeedbackSection />
            <CommunityFeedbackSection />
          </div>
        );
      default:
        return <MyAccountSection />;
    }
  };

  return (
    <div className="animate-fade-in px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your account preferences and view your progress
          </p>
        </div>

        {moderationStatus.isModerated && (
          <div className="mb-6">
            <ModerationBanner
              isSuspended={moderationStatus.isSuspended}
              isBanned={moderationStatus.isBanned}
              reason={moderationStatus.reason}
              expiresAt={moderationStatus.expiresAt}
            />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <SettingsNav activeSection={activeSection} onSectionChange={setActiveSection} />
          <div className="flex-1">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
};
