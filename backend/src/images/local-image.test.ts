import { describe, expect, it, vi } from 'vitest';
import { localImageUrl, localImageWriteMiddleware, normalizeLocalImageUrl } from './local-image';
const installScriptImageWriteGuard = require('../../scripts/local-image-write-guard.cjs') as (client: { $use: (middleware: (params: any, next: (params: any) => Promise<unknown>) => Promise<unknown>) => void }) => void;

describe('local image resolver', () => {
  it('normalizes safe R2 object keys without requiring local files', () => {
    const image = '/images/Logo_design_for_Big_Cities_202608061337_11zon.webp';

    expect(normalizeLocalImageUrl(image)).toBe(image);
    expect(normalizeLocalImageUrl('/images/missing/not-downloaded.webp')).toBe('/images/missing/not-downloaded.webp');
    expect(localImageUrl('Pakistan cities images', 'Pakistan.jpg')).toBe('/images/Pakistan%20cities%20images/Pakistan.jpg');
  });

  it('rejects external URLs, traversal, and unsupported extensions', () => {
    expect(normalizeLocalImageUrl('https://images.unsplash.com/photo.jpg')).toBeNull();
    expect(normalizeLocalImageUrl('/images/%2e%2e/private.png')).toBeNull();
    expect(normalizeLocalImageUrl('/images/folder%2Fprivate.png')).toBeNull();
    expect(normalizeLocalImageUrl('/images/readme.txt')).toBeNull();
  });

  it('rejects external or missing image writes before Prisma continues', async () => {
    const next = vi.fn().mockResolvedValue({});

    await expect(localImageWriteMiddleware({
      model: 'Country',
      action: 'update',
      args: { data: { profile: { heroImageUrl: 'https://images.unsplash.com/photo.jpg' } } },
    } as any, next)).rejects.toThrow('safe /images/ object key');

    expect(next).not.toHaveBeenCalled();
  });

  it('checks both branches of upserts', async () => {
    const next = vi.fn().mockResolvedValue({});

    await expect(localImageWriteMiddleware({
      model: 'Country',
      action: 'upsert',
      args: { create: { profile: { flagImageUrl: 'https://flagcdn.com/w80/pk.png' } }, update: {} },
    } as any, next)).rejects.toThrow('safe /images/ object key');

    expect(next).not.toHaveBeenCalled();
  });

  it('allows valid object keys through Prisma writes when the source is not local', async () => {
    const next = vi.fn().mockResolvedValue({});

    await expect(localImageWriteMiddleware({
      model: 'Event',
      action: 'create',
      args: { data: { image: '/images/not-on-disk/event.webp' } },
    } as any, next)).resolves.toEqual({});

    expect(next).toHaveBeenCalledOnce();
  });

  it('prevents operator seed scripts from persisting external image URLs', async () => {
    let middleware: ((params: any, next: (params: any) => Promise<unknown>) => Promise<unknown>) | undefined;
    installScriptImageWriteGuard({ $use: (installed) => { middleware = installed; } });
    const params = { model: 'Event', action: 'create', args: { data: { image: 'https://images.unsplash.com/photo.jpg' } } };
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await middleware?.(params, async () => true);

    expect(params.args.data.image).toBeNull();
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });

  it('preserves valid R2 image references in operator seed scripts without local files', async () => {
    let middleware: ((params: any, next: (params: any) => Promise<unknown>) => Promise<unknown>) | undefined;
    installScriptImageWriteGuard({ $use: (installed) => { middleware = installed; } });
    const image = '/images/catalog/seed-image.webp';
    const params = { model: 'Event', action: 'create', args: { data: { image } } };

    await middleware?.(params, async () => true);

    expect(params.args.data.image).toBe(image);
  });
});