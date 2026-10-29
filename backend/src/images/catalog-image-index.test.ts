import { describe, expect, it } from 'vitest';
import catalogImageKeys from './catalog-image-keys.json';
import { getCatalogImageFileNames, hasCatalogImage } from './catalog-image-index';

describe('catalog image key index', () => {
  it('contains the migrated catalog object keys without user-upload keys', () => {
    expect(catalogImageKeys).toHaveLength(2797);
    expect(catalogImageKeys.some((key) => key.startsWith('uploads/'))).toBe(false);
    expect(getCatalogImageFileNames('Pakistan cities images')).toContain('Pakistan.jpg');
    expect(getCatalogImageFileNames('uploads')).toEqual([]);
    expect(hasCatalogImage('Pakistan cities images', 'Pakistan.jpg')).toBe(true);
  });

  it('checks a directory and filename as a complete object key', () => {
    expect(hasCatalogImage('Pakistan cities images', 'Lahore.png')).toBe(true);
    expect(hasCatalogImage('Pakistan cities images', 'missing.png')).toBe(false);
  });
});
