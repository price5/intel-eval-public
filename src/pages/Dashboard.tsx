import React, { useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useXPTracking } from '@/hooks/useXPTracking';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { InstructorDashboard } from '@/components/dashboard/InstructorDashboard';
import { ProfileDropdown } from '@/components/ui/ProfileDropdown';
import { NotificationCenter } from '@/components/ui/NotificationCenter';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/contexts/AssessmentContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { useNavigate } from 'react-router-dom';
import { useModerationStatus } from '@/hooks/useModerationStatus';
import { ModerationBanner } from '@/components/moderation/ModerationBanner';
import { TestNotifications } from '@/components/debug/TestNotifications';
import { useSearchParams } from 'react-router-dom';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { useOnboarding } from '@/hooks/useOnboarding';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { isAssessmentActive } = useAssessment();
  const { moderationStatus } = useModerationStatus();
  const navigate = useNavigate();
  const [settingsNavTrigger, setSettingsNavTrigger] = React.useState(0);
  const { shouldShowTour, isLoading: onboardingLoading, completeTour } = useOnboarding();
  
  // Track XP awards with notifications
  useXPTracking();

  // Handle logout redirect
  useEffect(() => {
    if (!profileLoading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, profileLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const handleSettingsClick = () => {
    setSettingsNavTrigger(prev => prev + 1);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ChatProvider>
      <div className="min-h-screen bg-background">
        {/* Onboarding Tour */}
        {shouldShowTour && !onboardingLoading && !isAssessmentActive && (
          <OnboardingTour 
            onComplete={completeTour} 
            role={profile?.role as 'student' | 'instructor'} 
          />
        )}
        
        <header className="fixed top-0 left-20 right-0 z-30 border-b border-border/50 bg-card/95 backdrop-blur-md">
          <div className="px-6 py-4 flex justify-end items-center">
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {profile && !isAssessmentActive && (
                <>
                  <NotificationCenter />
                  <ProfileDropdown 
                    profile={profile} 
                    onSignOut={handleSignOut}
                    onSettingsClick={handleSettingsClick}
                  />
                </>
              )}
              {isAssessmentActive && (
                <div className="text-sm text-destructive-foreground px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20 font-medium">
                  Assessment in Progress
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="ml-20 pt-[73px] min-h-screen">
          {/* Moderation Banner */}
          <ModerationBanner
            isSuspended={moderationStatus.isSuspended}
            isBanned={moderationStatus.isBanned}
            reason={moderationStatus.reason}
            expiresAt={moderationStatus.expiresAt}
          />

          {profile?.role === 'student' ? (
            <StudentDashboard 
              profileName={profile.full_name}
              onSettingsClick={handleSettingsClick}
              settingsNavTrigger={settingsNavTrigger}
            />
          ) : profile?.role === 'instructor' ? (
            <InstructorDashboard 
              profileName={profile.full_name}
              onSettingsClick={handleSettingsClick}
              settingsNavTrigger={settingsNavTrigger}
            />
          ) : (
            <div className="max-w-4xl mx-auto text-center p-8">
              <h2 className="text-2xl font-bold mb-4">Welcome</h2>
              <p className="text-muted-foreground">Please contact your administrator to set up your role.</p>
            </div>
          )}
        </main>
      </div>
    </ChatProvider>
  );
};

export default Dashboard;