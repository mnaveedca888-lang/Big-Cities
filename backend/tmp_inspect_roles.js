const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  await prisma.$connect();
  const admin = await prisma.user.findUnique({ where: { email: 'test-events-admin@example.com' }, include: { role: true } });
  const member = await prisma.user.findUnique({ where: { email: 'test-member@example.com' }, include: { role: true } });
  const roles = await prisma.role.findMany({ include: { users: true } });
  console.log(JSON.stringify({ admin, member, roles }, null, 2));
  await prisma.$disconnect();
})();