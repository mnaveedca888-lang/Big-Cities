const fetch = global.fetch || require('node-fetch');
const { PrismaClient } = require('@prisma/client');
(async () => {
  const base = 'http://127.0.0.1:4000';
  const prisma = new PrismaClient();
  await prisma.$connect();
  let memberEmail = 'test-member@example.com';
  let memberPassword = 'password123';
  const adminEmail = 'test-events-admin@example.com';
  const adminPassword = 'password123';
  // ensure admin user exists
  let role = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (!role) role = await prisma.role.create({ data: { name: 'admin', description: 'Administrator' } });
  const adminHash = await require('argon2').hash(adminPassword);
  await prisma.user.upsert({ where: { email: adminEmail }, update: { passwordHash: adminHash, roleId: role.id, name: 'Test Events Admin' }, create: { email: adminEmail, passwordHash: adminHash, roleId: role.id, name: 'Test Events Admin' } });
  // ensure member user exists
  const memberUser = await prisma.user.upsert({ where: { email: memberEmail }, update: { passwordHash: await require('argon2').hash(memberPassword), name: 'Test Member' }, create: { email: memberEmail, passwordHash: await require('argon2').hash(memberPassword), name: 'Test Member' } });
  console.log('Admin and member users ensured');

  async function login(email, password) {
    const res = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const body = await res.json();
    return { status: res.status, body };
  }
  async function patchCountry(token) {
    const res = await fetch(`${base}/countries/AF`, { method: 'PATCH', headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: 'Afghanistan MEMBER TEST' }) });
    const body = await res.json();
    return { status: res.status, body };
  }

  const adminLogin = await login(adminEmail, adminPassword);
  console.log('ADMIN LOGIN', adminLogin.status, adminLogin.body);
  const adminToken = adminLogin.body.data?.accessToken;
  const adminPatch = adminToken ? await patchCountry(adminToken) : null;
  console.log('ADMIN PATCH /countries/AF', adminPatch?.status, adminPatch?.body);

  const memberLogin = await login(memberEmail, memberPassword);
  console.log('MEMBER LOGIN', memberLogin.status, memberLogin.body);
  const memberToken = memberLogin.body.data?.accessToken;
  const memberPatch = memberToken ? await patchCountry(memberToken) : null;
  console.log('MEMBER PATCH /countries/AF', memberPatch?.status, memberPatch?.body);

  await prisma.$disconnect();
})();