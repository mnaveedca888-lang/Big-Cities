const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const expected = {
  AR: 2780400,
  BO: 1098581,
  BR: 8515767,
  CL: 756102,
  CO: 1141748,
  EC: 283561,
  GY: 214969,
  PY: 406752,
  PE: 1285216,
  SR: 163820,
  UY: 176215,
  VE: 916445,
};

function parseArea(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;

  const millionMatch = text.match(/([0-9][0-9,\.]*)(?:\s+million)?\s*km²?/i);
  if (millionMatch && /million/i.test(text)) {
    const num = Number(millionMatch[1].replace(/,/g, ''));
    return Math.round(num * 1000000);
  }

  const plainMatch = text.match(/([0-9][0-9,\.]+)/);
  if (plainMatch) {
    return Number(plainMatch[1].replace(/,/g, ''));
  }

  return null;
}

function normalizedStatus(current, expectedValue) {
  const currentNum = parseArea(current);
  if (currentNum === null) return { status: 'missing', same: false };
  const delta = Math.abs(currentNum - expectedValue) / expectedValue;
  return { status: delta <= 0.01 ? 'correct' : 'incorrect', same: delta <= 0.01 };
}

async function main() {
  const codes = Object.keys(expected);
  const countries = await prisma.country.findMany({
    where: { code: { in: codes } },
    select: { code: true, name: true, profile: true },
    orderBy: { code: 'asc' },
  });

  for (const country of countries) {
    const current = country.profile?.totalArea || country.profile?.area || null;
    const result = normalizedStatus(current, expected[country.code]);
    console.log(`${country.code}|${country.name}|${current || 'MISSING'}|${result.status}|${expected[country.code].toLocaleString('en-US')} km²`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
