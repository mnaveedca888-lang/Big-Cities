import { apiClient } from '@/api/client';
import type { ApiResponse } from '@/types/api';
import type { AuthSession } from '@/types/auth';

export async function login(payload: { email: string; password: string }) {
  const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/login', payload);
  return response.data;
}

export async function register(payload: { name: string; email: string; password: string }) {
  const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/register', payload);
  return response.data;
}

export async function refreshSession(refreshToken: string) {
  const response = await apiClient.post<ApiResponse<AuthSession>>('/auth/refresh', { refreshToken });
  return response.data.data;
}

export async function logout(refreshToken?: string) {
  const response = await apiClient.post<ApiResponse<null>>('/auth/logout', { refreshToken });
  return response.data;
}

export async function requestPasswordReset(email: string) {
  const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword(payload: { token: string; password: string }) {
  const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/reset-password', payload);
  return response.data;
}

export async function verifyEmail(token: string) {
  const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/verify-email', { token });
  return response.data;
}
