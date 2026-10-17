const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const city = await prisma.city.findUnique({ where: { slug: 'ru-samara' }, select: { slug: true, name: true, countryCode: true } });
  const api = await (await fetch('http://localhost:4000/cities/ru-samara')).json();
  const page = await (await fetch('https://en.wikipedia.org/wiki/Samara', { headers: { 'User-Agent': 'BigCitiesImageAudit/1.0 (probe)' } })).text();
  const qid = /"wgWikibaseItemId":"([^"]+)"/.exec(page)?.[1];
  const entityJson = await (await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, { headers: { 'User-Agent': 'BigCitiesImageAudit/1.0 (probe)' } })).json();
  const entity = entityJson.entities[qid];
  const countryIds = (entity.claims.P17 ?? []).map((claim) => claim.mainsnak?.datavalue?.value?.id).filter(Boolean);
  const countryEntities = [];
  for (const id of countryIds) {
    const result = await (await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${id}.json`, { headers: { 'User-Agent': 'BigCitiesImageAudit/1.0 (probe)' } })).json();
    countryEntities.push({ id, label: result.entities[id]?.labels?.en?.value, iso: (result.entities[id]?.claims?.P297 ?? []).map((claim) => claim.mainsnak?.datavalue?.value).filter(Boolean) });
  }
  const url = api.data.image;
  const fileName = decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).at(-1));
  const file = path.join(process.cwd(), 'public', 'Images', 'Asia cities images', fileName);
  console.log(JSON.stringify({ city, api: { slug: api.data.slug, countryCode: api.data.countryCode, image: api.data.image }, qid, label: entity.labels.en.value, description: entity.descriptions.en.value, p31: (entity.claims.P31 ?? []).map((claim) => claim.mainsnak?.datavalue?.value?.id).filter(Boolean), p17: countryEntities, p18: (entity.claims.P18 ?? []).map((claim) => claim.mainsnak?.datavalue?.value).filter(Boolean), fileName, fileExists: fs.existsSync(file), filePathMatches: file.endsWith(`${city.slug}.webp`), imageUrl: url }, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
