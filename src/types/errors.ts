export interface ApiErrorShape {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
}

export function isApiError(error: unknown): error is ApiErrorShape {
  return typeof error === 'object' && error !== null && 'status' in error && 'message' in error;
}
