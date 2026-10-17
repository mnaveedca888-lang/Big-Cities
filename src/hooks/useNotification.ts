import { useNotifications } from '@/contexts/NotificationContext';

export function useNotification() {
  return useNotifications();
}
