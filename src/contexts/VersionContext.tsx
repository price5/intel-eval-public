import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAssessment } from './AssessmentContext';

interface VersionInfo {
  version: string;
  buildTime: string;
  hash: string;
}

interface VersionContextType {
  currentVersion: string | null;
  latestVersion: string | null;
  updateAvailable: boolean;
  checkForUpdates: () => Promise<void>;
  dismissUpdate: () => void;
  applyUpdate: () => void;
  isUpdateDismissed: boolean;
  isChecking: boolean;
}

const VersionContext = createContext<VersionContextType | undefined>(undefined);

export const useVersion = () => {
  const context = useContext(VersionContext);
  if (!context) {
    throw new Error('useVersion must be used within a VersionProvider');
  }
  return context;
};

interface VersionProviderProps {
  children: React.ReactNode;
}

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DISMISSED_UPDATE_KEY = 'dismissedUpdateHash';
const CURRENT_VERSION_KEY = 'currentVersionHash';

export const VersionProvider: React.FC<VersionProviderProps> = ({ children }) => {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [isUpdateDismissed, setIsUpdateDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const { isAssessmentActive } = useAssessment();

  // Initialize current version on mount
  useEffect(() => {
    const initVersion = async () => {
      try {
        const response = await fetch('/version.json', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const versionInfo: VersionInfo = await response.json();
          const hash = versionInfo.hash;
          setCurrentVersion(hash);
          setLatestVersion(hash);
          
          // Store current version
          localStorage.setItem(CURRENT_VERSION_KEY, hash);
          
          // Check if there's a dismissed update for a different version
          const dismissedHash = localStorage.getItem(DISMISSED_UPDATE_KEY);
          if (dismissedHash && dismissedHash !== hash) {
            // Clear old dismissal if we're on a new version
            localStorage.removeItem(DISMISSED_UPDATE_KEY);
          }
        }
      } catch (error) {
        console.error('Failed to initialize version:', error);
      }
    };

    initVersion();
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (isChecking || !currentVersion) return;
    
    setIsChecking(true);
    try {
      const response = await fetch('/version.json?' + Date.now(), {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const versionInfo: VersionInfo = await response.json();
        const newHash = versionInfo.hash;
        
        setLatestVersion(newHash);

        // Check if version changed
        if (newHash !== currentVersion) {
          const dismissedHash = localStorage.getItem(DISMISSED_UPDATE_KEY);
          
          // Only mark as update available if not dismissed
          if (dismissedHash !== newHash) {
            setIsUpdateDismissed(false);
            
            // If assessment is active, queue the update
            if (isAssessmentActive) {
              setPendingUpdate(true);
            }
          } else {
            setIsUpdateDismissed(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsChecking(false);
    }
  }, [currentVersion, isAssessmentActive, isChecking]);

  // Show pending update when assessment ends
  useEffect(() => {
    if (pendingUpdate && !isAssessmentActive) {
      setPendingUpdate(false);
      setIsUpdateDismissed(false);
    }
  }, [isAssessmentActive, pendingUpdate]);

  // Poll for updates
  useEffect(() => {
    if (!currentVersion) return;

    // Initial check after 10 seconds
    const initialTimeout = setTimeout(() => {
      checkForUpdates();
    }, 10000);

    // Regular polling
    const interval = setInterval(() => {
      checkForUpdates();
    }, POLL_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [currentVersion, checkForUpdates]);

  const dismissUpdate = useCallback(() => {
    if (latestVersion) {
      localStorage.setItem(DISMISSED_UPDATE_KEY, latestVersion);
      setIsUpdateDismissed(true);
    }
  }, [latestVersion]);

  const applyUpdate = useCallback(() => {
    // Clear dismissed state
    localStorage.removeItem(DISMISSED_UPDATE_KEY);
    
    // Hard reload to get new version
    window.location.reload();
  }, []);

  const updateAvailable = !!(
    currentVersion && 
    latestVersion && 
    currentVersion !== latestVersion && 
    !isUpdateDismissed
  );

  const value: VersionContextType = {
    currentVersion,
    latestVersion,
    updateAvailable,
    checkForUpdates,
    dismissUpdate,
    applyUpdate,
    isUpdateDismissed,
    isChecking,
  };

  return (
    <VersionContext.Provider value={value}>
      {children}
    </VersionContext.Provider>
  );
};
