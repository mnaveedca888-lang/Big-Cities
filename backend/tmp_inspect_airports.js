const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const dataDir = path.join(__dirname, '..', 'Data');
const planPath = path.join(__dirname, 'tmp_final_city_audit_plan.json');
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function countryAliases(name) {
  const normalized = normalize(name);
  const aliases = {
    'united states of america': 'united states',
    'czech republic': 'czechia',
    'czech republic czechia': 'czechia',
    'cape verde': 'cabo verde',
  };
  return aliases[normalized] || normalized;
}

function likelyAirportMatch(record, airport) {
  const name = normalize(record.currentName);
  const airportName = normalize(airport);
  if (name.length < 3 || airportName.length < 3) return false;
  if (airportName.includes(name) || name.includes(airportName)) return true;

  const nameWords = name.split(' ').filter((word) => word.length > 2);
  const airportWords = new Set(airportName.split(' '));
  if (!nameWords.length) return false;
  const matchedWords = nameWords.filter((word) => airportWords.has(word)).length;
  return matchedWords >= Math.max(2, Math.ceil(nameWords.length * 0.75));
}

const airportEntries = [];
const cityDetailNames = new Map();
for (const file of fs.readdirSync(dataDir).filter((name) => /\.xlsx?$/i.test(name) && !name.startsWith('~$'))) {
  const workbook = xlsx.readFile(path.join(dataDir, file));
  const citySheet = workbook.Sheets.City_Details;
  if (citySheet) {
    for (const row of xlsx.utils.sheet_to_json(citySheet, { defval: null, raw: false })) {
      const country = row.Country || row['Country Name'];
      const city = row.City;
      if (!country || !city) continue;
      const key = countryAliases(country);
      if (!cityDetailNames.has(key)) cityDetailNames.set(key, new Set());
      cityDetailNames.get(key).add(city.trim());
    }
  }

  const airportSheet = workbook.Sheets.Airports;
  if (!airportSheet) continue;
  for (const row of xlsx.utils.sheet_to_json(airportSheet, { defval: null, raw: false })) {
    for (const [country, value] of Object.entries(row)) {
      if (country === '#' || typeof value !== 'string') continue;
      const parts = value.split(/\s+[—–]\s+/);
      if (parts.length < 2) continue;
      airportEntries.push({
        country: countryAliases(country),
        servedCity: parts[0].trim(),
        airport: parts.slice(1).join(' — ').trim(),
        workbook: file,
      });
    }
  }
}

const manualRows = plan.rows.filter((row) => row.action === 'MANUAL_REVIEW');
const matches = [];
for (const record of manualRows) {
  const country = countryAliases(record.country);
  const candidates = airportEntries.filter((entry) =>
    entry.country === country && likelyAirportMatch(record, entry.airport)
  );
  const uniqueCities = [...new Map(candidates.map((entry) => [normalize(entry.servedCity), entry])).values()];
  if (uniqueCities.length === 0) continue;
  matches.push({
    country: record.country,
    countryCode: record.countryCode,
    currentName: record.currentName,
    slug: record.slug,
    candidates: uniqueCities.map((entry) => ({
      servedCity: entry.servedCity,
      airport: entry.airport,
      workbook: entry.workbook,
      inCityDetails: [...(cityDetailNames.get(country) || [])].some((name) => normalize(name) === normalize(entry.servedCity)),
    })),
  });
}

const unique = matches.filter((record) => record.candidates.length === 1);
console.log(JSON.stringify({
  manualRows: manualRows.length,
  workbookAirportEntries: airportEntries.length,
  workbookMatchedRows: matches.length,
  uniqueServedCityMatches: unique.length,
  ambiguousMatches: matches.length - unique.length,
  sampleUniqueMatches: unique.slice(0, 30),
  sampleAmbiguousMatches: matches.filter((record) => record.candidates.length > 1).slice(0, 10),
}, null, 2));
