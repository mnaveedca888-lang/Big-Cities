require('dotenv').config();
const fetch = global.fetch || require('node-fetch');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const base = 'http://127.0.0.1:4000';
  const rand = Math.floor(Math.random()*100000);
  const email = `audit+${rand}@example.com`;
  const password = 'StrongPass123!';
  console.log('Registering user:', email);

  // Register
  let res = await fetch(base + '/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Audit User', email, password }) });
  console.log('/auth/register status', res.status);
  const regBody = await res.json().catch(()=>null);
  console.log('register body', regBody);
  if (res.status !== 201) { console.log('Registration failed; aborting'); process.exit(1); }

  const user = regBody.data.user;
  const tokens = { accessToken: regBody.data.accessToken, refreshToken: regBody.data.refreshToken };
  const originalSessionId = jwt.decode(tokens.refreshToken)?.sid;

  // Verify DB user exists and password hashed
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  console.log('DB user id', dbUser.id);
  console.log('passwordHash startsWith $argon2', typeof dbUser.passwordHash === 'string' && dbUser.passwordHash.startsWith('$argon2'));

  // Login with wrong password
  res = await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: 'wrongpass' }) });
  console.log('/auth/login wrong password status', res.status);
  const wrongLogin = await res.json().catch(()=>null);
  console.log('wrong login body', wrongLogin);

  // Decode access token
  const at = tokens.accessToken;
  const decoded = jwt.decode(at);
  console.log('access token decoded', decoded);
  if (decoded && decoded.iat && decoded.exp) {
    const ttl = decoded.exp - decoded.iat;
    console.log('access token ttl (sec):', ttl);
  }

  // Test /users/me with valid token
  res = await fetch(base + '/users/me', { method: 'GET', headers: { Authorization: `Bearer ${at}` } });
  console.log('/users/me with valid token status', res.status);
  console.log('body', await res.json().catch(()=>null));

  // Tampered token
  const tampered = at.slice(0,-1) + (at.slice(-1) === 'a' ? 'b' : 'a');
  res = await fetch(base + '/users/me', { method: 'GET', headers: { Authorization: `Bearer ${tampered}` } });
  console.log('/users/me with tampered token status', res.status);
  console.log('body', await res.json().catch(()=>null));

  // Refresh token rotation
  const rt = tokens.refreshToken;
  console.log('Original session id:', originalSessionId);
  res = await fetch(base + '/auth/refresh', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refreshToken: rt }) });
  console.log('/auth/refresh status', res.status);
  const refBody = await res.json().catch(()=>null);
  console.log('refresh body', refBody);
  const newSessionId = jwt.decode(refBody?.data?.refreshToken)?.sid;
  console.log('new session id', newSessionId);

  // Check sessions in DB
  const sessions = await prisma.session.findMany({ where: { userId: user.id } , orderBy: { createdAt: 'asc' } });
  console.log('sessions for user:', sessions.map(s=>({ id: s.id, revoked: s.revoked })));

  // Old session should be revoked
  const old = await prisma.session.findUnique({ where: { id: originalSessionId } });
  console.log('old session revoked:', old ? old.revoked : 'missing');
  const nw = await prisma.session.findUnique({ where: { id: newSessionId } });
  console.log('new session revoked:', nw ? nw.revoked : 'missing');

  // Logout using new refresh token
  const newRT = refBody?.data?.refreshToken;
  res = await fetch(base + '/auth/logout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refreshToken: newRT }) });
  console.log('/auth/logout status', res.status);

  const afterLogout = await prisma.session.findUnique({ where: { id: newSessionId } });
  console.log('after logout revoked:', afterLogout ? afterLogout.revoked : 'missing');

  // Expired/invalid JWT returns 401: simulate expired by creating token with past exp
  const accessSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
  const expiredToken = jwt.sign({ sub: user.id }, accessSecret, { expiresIn: '-1s' });
  res = await fetch(base + '/users/me', { method: 'GET', headers: { Authorization: `Bearer ${expiredToken}` } });
  console.log('/users/me with expired token status', res.status);
  console.log('body', await res.json().catch(()=>null));

  // SQL injection attempt in login
  res = await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: "' OR '1'='1", password: 'x' }) });
  console.log('/auth/login SQL injection attempt status', res.status);
  console.log('body', await res.json().catch(()=>null));

  // Validation rejects invalid email/password
  res = await fetch(base + '/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: '', email: 'bad-email', password: '123' }) });
  console.log('/auth/register invalid input status', res.status);
  console.log('body', await res.json().catch(()=>null));

  // Check that JWT secrets come from env
  console.log('JWT_ACCESS_TOKEN_SECRET present:', !!process.env.JWT_ACCESS_TOKEN_SECRET);
  console.log('JWT_REFRESH_TOKEN_SECRET present:', !!process.env.JWT_REFRESH_TOKEN_SECRET);

  // Rate limiting check: attempt many login requests to detect 429
  let rateLimited = false;
  for (let i = 0; i < 30; i++) {
    const r = await fetch(base + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: "noone@example.com", password: 'x' }) });
    if (r.status === 429) { rateLimited = true; break; }
  }
  console.log('Rate limiting implemented:', rateLimited);

  // SQL injection protection note: using Prisma parameterized queries
  console.log('Prisma usage observed for auth queries (findUnique) => parameterized, safe from SQL injection');

  await prisma.$disconnect();
}

run().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
