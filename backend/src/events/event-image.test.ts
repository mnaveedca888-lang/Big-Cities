import { describe, expect, it } from 'vitest';
import { resolveImageUrlForAzerbaijanEvent, resolveImageUrlForTitle } from './event-image';

describe('event image resolver', () => {
  it('resolves exact local event filenames and explicit aliases', () => {
    expect(resolveImageUrlForTitle('Basant')).toBe('/images/Events%20in%20Pakistan/Basant.webp');
    expect(resolveImageUrlForTitle('Pakistan Day')).toBe('/images/Events%20in%20Pakistan/Pakistan%20Day.webp');
    expect(resolveImageUrlForAzerbaijanEvent('Novruz Bayram')).toBe('/images/Azerbaijan%20events%20images/Novruz%20Bayram.jpg');
  });

  it('returns missing instead of selecting a fuzzy near-match', () => {
    expect(resolveImageUrlForTitle('Unrelated Regional Festival')).toBeNull();
    expect(resolveImageUrlForAzerbaijanEvent('Unrelated Azerbaijan Festival')).toBeNull();
  });
});