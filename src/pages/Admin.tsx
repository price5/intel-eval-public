import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ArrowLeft, Shield } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/contexts/AuthContext';
import { useModerationStatus } from '@/hooks/useModerationStatus';
import { ModerationBanner } from '@/components/moderation/ModerationBanner';
import { AdminPanel } from '@/components/admin/AdminPanel';

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminRole();
  const { user } = useAuth();
  const { moderationStatus } = useModerationStatus();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Admin Panel
              </h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
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
        
        <div className="mb-6">
          <p className="text-muted-foreground">
            Manage users, channels, and system achievements
          </p>
        </div>

        <AdminPanel />
      </main>
    </div>
  );
};

export default Admin;
