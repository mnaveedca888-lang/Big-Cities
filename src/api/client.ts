import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorShape } from '@/types/errors';
import { apiBaseUrl } from '@/config/runtime';

type RetryConfig = InternalAxiosRequestConfig & { _authRetry?: boolean };

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function clearAuthStorage(storage: Storage) {
  storage.removeItem('auth-session');
  storage.removeItem('auth-user');
  storage.removeItem('access-token');
  storage.removeItem('refresh-token');
}

function clearAllAuthStorage() {
  clearAuthStorage(window.localStorage);
  clearAuthStorage(window.sessionStorage);
}

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('access-token') ?? window.sessionStorage.getItem('access-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; code?: string; details?: unknown }>) => {
    const originalRequest = error.config as RetryConfig | undefined;
    const refreshToken = window.localStorage.getItem('refresh-token') ?? window.sessionStorage.getItem('refresh-token');
    const requestUrl = String(originalRequest?.url ?? '');
    const skipRefresh = requestUrl.includes('/auth/refresh') || requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register') || requestUrl.includes('/auth/logout');
    if (error.response?.status === 401 && originalRequest && !originalRequest._authRetry && refreshToken && !skipRefresh) {
      originalRequest._authRetry = true;
      try {
        const refreshResponse = await axios.post<{ data: { user: unknown; accessToken: string; refreshToken?: string; expiresAt?: number } }>(`${apiBaseUrl}/auth/refresh`, { refreshToken });
        const nextSession = refreshResponse.data.data;
        const storage = window.localStorage.getItem('auth-session')
          ? window.localStorage
          : window.sessionStorage.getItem('auth-session')
          ? window.sessionStorage
          : window.localStorage.getItem('refresh-token')
          ? window.localStorage
          : window.sessionStorage.getItem('refresh-token')
          ? window.sessionStorage
          : window.localStorage;
        storage.setItem('access-token', nextSession.accessToken);
        if (nextSession.refreshToken) storage.setItem('refresh-token', nextSession.refreshToken);
        storage.setItem('auth-session', JSON.stringify(nextSession));
        if (nextSession.user) storage.setItem('auth-user', JSON.stringify(nextSession.user));
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${nextSession.accessToken}`;
        }
        window.dispatchEvent(new CustomEvent('auth:session:update', { detail: nextSession }));
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearAllAuthStorage();
        window.dispatchEvent(new Event('auth:session:clear'));
      }
    } else if (error.response?.status === 401) {
      clearAllAuthStorage();
      window.dispatchEvent(new Event('auth:session:clear'));
    }
    if (import.meta.env.DEV) {
      console.error('API request error', {
        url: requestUrl,
        method: originalRequest?.method,
        status: error.response?.status,
        requestData: originalRequest?.data,
        responseData: error.response?.data,
        message: error.message,
        stack: error.stack,
      });
    }
    const responseData = error.response?.data as any;
    const normalized: ApiErrorShape = {
      status: error.response?.status ?? 0,
      message:
        responseData?.error?.message ?? responseData?.message ?? error.message ?? 'Request failed',
      code: responseData?.error?.code ?? responseData?.code,
      details: responseData?.error?.details ?? responseData?.details,
    };
    return Promise.reject(normalized);
  },
);
