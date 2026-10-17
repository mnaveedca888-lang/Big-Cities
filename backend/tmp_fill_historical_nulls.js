const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mapping = {
  'b7ab54ce-c011-4506-bbe8-3ac67bd6cdab': '/images/Asia%20historical%20events/AZ-victory-day-republic.webp',
  'b36cf0a4-bb0c-483f-8dc3-586521ed1592': '/images/Asia%20historical%20events/AZ-azerbaijan-republic-day.webp',
  'f5aab01a-0d36-4432-9ab8-cf2d2e437f8b': '/images/Asia%20historical%20events/AZ-martyrs-day-black-january.jpg',
  '413873ce-cc41-4cfd-8c26-dc0b207e80ec': '/images/Asia%20historical%20events/AZ-martyrs-day-black-january.jpg',
  '9441c1bb-0ae2-434c-9225-3761fe75dcb0': '/images/Asia%20historical%20events/AZ-azerbaijan-republic-day.webp',
  '7008640d-4b03-425d-8a6e-4aef79e82e19': '/images/Asia%20historical%20events/AZ-azerbaijan-republic-day.webp',
  '7c7f9521-4fd1-4863-9d7b-9ff925f1762d': '/images/Asia%20historical%20events/AZ-azerbaijan-republic-day.webp',
  '7bac09c0-7854-4763-8f0a-1f2dd6ffd7b8': '/images/Asia%20historical%20events/AZ-novruz-bayram-spring-festival.webp',
  '917ef361-f970-4604-939e-cef11afee42e': '/images/Asia%20historical%20events/AZ-azerbaijan-republic-day.webp',
  '40d92791-a15d-4a5b-98e9-83c3f10b0d98': '/images/Asia%20historical%20events/AZ-azerbaijan-republic-day.webp',
  'b195ce04-b3c1-4b4a-9934-1da14eb29924': '/images/Asia%20historical%20events/AZ-international-women-s-day.jpg',
  '1a97e90b-58ec-4fba-ba69-482583149e0c': '/images/Asia%20historical%20events/Karachi%20Literature%20Festival.webp',
};

async function main() {
  const ids = Object.keys(mapping);
  let updated = 0;
  for (const id of ids) {
    const row = await prisma.event.findUnique({ where: { id }, select: { id: true, image: true } });
    if (!row) continue;
    if (row.image) continue;
    await prisma.event.update({
      where: { id },
      data: { image: mapping[id] },
    });
    updated += 1;
  }
  const countries = await prisma.country.findMany({ where: { continent: { name: 'Asia' } }, select: { code: true } });
  const countryCodes = countries.map((country) => country.code);
  const remaining = await prisma.event.count({ where: { countryCode: { in: countryCodes }, image: null } });
  const historicalNames = ['Historical Commemoration','Memorial Day','National Holiday','Traditional Festival','Cultural Celebration'];
  const categories = await prisma.category.findMany({ where: { name: { in: historicalNames } }, select: { id: true, name: true } });
  const categoryIds = categories.map((c) => c.id);
  const historicalCount = await prisma.event.count({ where: { countryCode: { in: countryCodes }, categoryId: { in: categoryIds } } });
  const historicalNull = await prisma.event.count({ where: { countryCode: { in: countryCodes }, categoryId: { in: categoryIds }, image: null } });
  console.log(JSON.stringify({ updated, remaining, historicalCount, historicalNull }, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
