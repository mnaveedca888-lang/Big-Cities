require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const root = __dirname;
const overrides = new Map([
  ['bi-burundi', ['Bujumbura', 'Profile asset and same-country gazetteer identify Bujumbura; current label is the country.']],
  ['au-ayers-rock-airport', ['Yulara', 'Northern Territory register identifies Yulara as a town; the airport is six kilometres north of Yulara.']],
  ['mh-marshall-islands-international-airport', ['Majuro', 'Airport article locates it in Majuro; Majuro is the capital and a same-country populated city.']],
  ['mt-malta-international-airport', ['Luqa', 'Malta International Airport is physically in Luqa; Luqa is a recognized town.']],
  ['sc-seychelles-international-airport', ['Victoria', 'The airport municipality crosswalk identifies Victoria; Victoria is the capital and a populated locality.']],
  ['au-cocos-keeling-islands-airport', ['West Island', 'The airport is on West Island, the inhabited capital locality (population about 120).']],
]);
const variants = new Map([
  ['bd-chattogram-chittagong','Chattogram'],['bh-muharraq-serves-manama','Al Muharraq'],['cn-mangshi-dehong','Mangshi (Dehong)'],
  ['es-ceuta-heliport','Ceuta'],['gr-astypalaia-island-national-airport','Astypalaia'],['gr-chios-island-national-airport','Chios'],
  ['gr-karpathos-island-national-airport','Karpathos'],['gr-kithira-island-national-airport','Kythira'],['gr-milos-island-national-airport','Milos'],
  ['gr-naxos-island-national-airport','Naxos'],['gr-skyros-island-national-airport','Skyros'],['gr-syros-island-national-airport','Ermoupoli'],
  ['id-surakarta-solo','Surakarta'],['id-tangerang-jakarta','Tangerang'],['id-yogyakarta-limited-international-operations','Yogyakarta'],
  ['ir-kish-island','Kish'],['ir-qeshm-island','Qeshm'],['jp-naha-okinawa','Naha'],['jp-narita-tokyo','Narita'],
  ['kz-oral-uralsk','Oral'],['kz-oskemen-ust-kamenogorsk','Oskemen'],['lk-katunayake-colombo','Katunayake'],
  ['mm-thandwe-ngapali','Thandwe'],['mv-mal-hulhul-island','Malé'],['my-sepang-kuala-lumpur','Sepang'],
  ['np-bhairahawa-siddharthanagar','Bhairahawa'],['ph-angeles-clark-pampanga','Angeles City'],['ph-lapu-lapu-cebu','Lapu-Lapu City'],
  ['tr-mu-la-bodrum','Bodrum'],['tr-mu-la-dalaman','Dalaman'],['vn-nha-trang-khanh-hoa','Nha Trang'],
  ['vn-phu-quoc-island','Phu Quoc'],['ye-al-ghaydah-al-mahrah','Al Ghaydah'],['id-lombok-praya','Praya'],
  ['kg-tamchy-issyk-kul-region','Tamchy'],['mm-bagan-nyaung-u','Nyaung U'],
]);
const removals = new Map([
  ['fm-none',[null,'Placeholder, not a locality; no intended city can be established.']],
  ['nr-nauru-international-airport',[null,'Nauru is a country, not a city; the airport is in Yaren District and Nauru has no formal cities.']],
  ['gb-george-best-belfast-city-airport',['gb-belfast-international-airport','Duplicate airport-named Belfast entry; retain the existing verified Belfast record.']],
  ['us-orlando-sanford-international-airport',['us-orlando-international-airport','Duplicate airport-named Orlando entry; retain the existing verified Orlando record.']],
  ['gb-london-gatwick-airport',['gb-london-heathrow-airport','Duplicate airport-derived London entry; retain one London locality record.']],
  ['se-stockholm-bromma-airport',['se-stockholm-arlanda-airport','Duplicate airport-derived Stockholm entry; retain one Stockholm locality record.']],
  ['ao-dr-ant-nio-agostinho-neto-international-airport-nbj-luanda',['ao-quatro-de-fevereiro-international-airport-lad-luanda','Duplicate Luanda record; retain the record with two linked events.']],
  ['cy-larnaca',['cy-larnaca-international-airport','Duplicate Larnaca record; retain the row with its existing local image/profile.']],
  ['cy-paphos',['cy-paphos-international-airport','Duplicate Paphos record; retain the row with its existing local image/profile.']],
  ['mn-ulaanbaatar-sergelen-t-v-province',['mn-ulaanbaatar','Airport-location duplicate; profile explicitly says it serves Ulaanbaatar and to see the existing Ulaanbaatar entry.']],
  ['id-yogyakarta-limited-international-operations',['id-yogyakarta','Duplicate Yogyakarta record; retain the canonical Yogyakarta row with the existing city image/profile.']],
]);
const manual = new Map([
  ['au-christmas-island-airport','Current label is the whole territory; airport data does not prove that Flying Fish Cove was the intended record.'],
  ['in-district-kutch','District/region label; the linked event and record fields do not establish which locality was intended.'],
  ['tr-mersin-adana-region','Explicitly a region containing separate cities; choosing Mersin or Adana would be a guess.'],
  ['mm-bagan-nyaung-u','Profile describes a regional/archaeological area; requires source review to choose Bagan or Nyaung U.'],
  ['ye-socotra-island','Island/region label; the record does not identify a specific town on Socotra.'],
]);
function normalize(value) { return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' '); }

async function main() {
  const base = JSON.parse(fs.readFileSync(path.join(root, 'tmp_city_classification_full.json'), 'utf8'));
  const cities = await prisma.city.findMany({ select: { slug: true, name: true, countryCode: true }, orderBy: [{ countryCode: 'asc' }, { name: 'asc' }] });
  const bySlug = new Map(cities.map((city) => [city.slug, city]));
  const countryRows = await prisma.country.findMany({ select: { code: true, name: true } });
  const countryName = new Map(countryRows.map((row) => [row.code, row.name]));
  const placeNames = new Set();
  const geonamesFile = path.join(process.env.TEMP || process.env.TMP, 'big-cities-audit-geonames', 'cities500.txt');
  for (const line of fs.readFileSync(geonamesFile, 'utf8').split(/\r?\n/)) {
    if (!line) continue;
    const fields = line.split('\t');
    if (fields[6] !== 'P' || !fields[8]) continue;
    for (const value of [fields[1], fields[2], ...(fields[3] || '').split(',')]) placeNames.add(`${fields[8]}|${normalize(value)}`);
  }
  const rows = [];
  for (const original of base.rows) {
    const city = bySlug.get(original.slug);
    let action = original.action;
    let targetName = original.correction || null;
    let reason = original.reason;
    let removeTargetSlug = null;
    if (removals.has(city.slug)) {
      [removeTargetSlug, reason] = removals.get(city.slug);
      action = 'REMOVE';
      targetName = removeTargetSlug ? bySlug.get(removeTargetSlug)?.name : null;
    } else if (manual.has(city.slug)) {
      action = 'MANUAL_REVIEW';
      reason = manual.get(city.slug);
      targetName = null;
    } else if (overrides.has(city.slug)) {
      [targetName, reason] = overrides.get(city.slug);
      action = 'RENAME';
    } else if (variants.has(city.slug)) {
      targetName = variants.get(city.slug);
      action = targetName === city.name ? 'KEEP_VERIFIED' : 'RENAME';
      reason = action === 'KEEP_VERIFIED' ? 'The current name identifies a recognized same-country urban locality; parenthetical prefecture text is retained as a disambiguator.' : 'Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context.';
    }
    if (['RENAME','RENAME_TO_MUNICIPALITY'].includes(action) && !placeNames.has(`${city.countryCode}|${normalize(targetName)}`) && !(city.slug === 'au-cocos-keeling-islands-airport' || city.slug === 'au-ayers-rock-airport')) {
      action = 'MANUAL_REVIEW';
      reason = `Proposed target “${targetName}” lacks a same-country GeoNames cities500 match; held for review.`;
      targetName = null;
    }
    const isVerified = action === 'KEEP_VERIFIED' || action === 'RENAME' || action === 'RENAME_TO_MUNICIPALITY';
    rows.push({
      country: countryName.get(city.countryCode) || city.countryCode,
      countryCode: city.countryCode,
      currentName: city.name,
      slug: city.slug,
      isVerified,
      action,
      correctedName: isVerified && ['RENAME','RENAME_TO_MUNICIPALITY'].includes(action) ? targetName : null,
      removeTargetSlug,
      reason,
      evidence: isVerified ? 'Country-matched GeoNames populated place and/or cited airport-to-locality source' : 'Insufficient locality evidence; excluded from Big Cities pending review',
    });
  }
  const duplicateTargets = new Map();
    for (const row of rows.filter((item) => item.action === 'REMOVE')) {
      row.eventCount = await prisma.event.count({ where: { citySlug: row.slug } });
      if (row.removeTargetSlug) {
        const target = bySlug.get(row.removeTargetSlug);
        if (!target || target.countryCode !== row.countryCode) throw new Error(`Unsafe city merge target for ${row.slug}`);
      } else if (row.eventCount > 0) {
        row.action = 'MANUAL_REVIEW';
        row.isVerified = false;
        row.reason = `No merge target is established and ${row.eventCount} linked event(s) exist; kept for manual review.`;
      }
    }
  for (const row of rows.filter((item) => item.isVerified)) {
    const name = row.correctedName || row.currentName;
    const key = `${row.countryCode}|${normalize(name)}`;
    if (!duplicateTargets.has(key)) duplicateTargets.set(key, []);
    duplicateTargets.get(key).push(row);
  }
  const unresolvedCollisions = [...duplicateTargets.values()].filter((group) => group.length > 1);
  if (unresolvedCollisions.length) throw new Error(`Verified-name collisions remain: ${JSON.stringify(unresolvedCollisions.map((group) => group.map((item) => item.slug)))}`);
  const summary = rows.reduce((out, row) => { out[row.action] = (out[row.action] || 0) + 1; return out; }, {});
  const plan = { generatedAt: new Date().toISOString(), totalSourceRecords: rows.length, summary, unresolvedNameCollisions: unresolvedCollisions.map((group) => group.map(({ countryCode, currentName, correctedName, slug }) => ({ countryCode, currentName, correctedName, slug }))), rows };
  fs.writeFileSync(path.join(root, 'tmp_final_city_audit_plan.json'), JSON.stringify(plan, null, 2));
  console.log(JSON.stringify({ totalSourceRecords: plan.totalSourceRecords, summary, unresolvedNameCollisions: plan.unresolvedNameCollisions }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
