const fetch = global.fetch || require('node-fetch');
(async () => {
  const base = 'http://127.0.0.1:4000';
  const email = 'test-events-admin@example.com';
  const password = 'password123';
  const loginRes = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const loginBody = await loginRes.json();
  console.log('LOGIN', loginRes.status, loginBody.success ? loginBody.data.user.role : loginBody);
  const token = loginBody.data.accessToken;
  const patchRes = await fetch(`${base}/countries/AF`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: 'Afghanistan PATCH VERIFY', profile: {} }) });
  const patchBody = await patchRes.json();
  console.log('PATCH', patchRes.status, patchBody);
  const getRes = await fetch(`${base}/countries/AF`, { headers: { Authorization: `Bearer ${token}` } });
  const getBody = await getRes.json();
  console.log('GET after PATCH', getRes.status, getBody);
})();