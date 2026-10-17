require('dotenv').config();
const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');
const countries = require('i18n-iso-countries');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

const args = process.argv.slice(2);
const targetSheetArgIndex = args.indexOf('--continent');
const targetSheet = targetSheetArgIndex !== -1 && args[targetSheetArgIndex + 1]
  ? String(args[targetSheetArgIndex + 1]).trim()
  : null;

const COUNTRY_OVERRIDES = {
  'Afganistan': 'AF',
  'Czech Republic (Czechia)': 'CZ',
  'North Korea': 'KP',
  'South Korea': 'KR',
  'United States of America': 'US',
  'United Kingdom': 'GB',
  'United Arab Emirates': 'AE',
  'Eswatini': 'SZ',
  'Russia': 'RU',
  'The Gambia': 'GM',
  'Brunei': 'BN',
  'Syria': 'SY',
  'Myanmar': 'MM',
  'Laos': 'LA',
  'Moldova': 'MD',
  'Palestine': 'PS',
  'Vatican City': 'VA',
  'Timor-Leste': 'TL',
  'Cabo Verde': 'CV',
  'São Tomé and Príncipe': 'ST',
  'Federated States of Micronesia': 'FM',
  'Saint Kitts and Nevis': 'KN',
  'Saint Lucia': 'LC',
  'Saint Vincent and the Grenadines': 'VC',
  'Trinidad and Tobago': 'TT',
  'Bolivia': 'BO',
  'Venezuela': 'VE',
  'Republic of the Congo': 'CG',
  'Democratic Republic of the Congo': 'CD',
  'Ivory Coast': 'CI',
  'Côte d\'Ivoire': 'CI',
};

const CANONICAL_IMAGE_CITY_RECORDS = [
  { slug: 'dm-roseau', name: 'Roseau', countryCode: 'DM' },
];

function normalizeCountryName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ');
}

function getCountryAlpha2(name) {
  const normalized = normalizeCountryName(name);
  if (!normalized) return null;
  const override = COUNTRY_OVERRIDES[normalized];
  if (override) return override;
  const code = countries.getAlpha2Code(normalized, 'en');
  if (code) return code;
  const alt = normalized
    .replace(/\s*\(.*\)$/, '')
    .replace(/^The\s+/i, '')
    .replace(/\s+Republic of\s+/i, '')
    .replace(/\s+Democratic Republic of\s+/i, '')
    .trim();
  return countries.getAlpha2Code(alt, 'en') || null;
}
function getCountryNameFromCode(alpha2) {
  return countries.getName(alpha2, 'en') || null;
}
function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeCityKey(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function getSouthAmericaWorkbookProfile(row) {
  const profile = {};
  for (const [header, value] of Object.entries(row)) {
    if (header === 'City' || header === 'Country' || value == null) continue;
    const text = String(value).trim();
    if (!text || /^(?:none\.?|—|-)$/i.test(text)) continue;
    const key = header
      .trim()
      .split(/\s+/)
      .map((part, index) => index === 0 ? part.toLowerCase() : part[0].toUpperCase() + part.slice(1).toLowerCase())
      .join('');
    profile[key] = text;
  }
  const country = String(row.Country || '').trim();
  if (country) profile.country = country;
  if (profile.overview && !profile.shortDescription) profile.shortDescription = profile.overview;
  profile.sources = ['Data/South_America.xlsx#City_Details'];
  return profile;
}

function mergeSouthAmericaProfiles(workbookProfile, existingProfile) {
  const existing = existingProfile && typeof existingProfile === 'object' && !Array.isArray(existingProfile)
    ? existingProfile
    : {};
  const merged = { ...existing };
  for (const [key, value] of Object.entries(workbookProfile)) {
    const current = merged[key];
    if (current == null || current === '' || current === '—' || (Array.isArray(current) && current.length === 0)) {
      merged[key] = value;
    }
  }
  return merged;
}

function extractCityName(value) {
  if (!value || typeof value !== 'string') return null;
  const cleaned = value.replace(/\uFFFD/g, ' ').trim();
  const separators = [' – ', ' — ', ' - ', '–', '—', 'ΓÇö', '–', '—'];
  for (const sep of separators) {
    if (cleaned.includes(sep)) {
      const parts = cleaned.split(sep).map((part) => part.trim()).filter(Boolean);
      if (parts.length > 1) return parts[parts.length - 1];
    }
  }
  const commaParts = cleaned.split(',').map((part) => part.trim()).filter(Boolean);
  if (commaParts.length > 1) return commaParts[commaParts.length - 1];
  return cleaned;
}

function isClearlyNotCityName(value, countryName) {
  const normalized = normalizeCountryName(value).toLocaleLowerCase();
  if (!normalized || /^none\.?$/i.test(normalized) || normalized === normalizeCountryName(countryName).toLocaleLowerCase()) return true;
  return /\b(?:airport|airfield|aerodrome|heliport|air terminal|university|college|department|ministry|province|district|region|county|prefecture)\b|https?:\/\/|www\.|\.(?:com|org|net|gov|edu)\b/i.test(normalized);
}

async function seedSouthAmericaManifestCities() {
  const manifestPath = path.resolve(__dirname, '..', '..', 'South_America_city_image_manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`South America manifest not found at ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const cityEntries = Array.isArray(manifest?.cities) ? manifest.cities : [];
  if (cityEntries.length === 0) {
    throw new Error('South America manifest is empty or missing a cities array.');
  }

  const continent = await prisma.continent.upsert({
    where: { name: 'South America' },
    update: {},
    create: { name: 'South America' },
  });

  const workbookPath = path.resolve(__dirname, '..', '..', 'Data', 'South_America.xlsx');
  const workbook = xlsx.readFile(workbookPath);
  const sourceRows = xlsx.utils.sheet_to_json(workbook.Sheets.City_Details, { defval: null });
  const sourceProfiles = new Map();
  for (const row of sourceRows) {
    const countryCode = getCountryAlpha2(row.Country);
    const cityKey = normalizeCityKey(row.City);
    if (!countryCode || !cityKey) continue;
    sourceProfiles.set(`${countryCode}:${cityKey}`, getSouthAmericaWorkbookProfile(row));
  }

  const seenCountries = new Map();
  for (const entry of cityEntries) {
    const countryName = String(entry.country || '').trim();
    const countryCode = String(entry.country_code || entry.countryCode || '').trim().toUpperCase();
    if (!countryName || !countryCode) continue;
    seenCountries.set(countryCode, countryName);
  }

  for (const [countryCode, countryName] of seenCountries.entries()) {
    await prisma.country.upsert({
      where: { code: countryCode },
      update: { name: countryName, continentId: continent.id },
      create: { code: countryCode, name: countryName, continentId: continent.id },
    });
  }

  let created = 0;
  let updated = 0;
  let duplicateRowsUnverified = 0;
  const seenSlugs = new Set();

  for (const entry of cityEntries) {
    const countryCode = String(entry.country_code || entry.countryCode || '').trim().toUpperCase();
    const cityName = String(entry.city || entry.name || '').trim();
    const filename = String(entry.filename || '').trim();
    if (!countryCode || !cityName || !filename || path.extname(filename).toLowerCase() !== '.webp') continue;

    const slug = path.basename(filename, path.extname(filename)).toLowerCase();
    if (!slug.startsWith(`${countryCode.toLowerCase()}-`)) continue;
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const existing = await prisma.city.findUnique({ where: { slug } });
    const sourceCity = String(entry.source_city || '').trim();
    const workbookProfile = sourceProfiles.get(`${countryCode}:${normalizeCityKey(cityName)}`)
      || sourceProfiles.get(`${countryCode}:${normalizeCityKey(sourceCity)}`)
      || {};
    const profile = mergeSouthAmericaProfiles(workbookProfile, existing?.profile);
    const payload = { slug, name: cityName, countryCode, isVerifiedCity: true, ...(Object.keys(profile).length ? { profile } : {}) };

    if (existing) {
      await prisma.city.update({ where: { slug }, data: payload });
      updated += 1;
    } else {
      await prisma.city.create({ data: payload });
      created += 1;
    }

    const duplicates = await prisma.city.updateMany({
      where: { countryCode, name: cityName, slug: { not: slug }, isVerifiedCity: true },
      data: { isVerifiedCity: false },
    });
    duplicateRowsUnverified += duplicates.count;
  }

  return { continentName: 'South America', countryCount: seenCountries.size, cityCount: seenSlugs.size, created, updated, duplicateRowsUnverified };
}

async function main() {
  const normalizedTargetSheet = targetSheet ? targetSheet.trim().toLowerCase() : '';
  if (normalizedTargetSheet === 'south america' || normalizedTargetSheet === 'south_america' || normalizedTargetSheet === 'south-america' || normalizedTargetSheet === 'city_details') {
    const result = await seedSouthAmericaManifestCities();
    console.log('Seeded South America manifest records');
    console.log(JSON.stringify(result, null, 2));
    await prisma.$disconnect();
    return;
  }

  const wbPath = path.resolve(__dirname, '..', '..', 'Data', 'Big City Info (1).xlsx');
  console.log('Reading', wbPath);
  const wb = xlsx.readFile(wbPath);
  const sheets = wb.SheetNames;
  const wsNames = new Set(sheets);

  const continentNameToRecord = new Map();
  for (const name of sheets) {
    const rec = await prisma.continent.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    continentNameToRecord.set(name, rec);
  }

  const countriesByName = new Map();
  const importSheets = targetSheet ? [targetSheet] : sheets;
  console.log('Import target sheets:', importSheets.join(', '));

  for (const sheetName of importSheets) {
    if (!wsNames.has(sheetName)) {
      throw new Error(`Sheet not found in workbook: ${sheetName}`);
    }
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
    if (rows.length === 0) continue;
    const headers = Object.keys(rows[0]).map((header) => normalizeCountryName(header)).filter(Boolean);
    for (const header of headers) {
      if (countriesByName.has(header)) continue;
      const alpha2 = getCountryAlpha2(header);
      if (!alpha2) {
        throw new Error(`Unable to resolve ISO code for country name: ${header}`);
      }
      const officialName = getCountryNameFromCode(alpha2) || header;
      countriesByName.set(header, {
        name: officialName,
        code: alpha2,
        continent: sheetName,
      });
    }
  }

  let countryCreated = 0;
  let countryUpdated = 0;
  for (const [countryName, country] of countriesByName.entries()) {
    const continentRec = continentNameToRecord.get(country.continent);
    if (!continentRec) {
      throw new Error(`Missing continent record for ${country.continent}`);
    }
    const existing = await prisma.country.findUnique({ where: { code: country.code } });
    if (existing) {
      await prisma.country.update({
        where: { code: country.code },
        data: { name: country.name, continentId: continentRec.id },
      });
      countryUpdated += 1;
    } else {
      await prisma.country.create({
        data: { code: country.code, name: country.name, continentId: continentRec.id },
      });
      countryCreated += 1;
    }
  }

  let cityCreated = 0;
  let cityRowsSkippedForReview = 0;
  const seenCitySlugs = new Set();
  const cityImportSheets = targetSheet ? [targetSheet] : sheets;
  for (const sheetName of cityImportSheets) {
    if (!wsNames.has(sheetName)) {
      throw new Error(`Sheet not found in workbook: ${sheetName}`);
    }
    const sheet = wb.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
    if (rows.length === 0) continue;
    const headers = Object.keys(rows[0]).map((header) => normalizeCountryName(header)).filter(Boolean);
    for (const row of rows) {
      for (const header of headers) {
        const cellValue = row[header];
        const country = countriesByName.get(header);
        if (!country || !cellValue) continue;
        const cityName = extractCityName(cellValue);
        if (!cityName) continue;
        if (isClearlyNotCityName(cityName, country.name)) {
          cityRowsSkippedForReview += 1;
          console.warn(`Skipping unverified non-city label for ${country.name}: ${cityName}`);
          continue;
        }
        const citySlug = `${country.code.toLowerCase()}-${slugify(cityName)}`;
        if (seenCitySlugs.has(citySlug)) continue;
        seenCitySlugs.add(citySlug);
        await prisma.city.upsert({
          where: { slug: citySlug },
          create: { slug: citySlug, name: cityName, countryCode: country.code },
          update: { name: cityName, countryCode: country.code, isVerifiedCity: false },
        });
        cityCreated += 1;
      }
    }
  }

  let canonicalImageCityRecordsCreated = 0;
  for (const city of CANONICAL_IMAGE_CITY_RECORDS) {
    const existing = await prisma.city.findUnique({ where: { slug: city.slug } });
    await prisma.city.upsert({
      where: { slug: city.slug },
      create: { ...city, isVerifiedCity: true },
      update: { name: city.name, countryCode: city.countryCode, isVerifiedCity: true },
    });
    if (!existing) canonicalImageCityRecordsCreated += 1;
  }

  const deletedCities = await prisma.$executeRaw`DELETE FROM "City" WHERE CHAR_LENGTH("countryCode") != 2`;
  const deletedCountries = await prisma.$executeRaw`DELETE FROM "Country" WHERE CHAR_LENGTH("code") != 2`;
  const deletedEvents = await prisma.$executeRaw`DELETE FROM "Event" WHERE "countryCode" IS NOT NULL AND CHAR_LENGTH("countryCode") != 2`;

  const continentCount = await prisma.continent.count();
  const countryCount = await prisma.country.count();
  const cityCount = await prisma.city.count();

  console.log('Import complete');
  console.log('Continents in DB:', continentCount);
  console.log('Countries in DB:', countryCount);
  console.log('Cities in DB:', cityCount);
  console.log('Country created:', countryCreated, 'updated:', countryUpdated);
  console.log('City records created:', cityCreated);
  console.log('Canonical image city records created:', canonicalImageCityRecordsCreated);
  console.log('City labels skipped for verification:', cityRowsSkippedForReview);
  console.log('Deleted invalid country rows:', deletedCountries);
  console.log('Deleted invalid city rows:', deletedCities);
  console.log('Deleted invalid event rows:', deletedEvents);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
