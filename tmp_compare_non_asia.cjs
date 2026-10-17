const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  const db = await prisma.country.findMany({
    where: { continent: { name: { not: 'Asia' } } },
    orderBy: [{ code: 'asc' }],
    select: { code: true, name: true }
  });

  const manifestPath = path.join('backend', 'data', 'non_asia_country_image_manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const arr = Array.isArray(manifest) ? manifest : manifest.countries;
  const manifestCodes = arr.map(c => c.code);
  const missing = db.filter(c => !manifestCodes.includes(c.code));

  console.log(JSON.stringify({
    targetNonAsia: db.length,
    manifestCountries: arr.length,
    missingCount: missing.length,
    missing: missing.map(c => ({ code: c.code, name: c.name }))
  }, null, 2));

  await prisma.$disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
