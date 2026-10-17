const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const titles = ['Data Darbar Urs', 'Urs of Shah Rukn-e-Alam', 'Urs of Bahauddin Zakariya'];
  const rows = await prisma.event.findMany({
    where: { title: { in: titles } },
    select: { id: true, slug: true, title: true, description: true, createdAt: true, updatedAt: true }
  });
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
