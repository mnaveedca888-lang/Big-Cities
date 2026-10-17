import { describe, expect, it } from 'vitest';
import { apiBaseUrl } from '@/config/runtime';
import { isDirectImageUrl, normalizeImageUrl } from './imageValidation';

describe('imageValidation', () => {
  it('accepts direct image URLs from trusted image hosts', () => {
    expect(isDirectImageUrl('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80')).toBe(true);
    expect(isDirectImageUrl('https://pixabay.com/photos/example-1234.jpg')).toBe(true);
    expect(isDirectImageUrl('https://flagcdn.com/w80/jp.png')).toBe(true);
    expect(normalizeImageUrl('https://flagcdn.com/w80/jp.png')).toBe('https://flagcdn.com/w80/jp.png');
  });

  it('accepts Vite local asset paths', () => {
    expect(isDirectImageUrl('/src/Images/Pakistan images/Pakistan.jpg')).toBe(true);
    expect(isDirectImageUrl('/src/Images/Pakistan images/Lahore.jpg')).toBe(true);
    expect(isDirectImageUrl('/@fs/C:/Users/LBG/Desktop/React router/src/Images/Pakistan images/Pakistan.jpg')).toBe(true);
  });

  it('accepts backend-origin image paths under /images/', () => {
    expect(isDirectImageUrl('/images/Logo_design_for_Big_Cities_202608061337_11zon.webp')).toBe(true);
    expect(normalizeImageUrl('/images/Logo_design_for_Big_Cities_202608061337_11zon.webp')).toBe(`${apiBaseUrl}/images/Logo_design_for_Big_Cities_202608061337_11zon.webp`);
  });

  it('accepts backend API absolute image URLs', () => {
    const imageUrl = `${apiBaseUrl}/images/Logo_design_for_Big_Cities_202608061337_11zon.webp`;
    expect(isDirectImageUrl(imageUrl)).toBe(true);
    expect(normalizeImageUrl(imageUrl)).toBe(imageUrl);
  });

  it('rejects non-image or unsafe URLs', () => {
    expect(isDirectImageUrl('https://example.com/image')).toBe(false);
    expect(isDirectImageUrl('javascript:alert(1)')).toBe(false);
    expect(isDirectImageUrl('https://upload.wikimedia.org/wikipedia/commons/3/32/Flag_of_Pakistan.svg')).toBe(true);
  });

  it('normalizes empty values to null', () => {
    expect(normalizeImageUrl('')).toBeNull();
    expect(normalizeImageUrl(null)).toBeNull();
  });
});
