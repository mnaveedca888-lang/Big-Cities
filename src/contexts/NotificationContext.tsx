import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { NotificationItem } from '@/types/api';

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: NotificationItem) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const markAsRead = useCallback((id: string) => setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item)), []);
  const markAllAsRead = useCallback(() => setNotifications((current) => current.map((item) => ({ ...item, read: true }))), []);
  const addNotification = useCallback((notification: NotificationItem) => setNotifications((current) => [notification, ...current]), []);
  const value = useMemo(() => ({ notifications, unreadCount: notifications.filter((item) => !item.read).length, markAsRead, markAllAsRead, addNotification }), [notifications, markAsRead, markAllAsRead, addNotification]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
