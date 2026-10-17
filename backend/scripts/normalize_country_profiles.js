const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CANONICAL_FIELDS = [
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
];

const DEFAULTS = Object.fromEntries(CANONICAL_FIELDS.map((field) => [field, field === 'interestingFacts' || field === 'sources' ? [] : null]));

const LEGACY_ALIASES = {
  heroImageUrl: ['heroImageUrl', 'heroImage'],
  flagImageUrl: ['flagImageUrl', 'flagImage'],
  shortDescription: ['shortDescription', 'description', 'summary'],
  overview: ['overview', 'about'],
  geography: ['geography', 'terrain', 'location'],
  economy: ['economy', 'economicProfile'],
  government: ['government', 'governance'],
  founded: ['founded', 'established', 'foundedYear'],
  independence: ['independence', 'independenceDate'],
  capital: ['capital', 'capitalCity'],
  historicalSignificance: ['historicalSignificance', 'history'],
  importantHistoricalEvents: ['importantHistoricalEvents', 'historicalEvents', 'majorEvents', 'importantEvents'],
  highestMountain: ['highestMountain', 'highestPeak'],
  lowestPoint: ['lowestPoint', 'lowestElevation'],
  majorRivers: ['majorRivers', 'rivers'],
  lakes: ['lakes', 'lakeNames'],
  coastline: ['coastline', 'coastLine'],
  nationalParks: ['nationalParks', 'parks'],
  climateOverview: ['climateOverview', 'climate'],
  hottestRegion: ['hottestRegion', 'hottestArea'],
  coldestRegion: ['coldestRegion', 'coldestArea'],
  wettestRegion: ['wettestRegion', 'wettestArea'],
  seasons: ['seasons', 'seasonalPatterns'],
  famousFoods: ['famousFoods', 'traditionalFood', 'specialties'],
  traditionalDress: ['traditionalDress', 'traditionalClothing', 'dress'],
  sports: ['sports', 'popularSports'],
  music: ['music', 'traditionalMusic'],
  culturalHeritage: ['culturalHeritage', 'culture', 'heritage'],
  unescoWorldHeritageSites: ['unescoWorldHeritageSites', 'unescoSites', 'worldHeritageSites'],
  famousLandmarks: ['famousLandmarks', 'landmarks'],
  museums: ['museums', 'museum'],
  religiousPlaces: ['religiousPlaces', 'religiousSites'],
  touristAttractions: ['touristAttractions', 'tourism', 'attractions'],
  airports: ['airports', 'airport'],
  railways: ['railways', 'railway'],
  metro: ['metro', 'metroSystem'],
  motorways: ['motorways', 'majorRoads'],
  population: ['population', 'populationSize'],
  gdp: ['gdp', 'grossDomesticProduct'],
  literacyRate: ['literacyRate', 'literacy'],
  lifeExpectancy: ['lifeExpectancy', 'lifeExpectancyRate'],
  area: ['area', 'totalArea', 'areaKm2'],
  currency: ['currency', 'currencyName'],
  callingCode: ['callingCode', 'dialingCode'],
  internetUsers: ['internetUsers', 'internetUsage'],
  drivingSide: ['drivingSide', 'trafficSide'],
  interestingFacts: ['interestingFacts', 'facts', 'surprisingFacts', 'uniqueCustoms'],
  sources: ['sources', 'references'],
};

function normalizeScalar(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeScalar(item))
      .filter((item) => item !== null && item !== undefined && String(item).trim() !== '');
  }
  return value;
}

function toArrayIfNeeded(value) {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined && String(item).trim() !== '');
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  return [value];
}

function pickValue(source, field) {
  const aliases = LEGACY_ALIASES[field] || [field];
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(source, alias)) {
      return source[alias];
    }
  }
  return undefined;
}

function normalizeProfile(rawProfile) {
  const source = rawProfile && typeof rawProfile === 'object' && !Array.isArray(rawProfile) ? rawProfile : {};
  const canonical = { ...DEFAULTS };

  for (const field of CANONICAL_FIELDS) {
    const value = pickValue(source, field);
    if (value === undefined) {
      canonical[field] = DEFAULTS[field];
      continue;
    }

    if (field === 'interestingFacts' || field === 'sources') {
      canonical[field] = toArrayIfNeeded(normalizeScalar(value));
      continue;
    }

    const normalized = normalizeScalar(value);
    if (normalized === null || normalized === undefined) {
      canonical[field] = null;
      continue;
    }

    if (typeof normalized === 'string') {
      canonical[field] = normalized;
      continue;
    }

    if (Array.isArray(normalized)) {
      canonical[field] = normalized.length ? normalized : [];
      continue;
    }

    canonical[field] = normalized;
  }

  return canonical;
}

async function main() {
  const countries = await prisma.country.findMany({
    select: { code: true, name: true, profile: true },
    orderBy: { name: 'asc' },
  });

  let fixed = 0;
  let complete = 0;
  let invalid = 0;

  for (const country of countries) {
    const beforeKeys = country.profile && typeof country.profile === 'object' && !Array.isArray(country.profile)
      ? Object.keys(country.profile)
      : [];

    const normalizedProfile = normalizeProfile(country.profile);
    const afterKeys = Object.keys(normalizedProfile);
    const hasExpectedShape = afterKeys.length === CANONICAL_FIELDS.length && CANONICAL_FIELDS.every((key) => Object.prototype.hasOwnProperty.call(normalizedProfile, key));

    if (!hasExpectedShape) {
      throw new Error(`Unexpected shape generated for ${country.code}: ${afterKeys.length} keys`);
    }

    const existingExtraFields = beforeKeys.filter((key) => !CANONICAL_FIELDS.includes(key));
    const hasMissingFields = CANONICAL_FIELDS.some((key) => !Object.prototype.hasOwnProperty.call(normalizedProfile, key));

    await prisma.country.update({
      where: { code: country.code },
      data: { profile: normalizedProfile },
    });

    if (beforeKeys.length !== CANONICAL_FIELDS.length || existingExtraFields.length > 0 || hasMissingFields) {
      fixed += 1;
    }

    if (beforeKeys.length === CANONICAL_FIELDS.length && existingExtraFields.length === 0 && !hasMissingFields) {
      complete += 1;
    }

    if (beforeKeys.length !== CANONICAL_FIELDS.length || existingExtraFields.length > 0) {
      invalid += 1;
    }
  }

  console.log('COUNTRIES_PROCESSED', countries.length);
  console.log('COUNTRIES_FIXED', fixed);
  console.log('COUNTRIES_ALREADY_COMPLETE', complete);
  console.log('COUNTRIES_WITH_NON_CANONICAL_SHAPE', invalid);
  console.log('CANONICAL_FIELD_COUNT', CANONICAL_FIELDS.length);
}

main()
  .catch((error) => {
    console.error('COUNTRY_PROFILE_FIX_FAILED');
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
