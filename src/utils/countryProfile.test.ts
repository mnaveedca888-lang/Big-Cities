import { describe, expect, it } from 'vitest';
import { buildCanonicalCountryProfile, PAKISTAN_CANONICAL_COUNTRY_PROFILE_KEYS } from './countryProfile';

describe('countryProfile canonicalization', () => {
  it('matches the Pakistan field template exactly while preserving real country values', () => {
    const profile = buildCanonicalCountryProfile({
      capital: 'Paris',
      population: '40 million',
      currency: 'Euro',
      interestingFacts: ['Paris is the capital of France.'],
      sources: ['UN'],
    });

    expect(Object.keys(profile).sort()).toEqual([...PAKISTAN_CANONICAL_COUNTRY_PROFILE_KEYS].sort());
    expect(profile.capital).toBe('Paris');
    expect(profile.population).toBe('40 million');
    expect(profile.currency).toBe('Euro');
    expect(profile.interestingFacts).toEqual(['Paris is the capital of France.']);
    expect(profile.sources).toEqual(['UN']);
    expect(profile.area).toBeNull();
    expect(profile.drivingSide).toBeNull();
  });

  it('fills any missing Pakistan fields with null or empty arrays without copying Pakistan data', () => {
    const profile = buildCanonicalCountryProfile({ overview: 'A country in Europe.' });

    expect(profile.overview).toBe('A country in Europe.');
    expect(profile.capital).toBeNull();
    expect(profile.interestingFacts).toEqual([]);
    expect(profile.sources).toEqual([]);
  });
});
