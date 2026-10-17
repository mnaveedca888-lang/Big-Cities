const fetch = global.fetch || require('node-fetch');
const { PrismaClient } = require('@prisma/client');
(async () => {
  const base = 'http://127.0.0.1:4000';
  const email = 'test-events-admin@example.com';
  const password = 'password123';
  try {
    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const loginBody = await loginRes.json();
    console.log('LOGIN', loginRes.status, JSON.stringify(loginBody));
    if (!loginBody.success) return;
    const token = loginBody.data.accessToken;
    console.log('TOKEN', token?.slice(0, 32) + '...');
    const getRes = await fetch(`${base}/countries/AF`, { headers: { Authorization: `Bearer ${token}` } });
    console.log('GET /countries/AF', getRes.status, await getRes.json());
    const patchRes = await fetch(`${base}/countries/AF`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Afghanistan AUTH DEBUG' }),
    });
    console.log('PATCH /countries/AF', patchRes.status, await patchRes.json());
  } catch (err) {
    console.error(err);
  }
})();