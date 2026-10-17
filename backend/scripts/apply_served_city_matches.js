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

function stripAirportSuffix(value) {
  let s = String(value ?? '').trim();
  const patterns = [
    /\bairport\b/gi,
    /\binternational\b/gi,
    /\bintl\b/gi,
    /\bcity\b/gi,
    /\bmunicipality\b/gi,
    /\barea\b/gi,
    /\bregional\b/gi,
    /\bterminal\b/gi,
    /\bgovernment\b/gi,
    /\bgov\b/gi,
    /\baerodrome\b/gi,
  ];
  for (const re of patterns) s = s.replace(re, ' ');
  s = s.replace(/\s+[-–—]\s+.*$/g, '');
  s = s.replace(/\s*\([^)]*\)/g, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

function variants(value) {
  const base = norm(value);
  const cleaned = norm(stripAirportSuffix(value));
  return [...new Set([base, cleaned, base.split(' ')[0] || base].filter(Boolean))];
}

function firstNamedCell(row) {
  const entries = Object.entries(row || {}).filter(([, value]) => value != null && String(value).trim() !== '');
  for (const [key, value] of entries) {
    if (/(^|_)city$|^city$|^City$|^town$|^municipality$|^locality$|^destination$/i.test(key)) return String(value).trim();
  }
  for (const [key, value] of entries) {
    const keyNorm = norm(key);
    const valueNorm = norm(String(value));
    if (/city|town|municipality|locality/.test(keyNorm) || /city|town|municipality|locality/.test(valueNorm)) {
      return String(value).trim();
    }
  }
  return null;
}

function firstCountryCell(row) {
  const entries = Object.entries(row || {}).filter(([, value]) => value != null && String(value).trim() !== '');
  for (const [key, value] of entries) {
    if (/country/i.test(key)) return String(value).trim();
  }
  return null;
}

function getWorkbookServedCities(rootDir, countryCodeByName) {
  const servedCities = [];
  const files = fs.readdirSync(rootDir).filter((file) => /\.(xlsx|xls)$/i.test(file));
  for (const file of files) {
    const workbook = xlsx.readFile(path.join(rootDir, file));
    const sheet = workbook.Sheets['City_Details'];
    if (!sheet) continue;
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: false, blankrows: false });
    for (const row of rows) {
      const cityName = firstNamedCell(row);
      const countryName = firstCountryCell(row);
      if (!cityName || !countryName) continue;
      const countryCode = countryCodeByName.get(norm(countryName));
      if (!countryCode) continue;
      servedCities.push({ countryCode, name: String(cityName).trim() });
    }
  }
  return servedCities;
}

async function main() {
  const countryRows = await prisma.country.findMany({ select: { code: true, name: true } });
  const countryCodeByName = new Map(countryRows.map((country) => [norm(country.name), country.code]));

  const rootDir = path.join(__dirname, '..', '..', 'Data');
  const servedCities = getWorkbookServedCities(rootDir, countryCodeByName);
  const allCities = await prisma.city.findMany({ select: { slug: true, name: true, countryCode: true, isVerifiedCity: true } });

  const updates = [];
  for (const city of allCities) {
    const candidates = servedCities.filter((served) => served.countryCode === city.countryCode);
    if (!candidates.length) continue;

    const matching = candidates.filter((served) => {
      const source = norm(city.name);
      const target = norm(served.name);
      if (!source || !target) return false;
      if (source === target) return false;
      const sourceVariants = variants(city.name);
      const targetVariants = variants(served.name);
      const directMatch = sourceVariants.some((v) => targetVariants.includes(v)) || targetVariants.some((v) => sourceVariants.includes(v));
      const substringMatch = sourceVariants.some((v) => targetVariants.some((tv) => v.includes(tv) || tv.includes(v)));
      return directMatch || substringMatch;
    });

    if (matching.length !== 1) continue;

    const target = matching[0].name;
    if (norm(city.name) === norm(target)) continue;
    updates.push({ slug: city.slug, oldName: city.name, newName: target, countryCode: city.countryCode });
  }

  console.log('candidate_updates=', updates.length);
  console.log(JSON.stringify(updates.slice(0, 30), null, 2));

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
