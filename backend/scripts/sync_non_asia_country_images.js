require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const manifestPath = path.join(__dirname, '..', 'data', 'non_asia_country_image_manifest.json');
const imageDirectory = path.join(__dirname, '..', 'public', 'Images', 'Country images');
const imagePrefix = '/images/Country%20images/';

function slugify(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function imagePathFor(entry) {
  return `${entry.code.toLowerCase()}-${slugify(entry.country)}.webp`;
}

function writeManifest(manifest) {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function verifyWebp(filePath) {
  const metadata = await sharp(filePath, { failOn: 'error' }).metadata();
  if (metadata.format !== 'webp' || !metadata.width || !metadata.height || Math.min(metadata.width, metadata.height) < 500 || Math.max(metadata.width, metadata.height) < 1000) {
    throw new Error(`Invalid or undersized WebP (${metadata.format || 'unknown'} ${metadata.width || 0}x${metadata.height || 0})`);
  }
  return { width: metadata.width, height: metadata.height };
}

async function syncEntry(entry) {
  entry.imageFilename = imagePathFor(entry);
  entry.localImagePath = `${imagePrefix}${entry.imageFilename}`;
  entry.downloadStatus = 'pending';
  entry.webpConversionStatus = 'pending';
  entry.databaseUpdateStatus = 'pending';
  entry.verificationStatus = 'pending';
  entry.error = null;

  const country = await prisma.country.findUnique({
    where: { code: entry.code },
    select: { code: true, name: true, profile: true, continent: { select: { name: true } } },
  });
  if (!country) throw new Error(`Country ${entry.code} is absent from the live database`);
  if (country.continent?.name === 'Asia') throw new Error(`Refusing to modify Asia country ${entry.code}`);

  const outputPath = path.join(imageDirectory, entry.imageFilename);
  fs.mkdirSync(imageDirectory, { recursive: true });
  const alreadyAssigned = country.profile && typeof country.profile === 'object' && !Array.isArray(country.profile)
    ? country.profile.heroImageUrl === entry.localImagePath
    : false;

  let dimensions;
  if (alreadyAssigned && fs.existsSync(outputPath)) {
    dimensions = await verifyWebp(outputPath);
    entry.downloadStatus = 'retained-existing-local-file';
    entry.webpConversionStatus = 'already-webp';
  } else {
    const sourceUrl = new URL(entry.sourceUrl);
    const sourceHosts = {
      'images.pexels.com': 'Pexels',
      'upload.wikimedia.org': 'Wikimedia Commons',
      'live.staticflickr.com': 'Flickr',
    };
    if (sourceHosts[sourceUrl.hostname] !== entry.sourceWebsite) throw new Error(`Unapproved image host/source: ${sourceUrl.hostname}`);
    if (entry.sourceWebsite !== 'Pexels' && (!entry.licenseUrl || !entry.creator || !entry.attribution)) {
      throw new Error('Open-license sources require creator, license URL, and attribution metadata');
    }
    const response = await fetch(sourceUrl, { headers: { 'User-Agent': 'BigCitiesCountryImageImporter/1.0' }, signal: AbortSignal.timeout(30000) });
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
    const temporaryPath = `${outputPath}.tmp`;
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    fs.writeFileSync(outputPath, webpBuffer);
    entry.sourceContentType = contentType;
    entry.sourceBytes = sourceBuffer.length;
    entry.sourceDimensions = { width: sourceMetadata.width, height: sourceMetadata.height };
    entry.webpBytes = webpBuffer.length;
    entry.downloadStatus = 'downloaded';
    entry.webpConversionStatus = sourceMetadata.format === 'webp' ? 'validated-webp' : `converted-${sourceMetadata.format || 'image'}-to-webp`;
  }

  entry.outputDimensions = dimensions;
  const profile = country.profile && typeof country.profile === 'object' && !Array.isArray(country.profile)
    ? { ...country.profile }
    : {};
  if (profile.heroImageUrl !== entry.localImagePath) {
    profile.heroImageUrl = entry.localImagePath;
    await prisma.country.update({ where: { code: entry.code }, data: { profile } });
  }
  entry.databaseUpdateStatus = 'updated-or-already-current';
  entry.verificationStatus = 'source-caption, image-decode, WebP-format, and-dimensions-passed';
  entry.verifiedAt = new Date().toISOString();
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const batchArg = process.argv.find((arg) => arg.startsWith('--batch='));
  const sizeArg = process.argv.find((arg) => arg.startsWith('--size='));
  const batchNumber = batchArg ? Number.parseInt(batchArg.split('=')[1], 10) : 1;
  const batchSize = sizeArg ? Number.parseInt(sizeArg.split('=')[1], 10) : 20;
  if (!Number.isInteger(batchNumber) || batchNumber < 1 || !Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error('Use positive integer values for --batch and --size');
  }
  const start = (batchNumber - 1) * batchSize;
  const batch = manifest.countries.slice(start, start + batchSize);
  if (!batch.length) throw new Error(`No countries found for batch ${batchNumber}`);

  for (const entry of batch) {
    try {
      await syncEntry(entry);
      console.log(`${entry.code}: ${entry.downloadStatus}; ${entry.webpConversionStatus}; ${entry.databaseUpdateStatus}; ${entry.outputDimensions.width}x${entry.outputDimensions.height}`);
    } catch (error) {
      entry.downloadStatus = entry.downloadStatus === 'pending' ? 'failed' : entry.downloadStatus;
      entry.webpConversionStatus = entry.webpConversionStatus === 'pending' ? 'not-converted' : entry.webpConversionStatus;
      entry.databaseUpdateStatus = entry.databaseUpdateStatus === 'pending' ? 'not-updated' : entry.databaseUpdateStatus;
      entry.verificationStatus = 'failed';
      entry.error = error.message;
      console.error(`${entry.code}: ${error.message}`);
    }
    writeManifest(manifest);
  }

  const failures = batch.filter((entry) => entry.verificationStatus !== 'source-caption, image-decode, WebP-format, and-dimensions-passed').length;
  if (failures) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});