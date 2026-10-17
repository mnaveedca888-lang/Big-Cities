import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/types/api';
import type { DashboardOverview } from '@/types/dashboard';

export async function getDashboardOverview() {
  const response = await apiClient.get<ApiResponse<DashboardOverview>>('/dashboard/overview');
  return response.data.data;
}
