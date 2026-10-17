import { apiClient } from '@/api/client';
import type { ApiResponse, NotificationItem } from '@/types/api';

export async function getNotifications() {
  const response = await apiClient.get<ApiResponse<NotificationItem[]>>('/notifications');
  return response.data;
}
