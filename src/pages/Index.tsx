import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // If user is authenticated, redirect to dashboard
        navigate('/dashboard');
      } else {
        // If user is not authenticated, stay on home page (this component will be replaced by Home.tsx in routing)
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  // This component is now just a redirect component
  // The actual home page is handled by Home.tsx
  if (loading) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return null;
};

export default Index;
