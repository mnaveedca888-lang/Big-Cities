const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.city.findMany({
    where: { isVerifiedCity: true },
    select: { slug: true, name: true, countryCode: true },
    orderBy: { name: 'asc' }
  });
  const airportLike = rows.filter(r => /airport|aerodrome|heliport|international|gov/i.test((r.slug || '') + ' ' + (r.name || '')));
  console.log('airport_like_verified', airportLike.length);
  console.log(JSON.stringify(airportLike.slice(0, 80), null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
