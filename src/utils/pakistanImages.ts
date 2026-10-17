import { apiBaseUrl } from '@/config/runtime';

const baseImagePath = `${apiBaseUrl}/images`;
const encodeImagePath = (...segments: string[]) => segments.map((segment) => encodeURIComponent(segment)).join('/');

export const pakistanCountryImage = `${baseImagePath}/${encodeImagePath('Pakistan cities images', 'Pakistan.jpg')}`;

export const pakistanCityImages: Record<string, string> = {
  'pk-lahore': `${baseImagePath}/${encodeImagePath('Pakistan cities images', 'Lahore.png')}`,
  'pk-karachi': `${baseImagePath}/${encodeImagePath('Pakistan cities images', 'Karachi.png')}`,
  'pk-islamabad': `${baseImagePath}/${encodeImagePath('Pakistan cities images', 'Islamabad.jpg')}`,
  'pk-rawalpindi': `${baseImagePath}/${encodeImagePath('Pakistan cities images', 'Rawalpindi.jpeg')}`,
  'pk-faisalabad': `${baseImagePath}/${encodeImagePath('Pakistan cities images', 'Faisalabad.png')}`,
  'pk-multan': `${baseImagePath}/${encodeImagePath('Pakistan cities images', 'Multan.png')}`,
  'pk-peshawar': `${baseImagePath}/${encodeImagePath('Pakistan cities images', 'Peshawar.png')}`,
  'pk-quetta': `${baseImagePath}/${encodeImagePath('Pakistan cities images', 'Quetta.png')}`,
  'pk-sialkot': `${baseImagePath}/${encodeImagePath('Pakistan cities images', 'Sialkot.png')}`,
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
