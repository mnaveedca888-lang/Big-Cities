import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/types/api';
import type { UserProfile } from '@/types';

export async function getProfile() {
  const response = await apiClient.get<ApiResponse<UserProfile>>('/users/me');
  return response.data;
}
