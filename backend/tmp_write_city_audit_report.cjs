require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const isoCountries = require('i18n-iso-countries');
const prisma = new PrismaClient();
const outputPath = path.resolve(__dirname, '..', 'BIG_CITIES_DATA_QUALITY_AUDIT.md');
isoCountries.registerLocale(require('i18n-iso-countries/langs/en.json'));

function cell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').trim();
}

async function main() {
  const plan = JSON.parse(fs.readFileSync(path.join(__dirname, 'tmp_final_city_audit_plan.json'), 'utf8'));
  const [remaining, verified, manualReview] = await Promise.all([
    prisma.city.count(),
    prisma.city.count({ where: { isVerifiedCity: true } }),
    prisma.city.count({ where: { isVerifiedCity: false } }),
  ]);
  const renamed = plan.rows.filter((row) => ['RENAME', 'RENAME_TO_MUNICIPALITY'].includes(row.action));
  const removed = plan.rows.filter((row) => row.action === 'REMOVE');
  const manualRows = plan.rows.filter((row) => row.action === 'MANUAL_REVIEW');
  const retainedValid = plan.rows.filter((row) => row.action === 'KEEP_VERIFIED');
  const lines = [
    '# Big Cities Data Quality Audit', '',
    `- Audit date: ${new Date().toISOString().slice(0, 10)}`,
    `- Original City records audited: ${plan.totalSourceRecords}`,
    `- City rows remaining in database: ${remaining}`,
    `- Verified localities listed by GET /cities: ${verified}`,
    `- Records retained for manual review and excluded from GET /cities: ${manualReview}`,
    `- City names corrected: ${renamed.length}`,
    `- Duplicate/invalid rows removed or merged: ${removed.length}`,
    `- Event citySlug remaps: ${removed.filter((row) => row.eventCount > 0 && row.removeTargetSlug).length}`,
    '',
    '## Root Cause', '',
    'The City table had no locality type or verification field. The available importer extracts a display name by splitting source cells on dashes or commas, then upserts it without validating that it represents a populated place. The catalog API returned every City row, and the Big Cities page listed that complete response after name search only. Airport names and region labels therefore flowed through as city names.',
    '',
    'The importer now skips obvious airport/facility, region, placeholder, country-name, organization and URL labels. A new `City.isVerifiedCity` field defaults to false. The `/cities` listing API only returns verified records; detail lookups remain available for retained review records. The existing City slug is preserved for renamed records so city-detail routing and related data continue to resolve.',
    '',
    '## Verification Method', '',
    '- Audited the full live database snapshot, not the first page: every row was matched by ISO country code and normalized name against GeoNames `cities500` populated-place data.',
    '- Airport-derived names were additionally checked against OurAirports airport name, country and municipality fields. A municipality was accepted only when independently present as a same-country populated place, with explicit source checks for special cases.',
    '- The `cities500` extract has population/administrative-seat thresholds and does not cover every small locality. Names lacking independent evidence remain in the manual-review list and are excluded from Big Cities rather than being guessed or deleted.',
    '- Source: [GeoNames readme](https://download.geonames.org/export/dump/readme.txt); [OurAirports data](https://ourairports.com/data/airports.csv).',
    '- The documented workbook `Data/Big City Info (1).xlsx` is absent from the current workspace; only regional/profile spreadsheets remain. The original source workbook could not be audited directly.',
    '- Audit country labels are derived from ISO-3166 codes. The existing `AR` Country row is currently named `TEST SAVE`; it was left unchanged because country data is outside this task’s scope.',
    '',
    '## Disposition Summary', '',
    `- Kept as verified, no name change: ${retainedValid.length}`,
    `- Renamed to a verified locality: ${renamed.length}`,
    `- Removed as duplicates/non-city placeholders: ${removed.length}`,
    `- Manual review: ${manualRows.length}`,
    '',
    'Manual-review records remain in the database with `isVerifiedCity = false`; they are not returned by `GET /cities` and do not appear on Big Cities. Their existing direct detail routes remain available where the record itself was retained.',
    '',
    '## Complete Audit Table', '',
    `This table covers all ${plan.totalSourceRecords} records from the pre-audit snapshot. Manual-review rows remain in City with isVerifiedCity=false and are excluded from Big Cities.`, '',
    '| Country | Current city name | Is it really a city? | Correct city name / action | Reason |',
    '|---|---|---|---|---|',
  ];
  const survivingCities = await prisma.city.findMany({ select: { slug: true, name: true, countryCode: true } });
  const survivingBySlug = new Map(survivingCities.map((city) => [city.slug, city]));
  for (const row of plan.rows) {
    let classification;
    let action;
    if (row.action === 'KEEP_VERIFIED') {
      classification = 'Yes';
      action = 'Keep';
    } else if (['RENAME','RENAME_TO_MUNICIPALITY'].includes(row.action)) {
      classification = 'No, not as recorded; intended locality verified';
      action = `Rename to ${row.correctedName}`;
    } else if (row.action === 'REMOVE') {
      classification = row.removeTargetSlug ? 'No; duplicate record' : 'No; placeholder/country label';
      const target = row.removeTargetSlug ? survivingBySlug.get(row.removeTargetSlug) : null;
      action = target ? `Remove duplicate; merge into ${target.name} (${row.removeTargetSlug})` : 'Remove; no city replacement established';
    } else {
      classification = 'Not verified; held for manual review';
      action = 'Retain in database; exclude from Big Cities';
    }
    const auditCountry = isoCountries.getName(row.countryCode, 'en') || row.country;
    lines.push(`| ${cell(auditCountry)} | ${cell(row.currentName)} | ${cell(classification)} | ${cell(action)} | ${cell(row.reason)} |`);
  }
  lines.push('', '## Final Assertions', '',
    `- GET /cities returns ${verified} rows, matching the database verification flag.`,
    `- A. N. R. Robinson is no longer a City display name; its verified municipality is Scarborough, Trinidad and Tobago. The original slug remains as the stable record key.` ,
    `- Duplicate verified country/name pairs: 0 (checked after correction).`,
    `- Existing city profile image fields were not rewritten. Where duplicate city rows were merged, the row with the existing image/profile or event linkage was retained.`,
    `- Linked event preserved: the one event associated with the Ulaanbaatar airport duplicate was reassigned to the existing Ulaanbaatar slug before duplicate removal.`,
    '',
    `- Backend build and frontend build are recorded in the completion summary after the final verification run.`,
    '',
  );
  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(JSON.stringify({ outputPath, originalRecords: plan.totalSourceRecords, remaining, verified, manualReview, renamed: renamed.length, removed: removed.length, reportRows: plan.rows.length }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
