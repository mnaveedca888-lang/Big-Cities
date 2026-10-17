const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const expectedEvents = [
  'New Year\'s Day',
  'Carnival',
  'National Day of Remembrance',
  'Malvinas Day',
  'Flag Day',
  'Independence Day',
  'San Martín Day',
  'National Sovereignty Day',
  'Plurinational State Day',
  'All Souls\' Day',
  'Christmas Day',
  'Tiradentes Day',
  'Labour Day',
  'Our Lady of Aparecida',
  'Republic Proclamation Day',
  'Black Awareness Day',
  'Navy Day',
  'Indigenous Peoples Day',
  'Independence Day / Fiestas Patrias',
  'Army Day',
  'All Saints\' Day',
  'Battle of Boyacá',
  'Independence of Cartagena',
  'Battle of Pichincha',
  'Independence of Quito',
  'Independence of Guayaquil',
  'Day of the Dead',
  'Independence of Cuenca',
  'Republic Day / Mashramani',
  'Arrival Day',
  'Emancipation Day',
  'Heroes\' Day',
  'Chaco Peace Day',
  'Constitution Day',
  'Foundation of Asunción',
  'Battle of Boquerón',
  'Virgin of Caacupé',
  'Independence Day / Fiestas Patrias',
  'Battle of Junín',
  'Santa Rosa de Lima',
  'Battle of Angamos',
  'Immaculate Conception',
  'Holi / Phagwa',
  'Keti Koti',
  'Independence Day / Srefidensi',
  'Landing of the 33 Orientals',
  'Battle of Las Piedras',
  'Artigas\' Birthday',
  'Independence Declaration',
  'Columbus Day',
  'Battle of Carabobo',
  'Simón Bolívar\'s Birthday',
];

async function main() {
  const events = await prisma.event.findMany({
    where: { countryCode: { in: ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PY', 'PE', 'SR', 'UY', 'VE'] } },
    select: { title: true, countryCode: true, citySlug: true, slug: true },
    orderBy: { startAt: 'asc' },
  });

  const seen = new Set();
  const duplicates = [];
  for (const event of events) {
    const key = `${event.countryCode}|${event.title}|${event.citySlug || 'country'}`;
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
  }

  const missing = expectedEvents.filter((title) => !events.some((event) => event.title === title));

  console.log(`southAmericaEventTotal=${events.length}`);
  console.log(`missingEvents=${missing.length}`);
  if (missing.length) console.log(JSON.stringify(missing.slice(0, 40), null, 2));
  console.log(`duplicateKeyCount=${duplicates.length}`);
  if (duplicates.length) console.log(JSON.stringify(duplicates.slice(0, 20), null, 2));

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
