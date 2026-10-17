const Fastify = require('fastify');
const { PrismaClient } = require('@prisma/client');
const registerSearchRoutes = require('./dist/search/search.controller').default || require('./dist/search/search.controller');

async function run() {
  const prisma = new PrismaClient();
  const app = Fastify();
  registerSearchRoutes(app, prisma);
  const response = await app.inject({ method: 'GET', url: '/search?q=Pakistan' });
  console.log('status:', response.statusCode);
  console.log('body:', response.body.slice(0, 1200));
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
