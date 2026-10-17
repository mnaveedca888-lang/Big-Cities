require('dotenv').config();
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const suspiciousPattern = /airport|airfield|aerodrome|university|college|institute|hospital|station|museum|resort|hotel|park|island|province|region|prefecture|department|ministry|authority|corporation|company|website|\.com\b|\.org\b|\bnone\b|\bno city\b|international airport|terminal|air base|military base|port\b|dam\b|reservoir|mountain|island|county|district|capital region/i;

function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

async function main() {
  const cities = await prisma.city.findMany({ select: { slug: true, name: true, countryCode: true, profile: true }, orderBy: [{ countryCode: 'asc' }, { name: 'asc' }] });
  const countries = await prisma.country.findMany({ select: { code: true, name: true }, orderBy: { code: 'asc' } });
  const workbookPath = path.resolve(__dirname, '..', '..', 'Data', 'Big City Info (1).xlsx');
  const workbookExists = fs.existsSync(workbookPath);
  const workbookData = [];
  if (workbookExists) {
    const workbook = xlsx.readFile(workbookPath);
    for (const sheetName of workbook.SheetNames) {
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
      for (const [rowIndex, row] of rows.entries()) {
        for (const [country, value] of Object.entries(row)) {
          if (value !== null && value !== undefined && String(value).trim()) workbookData.push({ sheetName, row: rowIndex + 2, country, value: String(value).trim() });
        }
      }
    }
  }
  const byCode = Object.fromEntries(countries.map((country) => [country.code, country.name]));
  const matchRows = cities.map((city) => {
    const rawCandidates = workbookData.filter((entry) => entry.country === (byCode[city.countryCode] || city.countryCode) && normalize(entry.value).includes(normalize(city.name)));
    return { country: byCode[city.countryCode] || city.countryCode, ...city, suspicious: suspiciousPattern.test(city.name), workbookRows: rawCandidates.slice(0, 3) };
  });
  const codes = {};
  for (const city of cities) codes[city.countryCode] = (codes[city.countryCode] || 0) + 1;
  const suspicious = matchRows.filter((row) => row.suspicious);
  const airport = cities.filter((city) => /airport|airfield|aerodrome|terminal/i.test(city.name));
  const exact = cities.filter((city) => /a\.?\s*n\.?\s*r\.?\s*robinson/i.test(city.name) || /a-n-r-robinson/i.test(city.slug));
  console.log(JSON.stringify({
    workbookPath,
    workbookExists,
    totalCities: cities.length,
    uniqueSlugs: new Set(cities.map((city) => city.slug)).size,
    countryCounts: codes,
    suspiciousCount: suspicious.length,
    airportLikeCount: airport.length,
    exactANRRecords: exact.map((city) => ({ country: byCode[city.countryCode] || city.countryCode, ...city, matchingWorkbookRows: workbookData.filter((entry) => normalize(entry.value).includes(normalize(city.name)) || /robinson/i.test(entry.value)).slice(0, 5) })),
    suspiciousRecords: suspicious.map(({ country, slug, name, countryCode, workbookRows }) => ({ country, countryCode, name, slug, workbookRows })),
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
