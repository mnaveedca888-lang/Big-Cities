const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const asiaDir = path.join(process.cwd(), 'public', 'Images', 'Asia cities images');

(async () => {
  const continents = await prisma.continent.findMany({ include: { countries: true } });
  const asia = continents.find((item) => item.name === 'Asia');
  const countries = asia?.countries ?? [];
  const countryByCode = new Map(countries.map((country) => [country.code.toUpperCase(), country]));
  const cities = await prisma.city.findMany({
    where: { countryCode: { in: countries.map((country) => country.code) } },
    orderBy: [{ countryCode: 'asc' }, { slug: 'asc' }],
    select: { slug: true, name: true, countryCode: true, profile: true },
  });
  const breakdown = { localAsiaFile: [], profileImage: [], none: [], duplicateRecords: [] };
  const keys = new Map();
  for (const city of cities) {
    const key = `${city.countryCode.toUpperCase()}\u0000${city.slug}`;
    keys.set(key, (keys.get(key) ?? 0) + 1);
    const profile = city.profile && typeof city.profile === 'object' ? city.profile : {};
    const urls = ['heroImageUrl', 'thumbnail'].filter((field) => typeof profile[field] === 'string' && profile[field].trim());
    const localPath = path.join(asiaDir, `${city.slug.toLowerCase()}.webp`);
    const fileExists = fs.existsSync(localPath);
    const row = { country: countryByCode.get(city.countryCode.toUpperCase())?.name ?? null, countryCode: city.countryCode, slug: city.slug, name: city.name, profileFields: urls.map((field) => ({ field, url: profile[field] })), localFile: fileExists ? `${city.slug.toLowerCase()}.webp` : null };
    if (fileExists) breakdown.localAsiaFile.push(row);
    else if (urls.length) breakdown.profileImage.push(row);
    else breakdown.none.push(row);
  }
  for (const [key, count] of keys) if (count > 1) breakdown.duplicateRecords.push({ key, count });
  console.log(JSON.stringify({ countryCount: countries.length, cityCount: cities.length, folderFiles: fs.existsSync(asiaDir) ? fs.readdirSync(asiaDir) : [], counts: { localAsiaFile: breakdown.localAsiaFile.length, profileImage: breakdown.profileImage.length, none: breakdown.none.length, duplicateRecords: breakdown.duplicateRecords.length }, profileImageSamples: breakdown.profileImage.slice(0, 12), localAssetRecords: breakdown.localAsiaFile }, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
