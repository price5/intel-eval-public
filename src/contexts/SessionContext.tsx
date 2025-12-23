import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface SessionContextType {
  isSessionLocked: boolean;
  createAssessmentSession: (assessmentId: string) => Promise<boolean>;
  endAssessmentSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [activeAssessments] = useState<Set<string>>(new Set());

  const createAssessmentSession = async (assessmentId: string): Promise<boolean> => {
    // Simple session management - check if assessment is already active
    if (activeAssessments.has(assessmentId)) {
      toast.error('Assessment is already active in another session.');
      setIsSessionLocked(true);
      return false;
    }

    activeAssessments.add(assessmentId);
    return true;
  };

  const endAssessmentSession = async (): Promise<void> => {
    // Clear all active assessments for now
    activeAssessments.clear();
    setIsSessionLocked(false);
  };

  const value: SessionContextType = {
    isSessionLocked,
    createAssessmentSession,
    endAssessmentSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};