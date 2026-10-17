const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function cleanupName(name) {
  let n = String(name || '').trim();
  if (!/airport/i.test(n)) return null;

  // Prefer the explicitly labeled place after a real delimiter, e.g. `Name Airport -- City`
  const dashSplit = n.split(/\s*[\u2013\u2014\-–—]\s*/);
  if (dashSplit.length > 1) {
    const cityNameAfter = dashSplit[dashSplit.length - 1].trim();
    if (/airport/i.test(cityNameAfter) === false && cityNameAfter.length > 1) {
      n = cityNameAfter.replace(/\s*\([^)]*\)/g, '').trim();
      return n;
    }
  }

  // Remove parenthetical airport codes such as `(QSF)` before and after cleaning
  n = n.replace(/\s*\([^)]*\)/g, '').trim();

  // Remove airport-only phrase fragments by type so the user sees the place or city, not the airport label
  n = n
    .replace(/\bInternational Airport\b/gi, '')
    .replace(/\bInternational\b/gi, '')
    .replace(/\bRegional Airport\b/gi, '')
    .replace(/\bMunicipal Airport\b/gi, '')
    .replace(/\bNational Airport\b/gi, '')
    .replace(/\bAirport\b/gi, '')
    .replace(/\bAeroport\b/gi, '')
    .replace(/\bAirfield\b/gi, '')
    .replace(/\bTerminal\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+[-–—]\s*/g, ' ')
    .trim();

  // Keep only real city token if the airport expression held a city phrase with punctuation or expressive tokens.
  n = n.replace(/[.,;:]+$/g, '').trim();
  return n || null;
}

async function main() {
  await prisma.$connect();

  const before = await prisma.city.count();
  const cities = await prisma.city.findMany({
    select: { slug: true, name: true, countryCode: true },
    orderBy: { name: 'asc' }
  });

  const updated = [];
  const skipped = [];
  let changed = 0;

  for (const city of cities) {
    const clean = cleanupName(city.name);
    if (!clean || clean === city.name) {
      skipped.push({ slug: city.slug, countryCode: city.countryCode, name: city.name });
      continue;
    }

    await prisma.city.update({
      where: { slug: city.slug },
      data: { name: clean }
    });

    changed++;
    updated.push({ slug: city.slug, countryCode: city.countryCode, from: city.name, to: clean });
  }

  const after = await prisma.city.count();

  console.log('TOTAL_BEFORE', before);
  console.log('TOTAL_AFTER', after);
  console.log('TOTAL_CITIES_REMAIN_SAME', before === after ? 'YES' : 'NO');
  console.log('CITY_NAMES_CORRECTED', changed);
  console.log('SAMPLES_CORRECTED');
  for (const row of updated.slice(0, 80)) {
    console.log(`${row.countryCode} | ${row.from} -> ${row.to} | ${row.slug}`);
  }

  if (updated.length < 1) {
    console.log('SAMPLES_CORRECTED_EMPTY');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
