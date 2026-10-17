export const PAKISTAN_CANONICAL_COUNTRY_PROFILE_KEYS = [
  'heroImageUrl',
  'flagImageUrl',
  'shortDescription',
  'overview',
  'geography',
  'economy',
  'government',
  'founded',
  'independence',
  'capital',
  'historicalSignificance',
  'importantHistoricalEvents',
  'highestMountain',
  'lowestPoint',
  'majorRivers',
  'lakes',
  'coastline',
  'nationalParks',
  'climateOverview',
  'hottestRegion',
  'coldestRegion',
  'wettestRegion',
  'seasons',
  'famousFoods',
  'traditionalDress',
  'sports',
  'music',
  'culturalHeritage',
  'unescoWorldHeritageSites',
  'famousLandmarks',
  'museums',
  'religiousPlaces',
  'touristAttractions',
  'airports',
  'railways',
  'metro',
  'motorways',
  'population',
  'gdp',
  'literacyRate',
  'lifeExpectancy',
  'area',
  'currency',
  'callingCode',
  'internetUsers',
  'drivingSide',
  'interestingFacts',
  'sources',
] as const;

export type CanonicalCountryProfile = {
  [K in (typeof PAKISTAN_CANONICAL_COUNTRY_PROFILE_KEYS)[number]]: string | string[] | null;
};

const canonicalCountryProfileDefaults: CanonicalCountryProfile = {
  heroImageUrl: null,
  flagImageUrl: null,
  shortDescription: null,
  overview: null,
  geography: null,
  economy: null,
  government: null,
  founded: null,
  independence: null,
  capital: null,
  historicalSignificance: null,
  importantHistoricalEvents: null,
  highestMountain: null,
  lowestPoint: null,
  majorRivers: null,
  lakes: null,
  coastline: null,
  nationalParks: null,
  climateOverview: null,
  hottestRegion: null,
  coldestRegion: null,
  wettestRegion: null,
  seasons: null,
  famousFoods: null,
  traditionalDress: null,
  sports: null,
  music: null,
  culturalHeritage: null,
  unescoWorldHeritageSites: null,
  famousLandmarks: null,
  museums: null,
  religiousPlaces: null,
  touristAttractions: null,
  airports: null,
  railways: null,
  metro: null,
  motorways: null,
  population: null,
  gdp: null,
  literacyRate: null,
  lifeExpectancy: null,
  area: null,
  currency: null,
  callingCode: null,
  internetUsers: null,
  drivingSide: null,
  interestingFacts: [],
  sources: [],
};

export function buildCanonicalCountryProfile(profile: Record<string, unknown> | null | undefined): CanonicalCountryProfile {
  const source = profile && typeof profile === 'object' ? profile : {};
  const merged: Record<string, unknown> = { ...canonicalCountryProfileDefaults };

  for (const key of PAKISTAN_CANONICAL_COUNTRY_PROFILE_KEYS) {
    const value = source[key];
    if (value === undefined || value === null) {
      merged[key] = canonicalCountryProfileDefaults[key as keyof CanonicalCountryProfile] ?? null;
      continue;
    }

    if (Array.isArray(value)) {
      merged[key] = value.filter((item) => item !== null && item !== undefined && String(item).trim() !== '');
      continue;
    }

    if (typeof value === 'string') {
      merged[key] = value.trim() || null;
      continue;
    }

    merged[key] = value;
  }

  return merged as CanonicalCountryProfile;
}
