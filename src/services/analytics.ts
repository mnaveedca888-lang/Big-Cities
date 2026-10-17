import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/types/api';
import type { AnalyticsSummary } from '@/types/analytics';

export async function getAnalytics(range = '30d') {
  const response = await apiClient.get<ApiResponse<AnalyticsSummary>>('/analytics', { params: { range } });
  return response.data.data;
}
