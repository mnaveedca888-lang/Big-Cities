export const PAKISTAN_CANONICAL_CITY_PROFILE_KEYS = [
  'airport',
  'area',
  'arts',
  'busNetwork',
  'climate',
  'coordinates',
  'country',
  'culturalEvents',
  'elevation',
  'famousLandmarks',
  'famousPeople',
  'festivals',
  'finance',
  'flagImageUrl',
  'founded',
  'heroImageUrl',
  'historicalSignificance',
  'history',
  'interestingFacts',
  'majorIndustries',
  'majorRoads',
  'manufacturing',
  'metro',
  'moviesFilmedHere',
  'museums',
  'music',
  'nickname',
  'overview',
  'parks',
  'popularRestaurants',
  'population',
  'postalCode',
  'railway',
  'rivers',
  'shortDescription',
  'sources',
  'sports',
  'stadiums',
  'streetFood',
  'surprisingFacts',
  'technology',
  'thumbnail',
  'timeZone',
  'tourism',
  'traditionalFood',
  'tvShows',
  'unescoSites',
  'uniqueCustoms',
  'uniqueTransportation',
  'worldRecords',
] as const;

type CityProfile = {
  [K in (typeof PAKISTAN_CANONICAL_CITY_PROFILE_KEYS)[number]]: string | string[] | null;
};

const cityProfileDefaults: CityProfile = Object.fromEntries(
  PAKISTAN_CANONICAL_CITY_PROFILE_KEYS.map((key) => [key, key === 'sources' ? [] : null]),
) as CityProfile;

export function buildCanonicalCityProfile(profile: Record<string, unknown> | null | undefined): CityProfile {
  const source = profile && typeof profile === 'object' && !Array.isArray(profile) ? profile : {};
  const canonical: Record<string, unknown> = { ...cityProfileDefaults };

  for (const key of PAKISTAN_CANONICAL_CITY_PROFILE_KEYS) {
    const value = source[key];
    if (value === undefined || value === null) {
      canonical[key] = cityProfileDefaults[key];
    } else if (Array.isArray(value)) {
      canonical[key] = value.filter((item) => item !== null && item !== undefined && String(item).trim() !== '');
    } else if (typeof value === 'string') {
      canonical[key] = value.trim() || null;
    } else {
      canonical[key] = value;
    }
  }

  return canonical as CityProfile;
}
