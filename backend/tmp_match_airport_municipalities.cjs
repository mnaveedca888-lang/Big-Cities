require('dotenv').config();
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auditDirectory = path.join(process.env.TEMP || process.env.TMP, 'big-cities-audit-geonames');

function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function slugify(value) {
  return normalize(value).replace(/ /g, '-');
}

function localityTokens(value) {
  return new Set(normalize(value).split(' ').filter((token) => token && !['airport', 'international', 'regional', 'national', 'municipal', 'airfield', 'heliport', 'aerodrome'].includes(token)));
}

function airportMatchForCity(city, airportsByCountry) {
  const suffix = city.slug.replace(/^[a-z]{2}-/i, '');
  const candidates = airportsByCountry.get(city.countryCode) || [];
  const exact = candidates.filter((airport) => slugify(airport.name) === suffix);
  if (exact.length) return { kind: 'exact', matches: exact };
  const targetTokens = localityTokens(suffix.replace(/-/g, ' '));
  if (!targetTokens.size) return { kind: 'unmatched', matches: [] };
  const scored = candidates.map((airport) => {
    const airportTokens = localityTokens(airport.name);
    const overlap = [...targetTokens].filter((token) => airportTokens.has(token)).length;
    const score = overlap / Math.max(targetTokens.size, airportTokens.size);
    return { airport, score, overlap };
  }).filter((entry) => entry.overlap > 0).sort((left, right) => right.score - left.score || right.overlap - left.overlap);
  const best = scored[0];
  const next = scored[1];
  if (best && best.score >= 0.72 && (!next || best.score - next.score >= 0.15)) return { kind: 'fuzzy', matches: [best.airport] };
  return { kind: 'unmatched', matches: [] };
}

async function main() {
  const airportWorkbook = xlsx.readFile(path.join(auditDirectory, 'airports.csv'));
  const airportRows = xlsx.utils.sheet_to_json(airportWorkbook.Sheets[airportWorkbook.SheetNames[0]], { defval: '' });
  const placeLines = fs.readFileSync(path.join(auditDirectory, 'cities500.txt'), 'utf8').split(/\r?\n/);
  const placeAliases = new Set();
  for (const line of placeLines) {
    if (!line) continue;
    const fields = line.split('\t');
    if (fields[6] !== 'P' || !fields[8]) continue;
    for (const alias of [fields[1], fields[2], ...(fields[3] || '').split(',')]) {
      placeAliases.add(`${fields[8]}|${normalize(alias)}`);
    }
  }
  const cities = await prisma.city.findMany({ select: { slug: true, name: true, countryCode: true } });
  const airportsByCountry = new Map();
  for (const airport of airportRows) {
    if (!airport.iso_country || !airport.name) continue;
    if (!airportsByCountry.has(airport.iso_country)) airportsByCountry.set(airport.iso_country, []);
    airportsByCountry.get(airport.iso_country).push(airport);
  }
  const cityRecords = [];
  const unmatchedAirportRecords = [];
  for (const city of cities) {
    if (!/airport|heliport|airfield|aerodrome/i.test(city.slug)) continue;
    const match = airportMatchForCity(city, airportsByCountry);
    const matches = match.matches;
    if (!matches.length) {
      unmatchedAirportRecords.push({ countryCode: city.countryCode, name: city.name, slug: city.slug });
      continue;
    }
    for (const airport of matches) {
      const municipality = String(airport.municipality || '').trim();
      const municipalityIsPopulatedPlace = municipality && placeAliases.has(`${airport.iso_country}|${normalize(municipality)}`);
      const existingCities = municipality ? cities.filter((candidate) => candidate.countryCode === airport.iso_country && normalize(candidate.name) === normalize(municipality)) : [];
      cityRecords.push({
        countryCode: airport.iso_country,
        matchKind: match.kind,
        country: airport.iso_country,
        recordName: city.name,
        slug: city.slug,
        airportName: airport.name,
        airportType: airport.type,
        airportCode: airport.iata_code || airport.ident,
        municipality: municipality || null,
        municipalityIsPopulatedPlace: Boolean(municipalityIsPopulatedPlace),
        existingMunicipalityRecords: existingCities.map((candidate) => ({ name: candidate.name, slug: candidate.slug })),
      });
    }
  }
  const result = {
    airportSource: 'OurAirports public airports.csv',
    airportRows: airportRows.length,
    airportDerivedDbRows: cities.filter((city) => /airport|heliport|airfield|aerodrome/i.test(city.slug)).length,
    matchedRecords: cityRecords.length,
    exactMatches: cityRecords.filter((row) => row.matchKind === 'exact').length,
    fuzzyMatches: cityRecords.filter((row) => row.matchKind === 'fuzzy').length,
    unmatchedAirportRecords,
    matchingAirportNamesUnique: new Set(cityRecords.map((row) => `${row.countryCode}|${row.slug}`)).size,
    municipalityPresent: cityRecords.filter((row) => row.municipality).length,
    municipalityGazetteerMatch: cityRecords.filter((row) => row.municipalityIsPopulatedPlace).length,
    municipalityMissingOrUnmatched: cityRecords.filter((row) => !row.municipalityIsPopulatedPlace),
    airportRecords: cityRecords,
  };
  fs.writeFileSync(path.join(__dirname, 'tmp_airport_city_crosswalk.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ airportSource: result.airportSource, airportRows: result.airportRows, airportDerivedDbRows: result.airportDerivedDbRows, matchedRecords: result.matchedRecords, exactMatches: result.exactMatches, fuzzyMatches: result.fuzzyMatches, unmatchedAirportRecords: result.unmatchedAirportRecords.length, municipalityPresent: result.municipalityPresent, municipalityGazetteerMatch: result.municipalityGazetteerMatch, municipalityMissingOrUnmatched: result.municipalityMissingOrUnmatched.length }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
