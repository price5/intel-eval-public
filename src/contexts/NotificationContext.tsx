import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { Bell, Trophy, TrendingUp, MessageSquare, AlertCircle, Mail } from 'lucide-react';
import { channelManager } from '@/lib/realtimeChannelManager';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface NotificationSound {
  enabled: boolean;
  volume: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isNotificationCenterOpen: boolean;
  setIsNotificationCenterOpen: (open: boolean) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  soundSettings: NotificationSound;
  updateSoundSettings: (settings: NotificationSound) => void;
  pushNotificationPermission: NotificationPermission;
  requestPushPermission: () => Promise<boolean>;
  isPushEnabled: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [soundSettings, setSoundSettings] = useState<NotificationSound>(() => {
    const saved = localStorage.getItem('notification-sound-settings');
    return saved ? JSON.parse(saved) : { enabled: true, volume: 0.5 };
  });
  const [pushNotificationPermission, setPushNotificationPermission] = useState<NotificationPermission>('default');
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBixx0PLMeS0FJHfH8N2QQAoUXrTp66hVFApGn+Dyv');
  }, []);

  // Update sound settings
  const updateSoundSettings = useCallback((settings: NotificationSound) => {
    setSoundSettings(settings);
    localStorage.setItem('notification-sound-settings', JSON.stringify(settings));
    if (audioRef.current) {
      audioRef.current.volume = settings.volume;
    }
  }, []);

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Register service worker and check push permission
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
          
          // Check current permission
          if ('Notification' in window) {
            setPushNotificationPermission(Notification.permission);
            setIsPushEnabled(Notification.permission === 'granted');
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Request push notification permission
  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      toast.error('Browser does not support notifications');
      return false;
    }

    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker not supported');
      toast.error('Service Worker not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushNotificationPermission(permission);
      
      if (permission === 'granted') {
        setIsPushEnabled(true);
        
        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
          )
        });
        
        console.log('Push subscription:', subscription);
        toast.success('Push notifications enabled');
        return true;
      } else {
        setIsPushEnabled(false);
        toast.error('Push notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
      toast.error('Failed to enable push notifications');
      return false;
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (soundSettings.enabled && audioRef.current) {
      audioRef.current.volume = soundSettings.volume;
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  }, [soundSettings]);

  // Vibrate device (mobile)
  const vibrateDevice = useCallback(() => {
    if ('vibrate' in navigator && soundSettings.enabled) {
      navigator.vibrate(200);
    }
  }, [soundSettings.enabled]);

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement_unlocked':
        return Trophy;
      case 'rank_change':
        return TrendingUp;
      case 'message_mention':
      case 'message_reply':
      case 'direct_message':
        return MessageSquare;
      case 'assessment_graded':
      case 'assessment_deadline':
        return AlertCircle;
      case 'feedback_response':
        return Mail;
      default:
        return Bell;
    }
  };

  // Show toast notification
  const showToastNotification = useCallback((notification: Notification) => {
    // Don't show toast if notification center is open
    if (isNotificationCenterOpen) return;

    // Play sound and vibrate
    playNotificationSound();
    vibrateDevice();

    const Icon = getNotificationIcon(notification.type);

    toast(notification.title, {
      description: notification.message,
      icon: <Icon className="h-4 w-4" />,
      duration: 5000,
      action: notification.link ? {
        label: 'View',
        onClick: () => window.location.href = notification.link!,
      } : undefined,
    });
  }, [isNotificationCenterOpen, playNotificationSound, vibrateDevice]);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  }, [user]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }, [notifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const setupChannel = async () => {
      const channel = await channelManager.getOrCreateChannel(
        'notifications-changes',
        (ch) => ch
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (!mounted) return;
              const newNotification = payload.new as Notification;
              
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);

              // Show toast notification
              showToastNotification(newNotification);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (!mounted) return;
              const updatedNotification = payload.new as Notification;
              
              setNotifications(prev =>
                prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
              );
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (!mounted) return;
              const deletedId = payload.old.id as string;
              
              setNotifications(prev => prev.filter(n => n.id !== deletedId));
            }
          )
          .subscribe()
      );
    };

    setupChannel();

    return () => {
      mounted = false;
      channelManager.removeChannel('notifications-changes');
    };
  }, [user, showToastNotification]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
    soundSettings,
    updateSoundSettings,
    pushNotificationPermission,
    requestPushPermission,
    isPushEnabled,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
