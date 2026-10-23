import { isApiError } from '@/types/errors';

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 1 || !isApiError(error)) return false;
  return error.status === 0 || (error.status >= 500 && error.status < 600);
}
