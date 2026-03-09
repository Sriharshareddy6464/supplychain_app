import { useStore } from '@/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Check,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from '@/lib/utils';

export function NotificationsPanel() {
  const { currentUser, getNotificationsByUser, markAsRead, markAllAsRead } = useStore();

  const notifications = currentUser ? getNotificationsByUser(currentUser.id) : [];

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications
        </h3>
        {notifications.some((n: any) => !n.isRead) && currentUser && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead(currentUser.id)}
          >
            <Check className="w-4 h-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification: any) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!notification.isRead ? 'bg-blue-50/50' : ''
                  }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDistanceToNow(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
