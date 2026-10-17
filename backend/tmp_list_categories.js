const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
    console.log(JSON.stringify(categories, null, 2));
  } finally {
    await prisma.$disconnect();
  }
})();
