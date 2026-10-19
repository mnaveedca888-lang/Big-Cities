import { normalizeImageUrl } from '@/utils/imageValidation';

export const pakistanCountryImage = normalizeImageUrl('/images/Pakistan%20cities%20images/Pakistan.jpg') ?? '';

export const pakistanCityImages: Record<string, string> = {
  'pk-lahore': normalizeImageUrl('/images/Pakistan%20cities%20images/Lahore.png') ?? '',
  'pk-karachi': normalizeImageUrl('/images/Pakistan%20cities%20images/Karachi.png') ?? '',
  'pk-islamabad': normalizeImageUrl('/images/Pakistan%20cities%20images/Islamabad.jpg') ?? '',
  'pk-rawalpindi': normalizeImageUrl('/images/Pakistan%20cities%20images/Rawalpindi.jpeg') ?? '',
  'pk-faisalabad': normalizeImageUrl('/images/Pakistan%20cities%20images/Faisalabad.png') ?? '',
  'pk-multan': normalizeImageUrl('/images/Pakistan%20cities%20images/Multan.png') ?? '',
  'pk-peshawar': normalizeImageUrl('/images/Pakistan%20cities%20images/Peshawar.png') ?? '',
  'pk-quetta': normalizeImageUrl('/images/Pakistan%20cities%20images/Quetta.png') ?? '',
  'pk-sialkot': normalizeImageUrl('/images/Pakistan%20cities%20images/Sialkot.png') ?? '',
};

export function getPakistanCityImage(slug: string): string | null {
  if (!slug) return null;
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug.startsWith('pk-')) return null;
  return pakistanCityImages[normalizedSlug] ?? pakistanCountryImage;
}

export function isPakistanCitySlug(slug: string): boolean {
  return slug.trim().toLowerCase().startsWith('pk-');
}
