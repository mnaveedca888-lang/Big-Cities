require('dotenv').config();
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function norm(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function score(source, target) {
  const s = norm(source);
  const t = norm(target);
  if (!s || !t) return 0;
  if (s === t) return 100;
  if (s.includes(t) || t.includes(s)) return 90;
  const sWords = s.split(' ').filter((w) => w.length > 2);
  const tWords = t.split(' ').filter((w) => w.length > 2);
  if (!sWords.length || !tWords.length) return 0;
  const overlap = sWords.filter((word) => tWords.some((tw) => tw.includes(word) || word.includes(tw))).length;
  if (overlap >= Math.max(1, Math.min(sWords.length, tWords.length) - 1)) return 80;
  return 0;
}

function titleFromSlug(slug) {
  const withoutCountry = slug.replace(/^[a-z]{2}-/i, '');
  const cleaned = withoutCountry
    .replace(/-(airport|airfield|heliport|aerodrome|terminal|international|intl|gov|government|city|municipality|area|station|flesland)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned;
}

function extractAirportCitiesByCountry(rootDir, countryCodeByName) {
  const map = new Map();
  const files = fs.readdirSync(rootDir).filter((file) => /\.(xlsx|xls)$/i.test(file));
  for (const file of files) {
    const workbook = xlsx.readFile(path.join(rootDir, file));
    if (!workbook.Sheets || !workbook.Sheets['Airports']) continue;
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets['Airports'], { defval: null, raw: false, blankrows: false });
    for (const row of rows) {
      for (const [countryName, value] of Object.entries(row || {})) {
        if (!value || typeof value !== 'string') continue;
        const cityName = value.split('—')[0].split('-')[0].trim();
        if (!cityName) continue;
        const code = countryCodeByName.get(norm(countryName));
        if (!code) continue;
        if (!map.has(code)) map.set(code, new Set());
        map.get(code).add(cityName.trim());
      }
    }
  }
  return map;
}

async function main() {
  const countryRows = await prisma.country.findMany({ select: { code: true, name: true } });
  const countryCodeByName = new Map(countryRows.map((country) => [norm(country.name), country.code]));
  const airportCitiesByCountry = extractAirportCitiesByCountry(path.join(__dirname, '..', '..', 'Data'), countryCodeByName);

  const rows = await prisma.city.findMany({
    select: { slug: true, name: true, countryCode: true, isVerifiedCity: true },
    orderBy: { name: 'asc' }
  });

  const updates = [];
  for (const city of rows) {
    const countryCities = airportCitiesByCountry.get(city.countryCode) || new Set();
    if (!countryCities.size) continue;

    const sourceHints = [city.name, titleFromSlug(city.slug), city.slug];
    const scored = [...countryCities]
      .map((candidate) => {
        let best = 0;
        for (const hint of sourceHints) {
          const value = score(hint, candidate);
          if (value > best) best = value;
        }
        return { candidate, score: best };
      })
      .filter((item) => item.score >= 80)
      .sort((a, b) => b.score - a.score);

    if (scored.length !== 1) continue;
    const target = scored[0].candidate;
    if (norm(city.name) === norm(target)) continue;
    updates.push({ slug: city.slug, oldName: city.name, newName: target, countryCode: city.countryCode, score: scored[0].score });
  }

  console.log('candidate_updates=', updates.length);
  console.log(JSON.stringify(updates.slice(0, 50), null, 2));

  for (const update of updates) {
    await prisma.city.update({
      where: { slug: update.slug },
      data: { name: update.newName, isVerifiedCity: true },
    });
  }

  console.log('updated_rows=', updates.length);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
