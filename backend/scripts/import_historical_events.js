const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function parseDate(input) {
  const text = String(input || '').trim();
  if (!text) return null;

  const year = new Date().getFullYear();
  const monthMap = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  const lower = text.toLowerCase();

  if (lower.includes('january')) {
    const month = 0;
    const day = lower.includes('january') && lower.includes('february') ? 1 : 1;
    return new Date(Date.UTC(year, month, day));
  }

  if (lower.includes('february')) {
    return new Date(Date.UTC(year, 1, 1));
  }
  if (lower.includes('march')) {
    return new Date(Date.UTC(year, 2, 1));
  }
  if (lower.includes('april')) {
    return new Date(Date.UTC(year, 3, 1));
  }
  if (lower.includes('may')) {
    return new Date(Date.UTC(year, 4, 1));
  }
  if (lower.includes('june')) {
    return new Date(Date.UTC(year, 5, 1));
  }
  if (lower.includes('july')) {
    return new Date(Date.UTC(year, 6, 1));
  }
  if (lower.includes('august')) {
    return new Date(Date.UTC(year, 7, 1));
  }
  if (lower.includes('september')) {
    return new Date(Date.UTC(year, 8, 1));
  }
  if (lower.includes('october')) {
    return new Date(Date.UTC(year, 9, 1));
  }
  if (lower.includes('november')) {
    return new Date(Date.UTC(year, 10, 1));
  }
  if (lower.includes('december')) {
    return new Date(Date.UTC(year, 11, 1));
  }

  const dayMatch = text.match(/(\d{1,2})\s+([A-Za-z]+)/);
  if (dayMatch) {
    const day = Number(dayMatch[1]);
    const monthName = dayMatch[2].toLowerCase();
    const month = monthMap[monthName];
    if (month !== undefined) return new Date(Date.UTC(year, month, day));
  }

  if (/usually annually/i.test(lower) || /usually held/i.test(lower) || /throughout the year/i.test(lower) || /islamic calendar/i.test(lower)) {
    return new Date(Date.UTC(year, 0, 1));
  }

  return null;
}

function describeEvent(event) {
  const parts = [];
  if (event.dateText) parts.push(`Document date: ${event.dateText}`);
  if (event.significance) parts.push(`Historical/cultural significance: ${event.significance}`);
  if (event.notes) parts.push(`Notes: ${event.notes}`);
  return parts.join('\n\n');
}

function normalizeIdentity(value) {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function parseExcelHistoricalDate(dateText, historicalDate) {
  const parsed = parseDate(dateText || historicalDate);
  return parsed || new Date(Date.UTC(new Date().getFullYear(), 0, 1));
}

function describeAsiaEvent(row) {
  const parts = [];
  const documentDate = String(row['Document Date'] || row.Date || row['Historical Date'] || '').trim();
  if (documentDate) parts.push(`Document date: ${documentDate}`);
  if (row['Document Date'] && row.Date && String(row['Document Date']).trim() !== String(row.Date).trim()) {
    parts.push(`Event date: ${String(row.Date).trim()}`);
  }
  if (row['Historical Date']) parts.push(`Historical date: ${String(row['Historical Date']).trim()}`);
  if (row['Event Overview']) parts.push(`Historical/cultural significance: ${String(row['Event Overview']).trim()}`);

  const notes = [
    row.Location ? `Location: ${row.Location}` : '',
    row['Event Category'] ? `Event category: ${row['Event Category']}` : '',
    row.Category ? `Category: ${row.Category}` : '',
    row.Type ? `Type: ${row.Type}` : '',
    row.Status ? `Status: ${row.Status}` : '',
    row.Source ? `Source: ${row.Source}` : '',
    row['Event Scope'] ? `Scope: ${row['Event Scope']}` : '',
    row['Event Classification'] ? `Classification: ${row['Event Classification']}` : '',
  ].filter(Boolean);
  if (notes.length) parts.push(`Notes: ${notes.join('; ')}`);
  return parts.join('\n\n');
}

function workbookRows(workbook, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  return sheet ? XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false }) : [];
}

function countryProfileFromWorkbook(row, airports) {
  return {
    capital: row.Capital,
    population: row.Population,
    area: row['Area (km²)'],
    currency: row.Currency,
    overview: row.Overview,
    geography: row.Geography,
    economy: row.Economy,
    government: row.Government,
    airports: airports.length ? airports.join(', ') : null,
  };
}

function cityProfileFromWorkbook(row, airport) {
  const fieldMap = {
    'City Population': 'population',
    Nickname: 'nickname',
    Overview: 'overview',
    History: 'history',
    Founded: 'founded',
    'Historical Significance': 'historicalSignificance',
    Area: 'area',
    Elevation: 'elevation',
    Rivers: 'rivers',
    Climate: 'climate',
    Coordinates: 'coordinates',
    'UNESCO Sites': 'unescoSites',
    'Famous Landmarks': 'famousLandmarks',
    Museums: 'museums',
    Parks: 'parks',
    'Traditional Food': 'traditionalFood',
    'Street Food': 'streetFood',
    'Popular Restaurants': 'popularRestaurants',
    Festivals: 'festivals',
    'Cultural Events': 'culturalEvents',
    Arts: 'arts',
    Music: 'music',
    'Major Industries': 'majorIndustries',
    Technology: 'technology',
    Tourism: 'tourism',
    Manufacturing: 'manufacturing',
    Finance: 'finance',
    Metro: 'metro',
    Airport: 'airport',
    Railway: 'railway',
    'Bus Network': 'busNetwork',
    'Major Roads': 'majorRoads',
    'Movies Filmed Here': 'moviesFilmedHere',
    'TV Shows': 'tvShows',
    Sports: 'sports',
    Stadiums: 'stadiums',
    'Famous People': 'famousPeople',
    'World Records': 'worldRecords',
    'Interesting Facts': 'interestingFacts',
    'Unique Customs': 'uniqueCustoms',
    'Unique Transportation': 'uniqueTransportation',
    'Surprising Facts': 'surprisingFacts',
    Population: 'population',
    'Time Zone': 'timeZone',
    'Postal Code': 'postalCode',
  };
  const profile = {};
  for (const [source, target] of Object.entries(fieldMap)) {
    if (row[source] !== null && row[source] !== undefined && String(row[source]).trim()) profile[target] = String(row[source]).trim();
  }
  if (row.Population !== null && row.Population !== undefined && String(row.Population).trim()) profile.population = String(row.Population).trim();
  if (airport) profile.airport = airport;
  return profile;
}

function splitAirportCell(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  const separator = text.includes(' — ') ? ' — ' : text.includes(' – ') ? ' – ' : ' - ';
  const parts = text.split(separator);
  return parts.length > 1 ? { city: parts[0].trim(), airport: parts.slice(1).join(separator).trim() } : null;
}

async function importNorthAmericaWorkbook() {
  const workbook = XLSX.readFile(path.join(__dirname, '..', '..', 'Data', 'North America.xlsx'), { cellDates: true });
  const countryRows = workbookRows(workbook, 'Country_Details');
  const cityRows = workbookRows(workbook, 'City_Details');
  const airportRows = workbookRows(workbook, 'Airports');
  const eventRows = workbookRows(workbook, 'Events Section');
  const countries = await prisma.country.findMany({ select: { code: true, name: true, profile: true } });
  const cities = await prisma.city.findMany({ select: { slug: true, name: true, countryCode: true, profile: true } });
  const countryByName = new Map(countries.map((country) => [normalizeIdentity(country.name), country]));
  const cityByKey = new Map(cities.map((city) => [`${city.countryCode}|${normalizeIdentity(city.name)}`, city]));
  const airportByKey = new Map();
  for (const row of airportRows) {
    for (const [countryName, value] of Object.entries(row)) {
      if (countryName === '#' || !value) continue;
      const country = countryByName.get(normalizeIdentity(countryName));
      const parsed = splitAirportCell(value);
      if (country && parsed) airportByKey.set(`${country.code}|${normalizeIdentity(parsed.city)}`, parsed.airport);
    }
  }

  const report = { countriesMatched: 0, countriesUpdated: 0, countriesUnmatched: [], citiesMatched: 0, citiesUpdated: 0, citiesUnmatched: [], airports: 0 };
  for (const row of countryRows) {
    const country = countryByName.get(normalizeIdentity(row.country));
    if (!country) { report.countriesUnmatched.push(row.country); continue; }
    const airports = [...airportByKey.entries()].filter(([key]) => key.startsWith(`${country.code}|`)).map(([, value]) => value);
    report.countriesMatched += 1;
    await prisma.country.update({ where: { code: country.code }, data: { profile: { ...(country.profile || {}), ...countryProfileFromWorkbook(row, airports) } } });
    report.countriesUpdated += 1;
  }
  for (const row of cityRows) {
    const country = countryByName.get(normalizeIdentity(row.country));
    const city = country && cityByKey.get(`${country.code}|${normalizeIdentity(row.City)}`);
    if (!city) { report.citiesUnmatched.push({ country: row.country, city: row.City }); continue; }
    report.citiesMatched += 1;
    const airport = airportByKey.get(`${country.code}|${normalizeIdentity(row.City)}`);
    await prisma.city.update({ where: { slug: city.slug }, data: { profile: { ...(city.profile || {}), ...cityProfileFromWorkbook(row, airport) } } });
    report.citiesUpdated += 1;
  }
  report.airports = airportByKey.size;
  const eventReport = await importWorkbookEvents(eventRows, countryByName, cityByKey);
  console.log(JSON.stringify({ source: 'North America.xlsx', ...report, ...eventReport }, null, 2));
}

const EUROPE_COUNTRY_ALIASES = {
  'czech republic (czechia)': 'czechia',
};

function normalizedCountryName(value) {
  const normalized = normalizeIdentity(value);
  return EUROPE_COUNTRY_ALIASES[normalized] || normalized;
}

function isSafeEuropeCityName(value) {
  const name = String(value || '').trim();
  return Boolean(name) && !/^none\./i.test(name) && name.length <= 100;
}

function europeCityProfileFromWorkbook(row, airport) {
  const fieldMap = {
    Population: 'population', Nickname: 'nickname', Overview: 'overview', History: 'history', Founded: 'founded',
    'Historical Significance': 'historicalSignificance', Area: 'area', Elevation: 'elevation', Rivers: 'rivers',
    Climate: 'climate', Coordinates: 'coordinates', 'UNESCO Sites': 'unescoSites', 'Famous Landmarks': 'famousLandmarks',
    Museums: 'museums', Parks: 'parks', 'Traditional Food': 'traditionalFood',
    'Street Food (2026 verified; official tourism/cultural sources prioritized)': 'streetFood',
    'Popular Restaurants': 'popularRestaurants', Festivals: 'festivals',
    'Festivals (2026 verified; official tourism/cultural sources prioritized)': 'festivals',
    'Cultural Events': 'culturalEvents', 'Cultural Events (2026 verified; official tourism/cultural sources prioritized)': 'culturalEvents',
    Arts: 'arts', 'Arts (2026 verified; official tourism/cultural sources prioritized)': 'arts', Music: 'music',
    'Music (2026 verified; official tourism/cultural sources prioritized)': 'music', 'Major Industries': 'majorIndustries',
    Technology: 'technology', Tourism: 'tourism', Manufacturing: 'manufacturing', Finance: 'finance', Metro: 'metro',
    Airport: 'airport', Railway: 'railway', 'Bus Network': 'busNetwork', 'Major Roads': 'majorRoads',
    'Movies Filmed Here': 'moviesFilmedHere', 'TV Shows': 'tvShows', Sports: 'sports', Stadiums: 'stadiums',
    'Famous People': 'famousPeople', 'World Records': 'worldRecords', 'Interesting Facts': 'interestingFacts',
    'Unique Customs': 'uniqueCustoms', 'Unique Transportation': 'uniqueTransportation', 'Surprising Facts': 'surprisingFacts',
    'Time Zone': 'timeZone', 'Postal Code': 'postalCode',
  };
  const profile = {};
  for (const [source, target] of Object.entries(fieldMap)) {
    if (row[source] !== null && row[source] !== undefined && String(row[source]).trim()) profile[target] = String(row[source]).trim();
  }
  if (airport) profile.airport = airport;
  return profile;
}

async function importEuropeWorkbook() {
  const workbook = XLSX.readFile(path.join(__dirname, '..', '..', 'Data', 'Europe.xlsx'), { cellDates: true });
  const countryRows = workbookRows(workbook, 'Country_Details');
  const cityRows = workbookRows(workbook, 'City_Details');
  const airportRows = workbookRows(workbook, 'Airports');
  const eventRows = workbookRows(workbook, 'Events');
  const countries = await prisma.country.findMany({ select: { code: true, name: true, profile: true } });
  const cities = await prisma.city.findMany({ select: { slug: true, name: true, countryCode: true, profile: true } });
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  const countryByName = new Map(countries.map((country) => [normalizedCountryName(country.name), country]));
  const cityByKey = new Map(cities.map((city) => [`${city.countryCode}|${normalizeIdentity(city.name)}`, city]));
  const airportByKey = new Map();
  for (const row of airportRows) {
    for (const [countryName, value] of Object.entries(row)) {
      if (countryName === '#' || !value) continue;
      const country = countryByName.get(normalizedCountryName(countryName));
      const parsed = splitAirportCell(value);
      if (country && parsed) airportByKey.set(`${country.code}|${normalizeIdentity(parsed.city)}`, parsed.airport);
    }
  }

  const report = { countriesMatched: 0, countriesUpdated: 0, countriesUnmatched: [], citiesMatched: 0, citiesUpdated: 0, citiesUnmatched: [], airports: airportByKey.size };
  for (const row of countryRows) {
    const country = countryByName.get(normalizedCountryName(row.country));
    if (!country) { report.countriesUnmatched.push(row.country); continue; }
    const airports = [...airportByKey.entries()].filter(([key]) => key.startsWith(`${country.code}|`)).map(([, value]) => value);
    report.countriesMatched += 1;
    await prisma.country.update({ where: { code: country.code }, data: { profile: { ...(country.profile || {}), ...countryProfileFromWorkbook(row, airports) } } });
    report.countriesUpdated += 1;
  }
  for (const row of cityRows) {
    const country = countryByName.get(normalizedCountryName(row['Country Name']));
    const city = country && isSafeEuropeCityName(row.City)
      ? cityByKey.get(`${country.code}|${normalizeIdentity(row.City)}`)
      : null;
    if (!city) { report.citiesUnmatched.push({ country: row['Country Name'], city: row.City }); continue; }
    report.citiesMatched += 1;
    await prisma.city.update({ where: { slug: city.slug }, data: { profile: { ...(city.profile || {}), ...europeCityProfileFromWorkbook(row, airportByKey.get(`${country.code}|${normalizeIdentity(row.City)}`)) } } });
    report.citiesUpdated += 1;
  }
  const eventReport = await importEuropeEvents(eventRows, countryByCode, cityByKey);
  console.log(JSON.stringify({ source: 'Europe.xlsx', ...report, ...eventReport }, null, 2));
}

async function importEuropeEvents(rows, countryByCode, cityByKey, options = {}) {
  let inserted = 0;
  let duplicates = 0;
  let failed = 0;
  const failures = [];
  for (const row of rows) {
    const countryCode = String(row['Country Code'] || '').trim().toUpperCase();
    const country = countryByCode.get(countryCode);
    const title = String(row['Event Name'] || '').trim();
    if (!country || !title) {
      failed += 1;
      failures.push({ title: title || null, countryCode, reason: !country ? 'country code not found' : 'missing title' });
      continue;
    }
    const city = row.City && isSafeEuropeCityName(row.City)
      ? cityByKey.get(`${countryCode}|${normalizeIdentity(row.City)}`)
      : null;
    const citySlug = city ? city.slug : null;
    const existing = await prisma.event.findFirst({ where: { title: { equals: title, mode: 'insensitive' }, countryCode, citySlug } });
    const startAt = parseExcelHistoricalDate(row.Date, row['Historical Date']);
    const description = describeAsiaEvent(row);
    const data = {
      title,
      description,
      startAt,
      endAt: new Date(startAt.getTime() + 24 * 60 * 60 * 1000 - 1),
      dateOnly: true,
      countryCode,
      citySlug,
      tags: [row['Event Category'], row.Category, row.Type, row['Event Scope'], row['Event Classification']].filter(Boolean).map((value) => String(value).trim().toLowerCase()).join(','),
      featured: false,
      enabled: true,
      verificationStatus: 'UNVERIFIED',
      sourceName: row.Source ? String(row.Source).trim() : null,
      sourceUrl: row['Source URL'] ? String(row['Source URL']).trim() : null,
    };
    if (existing) {
      if (options.refreshExisting) await prisma.event.update({ where: { id: existing.id }, data });
      duplicates += 1;
      continue;
    }
    const baseSlug = slugify(`${countryCode}-${title}-${citySlug || 'regional'}`);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.event.findUnique({ where: { slug }, select: { id: true } })) slug = `${baseSlug}-${suffix++}`;
    await prisma.event.create({ data: { ...data, slug } });
    inserted += 1;
  }
  return { eventRows: rows.length, inserted, duplicates, failed, failures };
}

const WORKBOOK_COUNTRY_ALIASES = {
  'federated states of micronesia': 'micronesia',
};

function workbookCountryIdentity(value) {
  const identity = normalizeIdentity(value);
  return WORKBOOK_COUNTRY_ALIASES[identity] || identity;
}

async function importWorkbookContinent({ label, file, countryField, cityCountryField, areaField }) {
  const workbook = XLSX.readFile(path.join(__dirname, '..', '..', 'Data', file), { cellDates: true });
  const countryRows = workbookRows(workbook, 'Country_Details');
  const cityRows = workbookRows(workbook, 'City_Details');
  const airportRows = workbookRows(workbook, 'Airports');
  const eventRows = workbookRows(workbook, 'Events');
  const countries = await prisma.country.findMany({ select: { code: true, name: true, profile: true } });
  const cities = await prisma.city.findMany({ select: { slug: true, name: true, countryCode: true, profile: true } });
  const countryByName = new Map(countries.map((country) => [workbookCountryIdentity(country.name), country]));
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  const workbookNameToCode = new Map(eventRows.map((row) => [workbookCountryIdentity(row.Country), String(row['Country Code'] || '').trim().toUpperCase()]));
  const findCountry = (value) => countryByCode.get(workbookNameToCode.get(workbookCountryIdentity(value))) || countryByName.get(workbookCountryIdentity(value));
  const cityByKey = new Map(cities.map((city) => [`${city.countryCode}|${normalizeIdentity(city.name)}`, city]));
  const airportByKey = new Map();
  for (const row of airportRows) {
    for (const [countryName, value] of Object.entries(row)) {
      if (countryName === '#' || !value) continue;
      const country = findCountry(countryName);
      const parsed = splitAirportCell(value);
      if (country && parsed) airportByKey.set(`${country.code}|${normalizeIdentity(parsed.city)}`, parsed.airport);
    }
  }

  const report = {
    source: file,
    countriesMatched: 0,
    countriesUpdated: 0,
    countriesUnmatched: [],
    citiesMatched: 0,
    citiesUpdated: 0,
    citiesUnmatched: [],
    airports: airportByKey.size,
  };
  for (const row of countryRows) {
    const country = findCountry(row[countryField]);
    if (!country) { report.countriesUnmatched.push(row[countryField]); continue; }
    const airports = [...airportByKey.entries()].filter(([key]) => key.startsWith(`${country.code}|`)).map(([, value]) => value);
    report.countriesMatched += 1;
    await prisma.country.update({ where: { code: country.code }, data: { profile: { ...(country.profile || {}), ...countryProfileFromWorkbook({ ...row, 'Area (km²)': row[areaField] }, airports) } } });
    report.countriesUpdated += 1;
  }
  for (const row of cityRows) {
    const country = findCountry(row[cityCountryField] || row.Country);
    const city = country ? cityByKey.get(`${country.code}|${normalizeIdentity(row.City)}`) : null;
    if (!city) { report.citiesUnmatched.push({ country: row[cityCountryField] || row.Country, city: row.City }); continue; }
    report.citiesMatched += 1;
    const airport = airportByKey.get(`${country.code}|${normalizeIdentity(row.City)}`);
    await prisma.city.update({ where: { slug: city.slug }, data: { profile: { ...(city.profile || {}), ...cityProfileFromWorkbook(row, airport) } } });
    report.citiesUpdated += 1;
  }
  const eventReport = await importEuropeEvents(eventRows, countryByCode, cityByKey, { refreshExisting: true });
  console.log(JSON.stringify({ ...report, ...eventReport }, null, 2));
}

async function importAfricaWorkbook() {
  await importWorkbookContinent({
    label: 'Africa',
    file: 'Africa.xlsx',
    countryField: 'country',
    cityCountryField: 'Country Name',
    areaField: 'Area (km²)',
  });
}

async function importWorkbookEvents(rows, countryByName, cityByKey) {
  let inserted = 0;
  let duplicates = 0;
  let failed = 0;
  const failures = [];
  for (const row of rows) {
    const countryCode = String(row['Country Code'] || '').trim().toUpperCase();
    const country = [...countryByName.values()].find((item) => item.code === countryCode);
    const title = String(row['Event Name'] || '').trim();
    if (!country || !title) { failed += 1; failures.push({ title: title || null, countryCode, reason: !country ? 'country not found' : 'missing title' }); continue; }
    const cityMatches = row.City ? [cityByKey.get(`${countryCode}|${normalizeIdentity(row.City)}`)].filter(Boolean) : [];
    const citySlug = cityMatches.length === 1 ? cityMatches[0].slug : null;
    const existing = await prisma.event.findFirst({ where: { title: { equals: title, mode: 'insensitive' }, countryCode, citySlug } });
    if (existing) { duplicates += 1; continue; }
    const startAt = parseExcelHistoricalDate(row.Date, row['Historical Date']);
    const data = { title, description: describeAsiaEvent(row), startAt, endAt: new Date(startAt.getTime() + 24 * 60 * 60 * 1000 - 1), dateOnly: true, countryCode, citySlug, tags: [row['Event Category'], row.Category, row.Type, row['Event Scope'], row['Event Classification']].filter(Boolean).map((value) => String(value).trim().toLowerCase()).join(','), featured: false, enabled: true, verificationStatus: 'UNVERIFIED', sourceName: row.Source ? String(row.Source).trim() : null, sourceUrl: null };
    const baseSlug = slugify(`${countryCode}-${title}-${citySlug || 'regional'}`);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.event.findUnique({ where: { slug }, select: { id: true } })) slug = `${baseSlug}-${suffix++}`;
    await prisma.event.create({ data: { ...data, slug } });
    inserted += 1;
  }
  return { eventRows: rows.length, inserted, duplicates, failed, failures };
}

async function importAsiaHistoricalEvents() {
  const workbook = XLSX.readFile(path.join(__dirname, '..', '..', 'Data', 'Asia.xlsx'), { cellDates: true });
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Events Section'], { defval: null, raw: false });
  const countries = await prisma.country.findMany({ select: { code: true, name: true } });
  const cities = await prisma.city.findMany({ select: { slug: true, name: true, countryCode: true } });
  const countriesByCode = new Map(countries.map((country) => [country.code, country]));
  const citiesByKey = new Map();
  for (const city of cities) {
    const key = `${city.countryCode}|${normalizeIdentity(city.name)}`;
    const matches = citiesByKey.get(key) || [];
    matches.push(city);
    citiesByKey.set(key, matches);
  }

  let inserted = 0;
  let matched = 0;
  let duplicates = 0;
  let failed = 0;
  const failures = [];

  for (const row of rows) {
    const countryCode = String(row['Country Code'] || '').trim().toUpperCase();
    const country = countriesByCode.get(countryCode);
    if (!country || !row['Event Name']) {
      failed += 1;
      failures.push({ event: row['Event Name'] || null, countryCode, reason: !country ? 'country not found' : 'missing title' });
      continue;
    }

    const cityMatches = row.City
      ? citiesByKey.get(`${countryCode}|${normalizeIdentity(row.City)}`) || []
      : [];
    const citySlug = cityMatches.length === 1 ? cityMatches[0].slug : null;
    const startAt = parseExcelHistoricalDate(row.Date, row['Historical Date']);
    const endAt = new Date(startAt.getTime() + 24 * 60 * 60 * 1000 - 1);
    const title = String(row['Event Name']).trim();
    const description = describeAsiaEvent(row);
    const tags = [row['Event Category'], row.Category, row.Type, row['Event Scope'], row['Event Classification']]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase())
      .join(',');
    const existing = await prisma.event.findFirst({
      where: {
        title: { equals: title, mode: 'insensitive' },
        countryCode,
        citySlug,
      },
    });

    if (existing) {
      matched += 1;
      if (/Document date:|Historical\/cultural significance:/i.test(existing.description || '')) {
        duplicates += 1;
        continue;
      }
    }

    const data = {
      title,
      description,
      startAt,
      endAt,
      dateOnly: true,
      countryCode,
      citySlug,
      tags,
      featured: false,
      enabled: true,
      verificationStatus: 'UNVERIFIED',
      sourceName: null,
      sourceUrl: null,
    };
    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data });
    } else {
      const baseSlug = slugify(`${countryCode}-${title}-${citySlug || 'regional'}`);
      let slug = baseSlug;
      let suffix = 1;
      while (await prisma.event.findUnique({ where: { slug }, select: { id: true } })) {
        slug = `${baseSlug}-${suffix}`;
        suffix += 1;
      }
      await prisma.event.create({ data: { ...data, slug } });
      inserted += 1;
    }
  }

  console.log(JSON.stringify({ sourceRows: rows.length, inserted, matched, duplicates, failed, failures }, null, 2));
}

const events = [
  {
    title: 'Pakistan Day',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: '23 March',
    significance: 'National observance commemorating the Lahore Resolution and the country’s historical identity.',
    notes: 'The document lists it as a nationally celebrated event with military parade, cultural shows, flag hoisting, and fireworks.',
    tags: ['national', 'history', 'festival'],
  },
  {
    title: 'Independence Day',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: '14 August',
    significance: 'Pakistan’s independence anniversary, marking the birth of the nation in 1947.',
    notes: 'The document lists flag displays, parades, concerts, fireworks, and bike rallies.',
    tags: ['national', 'history', 'festival'],
  },
  {
    title: 'Defence & Martyrs Day',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: '6 September',
    significance: 'A national day honouring military service and those who sacrificed their lives.',
    notes: 'The document lists military ceremonies, tributes, and exhibitions.',
    tags: ['national', 'history', 'commemoration'],
  },
  {
    title: 'Iqbal Day',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: '9 November',
    significance: 'Commemorates the life and ideas of Allama Muhammad Iqbal.',
    notes: 'The document lists poetry events, seminars, and educational programs.',
    tags: ['national', 'culture', 'education'],
  },
  {
    title: 'Kashmir Solidarity Day',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: '5 February',
    significance: 'A national expression of support for the people of Kashmir.',
    notes: 'The document lists rallies, seminars, and awareness events.',
    tags: ['national', 'history', 'awareness'],
  },
  {
    title: 'Quaid-e-Azam Day',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: '25 December',
    significance: 'Commemorates the birth anniversary of Muhammad Ali Jinnah.',
    notes: 'The document lists ceremonies, exhibitions, and educational events.',
    tags: ['national', 'history', 'commemoration'],
  },
  {
    title: 'Pakistan Resolution Day Celebrations',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: 'March',
    significance: 'Celebrates the Pakistan Resolution and the country’s constitutional and political history.',
    notes: 'The document lists cultural events and historical exhibitions.',
    tags: ['national', 'history', 'festival'],
  },
  {
    title: 'Lok Mela',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: 'Usually November',
    significance: 'A major cultural gathering that showcases heritage, folk traditions, and arts from across Pakistan.',
    notes: 'The document notes visitors from all provinces and lists folk music, crafts, food, and cultural performances.',
    tags: ['culture', 'heritage', 'festival'],
  },
  {
    title: 'Pakistan Flower Show',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: 'February',
    significance: 'A long-running national flower exhibition reflecting horticultural traditions and public culture.',
    notes: 'The document lists flower exhibitions and competitions.',
    tags: ['culture', 'festival', 'gardens'],
  },
  {
    title: 'National Horse & Cattle Show',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: 'February–March',
    significance: 'A nationally recognized showcase of rural traditions, livestock, horse sports, and folk performances.',
    notes: 'The document notes visitors from across Pakistan and lists livestock, horse dancing, tent pegging, and folk performances.',
    tags: ['culture', 'agriculture', 'festival'],
  },
  {
    title: 'Basant',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: 'February',
    significance: 'A traditional spring celebration associated with kite flying and cultural joy in Punjab.',
    notes: 'The document lists kite flying, music, and food and notes that it is especially popular in Punjab.',
    tags: ['culture', 'festival', 'spring'],
  },
  {
    title: 'Sibi Mela',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: 'February',
    significance: 'A historic festival celebrating Baloch culture, livestock, and equestrian traditions.',
    notes: 'The document notes visitors from all provinces and lists camel races, horse shows, and livestock exhibitions.',
    tags: ['culture', 'festival', 'heritage'],
  },
  {
    title: 'Shandur Polo Festival',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: 'July',
    significance: 'A traditional festival associated with mountain polo and regional heritage.',
    notes: 'The document describes it as a national tourism event with freestyle polo and cultural activities.',
    tags: ['culture', 'tourism', 'festival'],
  },
  {
    title: 'Chilam Joshi Festival',
    location: null,
    countryCode: 'PK',
    citySlug: null,
    dateText: 'May',
    significance: 'A celebration of Kalash culture, music, and dance.',
    notes: 'The document notes national and international tourism interest.',
    tags: ['culture', 'festival', 'heritage'],
  },
  {
    title: 'Rang-e-Bahar Festival',
    location: 'Faisalabad',
    countryCode: 'PK',
    citySlug: 'pk-faisalabad',
    dateText: 'February–March',
    significance: 'A spring festival featuring flowers, arts, and Punjabi culture in Faisalabad.',
    notes: 'The document lists it as a spring festival and cites its cultural significance in Punjab.',
    tags: ['festival', 'culture', 'spring'],
  },
  {
    title: 'Basant (Traditional Kite Festival)',
    location: 'Faisalabad',
    countryCode: 'PK',
    citySlug: 'pk-faisalabad',
    dateText: 'February',
    significance: 'A traditional Punjabi spring celebration tied to kite flying and communal festivities.',
    notes: 'The document notes its historic status as a Punjabi spring celebration.',
    tags: ['festival', 'culture', 'spring'],
  },
  {
    title: 'Kissan Mela',
    location: 'Faisalabad',
    countryCode: 'PK',
    citySlug: 'pk-faisalabad',
    dateText: 'March–April',
    significance: 'An agricultural heritage festival highlighting the region’s farming traditions.',
    notes: 'The document states it is organized annually by the University of Agriculture.',
    tags: ['festival', 'agriculture', 'heritage'],
  },
  {
    title: 'Islamabad Literature Festival',
    location: 'Islamabad',
    countryCode: 'PK',
    citySlug: 'pk-islamabad',
    dateText: 'February',
    significance: 'A literary and cultural festival celebrating Pakistan’s history, literature, and heritage.',
    notes: 'The document identifies it as an annual cultural event.',
    tags: ['festival', 'literature', 'culture'],
  },
  {
    title: 'Lok Mela',
    location: 'Islamabad',
    countryCode: 'PK',
    citySlug: 'pk-islamabad',
    dateText: 'November',
    significance: 'A heritage festival that brings together traditions from across Pakistan.',
    notes: 'The document describes it as Pakistan’s largest folk and traditional heritage festival.',
    tags: ['festival', 'heritage', 'culture'],
  },
  {
    title: 'Pakistan Flower Show',
    location: 'Karachi',
    countryCode: 'PK',
    citySlug: 'pk-karachi',
    dateText: 'February',
    significance: 'A long-running flower exhibition that reflects Karachi’s civic and cultural traditions.',
    notes: 'The document lists it as an annual flower exhibition held for decades.',
    tags: ['festival', 'culture', 'flowers'],
  },
  {
    title: 'Karachi Literature Festival',
    location: 'Karachi',
    countryCode: 'PK',
    citySlug: 'pk-karachi',
    dateText: 'February',
    significance: 'A literary festival showcasing Pakistan’s historical and cultural heritage.',
    notes: 'The document identifies it as an annual festival of literature and heritage.',
    tags: ['festival', 'literature', 'culture'],
  },
  {
    title: 'All Pakistan Music Conference',
    location: 'Karachi',
    countryCode: 'PK',
    citySlug: 'pk-karachi',
    dateText: 'January–February',
    significance: 'A classical music gathering that preserves and promotes South Asian musical traditions.',
    notes: 'The document notes its importance in cultural preservation.',
    tags: ['festival', 'music', 'culture'],
  },
  {
    title: 'Mela Chiraghan',
    location: 'Lahore',
    countryCode: 'PK',
    citySlug: 'pk-lahore',
    dateText: 'March–April',
    significance: 'A centuries-old Festival of Lights associated with the shrine of Madho Lal Hussain.',
    notes: 'The document identifies it as a historic celebration of lights and spiritual heritage.',
    tags: ['festival', 'heritage', 'religion'],
  },
  {
    title: 'Jashn-e-Baharan (Basant)',
    location: 'Lahore',
    countryCode: 'PK',
    citySlug: 'pk-lahore',
    dateText: 'February',
    significance: 'A traditional Punjabi spring festival with kite flying and cultural activities.',
    notes: 'The document identifies it as a classic Lahore spring celebration.',
    tags: ['festival', 'culture', 'spring'],
  },
  {
    title: 'National Horse & Cattle Show',
    location: 'Lahore',
    countryCode: 'PK',
    citySlug: 'pk-lahore',
    dateText: 'February–March',
    significance: 'A historic cultural event that showcases Punjab’s rural traditions, livestock, sports, and crafts.',
    notes: 'The document notes its significance for Punjab’s cultural heritage and rural arts.',
    tags: ['festival', 'culture', 'agriculture'],
  },
  {
    title: 'Vaisakhi Festival',
    location: 'Lahore',
    countryCode: 'PK',
    citySlug: 'pk-lahore',
    dateText: 'April',
    significance: 'A Sikh harvest and heritage festival celebrated at historic Gurdwaras.',
    notes: 'The document highlights its significance for Sikh heritage and community life.',
    tags: ['festival', 'heritage', 'religion'],
  },
  {
    title: 'Faiz Festival',
    location: 'Lahore',
    countryCode: 'PK',
    citySlug: 'pk-lahore',
    dateText: 'February',
    significance: 'An annual celebration of the life and legacy of poet Faiz Ahmed Faiz.',
    notes: 'The document frames it as a literary and cultural tribute.',
    tags: ['festival', 'literature', 'culture'],
  },
  {
    title: 'Data Darbar Urs',
    location: 'Lahore',
    countryCode: 'PK',
    citySlug: 'pk-lahore',
    dateText: 'Islamic Calendar (Date varies annually)',
    significance: 'A historic Sufi pilgrimage and religious gathering of deep significance to Lahore.',
    notes: 'The document describes it as an annual gathering with centuries of history.',
    tags: ['festival', 'religion', 'heritage'],
  },
  {
    title: 'Urs of Shah Rukn-e-Alam',
    location: 'Multan',
    countryCode: 'PK',
    citySlug: 'pk-multan',
    dateText: 'Islamic Calendar (Date varies annually)',
    significance: 'One of Pakistan’s largest annual Sufi gatherings, rooted in Multan’s spiritual history.',
    notes: 'The document identifies it as one of the country’s largest annual Sufi festivals.',
    tags: ['festival', 'religion', 'heritage'],
  },
  {
    title: 'Urs of Bahauddin Zakariya',
    location: 'Multan',
    countryCode: 'PK',
    citySlug: 'pk-multan',
    dateText: 'Islamic Calendar (Date varies annually)',
    significance: 'A historic Sufi festival attracting devotees from across the region.',
    notes: 'The document highlights its continuity and spiritual importance.',
    tags: ['festival', 'religion', 'heritage'],
  },
  {
    title: 'Jashn-e-Baharan',
    location: 'Peshawar',
    countryCode: 'PK',
    citySlug: 'pk-peshawar',
    dateText: 'Spring',
    significance: 'A cultural celebration of Khyber Pakhtunkhwa traditions and handicrafts.',
    notes: 'The document identifies it as a springtime festival rooted in regional culture.',
    tags: ['festival', 'culture', 'heritage'],
  },
  {
    title: 'Pakistan Independence Day Heritage Celebrations',
    location: 'Peshawar',
    countryCode: 'PK',
    citySlug: 'pk-peshawar',
    dateText: 'August',
    significance: 'Parades and cultural programs that highlight Peshawar’s regional history.',
    notes: 'The document notes annual parades and cultural programming.',
    tags: ['festival', 'history', 'culture'],
  },
  {
    title: 'Sibi Mela (near Quetta, Balochistan)',
    location: 'Quetta',
    countryCode: 'PK',
    citySlug: 'pk-quetta',
    dateText: 'February',
    significance: 'A historic livestock, horse, camel, and cultural festival linked to Quetta’s regional heritage.',
    notes: 'The document notes the event’s long history and its role in Baloch cultural life.',
    tags: ['festival', 'culture', 'heritage'],
  },
  {
    title: 'Baloch Culture Day Celebrations',
    location: 'Quetta',
    countryCode: 'PK',
    citySlug: 'pk-quetta',
    dateText: 'March',
    significance: 'A celebration of Baloch heritage, music, dress, and traditions.',
    notes: 'The document frames it as an annual expression of regionally rooted identity.',
    tags: ['festival', 'culture', 'heritage'],
  },
  {
    title: 'Pakistan Day Parade',
    location: 'Rawalpindi',
    countryCode: 'PK',
    citySlug: 'pk-rawalpindi',
    dateText: '23 March',
    significance: 'A national military and historical celebration associated with the Islamabad–Rawalpindi area.',
    notes: 'The document identifies it as a traditional national observance in the region.',
    tags: ['festival', 'history', 'military'],
  },
  {
    title: 'Lok Virsa Heritage Activities',
    location: 'Rawalpindi',
    countryCode: 'PK',
    citySlug: 'pk-rawalpindi',
    dateText: 'Throughout the year',
    significance: 'Heritage events and folk performances connected to Rawalpindi’s cultural life and proximity to Islamabad.',
    notes: 'The document notes their importance to local cultural engagement.',
    tags: ['festival', 'culture', 'heritage'],
  },
  {
    title: 'Sialkot Chamber Expo / Industrial Exhibition',
    location: 'Sialkot',
    countryCode: 'PK',
    citySlug: 'pk-sialkot',
    dateText: 'Usually annually',
    significance: 'A recurring industrial exhibition reflecting Sialkot’s commercial and manufacturing identity.',
    notes: 'The document notes it as an annual showcase tied to the city’s economic life.',
    tags: ['festival', 'industry', 'commerce'],
  },
];

async function upsertEvent(entry) {
  const baseSlug = slugify(`${entry.citySlug || 'pakistan'}-${entry.title}`);
  const startAt = parseDate(entry.dateText) || new Date(Date.UTC(new Date().getFullYear(), 0, 1));
  const endAt = startAt ? new Date(startAt.getTime() + 24 * 60 * 60 * 1000) : new Date(Date.UTC(new Date().getFullYear(), 11, 31));
  const description = describeEvent(entry);
  const data = {
    title: entry.title,
    description,
    startAt,
    endAt,
    countryCode: entry.countryCode,
    citySlug: entry.citySlug,
    tags: entry.tags.join(','),
    featured: false,
  };

  const existing = await prisma.event.findFirst({ where: { slug: baseSlug } });
  if (existing) {
    return prisma.event.update({ where: { id: existing.id }, data: { ...data, slug: baseSlug } });
  }

  return prisma.event.create({ data: { slug: baseSlug, ...data } });
}

async function main() {
  if (process.argv.includes('--africa')) {
    await importAfricaWorkbook();
    return;
  }
  if (process.argv.includes('--australia')) {
    await importWorkbookContinent({ label: 'Australia', file: 'Australia .xlsx', countryField: 'country', cityCountryField: 'Country Name', areaField: 'Area (km²)' });
    return;
  }
  if (process.argv.includes('--south-america')) {
    await importWorkbookContinent({ label: 'South America', file: 'South_America.xlsx', countryField: 'Country Name', cityCountryField: 'Country', areaField: 'Area' });
    return;
  }
  if (process.argv.includes('--europe')) {
    await importEuropeWorkbook();
    return;
  }
  if (process.argv.includes('--north-america')) {
    await importNorthAmericaWorkbook();
    return;
  }
  await importAsiaHistoricalEvents();
  for (const entry of events) {
    await upsertEvent(entry);
  }
  console.log(`Imported ${events.length} historical events into the existing Event model.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
