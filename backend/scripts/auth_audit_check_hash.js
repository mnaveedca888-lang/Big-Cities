require('dotenv').config();
const fetch = global.fetch || require('node-fetch');
const {PrismaClient} = require('@prisma/client');
(async()=>{
  const prisma = new PrismaClient();
  const base='http://127.0.0.1:4000';
  const rand=Math.floor(Math.random()*100000);
  const email = `audithash+${rand}@example.com`;
  const password='StrongPass123!';

  const reg = await fetch(base + '/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Audit Hash', email, password }) });
  const regBody = await reg.json();
  console.log('register status', reg.status);
  const sessionId = regBody.data.tokens.sessionId;
  console.log('initial sessionId', sessionId);

  // Refresh to create a new session (rotate)
  const refreshRes = await fetch(base + '/auth/refresh', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refreshToken: regBody.data.tokens.refreshToken }) });
  const refreshBody = await refreshRes.json();
  console.log('refresh status', refreshRes.status);
  const newSid = refreshBody.data.tokens.sessionId;
  console.log('new session id', newSid);

  // Query DB for new session
  const newSession = await prisma.session.findUnique({ where: { id: newSid } });
  console.log('newSession.revoked', newSession.revoked);
  console.log('newSession.refreshTokenHash exists:', !!newSession.refreshTokenHash);
  if (newSession.refreshTokenHash) console.log('startsWith $argon2:', newSession.refreshTokenHash.startsWith('$argon2'));

  await prisma.$disconnect();
})();
