import { describe, expect, it, vi } from 'vitest';
import { isSafePersistentUploadUrl, localImageUrl, localImageWriteMiddleware, normalizeLocalImageUrl } from './local-image';
const installScriptImageWriteGuard = require('../../scripts/local-image-write-guard.cjs') as (client: { $use: (middleware: (params: any, next: (params: any) => Promise<unknown>) => Promise<unknown>) => void }) => void;

describe('local image resolver', () => {
  it('normalizes a verified file from the backend image tree', () => {
    const image = '/images/Logo_design_for_Big_Cities_202608061337_11zon.webp';

    expect(normalizeLocalImageUrl(image)).toBe(image);
    expect(localImageUrl('Pakistan cities images', 'Pakistan.jpg')).toBe('/images/Pakistan%20cities%20images/Pakistan.jpg');
  });

  it('rejects external URLs, traversal, and missing files', () => {
    expect(normalizeLocalImageUrl('https://images.unsplash.com/photo.jpg')).toBeNull();
    expect(normalizeLocalImageUrl('/images/%2e%2e/private.png')).toBeNull();
    expect(normalizeLocalImageUrl('/images/missing/not-downloaded.webp')).toBeNull();
    expect(normalizeLocalImageUrl('/images/pakistan%20cities%20images/Pakistan.jpg')).toBeNull();
  });

  it('accepts safely nested persistent upload keys and rejects traversal', () => {
    const previousDriver = process.env.UPLOAD_STORAGE_DRIVER;
    process.env.UPLOAD_STORAGE_DRIVER = 's3';
    try {
      expect(isSafePersistentUploadUrl('/images/uploads/user-1/uploads/1000-image.png')).toBe(true);
      expect(isSafePersistentUploadUrl('/images/uploads/user-1/%2e%2e/private.png')).toBe(false);
      expect(isSafePersistentUploadUrl('/images/uploads/user-1/image.png?redirect=1')).toBe(false);
    } finally {
      if (previousDriver === undefined) delete process.env.UPLOAD_STORAGE_DRIVER;
      else process.env.UPLOAD_STORAGE_DRIVER = previousDriver;
    }
  });

  it('rejects external or missing image writes before Prisma continues', async () => {
    const next = vi.fn().mockResolvedValue({});

    await expect(localImageWriteMiddleware({
      model: 'Country',
      action: 'update',
      args: { data: { profile: { heroImageUrl: 'https://images.unsplash.com/photo.jpg' } } },
    } as any, next)).rejects.toThrow('existing local /images/ file');

    expect(next).not.toHaveBeenCalled();
  });

  it('checks both branches of upserts', async () => {
    const next = vi.fn().mockResolvedValue({});

    await expect(localImageWriteMiddleware({
      model: 'Country',
      action: 'upsert',
      args: { create: { profile: { flagImageUrl: 'https://flagcdn.com/w80/pk.png' } }, update: {} },
    } as any, next)).rejects.toThrow('existing local /images/ file');

    expect(next).not.toHaveBeenCalled();
  });

  it('allows existing local image paths through Prisma writes', async () => {
    const next = vi.fn().mockResolvedValue({});

    await expect(localImageWriteMiddleware({
      model: 'Event',
      action: 'create',
      args: { data: { image: '/images/Logo_design_for_Big_Cities_202608061337_11zon.webp' } },
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
});