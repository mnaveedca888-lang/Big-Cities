const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const sharp = require('sharp');

const prisma = new PrismaClient();
const root = path.resolve(__dirname, '..', '..');
const imageRoot = path.resolve(__dirname, '..', 'public', 'Images');
const eventImageDir = path.join(imageRoot, 'Asia historical events');
const manifestPath = path.join(root, 'ASIA_HISTORICAL_EVENT_IMAGE_COLLECTION_MANIFEST.md');
const supportedExtensions = new Set(['.webp', '.jpg', '.jpeg', '.png', '.gif', '.tif', '.tiff']);
const uuidPattern = /[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/gi;
const verifiedCorrections = new Map([
  ['7304fbe7-089d-4b78-ae38-15dc3630e0ca', 'Pakistan — Basant (Traditional Kite Festival).jpg'],
]);
const knownFilenameVariants = new Map([
  ['MM|yangon founded/renamed by king alaungpaya', 'Yangon FoundedRenamed by King Alaungpaya.jpg'],
  ['PK|basant', 'Pakistan — Basant.jpg'],
  ['PK|basant (traditional kite festival)', 'Pakistan — Basant (Traditional Kite Festival).jpg'],
  ['PK|lok mela', 'lok-mela-2017-at-lok-virsa-islamabad-3.webp'],
  ['PK|national horse & cattle show', 'Horse-and-Cattle-Show.webp'],
]);

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function compact(value) {
  return normalize(value).replace(/ /g, '');
}

function localPathForImage(image) {
  if (!image || !image.startsWith('/images/')) return null;
  try {
    const pathname = image.split(/[?#]/, 1)[0];
    const relativePath = pathname.slice('/images/'.length).split('/').map(decodeURIComponent);
    return path.join(imageRoot, ...relativePath);
  } catch {
    return null;
  }
}

function urlForFile(filename) {
  return `/images/${encodeURIComponent('Asia historical events')}/${encodeURIComponent(filename)}`;
}

function manifestMappings() {
  const content = fs.readFileSync(manifestPath, 'utf8');
  const mappings = new Map();
  const conflicts = [];
  for (const line of content.split(/\r?\n/)) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').map((cell) => cell.trim());
    if (cells.length < 6) continue;
    const ids = cells[2].match(uuidPattern) ?? [];
    const asset = /\[([^\]]+\.(?:webp|jpg|jpeg|png|gif|tif|tiff))\]\(/i.exec(cells[4]);
    if (!asset) continue;
    for (const id of ids) {
      const previous = mappings.get(id);
      if (previous && previous !== asset[1]) conflicts.push({ id, files: [previous, asset[1]] });
      else mappings.set(id, asset[1]);
    }
  }
  return { mappings, conflicts };
}

function filenameScore(event, filename) {
  const title = normalize(event.title);
  const slug = String(event.slug ?? '')
    .replace(/^[a-z]{2}-/i, '')
    .replace(/-regional$/i, '')
    .replace(/-/g, ' ');
  const parentheticalBase = String(event.title).split(' (')[0];
  const variants = [
    [title, 120],
    [normalize(slug), 110],
    [normalize(parentheticalBase), 100],
  ].filter(([value]) => value);
  const aliases = new Map([
    ['yangon founded/renamed by king alaungpaya', 'Yangon FoundedRenamed by King Alaungpaya'],
    ['national horse & cattle show', 'Horse-and-Cattle-Show'],
    ['lok mela', 'lok-mela-2017-at-lok-virsa-islamabad-3'],
  ]);
  const alias = aliases.get(String(event.title).toLowerCase());
  if (alias && compact(filename) === compact(alias)) return 125;

  const stem = normalize(path.parse(filename).name);
  const codePrefix = /^([A-Z]{2})-/i.exec(filename);
  if (codePrefix && codePrefix[1].toUpperCase() !== String(event.countryCode).toUpperCase()) return 0;
  const stems = [stem];
  const country = normalize(event.country);
  if (stem.startsWith(`${country} `)) stems.push(stem.slice(country.length + 1));
  if (/^[a-z]{2} /.test(stem)) stems.push(stem.slice(3));

  let best = 0;
  for (const candidateStem of stems) {
    for (const [variant, exactScore] of variants) {
      if (candidateStem === variant) best = Math.max(best, exactScore);
      else if (candidateStem.includes(variant)) best = Math.max(best, exactScore - 5);
      else if (variant.includes(candidateStem) && candidateStem.length > 7) best = Math.max(best, exactScore - 15);
      else if (compact(candidateStem) === compact(variant)) best = Math.max(best, exactScore - 1);
    }
  }
  return best;
}

async function chooseFile(event, filenames, explicitMappings) {
  const explicit = explicitMappings.get(event.id);
  const knownVariant = knownFilenameVariants.get(`${String(event.countryCode).toUpperCase()}|${String(event.title).toLowerCase()}`);
  if (knownVariant && filenames.includes(knownVariant)) {
    const filePath = path.join(eventImageDir, knownVariant);
    try {
      const metadata = await sharp(filePath, { failOn: 'error' }).metadata();
      if (metadata.width && metadata.height) {
        return { file: knownVariant, image: urlForFile(knownVariant), format: metadata.format, width: metadata.width, height: metadata.height };
      }
    } catch {}
    return { invalid: knownVariant };
  }
  const ranked = explicit
    ? [{ file: explicit, score: 1000 }]
    : filenames
      .map((file) => ({ file, score: filenameScore(event, file) }))
      .filter((candidate) => candidate.score > 0)
      .sort((left, right) => right.score - left.score || left.file.localeCompare(right.file));

  if (!ranked.length) return { missing: true };
  const bestScore = ranked[0].score;
  const best = [...new Set(ranked.filter((candidate) => candidate.score === bestScore).map((candidate) => candidate.file))];
  if (best.length !== 1) return { ambiguous: best };

  const file = best[0];
  const filePath = path.join(eventImageDir, file);
  try {
    const metadata = await sharp(filePath, { failOn: 'error' }).metadata();
    if (!metadata.width || !metadata.height) return { invalid: file };
    return { file, image: urlForFile(file), format: metadata.format, width: metadata.width, height: metadata.height };
  } catch {
    return { invalid: file };
  }
}

async function main() {
  const countries = await prisma.country.findMany({
    where: { continent: { name: 'Asia' } },
    select: { code: true },
  });
  const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  const historicalCategoryIds = new Set(
    categories.filter((category) => /historical/i.test(`${category.name} ${category.slug}`)).map((category) => category.id),
  );
  const countryCodes = countries.map((country) => country.code);
  const allRows = await prisma.event.findMany({
    where: { countryCode: { in: countryCodes } },
    select: { id: true, slug: true, title: true, countryCode: true, categoryId: true, image: true },
    orderBy: [{ countryCode: 'asc' }, { title: 'asc' }],
  });
  const collectionRows = allRows.filter((event) => !event.categoryId || historicalCategoryIds.has(event.categoryId));
  const targetRowsById = new Map(collectionRows.filter((event) => {
    if (!event.image) return true;
    const localPath = localPathForImage(event.image);
    return localPath !== null && !fs.existsSync(localPath);
  }).map((event) => [event.id, event]));
  for (const [eventId, filename] of verifiedCorrections) {
    const event = collectionRows.find((row) => row.id === eventId);
    if (event && event.image !== urlForFile(filename)) targetRowsById.set(event.id, event);
  }
  const targetRows = [...targetRowsById.values()];
  const { mappings: explicitMappings, conflicts: manifestConflicts } = manifestMappings();
  for (const [eventId, filename] of verifiedCorrections) explicitMappings.set(eventId, filename);
  const filenames = fs.readdirSync(eventImageDir).filter((filename) => supportedExtensions.has(path.extname(filename).toLowerCase()));
  const mapping = [];
  const missing = [];
  const ambiguous = [];
  const invalid = [];

  for (const event of targetRows) {
    const result = await chooseFile(event, filenames, explicitMappings);
    if (result.missing) missing.push({ country: event.countryCode, event: event.title });
    else if (result.ambiguous) ambiguous.push({ country: event.countryCode, event: event.title, files: result.ambiguous });
    else if (result.invalid) invalid.push({ country: event.countryCode, event: event.title, file: result.invalid });
    else mapping.push({ id: event.id, countryCode: event.countryCode, title: event.title, currentImage: event.image, ...result });
  }

  const preflight = {
    asiaCountries: countries.length,
    asiaEventRows: allRows.length,
    historicalCollectionRows: collectionRows.length,
    targetRows: targetRows.length,
    mappedRows: mapping.length,
    missing,
    ambiguous,
    invalid,
    manifestConflicts,
  };

  if (missing.length || ambiguous.length || invalid.length || manifestConflicts.length) {
    console.log(JSON.stringify({ status: 'BLOCKED_NO_DATABASE_WRITES', ...preflight }, null, 2));
    process.exitCode = 2;
    return;
  }

  if (!process.argv.includes('--commit')) {
    console.log(JSON.stringify({ status: 'VERIFIED_READY_NO_DATABASE_WRITES', ...preflight }, null, 2));
    return;
  }

  const updateRows = mapping.filter((entry) => entry.currentImage !== entry.image);
  let updated = 0;
  await prisma.$transaction(async (transaction) => {
    for (const entry of updateRows) {
      const result = await transaction.event.updateMany({
        where: { id: entry.id, image: entry.currentImage },
        data: { image: entry.image },
      });
      if (result.count !== 1) throw new Error(`Concurrent change or missing event while updating ${entry.id}`);
      updated += result.count;
    }
  });

  const finalRows = await prisma.event.findMany({
    where: { countryCode: { in: countryCodes } },
    select: { id: true, countryCode: true, image: true },
  });
  const finalWithImage = finalRows.filter((event) => Boolean(event.image));
  const finalNull = finalRows.filter((event) => !event.image);
  const brokenTargetPaths = updateRows.filter((entry) => {
    const localPath = localPathForImage(entry.image);
    return !localPath || !fs.existsSync(localPath);
  });
  const sharedFiles = new Map();
  for (const entry of mapping) sharedFiles.set(entry.file, [...(sharedFiles.get(entry.file) ?? []), entry.id]);
  const duplicateFileMappings = [...sharedFiles.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([file, ids]) => ({ file, eventIds: ids }));

  console.log(JSON.stringify({
    status: 'IMPLEMENTED_AND_AUDITED',
    ...preflight,
    totalAsiaEventRows: finalRows.length,
    asiaRowsWithImages: finalWithImage.length,
    asiaRowsStillNull: finalNull.length,
    rowsUpdated: updated,
    updatedPathsMissingFromFolder: brokenTargetPaths,
    duplicateFileMappings,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());