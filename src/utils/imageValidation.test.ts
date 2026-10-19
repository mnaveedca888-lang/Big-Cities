import { describe, expect, it } from 'vitest';
import { apiBaseUrl } from '@/config/runtime';
import { isDirectImageUrl, normalizeImageUrl } from './imageValidation';

describe('imageValidation', () => {
  it('accepts local backend and built frontend image paths', () => {
    expect(isDirectImageUrl('/images/Pakistan%20cities%20images/Pakistan.jpg')).toBe(true);
    expect(isDirectImageUrl('/assets/Courses-abc123.png')).toBe(true);
    if (import.meta.env.DEV) expect(isDirectImageUrl('/src/assets/Courses.png')).toBe(true);
    expect(normalizeImageUrl('/images/Pakistan%20cities%20images/Pakistan.jpg')).toBe(`${apiBaseUrl}/images/Pakistan%20cities%20images/Pakistan.jpg`);
    expect(normalizeImageUrl('/assets/Courses-abc123.png')).toBe('/assets/Courses-abc123.png');
  });

  it('accepts only configured backend-origin absolute image paths', () => {
    expect(isDirectImageUrl('/images/Logo_design_for_Big_Cities_202608061337_11zon.webp')).toBe(true);
    expect(normalizeImageUrl('/images/Logo_design_for_Big_Cities_202608061337_11zon.webp')).toBe(`${apiBaseUrl}/images/Logo_design_for_Big_Cities_202608061337_11zon.webp`);
    expect(isDirectImageUrl('https://images.unsplash.com/photo-1529156069898-49953e39b3ac.jpg')).toBe(false);
    expect(isDirectImageUrl('https://flagcdn.com/w80/jp.png')).toBe(false);
    expect(isDirectImageUrl('https://upload.wikimedia.org/wikipedia/commons/3/32/Flag_of_Pakistan.svg')).toBe(false);
  });

  it('rejects external origins, dev filesystem paths, and traversal', () => {
    expect(isDirectImageUrl('https://example.com/image')).toBe(false);
    expect(isDirectImageUrl('javascript:alert(1)')).toBe(false);
    expect(isDirectImageUrl('/src/Images/Pakistan images/Pakistan.jpg')).toBe(false);
    expect(isDirectImageUrl('/@fs/C:/Users/LBG/Desktop/React router/src/Images/Pakistan images/Pakistan.jpg')).toBe(false);
    expect(isDirectImageUrl('/images/%2e%2e/private.png')).toBe(false);
  });

  it('normalizes empty values to null', () => {
    expect(normalizeImageUrl('')).toBeNull();
    expect(normalizeImageUrl(null)).toBeNull();
  });
});
