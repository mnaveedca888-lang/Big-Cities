const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const userAgent = 'BigCitiesImageAudit/1.0 (city image verification)';
const imageDir = path.join(process.cwd(), 'public', 'Images', 'Asia cities images');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (value) => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase('en');

async function getJson(url, label) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(25000) });
      if (response.status === 429 || response.status >= 500) {
        await wait(1500 * (attempt + 1));
        continue;
      }
      if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 2) await wait(1000 * (attempt + 1));
    }
  }
  throw lastError ?? new Error(`${label}: no response`);
}

async function searchCity(cityName) {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(cityName)}&language=en&format=json&limit=30`;
  const result = await getJson(url, 'Wikidata search');
  await wait(350);
  const expected = normalize(cityName);
  return (result.search ?? []).filter((item) => {
    const exactText = [item.label, ...(item.aliases ?? [])].some((value) => normalize(value) === expected);
    return exactText;
  });
}

async function getEntities(ids) {
  const output = new Map();
  for (let offset = 0; offset < ids.length; offset += 50) {
    const batch = ids.slice(offset, offset + 50);
    if (!batch.length) continue;
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.join('|')}&props=labels%7Cdescriptions%7Cclaims%7Csitelinks&languages=en&format=json`;
    const result = await getJson(url, 'Wikidata entity batch');
    for (const [id, entity] of Object.entries(result.entities ?? {})) output.set(id, entity);
    await wait(500);
  }
  return output;
}

function claimIds(entity, property) {
  return (entity?.claims?.[property] ?? []).map((claim) => claim.mainsnak?.datavalue?.value?.id).filter(Boolean);
}

function claimStrings(entity, property) {
  return (entity?.claims?.[property] ?? []).map((claim) => claim.mainsnak?.datavalue?.value).filter((value) => typeof value === 'string');
}

function citySearchNames(name) {
  const names = [name];
  const match = String(name).match(/^\s*(.*?)\s*\(([^()]*)\)\s*$/);
  if (match) {
    if (match[1].trim()) names.push(match[1].trim());
    if (match[2].trim()) names.push(match[2].trim());
  }
  return [...new Set(names)];
}

async function lookupCountryIds(countryCodes) {
  const codes = [...new Set(countryCodes.map((code) => String(code).toUpperCase()))];
  const values = codes.map((code) => `"${code}"`).join(' ');
  const query = `SELECT ?code ?country WHERE { VALUES ?code { ${values} } ?country wdt:P297 ?code. }`;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
  const result = await getJson(url, 'Wikidata ISO-country lookup');
  const map = new Map();
  for (const binding of result.results?.bindings ?? []) {
    const code = binding.code.value.toUpperCase();
    const qid = binding.country.value.split('/').pop();
    if (!map.has(code)) map.set(code, qid);
  }
  return map;
}

async function findCountryMatch(entity, countryQid, parentEntities) {
  if (claimIds(entity, 'P17').includes(countryQid)) return true;
  for (const parentId of claimIds(entity, 'P131')) {
    const parent = parentEntities.get(parentId);
    if (claimIds(parent, 'P17').includes(countryQid)) return true;
    if (claimIds(parent, 'P131').some((grandparentId) => claimIds(parentEntities.get(grandparentId), 'P17').includes(countryQid))) return true;
  }
  return false;
}

async function downloadAsWebp(sourceUrl, destination) {
  const response = await fetch(sourceUrl, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`image HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 35 * 1024 * 1024) throw new Error('image byte length outside safe bounds');
  const image = sharp(bytes, { failOn: 'error', limitInputPixels: 120000000 });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || !metadata.format || metadata.format === 'svg') throw new Error('unsupported or invalid source image');
  await image.rotate().resize({ width: 1800, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(destination);
  const finalMeta = await sharp(destination).metadata();
  if (finalMeta.format !== 'webp' || !finalMeta.width || !finalMeta.height) throw new Error('WebP output validation failed');
}

(async () => {
  fs.mkdirSync(imageDir, { recursive: true });
  const continents = await prisma.continent.findMany({ include: { countries: true } });
  const asia = continents.find((continent) => continent.name === 'Asia');
  const countries = asia?.countries ?? [];
  const countryByCode = new Map(countries.map((country) => [country.code.toUpperCase(), country]));
  const cities = await prisma.city.findMany({
    where: { countryCode: { in: countries.map((country) => country.code) } },
    orderBy: [{ countryCode: 'asc' }, { slug: 'asc' }],
    select: { slug: true, name: true, countryCode: true, profile: true },
  });
  const countryIds = await lookupCountryIds(countries.map((country) => country.code));
  const pending = cities.filter((city) => {
    const profile = city.profile && typeof city.profile === 'object' ? city.profile : {};
    const hasProfileImage = ['heroImageUrl', 'thumbnail'].some((key) => typeof profile[key] === 'string' && profile[key].trim());
    const filePath = path.join(imageDir, `${city.slug.toLowerCase()}.webp`);
    return !hasProfileImage && !fs.existsSync(filePath);
  });

  const searches = [];
  const searchErrors = new Map();
  let requestCount = 0;
  for (const city of pending) {
    const matches = new Map();
    for (const name of citySearchNames(city.name)) {
      try {
        const results = await searchCity(name);
        requestCount += 1;
        for (const item of results) matches.set(item.id, item);
        if (results.length) break;
      } catch (error) {
        searchErrors.set(city.slug, String(error.message || error));
        break;
      }
    }
    searches.push({ city, candidates: [...matches.values()] });
  }

  const candidateIds = [...new Set(searches.flatMap((row) => row.candidates.map((candidate) => candidate.id)))];
  const entities = await getEntities(candidateIds);
  const parentIds = [...new Set([...entities.values()].flatMap((entity) => claimIds(entity, 'P131')))].filter((id) => !entities.has(id));
  const parents = await getEntities(parentIds);
  for (const [id, entity] of entities) parents.set(id, entity);

  const selected = [];
  const skipped = [];
  for (const row of searches) {
    const { city, candidates } = row;
    const countryCode = city.countryCode.toUpperCase();
    const countryQid = countryIds.get(countryCode);
    if (!countryQid) {
      skipped.push({ city, reason: `no ISO country entity for ${countryCode}` });
      continue;
    }
    const countryCandidates = candidates.filter((candidate) => {
      const entity = entities.get(candidate.id);
      return entity && findCountryMatch(entity, countryQid, parents);
    });
    if (countryCandidates.length !== 1) {
      skipped.push({ city, reason: countryCandidates.length ? 'ambiguous exact-name city entities in country' : candidates.length ? 'exact-name entity country relation did not match' : searchErrors.get(city.slug) ?? 'no exact-label city entity' });
      continue;
    }
    const candidate = countryCandidates[0];
    const entity = entities.get(candidate.id);
    const imageNames = claimStrings(entity, 'P18');
    if (!imageNames.length) {
      skipped.push({ city, reason: 'verified city entity has no P18 image' });
      continue;
    }
    selected.push({ city, entityId: candidate.id, entityLabel: entity.labels?.en?.value ?? candidate.label, description: entity.descriptions?.en?.value ?? candidate.description ?? '', imageName: imageNames[0] });
  }

  const added = [];
  const failures = [];
  for (const item of selected) {
    const destination = path.join(imageDir, `${item.city.slug.toLowerCase()}.webp`);
    const sourceUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(item.imageName)}`;
    try {
      await downloadAsWebp(sourceUrl, destination);
      added.push({ country: countryByCode.get(item.city.countryCode.toUpperCase())?.name, countryCode: item.city.countryCode, city: item.city.name, slug: item.city.slug, qid: item.entityId, entityLabel: item.entityLabel, description: item.description, imageName: item.imageName, sourceUrl, file: path.basename(destination) });
    } catch (error) {
      failures.push({ countryCode: item.city.countryCode, city: item.city.name, slug: item.city.slug, qid: item.entityId, imageName: item.imageName, sourceUrl, error: String(error.message || error) });
    }
    await wait(350);
  }

  const statusCounts = {};
  for (const item of skipped) statusCounts[item.reason] = (statusCounts[item.reason] ?? 0) + 1;
  console.log(JSON.stringify({ totalAsianCities: cities.length, countryCount: countries.length, countryIdsFound: countryIds.size, pendingBeforePass: pending.length, exactEntitySearches: requestCount, exactCountryAndCityImageClaims: selected.length, newWebp: added.length, downloadOrDecodeFailures: failures.length, skippedByReason: statusCounts, newAssets: added, failures, unresolved: skipped.map(({ city, reason }) => ({ countryCode: city.countryCode, city: city.name, slug: city.slug, reason })) }, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
