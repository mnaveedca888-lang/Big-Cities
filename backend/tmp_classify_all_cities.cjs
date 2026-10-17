require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const auditDirectory = path.join(process.env.TEMP || process.env.TMP, 'big-cities-audit-geonames');
const placeFile = path.join(auditDirectory, 'cities500.txt');
const airportCrosswalkPath = path.join(__dirname, 'tmp_airport_city_crosswalk.json');

function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

async function main() {
  const placeNames = new Set();
  const placeLines = fs.readFileSync(placeFile, 'utf8').split(/\r?\n/);
  for (const line of placeLines) {
    if (!line) continue;
    const fields = line.split('\t');
    if (fields[6] !== 'P' || !fields[8]) continue;
    for (const alias of [fields[1], fields[2], ...(fields[3] || '').split(',')]) {
      placeNames.add(`${fields[8]}|${normalize(alias)}`);
    }
  }
  const [cities, countries] = await Promise.all([
    prisma.city.findMany({ select: { slug: true, name: true, countryCode: true }, orderBy: [{ countryCode: 'asc' }, { name: 'asc' }] }),
    prisma.country.findMany({ select: { code: true, name: true } }),
  ]);
  const countryNames = new Map(countries.map((country) => [country.code, country.name]));
  const cityByName = new Map();
  for (const city of cities) {
    const key = `${city.countryCode}|${normalize(city.name)}`;
    if (!cityByName.has(key)) cityByName.set(key, []);
    cityByName.get(key).push(city);
  }
  const airportCrosswalk = JSON.parse(fs.readFileSync(airportCrosswalkPath, 'utf8'));
  const airportBySlug = new Map();
  for (const airport of airportCrosswalk.airportRecords) {
    if (!airportBySlug.has(airport.slug)) airportBySlug.set(airport.slug, []);
    airportBySlug.get(airport.slug).push(airport);
  }
  const rows = cities.map((city) => {
    const key = `${city.countryCode}|${normalize(city.name)}`;
    const currentNameIsPlace = placeNames.has(key);
    const airportMatches = airportBySlug.get(city.slug) || [];
    let status = 'MANUAL_REVIEW';
    let reason = 'No exact same-country populated-place match or verified airport municipality was found.';
    let correction = null;
    if (currentNameIsPlace) {
      status = 'KEEP_VERIFIED';
      reason = 'Current name matches a GeoNames populated place in the same ISO country.';
    } else if (airportMatches.length === 1 && airportMatches[0].municipalityIsPopulatedPlace) {
      const airport = airportMatches[0];
      const duplicateRows = cityByName.get(`${city.countryCode}|${normalize(airport.municipality)}`) || [];
      if (duplicateRows.length) {
        status = 'REMOVE_DUPLICATE';
        correction = airport.municipality;
        reason = `Current label is an airport name; verified airport municipality ${airport.municipality} already exists as ${duplicateRows.map((row) => row.slug).join(', ')}.`;
      } else {
        status = 'RENAME_TO_MUNICIPALITY';
        correction = airport.municipality;
        reason = `Current label is not a populated place; OurAirports municipality ${airport.municipality} is an independently verified same-country populated place.`;
      }
    } else if (airportMatches.length > 1) {
      reason = 'Airport-name mapping is ambiguous across multiple airport records.';
    } else if (airportMatches.length === 1) {
      reason = `Airport municipality ${airportMatches[0].municipality || '(not reported)'} is not independently verified as a GeoNames populated place.`;
    }
    return {
      country: countryNames.get(city.countryCode) || city.countryCode,
      countryCode: city.countryCode,
      currentName: city.name,
      slug: city.slug,
      currentNameIsPlace,
      action: status,
      correction,
      reason,
      airport: airportMatches.length === 1 ? {
        name: airportMatches[0].airportName,
        municipality: airportMatches[0].municipality,
        municipalityIsPopulatedPlace: airportMatches[0].municipalityIsPopulatedPlace,
        existingMunicipalityRecords: airportMatches[0].existingMunicipalityRecords,
      } : null,
    };
  });
  const summary = rows.reduce((result, row) => { result[row.action] = (result[row.action] || 0) + 1; return result; }, {});
  const output = { source: 'GeoNames cities500 and OurAirports airport municipality crosswalk', total: rows.length, uniqueSlugs: new Set(rows.map((row) => row.slug)).size, summary, rows };
  fs.writeFileSync(path.join(__dirname, 'tmp_city_classification_full.json'), JSON.stringify(output, null, 2));
  console.log(JSON.stringify({ source: output.source, total: output.total, uniqueSlugs: output.uniqueSlugs, summary, reviewExamples: rows.filter((row) => row.action === 'MANUAL_REVIEW').slice(0, 35) }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
