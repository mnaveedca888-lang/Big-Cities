require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const manifestPath = path.join(__dirname, '..', 'data', 'africa_city_image_manifest.json');
const sourcePath = path.join(__dirname, '..', 'data', 'africa_city_image_sources.json');
const imageDirectory = path.join(__dirname, '..', 'public', 'Images', 'Africa cities images');
const imagePrefix = '/images/Africa%20cities%20images/';
const manualCityBySlug = {
  'ga-m-vengue-el-hadj-omar-bongo-ondimba-international-airport': 'Franceville',
  'cg-agostinho-neto-international-airport': 'Pointe-Noire',
  'ma-tangier-ibn-battouta-airport': 'Tangier',
  'bi-burundi': 'Bujumbura',
  'ma-hassan-i-airport': 'Laayoune',
  'ma-nador-al-aaroui-international-airport': 'Nador',
  'mg-marillac-airport': 'Toliara',
  'mg-toamasina-ambalamanasy-airport': 'Toamasina',
  'mz-pemba-airport': 'Pemba',
  'ng-sam-mbakwe-international-cargo-airport': 'Owerri',
  'ng-umaru-musa-yar-adua-international-airport': 'Katsina',
  'td-hassan-djamous-international-airport': "N'Djamena",
};

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, '-');
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function cityTargetKey(entry) {
  return `${entry.countryCode}|${normalize(entry.actualCity)}`;
}

function mapActualCity(city, cityDetails, codeByCountryName) {
  const countryCities = cityDetails.filter((row) => codeByCountryName.get(normalize(row['Country Name'])) === city.countryCode);
  const direct = countryCities.find((row) => normalize(row.City) === normalize(city.name));
  if (direct) return { actualCity: direct.City, mappingMethod: 'City_Details city-name match' };

  const airportMatch = countryCities.find((row) => {
    const airport = normalize(row.Airport);
    return airport && airport.includes(normalize(city.name));
  });
  if (airportMatch) return { actualCity: airportMatch.City, mappingMethod: 'City_Details airport-field match' };

  const actualCity = manualCityBySlug[city.slug];
  if (actualCity) return { actualCity, mappingMethod: 'reviewed airport-to-city mapping' };
  return null;
}

async function prepareManifest() {
  if (fs.existsSync(manifestPath)) throw new Error(`Refusing to overwrite existing manifest: ${manifestPath}`);
  const workbookPath = path.resolve(__dirname, '..', '..', 'Data', 'Africa.xlsx');
  const workbook = xlsx.readFile(workbookPath);
  const cityDetails = xlsx.utils.sheet_to_json(workbook.Sheets.City_Details, { defval: null });
  const countries = await prisma.country.findMany({
    where: { continent: { name: 'Africa' } },
    select: { code: true, name: true },
    orderBy: { code: 'asc' },
  });
  if (countries.length !== 54) throw new Error(`Expected 54 Africa countries; found ${countries.length}`);
  const codeByCountryName = new Map(countries.map((country) => [normalize(country.name), country.code]));
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  const cities = await prisma.city.findMany({
    where: { countryCode: { in: countries.map((country) => country.code) } },
    select: { slug: true, name: true, countryCode: true },
    orderBy: [{ countryCode: 'asc' }, { slug: 'asc' }],
  });
  if (cities.length !== 143) throw new Error(`Expected 143 Africa city records; found ${cities.length}`);

  const entries = cities.map((city) => {
    const mapping = mapActualCity(city, cityDetails, codeByCountryName);
    if (!mapping) throw new Error(`No actual-city mapping found for ${city.countryCode}|${city.slug}`);
    const country = countryByCode.get(city.countryCode);
    const imageFilename = `${city.countryCode.toLowerCase()}-${slugify(mapping.actualCity)}.webp`;
    return {
      country: country.name,
      countryCode: city.countryCode,
      existingCityName: city.name,
      citySlug: city.slug,
      actualCity: mapping.actualCity,
      mappingMethod: mapping.mappingMethod,
      imageFilename,
      localImagePath: `${imagePrefix}${imageFilename}`,
      sourceUrl: null,
      sourcePage: null,
      sourceWebsite: null,
      sourceType: null,
      licenseUrl: null,
      caption: null,
      downloadStatus: 'not-started',
      webpConversionStatus: 'not-started',
      databaseUpdateStatus: 'not-started',
      verificationStatus: 'not-started',
      error: null,
    };
  });
  const targets = [...new Map(entries.map((entry) => [cityTargetKey(entry), {
    key: cityTargetKey(entry),
    country: entry.country,
    countryCode: entry.countryCode,
    actualCity: entry.actualCity,
  }])).values()];
  if (targets.length !== 141) throw new Error(`Expected 141 distinct city targets; found ${targets.length}`);

  writeJson(manifestPath, {
    region: 'Africa',
    imageDirectory: 'backend/public/Images/Africa cities images',
    publicPathPrefix: imagePrefix,
    licenseUrl: 'https://www.pexels.com/license/',
    countriesChecked: countries.length,
    cityRecords: entries.length,
    uniqueActualCities: targets.length,
    targets,
    cities: entries,
  });
  console.log(JSON.stringify({ countries: countries.length, cityRecords: entries.length, uniqueActualCities: targets.length, manifestPath }, null, 2));
}

async function mergeSources() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const sources = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const sourceByKey = new Map(sources.map((source) => [source.key, source]));
  const missing = manifest.targets.filter((target) => !sourceByKey.has(target.key));
  if (missing.length) throw new Error(`Missing source candidates for ${missing.length} city targets: ${missing.map((target) => target.key).join(', ')}`);

  for (const entry of manifest.cities) {
    const source = sourceByKey.get(cityTargetKey(entry));
    const imageUrl = new URL(source.sourceUrl);
    const sourcePage = new URL(source.sourcePage);
    const validPexels = source.sourceWebsite === 'Pexels'
      && imageUrl.hostname === 'images.pexels.com'
      && sourcePage.hostname === 'www.pexels.com'
      && sourcePage.pathname.startsWith('/photo/');
    const validFlickr = source.sourceWebsite === 'Flickr'
      && imageUrl.hostname === 'live.staticflickr.com'
      && ['www.flickr.com', 'flickr.com'].includes(sourcePage.hostname)
      && /^\/photos\/[^/]+\/\d+\/?$/.test(sourcePage.pathname)
      && /^https:\/\/creativecommons\.org\/licenses\//.test(source.licenseUrl || '')
      && source.creator
      && source.attribution;
    const validCommons = source.sourceWebsite === 'Wikimedia Commons'
      && imageUrl.hostname === 'upload.wikimedia.org'
      && sourcePage.hostname === 'commons.wikimedia.org'
      && (source.licenseUrl === 'Public domain' || /^https:\/\/creativecommons\.org\/licenses\//.test(source.licenseUrl || ''))
      && source.creator
      && source.attribution;
    if (!validPexels && !validFlickr && !validCommons) throw new Error(`Unapproved or incomplete source for ${entry.citySlug}`);
    if (!source.caption || !normalize(source.caption).includes(normalize(entry.actualCity))) {
      throw new Error(`Source caption does not identify ${entry.actualCity} for ${entry.citySlug}`);
    }
    entry.sourceUrl = source.sourceUrl;
    entry.sourcePage = source.sourcePage;
    entry.sourceWebsite = source.sourceWebsite;
    entry.sourceType = source.sourceType || (validPexels ? 'Pexels free stock photograph' : validFlickr ? 'Flickr Creative Commons photograph' : 'Wikimedia Commons licensed photograph');
    entry.licenseUrl = source.licenseUrl || (validPexels ? 'https://www.pexels.com/license/' : null);
    entry.creator = source.creator || null;
    entry.attribution = source.attribution || null;
    entry.caption = source.caption;
  }
  writeJson(manifestPath, manifest);
  console.log(JSON.stringify({ sourcedCityRecords: manifest.cities.length, uniquePhotoSources: sourceByKey.size, missing: 0 }, null, 2));
}

async function verifyWebp(filePath) {
  const metadata = await sharp(filePath, { failOn: 'error' }).metadata();
  if (metadata.format !== 'webp' || !metadata.width || !metadata.height || Math.min(metadata.width, metadata.height) < 500 || Math.max(metadata.width, metadata.height) < 1000) {
    throw new Error(`Invalid or undersized WebP (${metadata.format || 'unknown'} ${metadata.width || 0}x${metadata.height || 0})`);
  }
  return { width: metadata.width, height: metadata.height };
}

async function syncEntry(entry) {
  const country = await prisma.country.findUnique({
    where: { code: entry.countryCode },
    select: { code: true, continent: { select: { name: true } } },
  });
  if (!country || country.continent?.name !== 'Africa') throw new Error(`Refusing non-African record ${entry.countryCode}|${entry.citySlug}`);
  const existing = await prisma.city.findUnique({
    where: { slug: entry.citySlug },
    select: { slug: true, name: true, countryCode: true, profile: true },
  });
  if (!existing || existing.countryCode !== entry.countryCode || existing.name !== entry.existingCityName) {
    throw new Error(`City identity changed; refusing update for ${entry.countryCode}|${entry.citySlug}`);
  }
  const profile = existing.profile && typeof existing.profile === 'object' && !Array.isArray(existing.profile) ? existing.profile : {};
  if (profile.heroImageUrl && profile.heroImageUrl !== entry.localImagePath) {
    throw new Error(`Existing hero image must be reviewed before replacement: ${entry.citySlug}`);
  }

  const outputPath = path.join(imageDirectory, entry.imageFilename);
  fs.mkdirSync(imageDirectory, { recursive: true });
  let dimensions;
  if (fs.existsSync(outputPath)) {
    dimensions = await verifyWebp(outputPath);
    entry.downloadStatus = 'reused-existing-local-file';
    entry.webpConversionStatus = 'already-webp';
  } else {
    const sourceUrl = new URL(entry.sourceUrl);
    const approvedPexels = entry.sourceWebsite === 'Pexels'
      && sourceUrl.hostname === 'images.pexels.com'
      && entry.licenseUrl === 'https://www.pexels.com/license/';
    const approvedFlickr = entry.sourceWebsite === 'Flickr'
      && sourceUrl.hostname === 'live.staticflickr.com'
      && /^https:\/\/creativecommons\.org\/licenses\//.test(entry.licenseUrl || '')
      && entry.creator
      && entry.attribution;
    const approvedCommons = entry.sourceWebsite === 'Wikimedia Commons'
      && sourceUrl.hostname === 'upload.wikimedia.org'
      && entry.sourcePage?.startsWith('https://commons.wikimedia.org/')
      && (entry.licenseUrl === 'Public domain' || /^https:\/\/creativecommons\.org\/licenses\//.test(entry.licenseUrl || ''))
      && entry.creator
      && entry.attribution;
    if (!approvedPexels && !approvedFlickr && !approvedCommons) throw new Error(`Unapproved or incomplete image source: ${sourceUrl.hostname}`);
    const response = await fetch(entry.sourceUrl, {
      headers: { 'User-Agent': 'BigCitiesAfricaCityImageImporter/1.0' },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Image source returned HTTP ${response.status}`);
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) throw new Error(`Response is not an image: ${contentType || 'missing content type'}`);
    const sourceBuffer = Buffer.from(await response.arrayBuffer());
    const sourceMetadata = await sharp(sourceBuffer, { failOn: 'error' }).metadata();
    if (!sourceMetadata.width || !sourceMetadata.height || Math.min(sourceMetadata.width, sourceMetadata.height) < 500 || Math.max(sourceMetadata.width, sourceMetadata.height) < 1000) {
      throw new Error(`Source image is undersized (${sourceMetadata.width || 0}x${sourceMetadata.height || 0})`);
    }
    const webpBuffer = await sharp(sourceBuffer, { failOn: 'error' })
      .rotate()
      .resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86, effort: 5 })
      .toBuffer();
    dimensions = await verifyWebp(webpBuffer);
    fs.writeFileSync(outputPath, webpBuffer);
    entry.sourceContentType = contentType;
    entry.sourceDimensions = { width: sourceMetadata.width, height: sourceMetadata.height };
    entry.sourceBytes = sourceBuffer.length;
    entry.webpBytes = webpBuffer.length;
    entry.downloadStatus = 'downloaded';
    entry.webpConversionStatus = sourceMetadata.format === 'webp' ? 'validated-webp' : `converted-${sourceMetadata.format || 'image'}-to-webp`;
  }

  entry.outputDimensions = dimensions;
  await prisma.$executeRaw`
    UPDATE "City"
    SET "profile" = jsonb_set(COALESCE("profile", '{}'::jsonb), '{heroImageUrl}', to_jsonb(${entry.localImagePath}::text), true)
    WHERE "slug" = ${entry.citySlug} AND "countryCode" = ${entry.countryCode}
  `;
  entry.databaseUpdateStatus = 'updated-image-field-only';
  entry.verificationStatus = 'caption-city-match, image-decode, WebP-format, and-dimensions-passed';
  entry.error = null;
  entry.verifiedAt = new Date().toISOString();
}

async function syncBatch() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const batchArg = process.argv.find((arg) => arg.startsWith('--batch='));
  const sizeArg = process.argv.find((arg) => arg.startsWith('--size='));
  const batchNumber = batchArg ? Number.parseInt(batchArg.split('=')[1], 10) : 1;
  const batchSize = sizeArg ? Number.parseInt(sizeArg.split('=')[1], 10) : 20;
  if (!Number.isInteger(batchNumber) || batchNumber < 1 || !Number.isInteger(batchSize) || batchSize < 1) throw new Error('Use positive integers for --batch and --size');
  const start = (batchNumber - 1) * batchSize;
  const batch = manifest.cities.slice(start, start + batchSize);
  if (!batch.length) throw new Error(`No cities found for batch ${batchNumber}`);

  for (const entry of batch) {
    try {
      if (!entry.sourceUrl || !entry.sourcePage || !entry.caption) throw new Error('Missing verified image source metadata');
      await syncEntry(entry);
      console.log(`${entry.countryCode} ${entry.existingCityName} => ${entry.actualCity}: ${entry.downloadStatus}; ${entry.webpConversionStatus}; ${entry.databaseUpdateStatus}; ${entry.outputDimensions.width}x${entry.outputDimensions.height}`);
    } catch (error) {
      entry.downloadStatus = entry.downloadStatus === 'not-started' ? 'failed' : entry.downloadStatus;
      entry.webpConversionStatus = entry.webpConversionStatus === 'not-started' ? 'not-converted' : entry.webpConversionStatus;
      entry.databaseUpdateStatus = entry.databaseUpdateStatus === 'not-started' ? 'not-updated' : entry.databaseUpdateStatus;
      entry.verificationStatus = 'failed';
      entry.error = error.message;
      console.error(`${entry.citySlug}: ${error.message}`);
    }
    writeJson(manifestPath, manifest);
  }
  if (batch.some((entry) => entry.verificationStatus !== 'caption-city-match, image-decode, WebP-format, and-dimensions-passed')) process.exitCode = 1;
}

async function main() {
  if (process.argv.includes('--prepare')) return prepareManifest();
  if (process.argv.includes('--merge-sources')) return mergeSources();
  return syncBatch();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});