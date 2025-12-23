import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNotifications as useNotificationActions } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';

export const TestNotifications = () => {
  const { user } = useAuth();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = useNotifications();
  const { createNotification } = useNotificationActions();

  const handleTestNotification = async () => {
    if (user) {
      await createNotification({
        userId: user.id,
        type: 'system_announcement',
        title: 'Test Notification',
        message: 'This is a test notification created at ' + new Date().toLocaleTimeString(),
        link: '/dashboard',
        metadata: { test: true }
      });
    }
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 w-96 z-50">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center">Loading notifications...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 z-50 max-h-[600px] overflow-hidden">
      <Card className="p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Test Notifications (Real-time)</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {unreadCount} unread
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notifications yet. Create a test notification!
            </p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${
                  notification.is_read ? 'bg-muted/50' : 'bg-accent/10 border-accent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotification(notification.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleTestNotification} className="flex-1">
            Create Test
          </Button>
          <Button onClick={refreshNotifications} variant="outline" size="icon" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="icon" title="Mark all as read">
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
