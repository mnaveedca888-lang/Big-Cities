const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const imageDir = path.join(__dirname, '..', 'public', 'Images', 'Downloaded event images');
fs.mkdirSync(imageDir, { recursive: true });

function sanitizeFilename(value) {
  return String(value || 'event')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'event';
}

async function downloadImage(url, filePath) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);
  return buffer.length;
}

async function processBatch(batchSize = 50, concurrency = 10) {
  const events = await prisma.event.findMany({
    where: { image: null },
    select: { id: true, slug: true, title: true },
    take: batchSize,
    orderBy: { createdAt: 'asc' },
  });

  if (events.length === 0) return 0;

  let index = 0;
  let updated = 0;

  const worker = async (event) => {
    const seed = event.slug || event.title || event.id;
    const sourceUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/1600/900`;
    const fileName = `${sanitizeFilename(event.slug || event.title || event.id)}-${event.id.slice(0, 8)}.jpg`;
    const filePath = path.join(imageDir, fileName);

    try {
      await downloadImage(sourceUrl, filePath);
      const localPath = `/images/Downloaded%20event%20images/${encodeURIComponent(fileName)}`;
      await prisma.event.update({
        where: { id: event.id },
        data: { image: localPath },
      });
      console.log(`UPDATED ${event.id} -> ${localPath}`);
      return 1;
    } catch (error) {
      console.error(`FAILED ${event.id}: ${error.message}`);
      return 0;
    }
  };

  while (index < events.length) {
    const slice = events.slice(index, index + concurrency);
    const results = await Promise.all(slice.map(worker));
    updated += results.reduce((sum, value) => sum + value, 0);
    index += concurrency;
  }

  return updated;
}

async function main() {
  let loop = 0;
  let totalUpdated = 0;

  while (true) {
    loop += 1;
    const updated = await processBatch(25);
    totalUpdated += updated;

    const remaining = await prisma.event.count({ where: { image: null } });
    console.log(JSON.stringify({ loop, batchUpdated: updated, remaining }, null, 2));

    if (remaining === 0 || updated === 0) {
      break;
    }
  }

  const finalRemaining = await prisma.event.count({ where: { image: null } });
  console.log(JSON.stringify({ totalUpdated, finalRemaining }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
