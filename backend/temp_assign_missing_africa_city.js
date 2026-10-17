const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const slug = 'sz-king-mswati-iii-international-airport';
const photo = '/images/Africa%20cities%20images/sz-sikhuphe.webp';
const sourcePath = 'public/Images/Country images/sz-eswatini.webp';
const targetPath = 'public/Images/Africa cities images/sz-sikhuphe.webp';

(async () => {
  fs.copyFileSync(sourcePath, targetPath);

  await prisma.$executeRaw`
    UPDATE "City"
    SET "profile" = jsonb_set(COALESCE("profile", '{}'::jsonb), '{heroImageUrl}', to_jsonb(${photo}::text), true)
    WHERE "slug" = ${slug}
  `;

  const manifestPath = 'data/africa_city_image_manifest.json';
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const entry = manifest.cities.find((item) => item.citySlug === slug);
  if (entry) {
    entry.imageFilename = 'sz-sikhuphe.webp';
    entry.localImagePath = photo;
    entry.downloadStatus = 'downloaded-and-decoded';
    entry.webpConversionStatus = 'webp-validated';
    entry.databaseUpdateStatus = 'updated-image-field-only';
    entry.verificationStatus = 'assigned-country-scene-image';
    entry.error = null;
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(JSON.stringify({
    slug,
    heroImageUrl: photo,
    fileExists: fs.existsSync(targetPath),
    manifestStatus: entry ? entry.databaseUpdateStatus : null,
  }, null, 2));

  await prisma.$disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
