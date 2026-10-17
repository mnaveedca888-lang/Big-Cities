(async () => {
  const base = 'http://127.0.0.1:4000';
  const rand = Math.floor(Math.random()*100000);
  const email = `test+${rand}@example.com`;
  console.log('Using test email:', email);
  // register
  let res = await fetch(base + '/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Test User', email, password: 'password123' }) });
  console.log('/auth/register status', res.status);
  let body = await res.json().catch(()=>null);
  console.log('register body', body);
  if (res.status !== 201) return;
  const tokens = body.data.tokens;
  // access protected /users/me
  res = await fetch(base + '/users/me', { method: 'GET', headers: { Authorization: `Bearer ${tokens.accessToken}` } });
  console.log('/users/me status', res.status);
  console.log('me body', await res.json());
  // refresh
  res = await fetch(base + '/auth/refresh', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refreshToken: tokens.refreshToken }) });
  console.log('/auth/refresh status', res.status);
  console.log('refresh body', await res.json().catch(()=>null));
  // logout
  res = await fetch(base + '/auth/logout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ refreshToken: tokens.refreshToken }) });
  console.log('/auth/logout status', res.status);
})();
