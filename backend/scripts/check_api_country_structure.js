const baseUrl = 'http://localhost:4000';

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

const canonical = [
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

async function main() {
  const countries = ['PK', 'AF', 'AR', 'FR', 'JP'];

  for (const code of countries) {
    const result = await fetchJson(`${baseUrl}/countries/${code}`);
    const data = result && result.data ? result.data : result;
    const profile = data && data.profile && typeof data.profile === 'object' ? data.profile : {};
    const keys = Object.keys(profile);
    const present = canonical.filter((key) => Object.prototype.hasOwnProperty.call(profile, key));
    const missing = canonical.filter((key) => !Object.prototype.hasOwnProperty.call(profile, key));
    const extra = keys.filter((key) => !canonical.includes(key));
    console.log('COUNTRY_API', code, data.name || code, 'present=', present.length, 'missing=', missing.length, 'extra=', extra.length);
    console.log('PROFILE_KEYS_SAMPLE', keys.slice(0, 12));
  }
}

main().catch((error) => {
  console.error('API_CHECK_FAILED');
  console.error(error && error.message ? error.message : error);
  process.exitCode = 1;
});
