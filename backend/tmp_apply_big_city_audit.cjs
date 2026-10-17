require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const planPath = path.join(__dirname, 'tmp_final_city_audit_plan.json');

function normalize(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

async function main() {
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const before = await prisma.city.findMany({ select: { slug: true, name: true, countryCode: true } });
  if (before.length !== plan.totalSourceRecords || before.length !== 1230) throw new Error(`Live City count changed since audit: ${before.length}`);
  const slugSet = new Set(before.map((row) => row.slug));
  for (const row of plan.rows) {
    if (!slugSet.has(row.slug)) throw new Error(`Audited city no longer exists: ${row.slug}`);
    if (row.action === 'REMOVE' && row.removeTargetSlug) {
      const target = before.find((city) => city.slug === row.removeTargetSlug);
      if (!target || target.countryCode !== row.countryCode) throw new Error(`Invalid merge target for ${row.slug}`);
    }
  }
  const verifiedNameCounts = new Map();
  for (const row of plan.rows.filter((item) => item.isVerified)) {
    const name = row.correctedName || row.currentName;
    const key = `${row.countryCode}|${normalize(name)}`;
    verifiedNameCounts.set(key, (verifiedNameCounts.get(key) || 0) + 1);
  }
  const collisions = [...verifiedNameCounts.entries()].filter(([, count]) => count > 1);
  if (collisions.length) throw new Error(`Duplicate verified place names remain: ${JSON.stringify(collisions)}`);

  const deleted = [];
  const eventRemaps = [];
  await prisma.$transaction(async (transaction) => {
    await transaction.city.updateMany({ data: { isVerifiedCity: false } });
    for (const row of plan.rows.filter((item) => item.isVerified)) {
      const name = row.correctedName || row.currentName;
      if (name !== row.currentName) await transaction.city.update({ where: { slug: row.slug }, data: { name, isVerifiedCity: true } });
      else await transaction.city.update({ where: { slug: row.slug }, data: { isVerifiedCity: true } });
    }
    for (const row of plan.rows.filter((item) => item.action === 'REMOVE')) {
      const linkedEvents = await transaction.event.count({ where: { citySlug: row.slug } });
      if (row.removeTargetSlug) {
        if (linkedEvents) {
          const result = await transaction.event.updateMany({ where: { citySlug: row.slug }, data: { citySlug: row.removeTargetSlug } });
          eventRemaps.push({ from: row.slug, to: row.removeTargetSlug, count: result.count });
        }
      } else if (linkedEvents) {
        throw new Error(`Refusing to remove ${row.slug}; ${linkedEvents} event(s) have no safe merge target.`);
      }
      await transaction.city.delete({ where: { slug: row.slug } });
      deleted.push({ country: row.country, name: row.currentName, slug: row.slug, targetSlug: row.removeTargetSlug });
    }
  }, { timeout: 120000, maxWait: 10000 });

  const [remaining, verified, manualReview] = await Promise.all([
    prisma.city.count(),
    prisma.city.count({ where: { isVerifiedCity: true } }),
    prisma.city.count({ where: { isVerifiedCity: false } }),
  ]);
  const cityRows = await prisma.city.findMany({ where: { isVerifiedCity: true }, select: { name: true, countryCode: true } });
  const duplicates = new Map();
  for (const city of cityRows) {
    const key = `${city.countryCode}|${normalize(city.name)}`;
    duplicates.set(key, (duplicates.get(key) || 0) + 1);
  }
  const duplicateVerifiedNames = [...duplicates.entries()].filter(([, count]) => count > 1);
  if (duplicateVerifiedNames.length) throw new Error(`Verified duplicate city names remain after apply: ${JSON.stringify(duplicateVerifiedNames)}`);
  console.log(JSON.stringify({ before: before.length, remaining, verified, manualReview, renamed: plan.rows.filter((row) => row.isVerified && row.correctedName).length, deletedCount: deleted.length, eventRemaps, duplicateVerifiedNames }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
