import { apiClient } from '@/api/client';
import { apiBaseUrl } from '@/config/runtime';

export type ImageReplacementTarget = {
  entity: 'country' | 'city' | 'event' | 'user';
  entityId: string;
  field: 'heroImageUrl' | 'flagImageUrl' | 'image' | 'avatarUrl';
  previousUrl?: string | null;
  replacementUrl: string;
};

export type ImageReplacementVerification = {
  verified: boolean;
  canDeletePrevious: boolean;
  reason: string | null;
};

export async function verifyReplacementImageDisplays(imageUrl: string) {
  const image = new Image();
  const response = await apiClient.get<Blob>(imageUrl, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data);
  try {
    image.src = objectUrl;
    await image.decode();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function verifyImageReplacement(target: ImageReplacementTarget) {
  const response = await apiClient.post<{ success: boolean; data: ImageReplacementVerification }>(
    '/uploads/replacements/verify',
    target,
  );
  const verification = response.data.data;
  if (!verification?.verified) throw new Error('The saved image replacement could not be verified.');
  await verifyReplacementImageDisplays(target.replacementUrl);
  return verification;
}

export async function deletePreviousImage(target: ImageReplacementTarget) {
  const response = await apiClient.post<{ success: boolean; data: { deleted: boolean; alreadyDeleted: boolean } }>(
    '/uploads/replacements/delete',
    target,
  );
  return response.data.data;
}

export function getImageUrlForDisplay(imageUrl: string) {
  return new URL(imageUrl, apiBaseUrl || window.location.origin).toString();
}
