import { describe, expect, it, vi } from 'vitest';
import { expireYouComEvents } from './scheduler';

describe('You.com event expiration', () => {
  it('disables only expired enabled You.com events', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const now = new Date('2026-09-09T00:00:00Z');
    await expireYouComEvents({ event: { updateMany } } as any, now);
    expect(updateMany).toHaveBeenCalledWith({
      where: { sourceName: 'You.com free web search', enabled: true, endAt: { lt: now } },
      data: { enabled: false },
    });
  });
});