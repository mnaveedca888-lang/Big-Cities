const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const fetch = global.fetch || require('node-fetch');

async function run() {
  const prisma = new PrismaClient();
  await prisma.$connect();

  // ensure admin role
  let role = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (!role) role = await prisma.role.create({ data: { name: 'admin', description: 'Administrator' } });

  const email = 'test-events-admin@example.com';
  const password = 'password123';
  const passwordHash = await argon2.hash(password);

  // upsert user with admin role
  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, roleId: role.id, name: 'Test Events Admin' },
    create: { email, passwordHash, roleId: role.id, name: 'Test Events Admin' },
  });

  console.log('Admin user ensured:', user.email);

  // login
  const loginRes = await fetch('http://127.0.0.1:4000/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const loginBody = await loginRes.json();
  if (!loginBody.success) { console.error('Login failed', loginBody); process.exit(1); }
  const accessToken = loginBody.data.tokens.accessToken;
  console.log('Logged in, access token length', accessToken.length);

  // create event
  const now = new Date();
  const startAt = new Date(now.getTime() + 3600 * 1000).toISOString();
  const endAt = new Date(now.getTime() + 7200 * 1000).toISOString();
  const createRes = await fetch('http://127.0.0.1:4000/events', { method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ title: 'Test Event', description: 'Automated test', startAt, endAt, tags: ['test','auto'] }) });
  const createBody = await createRes.json();
  console.log('/events POST', createRes.status, createBody.success ? 'created' : createBody);
  if (!createBody.success) process.exit(1);

  const slug = createBody.data.slug;

  // get event by slug
  const getRes = await fetch(`http://127.0.0.1:4000/events/${slug}`);
  console.log('/events/:slug GET', getRes.status, await getRes.json());

  // list events
  const listRes = await fetch('http://127.0.0.1:4000/events?q=Test&page=1&perPage=5');
  console.log('/events GET', listRes.status, await listRes.json());

  // update event
  const patchRes = await fetch(`http://127.0.0.1:4000/events/${slug}`, { method: 'PATCH', headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ title: 'Test Event Updated', featured: true }) });
  console.log('/events/:slug PATCH', patchRes.status, await patchRes.json());

  // delete
  const delRes = await fetch(`http://127.0.0.1:4000/events/${slug}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });
  console.log('/events/:slug DELETE', delRes.status);

  await prisma.$disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
