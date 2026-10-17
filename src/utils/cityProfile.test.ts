import { describe, expect, it } from 'vitest';
import { buildCanonicalCityProfile, PAKISTAN_CANONICAL_CITY_PROFILE_KEYS } from './cityProfile';

describe('cityProfile canonicalization', () => {
  it('matches the Pakistan city template while preserving another city values', () => {
    const profile = buildCanonicalCityProfile({
      name: 'Buenos Aires',
      overview: 'Argentina city profile',
      population: '3 million',
      sources: ['City source'],
    });

    expect(Object.keys(profile).sort()).toEqual([...PAKISTAN_CANONICAL_CITY_PROFILE_KEYS].sort());
    expect(profile.overview).toBe('Argentina city profile');
    expect(profile.population).toBe('3 million');
    expect(profile.sources).toEqual(['City source']);
    expect(profile.history).toBeNull();
    expect(profile.country).toBeNull();
  });

  it('does not copy Pakistan values into missing fields', () => {
    const profile = buildCanonicalCityProfile({ overview: 'A city in Europe.' });

    expect(profile.overview).toBe('A city in Europe.');
    expect(profile.nickname).toBeNull();
    expect(profile.sources).toEqual([]);
  });
});
