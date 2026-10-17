const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const historicalNames = ['Historical Commemoration', 'Memorial Day', 'National Holiday', 'Traditional Festival', 'Cultural Celebration'];
const imageRoot = path.join(__dirname, 'public', 'Images', 'Asia historical events');

function normalizeImagePath(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const decoded = decodeURIComponent(trimmed);
  const match = decoded.match(/(?:^|\/)Asia(?:\s+historical\s+events|%20historical%20events)\/(.+?)(?:\?.*)?$/i);
  if (!match) return null;
  return path.join(imageRoot, match[1].replace(/^\//, ''));
}

async function main() {
  const [countries, categories] = await Promise.all([
    prisma.country.findMany({
      where: { continent: { name: 'Asia' } },
      select: { code: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: { name: { in: historicalNames } },
      select: { id: true, name: true },
    }),
  ]);

  const categoryIds = categories.map((c) => c.id);
  const incidents = [];
  let totalHistoricalRows = 0;
  let totalWithImages = 0;
  let totalMissing = 0;
  let totalBroken = 0;
  let totalIncorrect = 0;

  for (const country of countries) {
    const rows = await prisma.event.findMany({
      where: {
        countryCode: country.code,
        categoryId: { in: categoryIds },
      },
      select: {
        id: true,
        title: true,
        image: true,
        categoryId: true,
        slug: true,
      },
      orderBy: { title: 'asc' },
    });

    const countryStatus = {
      country: country.name,
      code: country.code,
      historicalEvents: rows.length,
      withImages: 0,
      missing: 0,
      broken: 0,
      incorrect: 0,
      rows: [],
    };

    for (const row of rows) {
      const image = row.image?.trim() || '';
      const localPath = normalizeImagePath(image);
      let status = 'valid';

      if (!image) {
        status = 'missing';
        countryStatus.missing += 1;
      } else if (!localPath || !fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) {
        status = 'broken';
        countryStatus.broken += 1;
      } else {
        countryStatus.withImages += 1;
      }

      totalHistoricalRows += 1;
      if (status === 'valid') totalWithImages += 1;
      if (status === 'missing') totalMissing += 1;
      if (status === 'broken') totalBroken += 1;
      if (status === 'incorrect') totalIncorrect += 1;

      countryStatus.rows.push({
        title: row.title,
        image,
        status,
        slug: row.slug,
      });
    }

    incidents.push(countryStatus);
  }

  const report = {
    totalCountriesChecked: countries.length,
    totalHistoricalEventsChecked: totalHistoricalRows,
    totalImagesAlreadyCorrect: totalWithImages,
    totalNewImagesDownloaded: 0,
    totalImagesReused: 0,
    totalIncorrectMappingsCorrected: 0,
    totalMissingImagesRemaining: totalMissing,
    totalBrokenImagesRemaining: totalBroken,
    totalIncorrectImagesRemaining: totalIncorrect,
    countryCoverage: incidents,
  };

  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
