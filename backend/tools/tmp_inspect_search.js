const Fastify = require('fastify');
const { PrismaClient } = require('@prisma/client');
const registerSearchRoutes = require('./dist/search/search.controller').default || require('./dist/search/search.controller');

const app = Fastify();
const prisma = new PrismaClient();
registerSearchRoutes(app, prisma);
console.log(app.printRoutes());
