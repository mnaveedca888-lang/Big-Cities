const fetch = global.fetch || require('node-fetch');
const { PrismaClient } = require('@prisma/client');
(async () => {
  const base = 'http://127.0.0.1:4000';
  const email = 'test-events-admin@example.com';
  const password = 'password123';
  const prisma = new PrismaClient();
  await prisma.$connect();
  const city = await prisma.city.findFirst({ where: { countryCode: 'AF' } });
  const event = await prisma.event.findFirst({ where: { countryCode: 'AF' } });
  console.log('city', city?.slug, city?.name);
  console.log('event', event?.slug, event?.title);
  await prisma.$disconnect();
  const loginRes = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const loginBody = await loginRes.json();
  const token = loginBody.data.accessToken;
  const citySlug = city?.slug;
  const eventSlug = event?.slug;
  if (!citySlug || !eventSlug) {
    console.error('Missing city or event slug');
    return;
  }
  const cityPatchRes = await fetch(`${base}/cities/${citySlug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: 'City AUTH TEST', countryCode: 'AF', profile: {} }) });
  console.log('CITY PATCH', cityPatchRes.status, await cityPatchRes.json());
  const eventPatchRes = await fetch(`${base}/events/${eventSlug}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: 'Event AUTH TEST', featured: true }) });
  console.log('EVENT PATCH', eventPatchRes.status, await eventPatchRes.json());
})();