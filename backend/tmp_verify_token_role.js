const fetch = global.fetch || require('node-fetch');
(async () => {
  const base = 'http://127.0.0.1:4000';
  const email = 'test-events-admin@example.com';
  const password = 'password123';
  const loginRes = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const loginBody = await loginRes.json();
  console.log('LOGIN', loginRes.status, JSON.stringify(loginBody, null, 2));
  if (!loginBody.success) return;
  const token = loginBody.data.accessToken;
  const meRes = await fetch(`${base}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  const meBody = await meRes.json();
  console.log('/users/me', meRes.status, JSON.stringify(meBody, null, 2));
})();