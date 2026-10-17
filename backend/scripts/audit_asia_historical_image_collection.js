const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const sharp = require('sharp');

const prisma = new PrismaClient();
const imageRoot = path.resolve(__dirname, '..', 'public', 'Images');
const eventImageDir = path.join(imageRoot, 'Asia historical events');
const outputPath = path.resolve(__dirname, '..', '..', 'ASIA_HISTORICAL_EVENT_IMAGE_COLLECTION.json');
const ignoredTokens = new Set(['historical', 'milestone', 'begins', 'began', 'ends', 'signed', 'day', 'of', 'the', 'as', 'in', 'and', 'for', 'to', 'over']);

function tokens(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 2 && !ignoredTokens.has(token));
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

function sourceMetadata(image) {
  const query = String(image ?? '').split('?')[1];
  const parameters = new URLSearchParams(query ?? '');
  return {
    source: parameters.get('source'),
    license: parameters.get('license'),
    credit: parameters.get('credit'),
  };
}

function localCandidates(event, files) {
  const eventTokens = new Set(tokens(`${event.title} ${event.slug}`));
  return files
    .filter((file) => file.slice(0, 2).toUpperCase() === event.countryCode.toUpperCase())
    .map((file) => {
      const matchingTokens = tokens(file).filter((token) => eventTokens.has(token));
      return { file, matchingTokens: [...new Set(matchingTokens)] };
    })
    .filter((candidate) => candidate.matchingTokens.length > 0)
    .sort((left, right) => right.matchingTokens.length - left.matchingTokens.length || left.file.localeCompare(right.file))
    .slice(0, 5);
}

async function main() {
  const previousReport = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, 'utf8')) : null;
  const countries = await prisma.country.findMany({
    where: { continent: { name: 'Asia' } },
    select: { code: true, name: true },
    orderBy: { code: 'asc' },
  });
  const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  const historicalCategories = categories.filter((category) => /historical/i.test(`${category.name} ${category.slug}`));
  const historicalCategoryIds = new Set(historicalCategories.map((category) => category.id));
  const countriesByCode = new Map(countries.map((country) => [country.code.toUpperCase(), country]));
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const rows = await prisma.event.findMany({
    where: { countryCode: { in: countries.map((country) => country.code) } },
    select: {
      id: true,
      title: true,
      slug: true,
      countryCode: true,
      categoryId: true,
      image: true,
      enabled: true,
      startAt: true,
      endAt: true,
    },
    orderBy: [{ countryCode: 'asc' }, { title: 'asc' }],
  });
  const previousRows = previousReport
    ? [...(previousReport.categoryDistribution ?? []).flatMap((category) => category.rows ?? []), ...(previousReport.unclassifiedRows ?? [])]
    : [];
  const previousImageById = new Map(previousRows.map((row) => [row.id, row.image]));
  const imageValueChanges = rows
    .filter((row) => previousImageById.has(row.id) && previousImageById.get(row.id) !== row.image)
    .map((row) => ({ id: row.id, previousImage: previousImageById.get(row.id), currentImage: row.image }));
  const historicalRows = rows.filter((row) => historicalCategoryIds.has(row.categoryId));
  const collectionRows = rows.filter((row) => !row.categoryId || historicalCategoryIds.has(row.categoryId));
  const categoryDistribution = categories.map((category) => {
    const categoryRows = rows.filter((row) => row.categoryId === category.id);
    return {
      category: category.name,
      slug: category.slug,
      totalRows: categoryRows.length,
      enabledRows: categoryRows.filter((row) => row.enabled).length,
      rows: categoryRows.map((row) => ({
        id: row.id,
        title: row.title,
        countryCode: row.countryCode,
        image: row.image,
        enabled: row.enabled,
        startAt: row.startAt,
      })),
    };
  });
  const knownCategoryIds = new Set(categories.map((category) => category.id));
  const localFiles = fs.readdirSync(eventImageDir).filter((file) => fs.statSync(path.join(eventImageDir, file)).isFile());
  const unclassifiedRows = rows
    .filter((row) => !row.categoryId || !knownCategoryIds.has(row.categoryId))
    .map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      countryCode: row.countryCode,
      categoryId: row.categoryId,
      image: row.image,
      enabled: row.enabled,
      startAt: row.startAt,
    }));
  const auditedRows = await Promise.all(collectionRows.map(async (row) => {
    const localPath = localPathForImage(row.image);
    const localExists = localPath ? fs.existsSync(localPath) : null;
    let imageMetadata = null;
    if (localExists) {
      try {
        const metadata = await sharp(localPath).metadata();
        imageMetadata = { format: metadata.format, width: metadata.width, height: metadata.height };
      } catch (error) {
        imageMetadata = { error: String(error.message || error) };
      }
    }
    return {
      country: countriesByCode.get(row.countryCode.toUpperCase())?.name ?? null,
      countryCode: row.countryCode,
      eventId: row.id,
      title: row.title,
      slug: row.slug,
      date: row.startAt,
      enabled: row.enabled,
      category: categoryById.get(row.categoryId)?.name ?? null,
      currentImage: row.image,
      ...sourceMetadata(row.image),
      localPath,
      localExists,
      imageMetadata,
      localCandidates: !row.image ? localCandidates(row, localFiles) : [],
      requiredAction: !row.image ? 'MISSING_IMAGE' : localPath && !localExists ? 'MISSING_FILE' : !localPath ? 'VERIFY_REMOTE_IMAGE' : imageMetadata?.error || !imageMetadata?.width || !imageMetadata?.height ? 'CORRUPT_LOCAL_IMAGE' : 'REVIEW_RELEVANCE',
    };
  }));
  const report = {
    generatedAt: new Date().toISOString(),
    countryCount: countries.length,
    countries,
    categories,
    totalAsiaEventRows: rows.length,
    preCollectionSnapshotRows: previousImageById.size,
    imageValueChangesSinceSnapshot: imageValueChanges,
    enabledAsiaEventRows: rows.filter((row) => row.enabled).length,
    asiaRowsWithImage: rows.filter((row) => row.image).length,
    asiaRowsWithoutImage: rows.filter((row) => !row.image).length,
    historicalCategoryIds: historicalCategories,
    collectionScope: 'Asia events with no assigned category plus Historical Commemoration category rows',
    collectionEventRows: collectionRows.length,
    enabledCollectionEventRows: collectionRows.filter((row) => row.enabled).length,
    collectionRowsWithImage: collectionRows.filter((row) => row.image).length,
    collectionRowsWithoutImage: collectionRows.filter((row) => !row.image).length,
    collectionRowsWithMissingLocalFile: auditedRows.filter((row) => row.localExists === false).length,
    collectionRowsWithUnreadableLocalImage: auditedRows.filter((row) => row.currentImage && row.localExists && (row.imageMetadata?.error || !row.imageMetadata?.width || !row.imageMetadata?.height)).length,
    missingImageRowsWithLocalCandidates: auditedRows.filter((row) => !row.currentImage && row.localCandidates.length > 0).length,
    localEventImageFileCount: localFiles.length,
    imageFiles: localFiles,
    collectionRowsByCountry: countries.map((country) => {
      const countryRows = collectionRows.filter((row) => row.countryCode.toUpperCase() === country.code.toUpperCase());
      return {
        country: country.name,
        countryCode: country.code,
        total: countryRows.length,
        missingImage: countryRows.filter((row) => !row.image).length,
        existingImage: countryRows.filter((row) => row.image).length,
      };
    }),
    categoryDistribution,
    unclassifiedRowCount: unclassifiedRows.length,
    unclassifiedRows,
    historicalEventRows: historicalRows.length,
    enabledHistoricalEventRows: historicalRows.filter((row) => row.enabled).length,
    historicalRowsWithImage: historicalRows.filter((row) => row.image).length,
    historicalRowsWithoutImage: historicalRows.filter((row) => !row.image).length,
    historicalRowsWithMissingLocalFile: auditedRows.filter((row) => row.localExists === false).length,
    queue: auditedRows,
    manifest: auditedRows.map((row) => ({
      country: row.country,
      countryCode: row.countryCode,
      eventId: row.eventId,
      title: row.title,
      date: row.date,
      currentImage: row.currentImage,
      webpFile: row.currentImage?.toLowerCase().endsWith('.webp') ? path.basename(row.localPath ?? row.currentImage.split(/[?#]/, 1)[0]) : null,
      source: row.source,
      license: row.license,
      imageType: null,
      verification: 'UNRESOLVED',
      requiredAction: row.requiredAction,
      localPath: row.localPath,
      localExists: row.localExists,
      imageMetadata: row.imageMetadata,
    })),
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    outputPath,
    countryCount: report.countryCount,
    totalAsiaEventRows: report.totalAsiaEventRows,
    preCollectionSnapshotRows: report.preCollectionSnapshotRows,
    imageValueChangesSinceSnapshot: report.imageValueChangesSinceSnapshot.length,
    enabledAsiaEventRows: report.enabledAsiaEventRows,
    asiaRowsWithImage: report.asiaRowsWithImage,
    asiaRowsWithoutImage: report.asiaRowsWithoutImage,
    historicalCategories,
    historicalEventRows: report.historicalEventRows,
    enabledHistoricalEventRows: report.enabledHistoricalEventRows,
    historicalRowsWithImage: report.historicalRowsWithImage,
    historicalRowsWithoutImage: report.historicalRowsWithoutImage,
    historicalRowsWithMissingLocalFile: report.historicalRowsWithMissingLocalFile,
    collectionEventRows: report.collectionEventRows,
    collectionRowsWithoutImage: report.collectionRowsWithoutImage,
    collectionRowsWithMissingLocalFile: report.collectionRowsWithMissingLocalFile,
    collectionRowsWithUnreadableLocalImage: report.collectionRowsWithUnreadableLocalImage,
    missingImageRowsWithLocalCandidates: report.missingImageRowsWithLocalCandidates,
    localEventImageFileCount: report.localEventImageFileCount,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());