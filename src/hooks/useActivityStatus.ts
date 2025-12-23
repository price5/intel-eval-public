import { useEffect, useRef } from 'react';
import type { UserStatus } from '@/contexts/AuthContext';

export const useActivityStatus = (
  currentStatus: UserStatus,
  setUserStatus: (status: UserStatus) => void,
  timeoutMinutes: number = 5
) => {
  const INACTIVITY_TIMEOUT = timeoutMinutes * 60 * 1000;
  const inactivityTimerRef = useRef<NodeJS.Timeout>();
  const wasAwayRef = useRef(false);

  useEffect(() => {
    const handleActivity = () => {
      // Only auto-change if user is in 'online' or 'away' status
      // Don't override 'busy' status
      if (wasAwayRef.current && currentStatus === 'away') {
        setUserStatus('online');
        wasAwayRef.current = false;
      }

      // Reset inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Only start timer if status is 'online'
      if (currentStatus === 'online') {
        inactivityTimerRef.current = setTimeout(() => {
          setUserStatus('away');
          wasAwayRef.current = true;
        }, INACTIVITY_TIMEOUT);
      }
    };

    // Track activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial setup
    handleActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [currentStatus, setUserStatus, INACTIVITY_TIMEOUT]);
};
