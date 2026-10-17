const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const userAgent = 'BigCitiesImageAudit/1.0 (city image verification)';
const imageDir = path.join(process.cwd(), 'public', 'Images', 'Asia cities images');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (value) => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase('en');
const cityClasses = new Set(['Q515', 'Q3957', 'Q486972', 'Q15284', 'Q1549591']);

async function requestJson(url, label) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(20000) });
      if (response.status === 429 || response.status >= 500) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
      if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 4) await sleep(1000 * (attempt + 1));
    }
  }
  throw lastError ?? new Error(`${label}: retry budget exhausted`);
}

async function mapLimit(items, limit, action) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await action(items[index], index);
      await sleep(250);
    }
  }));
  return results;
}

function cityNames(name) {
  const variants = new Set([String(name).trim()]);
  const match = String(name).match(/^\s*(.*?)\s*\(([^()]*)\)\s*$/);
  if (match) {
    if (match[1].trim()) variants.add(match[1].trim());
    if (match[2].trim()) variants.add(match[2].trim());
  }
  return [...variants].filter(Boolean);
}

async function searchEntities(term) {
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.search = new URLSearchParams({ action: 'wbsearchentities', search: term, language: 'en', format: 'json', limit: '20' });
  const result = await requestJson(url, 'Wikidata search');
  const expected = normalize(term);
  return (result.search ?? []).filter((item) => [item.label, ...(item.aliases ?? [])].some((label) => normalize(label) === expected));
}

async function searchCity(city) {
  for (const name of cityNames(city.name)) {
    try {
      const results = await searchEntities(name);
      if (results.length) return results.map((result) => ({ ...result, matchedName: name }));
    } catch (error) {
      return { error: String(error.message || error) };
    }
  }
  return [];
}

async function fetchEntities(ids) {
  const entityMap = new Map();
  const unique = [...new Set(ids)].filter(Boolean);
  for (let offset = 0; offset < unique.length; offset += 40) {
    const batch = unique.slice(offset, offset + 40);
    const url = new URL('https://www.wikidata.org/w/api.php');
    url.search = new URLSearchParams({ action: 'wbgetentities', ids: batch.join('|'), props: 'labels|descriptions|claims|sitelinks', languages: 'en', format: 'json' });
    const result = await requestJson(url, 'Wikidata entities');
    for (const [id, entity] of Object.entries(result.entities ?? {})) entityMap.set(id, entity);
    await sleep(400);
  }
  return entityMap;
}

function values(entity, property) {
  return (entity?.claims?.[property] ?? []).map((claim) => claim.mainsnak?.datavalue?.value).filter((value) => value !== undefined);
}

function ids(entity, property) {
  return values(entity, property).map((value) => value?.id).filter(Boolean);
}

function isCityClass(entity) {
  return ids(entity, 'P31').some((id) => cityClasses.has(id));
}

function exactSearchMatch(candidate, city) {
  const labels = [candidate.label, ...(candidate.aliases ?? [])].map(normalize);
  return cityNames(city.name).some((name) => labels.includes(normalize(name)));
}

async function getFileMetadata(fileNames) {
  const metadataByName = new Map();
  for (let offset = 0; offset < fileNames.length; offset += 35) {
    const batch = [...new Set(fileNames.slice(offset, offset + 35))];
    const url = new URL('https://en.wikipedia.org/w/api.php');
    url.search = new URLSearchParams({ action: 'query', format: 'json', titles: batch.map((name) => `File:${name}`).join('|'), prop: 'imageinfo', iiprop: 'url|extmetadata' });
    const result = await requestJson(url, 'Wikimedia shared-file metadata');
    for (const page of Object.values(result.query?.pages ?? {})) {
      const info = page.imageinfo?.[0];
      if (info) metadataByName.set(page.title.replace(/^File:/i, ''), { url: info.url, descriptionUrl: info.descriptionurl, extmetadata: info.extmetadata ?? {} });
    }
    await sleep(400);
  }
  return metadataByName;
}

function hasReusableLicense(extmetadata) {
  const name = extmetadata?.LicenseShortName?.value ?? '';
  const url = extmetadata?.LicenseUrl?.value ?? '';
  return /CC0|public domain|CC BY(?:-SA)?(?:\s|$)/i.test(name) || /creativecommons\.org\/(publicdomain\/zero|licenses\/(by|by-sa)\/)/i.test(url);
}

async function downloadAsWebp(url, destination) {
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(url, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(45000) });
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    break;
  }
  if (!response?.ok) throw new Error(`image HTTP ${response?.status ?? 'no response'}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 35 * 1024 * 1024) throw new Error('source image byte length outside safe bounds');
  const source = sharp(bytes, { failOn: 'error', limitInputPixels: 120000000 });
  const sourceInfo = await source.metadata();
  if (!sourceInfo.width || !sourceInfo.height || !sourceInfo.format || sourceInfo.format === 'svg') throw new Error('unsupported or invalid source image');
  await source.rotate().resize({ width: 1800, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(destination);
  const outputInfo = await sharp(destination).metadata();
  if (outputInfo.format !== 'webp' || !outputInfo.width || !outputInfo.height) throw new Error('WebP output validation failed');
}

(async () => {
  fs.mkdirSync(imageDir, { recursive: true });
  const continents = await prisma.continent.findMany({ include: { countries: true } });
  const asia = continents.find((continent) => continent.name === 'Asia');
  const countries = asia?.countries ?? [];
  const cities = await prisma.city.findMany({
    where: { countryCode: { in: countries.map((country) => country.code) } },
    orderBy: [{ countryCode: 'asc' }, { slug: 'asc' }],
    select: { slug: true, name: true, countryCode: true, profile: true },
  });
  const pending = cities.filter((city) => {
    const profile = city.profile && typeof city.profile === 'object' ? city.profile : {};
    const hasProfileImage = ['heroImageUrl', 'thumbnail'].some((key) => typeof profile[key] === 'string' && profile[key].trim());
    return !hasProfileImage && !fs.existsSync(path.join(imageDir, `${city.slug.toLowerCase()}.webp`));
  });
  const searchResults = await mapLimit(pending, 3, async (city) => ({ city, result: await searchCity(city) }));
  const searchErrors = searchResults.filter((row) => !Array.isArray(row.result));
  const candidateList = searchResults.flatMap((row) => Array.isArray(row.result) ? row.result.map((candidate) => ({ city: row.city, candidate })) : []);
  const entities = await fetchEntities(candidateList.map(({ candidate }) => candidate.id));
  const parentIds = candidateList.flatMap(({ candidate }) => ids(entities.get(candidate.id), 'P131'));
  const parents = await fetchEntities(parentIds);
  const countryIds = candidateList.flatMap(({ candidate }) => {
    const parentCountryIds = ids(entities.get(candidate.id), 'P131').flatMap((parentId) => ids(parents.get(parentId), 'P17'));
    return ids(entities.get(candidate.id), 'P17').concat(parentCountryIds);
  });
  const countryEntities = await fetchEntities(countryIds);
  const candidatesByCity = new Map();
  const rejected = [];
  for (const { city, candidate } of candidateList) {
    const entity = entities.get(candidate.id);
    if (!entity || !exactSearchMatch(candidate, city)) continue;
    const directCountryIds = ids(entity, 'P17');
    const parentCountryIds = ids(entity, 'P131').flatMap((parentId) => ids(parents.get(parentId), 'P17'));
    const countryMatch = directCountryIds.concat(parentCountryIds).some((countryId) => values(countryEntities.get(countryId), 'P297').some((code) => String(code).toUpperCase() === city.countryCode.toUpperCase()));
    if (!countryMatch || !isCityClass(entity)) continue;
    const imageName = values(entity, 'P18').find((value) => typeof value === 'string');
    if (!imageName) continue;
    if (!candidatesByCity.has(city.slug)) candidatesByCity.set(city.slug, []);
    candidatesByCity.get(city.slug).push({ city, entity, qid: candidate.id, label: entity.labels?.en?.value ?? candidate.label, imageName });
  }

  const accepted = [];
  for (const city of pending) {
    const unique = new Map((candidatesByCity.get(city.slug) ?? []).map((candidate) => [candidate.qid, candidate]));
    if (unique.size !== 1) {
      rejected.push({ countryCode: city.countryCode, city: city.name, slug: city.slug, reason: unique.size ? 'multiple exact country-matched city entities' : 'no exact city entity, country relation, city class, and P18 image all verified' });
      continue;
    }
    accepted.push([...unique.values()][0]);
  }
  const byImage = new Map();
  for (const candidate of accepted) byImage.set(candidate.imageName, (byImage.get(candidate.imageName) ?? 0) + 1);
  const uniqueAccepted = accepted.filter((candidate) => {
    if (byImage.get(candidate.imageName) > 1) {
      rejected.push({ countryCode: candidate.city.countryCode, city: candidate.city.name, slug: candidate.city.slug, reason: `duplicate image claim ${candidate.imageName}` });
      return false;
    }
    return true;
  });
  const files = await getFileMetadata(uniqueAccepted.map((candidate) => candidate.imageName));
  const added = [];
  const failures = [];
  for (const candidate of uniqueAccepted) {
    const source = files.get(candidate.imageName);
    if (!source?.url || !hasReusableLicense(source.extmetadata)) {
      failures.push({ countryCode: candidate.city.countryCode, city: candidate.city.name, slug: candidate.city.slug, qid: candidate.qid, imageName: candidate.imageName, reason: source?.url ? `non-reusable or unknown license: ${source.extmetadata?.LicenseShortName?.value ?? 'unknown'}` : 'shared file metadata unavailable' });
      continue;
    }
    const destination = path.join(imageDir, `${candidate.city.slug.toLowerCase()}.webp`);
    try {
      await downloadAsWebp(source.url, destination);
      added.push({ countryCode: candidate.city.countryCode, city: candidate.city.name, slug: candidate.city.slug, qid: candidate.qid, verifiedEntityLabel: candidate.label, sourceImageName: candidate.imageName, sourceUrl: source.url, descriptionUrl: source.descriptionUrl, license: source.extmetadata.LicenseShortName?.value ?? 'Public domain', licenseUrl: source.extmetadata.LicenseUrl?.value ?? null, artist: source.extmetadata.Artist?.value ?? null, file: path.basename(destination) });
    } catch (error) {
      failures.push({ countryCode: candidate.city.countryCode, city: candidate.city.name, slug: candidate.city.slug, qid: candidate.qid, imageName: candidate.imageName, sourceUrl: source.url, descriptionUrl: source.descriptionUrl, reason: String(error.message || error) });
    }
    await sleep(1000);
  }
  const reasonCounts = {};
  for (const item of rejected) reasonCounts[item.reason] = (reasonCounts[item.reason] ?? 0) + 1;
  console.log(JSON.stringify({ total: cities.length, countries: countries.length, pendingBeforePass: pending.length, searched: searchResults.length, searchErrors: searchErrors.map((row) => ({ slug: row.city.slug, error: row.result.error })), candidateEntities: candidateList.length, verifiedUniqueCityImages: accepted.length, rejectedReasons: reasonCounts, duplicateFilesRejected: accepted.length - uniqueAccepted.length, newWebp: added.length, failures, added }, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
