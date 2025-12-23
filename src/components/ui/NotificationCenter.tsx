import React, { useState } from 'react';
import { Bell, Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useDirectMessage } from '@/contexts/DirectMessageContext';

export const NotificationCenter: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    isNotificationCenterOpen,
    setIsNotificationCenterOpen 
  } = useNotifications();
  const navigate = useNavigate();
  const { setSelectedRecipient } = useDirectMessage();
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

  const toggleExpanded = (notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    setIsNotificationCenterOpen(false);
    
    // Handle DM notifications specially
    if (notification.type === 'direct_message' && notification.metadata?.sender_id) {
      setSelectedRecipient(notification.metadata.sender_id);
      navigate('/dashboard');
    } else if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    // You can customize icons based on notification type
    return <Bell className="h-4 w-4" />;
  };

  return (
    <DropdownMenu open={isNotificationCenterOpen} onOpenChange={setIsNotificationCenterOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-accent/20 transition-all duration-200"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Badge
                variant="destructive"
                className="h-5 min-w-[20px] flex items-center justify-center px-1.5 py-0 text-[10px] font-bold rounded-full"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </motion.div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <AnimatePresence>
        {isNotificationCenterOpen && (
          <DropdownMenuContent
            align="end"
            className="w-80 p-0 bg-popover/95 backdrop-blur-sm border-border/50 z-50"
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h3 className="font-semibold text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="h-8 text-xs hover:bg-accent/10"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Mark all read
                  </Button>
                )}
              </div>

              <ScrollArea className="h-[400px]">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">
                      No notifications yet
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      We'll notify you when something happens
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {notifications.map((notification) => {
                      const isBatched = (notification as any).batch_count > 1;
                      const batchItems = (notification as any).batch_items || [];
                      const isExpanded = expandedNotifications.has(notification.id);
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={`transition-colors ${
                            !notification.is_read ? 'bg-accent/10' : ''
                          }`}
                        >
                          <div
                            className={`p-4 hover:bg-accent/5 cursor-pointer group ${
                              isBatched && isExpanded ? 'pb-2' : ''
                            }`}
                            onClick={() => {
                              if (!isBatched) {
                                handleNotificationClick(notification);
                              }
                            }}
                          >
                            <div className="flex gap-3">
                              <div
                                className={`mt-1 rounded-full p-2 shrink-0 ${
                                  !notification.is_read
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {getNotificationIcon(notification.type)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-medium text-sm truncate">
                                      {notification.title}
                                    </h4>
                                    {!notification.is_read && (
                                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                    )}
                                    {isBatched && (
                                      <Badge variant="secondary" className="text-xs h-5">
                                        {(notification as any).batch_count}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {notification.message}
                                </p>

                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.created_at), {
                                      addSuffix: true,
                                    })}
                                  </span>

                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isBatched && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleExpanded(notification.id);
                                        }}
                                        className="h-7 px-2 hover:bg-accent/20"
                                      >
                                        {isExpanded ? (
                                          <ChevronUp className="h-3 w-3" />
                                        ) : (
                                          <ChevronDown className="h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                    {!notification.is_read && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markAsRead(notification.id);
                                        }}
                                        className="h-7 px-2 hover:bg-accent/20"
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => handleDelete(e, notification.id)}
                                      className="h-7 px-2 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded batch items */}
                          {isBatched && isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="px-4 pb-3 pt-1 space-y-2"
                            >
                              <div className="pl-11 space-y-2">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Individual items ({(notification as any).batch_count}):
                                </p>
                                {batchItems.slice(-5).reverse().map((item: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="text-xs p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => handleNotificationClick(notification)}
                                  >
                                    <p className="text-muted-foreground">{item.message}</p>
                                    <span className="text-xs text-muted-foreground/70">
                                      {formatDistanceToNow(new Date(item.timestamp), {
                                        addSuffix: true,
                                      })}
                                    </span>
                                  </div>
                                ))}
                                {batchItems.length > 5 && (
                                  <p className="text-xs text-muted-foreground italic">
                                    And {batchItems.length - 5} more...
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
};
