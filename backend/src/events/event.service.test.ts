import { afterEach, describe, expect, it, vi } from 'vitest';
import EventService from './event.service';

describe('event image persistence', () => {
  const previousDriver = process.env.UPLOAD_STORAGE_DRIVER;

  afterEach(() => {
    if (previousDriver === undefined) delete process.env.UPLOAD_STORAGE_DRIVER;
    else process.env.UPLOAD_STORAGE_DRIVER = previousDriver;
  });

  it('retains a private object-storage image reference when reading an event', async () => {
    process.env.UPLOAD_STORAGE_DRIVER = 's3';
    const image = '/images/uploads/admin-user/unique-image.png';
    const event = { slug: 'test-event', image };
    const prisma = { event: { findUnique: vi.fn().mockResolvedValue(event) } };
    const service = new EventService(prisma as any);

    await expect(service.getBySlug('test-event')).resolves.toMatchObject({ image });
  });

  it('persists the safe object-storage path on event updates', async () => {
    process.env.UPLOAD_STORAGE_DRIVER = 's3';
    const image = '/images/uploads/admin-user/unique-image.png';
    const update = vi.fn().mockResolvedValue({ slug: 'test-event', image });
    const service = new EventService({ event: { update } } as any);

    await service.updateBySlug('test-event', { image });

    expect(update).toHaveBeenCalledWith({ where: { slug: 'test-event' }, data: { image } });
  });

  it('does not accept an object-storage path unless the R2 driver is active', async () => {
    delete process.env.UPLOAD_STORAGE_DRIVER;
    const image = '/images/uploads/admin-user/unique-image.png';
    const update = vi.fn().mockResolvedValue({ slug: 'test-event', image: null });
    const service = new EventService({ event: { update } } as any);

    await service.updateBySlug('test-event', { image });

    expect(update).toHaveBeenCalledWith({ where: { slug: 'test-event' }, data: { image: null } });
  });
});
