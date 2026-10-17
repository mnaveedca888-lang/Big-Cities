require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const gazetteerPath = path.join(process.env.TEMP || process.env.TMP, 'big-cities-audit-geonames', 'cities500.txt');

function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function candidates(name) {
  const original = String(name || '').trim();
  const values = new Set([original]);
  const withoutParenthetical = original.replace(/\s*\([^)]*\)/g, '').trim();
  if (withoutParenthetical) values.add(withoutParenthetical);
  const withoutAirport = withoutParenthetical.replace(/\s+(?:international\s+)?(?:airport|heliport|airfield|aerodrome)(?:\s+.*)?$/i, '').trim();
  if (withoutAirport) values.add(withoutAirport);
  const withoutIsland = withoutParenthetical.replace(/\s+island$/i, '').trim();
  if (withoutIsland) values.add(withoutIsland);
  return [...values].map(normalize).filter(Boolean);
}

async function main() {
  if (!fs.existsSync(gazetteerPath)) throw new Error(`GeoNames extract not found: ${gazetteerPath}`);
  const byCountryName = new Map();
  const lines = fs.readFileSync(gazetteerPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line) continue;
    const fields = line.split('\t');
    const [id, name, asciiName, alternateNames, , , featureClass, featureCode, countryCode] = fields;
    if (featureClass !== 'P' || !countryCode) continue;
    const record = { id, name, asciiName, featureCode, population: fields[14] };
    const aliases = new Set([name, asciiName, ...(alternateNames || '').split(',')].map(normalize).filter(Boolean));
    for (const alias of aliases) {
      const key = `${countryCode}|${alias}`;
      if (!byCountryName.has(key)) byCountryName.set(key, []);
      byCountryName.get(key).push(record);
    }
  }

  const [cities, countries] = await Promise.all([
    prisma.city.findMany({ select: { slug: true, name: true, countryCode: true, profile: true }, orderBy: [{ countryCode: 'asc' }, { name: 'asc' }] }),
    prisma.country.findMany({ select: { code: true, name: true } }),
  ]);
  const countryNames = new Map(countries.map((country) => [country.code, country.name]));
  const rows = cities.map((city) => {
    const lookupCandidates = candidates(city.name);
    const matches = [...new Map(lookupCandidates.flatMap((candidate) => byCountryName.get(`${city.countryCode}|${candidate}`) || []).map((match) => [match.id, match])).values()];
    const directMatches = byCountryName.get(`${city.countryCode}|${normalize(city.name)}`) || [];
    return {
      country: countryNames.get(city.countryCode) || city.countryCode,
      countryCode: city.countryCode,
      name: city.name,
      slug: city.slug,
      profilePopulation: city.profile && typeof city.profile === 'object' && !Array.isArray(city.profile) ? city.profile.population || null : null,
      candidates: lookupCandidates,
      matchKind: directMatches.length ? 'exact-name' : matches.length ? 'normalized-locality-variant' : 'not-in-cities500',
      matches: matches.slice(0, 3),
    };
  });
  const counts = rows.reduce((result, row) => { result[row.matchKind] = (result[row.matchKind] || 0) + 1; return result; }, {});
  const unmatched = rows.filter((row) => row.matchKind === 'not-in-cities500');
  const localityVariants = rows.filter((row) => row.matchKind === 'normalized-locality-variant');
  const airportSlugCount = cities.filter((city) => /airport|heliport|airfield|aerodrome/i.test(city.slug)).length;
  const profilePopulationCount = cities.filter((city) => city.profile && typeof city.profile === 'object' && !Array.isArray(city.profile) && city.profile.population).length;
  const unmatchedByCountry = unmatched.reduce((result, row) => {
    if (!result[row.country]) result[row.country] = [];
    result[row.country].push({ name: row.name, slug: row.slug, population: row.profilePopulation });
    return result;
  }, {});
  const auditResult = {
    source: 'GeoNames cities500 (populated places, country ISO code match)',
    totalCities: cities.length,
    gazetteerRows: lines.length - 1,
    counts,
    airportSlugCount,
    profilePopulationCount,
    unmatchedCount: unmatched.length,
    unmatchedByCountry,
  };
  fs.writeFileSync(path.join(__dirname, 'tmp_city_gazetteer_variants.json'), JSON.stringify(localityVariants, null, 2));
  fs.writeFileSync(path.join(__dirname, 'tmp_city_gazetteer_review.json'), JSON.stringify(auditResult, null, 2));
  console.log(JSON.stringify({
    source: auditResult.source,
    totalCities: auditResult.totalCities,
    gazetteerRows: auditResult.gazetteerRows,
    counts: auditResult.counts,
    airportSlugCount: auditResult.airportSlugCount,
    profilePopulationCount: auditResult.profilePopulationCount,
    unmatchedCount: auditResult.unmatchedCount,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
