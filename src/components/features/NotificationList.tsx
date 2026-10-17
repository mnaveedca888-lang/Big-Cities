import { Card } from '@/components/ui/card';
import type { NotificationItem } from '@/types/api';

interface NotificationListProps {
  notifications: NotificationItem[];
  onRead?: (id: string) => void;
}

export function NotificationList({ notifications, onRead }: NotificationListProps) {
  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card key={notification.id} className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-950 dark:text-white">{notification.title}</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{notification.message}</p>
          </div>
          {!notification.read ? (
            <button onClick={() => onRead?.(notification.id)} className="text-sm font-medium text-cyan-600">Mark read</button>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
