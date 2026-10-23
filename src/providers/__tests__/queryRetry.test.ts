import { describe, expect, it } from 'vitest';
import { shouldRetryQuery } from '../queryRetry';

describe('shouldRetryQuery', () => {
  it('does not retry client, auth, or not-found failures', () => {
    expect(shouldRetryQuery(0, { status: 400, message: 'Bad request' })).toBe(false);
    expect(shouldRetryQuery(0, { status: 401, message: 'Unauthorized' })).toBe(false);
    expect(shouldRetryQuery(0, { status: 404, message: 'Not found' })).toBe(false);
  });

  it('retries status-zero and server failures at most once', () => {
    for (const status of [0, 500, 503, 599]) {
      const error = { status, message: 'Temporary failure' };
      expect(shouldRetryQuery(0, error)).toBe(true);
      expect(shouldRetryQuery(1, error)).toBe(false);
    }
  });
});
