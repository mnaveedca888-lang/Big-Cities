const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const imageDir = path.join(__dirname, '..', 'public', 'Images', 'Asia historical events');

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function pickCandidate(countryCode, title, filesByCountry, fallbackFiles) {
  const text = normalize(title);
  const countryFiles = filesByCountry.get(countryCode.toUpperCase()) || [];

  const priority = [
    'national day',
    'independence day',
    'constitution day',
    'republic day',
    'liberation day',
    'victory day',
    'founding',
    'established as capital',
    'admitted to the united nations',
    'accession',
    'celebration',
    'nowruz',
    'birthday',
    'uprising',
    'revolution',
    'war',
    'festival',
    'day',
  ];

  for (const keyword of priority) {
    const exact = countryFiles.find((file) => normalize(file).includes(keyword));
    if (exact) return exact;
  }

  if (countryFiles.length) return countryFiles[0];

  const generic = fallbackFiles.find((file) => normalize(file).includes('national-day') || normalize(file).includes('independence-day') || normalize(file).includes('revolution') || normalize(file).includes('festival'));
  return generic || fallbackFiles[0] || null;
}

(async () => {
  const files = fs.readdirSync(imageDir).filter((file) => file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg') || file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.webp'));
  const filesByCountry = new Map();
  for (const file of files) {
    const countryCode = file.slice(0, 2).toUpperCase();
    if (!filesByCountry.has(countryCode)) filesByCountry.set(countryCode, []);
    filesByCountry.get(countryCode).push(file);
  }

  const asiaCountries = await prisma.country.findMany({
    where: { continent: { name: 'Asia' } },
    select: { code: true },
  });
  const countryCodes = asiaCountries.map((country) => country.code);

  const blankEvents = await prisma.event.findMany({
    where: {
      enabled: true,
      countryCode: { in: countryCodes },
      image: null,
    },
    select: { id: true, title: true, countryCode: true },
    orderBy: [{ countryCode: 'asc' }, { title: 'asc' }],
  });

  let updated = 0;
  let skipped = 0;
  for (const event of blankEvents) {
    const candidate = pickCandidate(event.countryCode, event.title, filesByCountry, files);
    if (!candidate) {
      skipped += 1;
      continue;
    }

    const imagePath = `/images/Asia%20historical%20events/${candidate}`;
    await prisma.event.update({
      where: { id: event.id },
      data: { image: imagePath },
    });
    updated += 1;
  }

  const finalBlanks = await prisma.event.count({
    where: { enabled: true, countryCode: { in: countryCodes }, image: null },
  });

  console.log(JSON.stringify({
    totalBlankEvents: blankEvents.length,
    updated,
    skipped,
    remainingBlanks: finalBlanks,
  }, null, 2));

  await prisma.$disconnect();
})();
