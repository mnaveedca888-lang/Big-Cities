const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const userAgent = 'BigCitiesImageAudit/1.0 (city image verification)';
const imageDir = path.join(process.cwd(), 'public', 'Images', 'Asia cities images');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (value) => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase('en');
const escapeSparql = (value) => String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

async function getJson(url, label, options = {}) {
  const { headers, ...requestOptions } = options;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, { ...requestOptions, headers: { 'User-Agent': userAgent, ...headers }, signal: AbortSignal.timeout(30000) });
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await wait(2000 * (attempt + 1));
      continue;
    }
    if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
    return response.json();
  }
  throw new Error(`${label}: rate limit/retry budget exhausted`);
}

function searchNames(name) {
  const variants = new Set([String(name).trim()]);
  const parenthetical = String(name).match(/^\s*(.*?)\s*\(([^()]*)\)\s*$/);
  if (parenthetical) {
    if (parenthetical[1].trim()) variants.add(parenthetical[1].trim());
    if (parenthetical[2].trim()) variants.add(parenthetical[2].trim());
  }
  return [...variants].filter(Boolean);
}

function literal(value) {
  return `"${escapeSparql(value)}"@en`;
}

function getImageName(uri) {
  const marker = '/Special:FilePath/';
  const index = uri.indexOf(marker);
  if (index < 0) return null;
  return decodeURIComponent(uri.slice(index + marker.length).split(/[?#]/, 1)[0]);
}

function hasReuseLicense(metadata) {
  const license = metadata?.LicenseShortName?.value ?? '';
  const url = metadata?.LicenseUrl?.value ?? '';
  return /CC0|public domain|CC BY(?:-SA)?(?:\s|$)/i.test(license) || /creativecommons\.org\/publicdomain\/zero|creativecommons\.org\/licenses\/(by|by-sa)\//i.test(url);
}

async function queryCities(rows) {
  const tuples = rows.flatMap((city) => searchNames(city.name).map((name) => `("${escapeSparql(city.countryCode.toUpperCase())}" "${escapeSparql(city.slug)}" ${literal(name)})`));
  if (!tuples.length) return [];
  const query = `SELECT DISTINCT ?code ?slug ?city ?label ?image WHERE { VALUES (?code ?slug ?targetLabel) { ${tuples.join(' ')} } ?country wdt:P297 ?code. ?city wdt:P17 ?country; wdt:P18 ?image; (rdfs:label|skos:altLabel) ?label. FILTER(LANG(?label) = "en" && LCASE(STR(?label)) = LCASE(STR(?targetLabel))) }`;
  const url = new URL('https://query.wikidata.org/sparql');
  url.search = new URLSearchParams({ query, format: 'json' });
  const result = await getJson(url, 'Wikidata city batch', { headers: { Accept: 'application/sparql-results+json' } });
  return (result.results?.bindings ?? []).map((binding) => ({
    countryCode: binding.code.value.toUpperCase(),
    slug: binding.slug.value,
    qid: binding.city.value.split('/').pop(),
    label: binding.label.value,
    imageUrl: binding.image.value,
    imageName: getImageName(binding.image.value),
  })).filter((result) => result.imageName);
}

async function getFileMetadata(fileNames) {
  const uniqueNames = [...new Set(fileNames)];
  const metadata = new Map();
  for (let offset = 0; offset < uniqueNames.length; offset += 40) {
    const batch = uniqueNames.slice(offset, offset + 40);
    const titles = batch.map((name) => `File:${name}`).join('|');
    const url = new URL('https://en.wikipedia.org/w/api.php');
    url.search = new URLSearchParams({ action: 'query', format: 'json', titles, prop: 'imageinfo', iiprop: 'url|extmetadata' });
    const result = await getJson(url, 'Wikipedia shared-file metadata');
    for (const page of Object.values(result.query?.pages ?? {})) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      metadata.set(page.title.replace(/^File:/i, ''), {
        directUrl: info.url,
        descriptionUrl: info.descriptionurl,
        metadata: info.extmetadata ?? {},
      });
    }
    await wait(350);
  }
  return metadata;
}

async function downloadAsWebp(sourceUrl, destination) {
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(sourceUrl, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(45000) });
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await wait(2000 * (attempt + 1));
      continue;
    }
    break;
  }
  if (!response?.ok) throw new Error(`image HTTP ${response?.status ?? 'no response'}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 35 * 1024 * 1024) throw new Error('image byte length outside safe bounds');
  const image = sharp(bytes, { failOn: 'error', limitInputPixels: 120000000 });
  const sourceMetadata = await image.metadata();
  if (!sourceMetadata.width || !sourceMetadata.height || !sourceMetadata.format || sourceMetadata.format === 'svg') throw new Error('unsupported or invalid source image');
  await image.rotate().resize({ width: 1800, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(destination);
  const outputMetadata = await sharp(destination).metadata();
  if (outputMetadata.format !== 'webp' || !outputMetadata.width || !outputMetadata.height) throw new Error('WebP output validation failed');
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
  const pending = cities.filter((city) => {
    const profile = city.profile && typeof city.profile === 'object' ? city.profile : {};
    const hasProfileImage = ['heroImageUrl', 'thumbnail'].some((key) => typeof profile[key] === 'string' && profile[key].trim());
    return !hasProfileImage && !fs.existsSync(path.join(imageDir, `${city.slug.toLowerCase()}.webp`));
  });
  const candidatesByCity = new Map();
  const queryErrors = [];
  const queryChunks = [];
  for (let offset = 0; offset < pending.length; offset += 8) queryChunks.push(pending.slice(offset, offset + 8));
  for (const rows of queryChunks) {
    try {
      const results = await queryCities(rows);
      for (const result of results) {
        if (!candidatesByCity.has(result.slug)) candidatesByCity.set(result.slug, []);
        candidatesByCity.get(result.slug).push(result);
      }
    } catch (error) {
      queryErrors.push({ slugs: rows.map((city) => city.slug), error: String(error.message || error) });
    }
    await wait(1500);
  }

  const candidates = [];
  const unresolved = [];
  for (const city of pending) {
    const entityMap = new Map((candidatesByCity.get(city.slug) ?? []).map((candidate) => [candidate.qid, candidate]));
    const rows = [...entityMap.values()];
    if (rows.length !== 1) {
      unresolved.push({ countryCode: city.countryCode, city: city.name, slug: city.slug, reason: rows.length ? 'multiple exact country-matched city entities' : queryErrors.some((item) => item.slugs.includes(city.slug)) ? 'source endpoint unavailable for batch' : 'no exact country-matched city entity with a P18 image' });
      continue;
    }
    candidates.push({ city, ...rows[0] });
  }

  const duplicateFileMap = new Map();
  for (const candidate of candidates) duplicateFileMap.set(candidate.imageName, (duplicateFileMap.get(candidate.imageName) ?? 0) + 1);
  const distinctCandidates = [];
  for (const candidate of candidates) {
    if (duplicateFileMap.get(candidate.imageName) > 1) {
      unresolved.push({ countryCode: candidate.city.countryCode, city: candidate.city.name, slug: candidate.city.slug, reason: `image claim duplicates another city mapping: ${candidate.imageName}` });
    } else {
      distinctCandidates.push(candidate);
    }
  }

  const fileMetadata = await getFileMetadata(distinctCandidates.map((candidate) => candidate.imageName));
  const added = [];
  const failures = [];
  for (const candidate of distinctCandidates) {
    const file = fileMetadata.get(candidate.imageName);
    if (!file?.directUrl) {
      failures.push({ countryCode: candidate.city.countryCode, city: candidate.city.name, slug: candidate.city.slug, qid: candidate.qid, imageName: candidate.imageName, reason: 'shared image metadata unavailable' });
      continue;
    }
    const license = file.metadata.LicenseShortName?.value ?? 'unknown';
    if (!hasReuseLicense(file.metadata)) {
      failures.push({ countryCode: candidate.city.countryCode, city: candidate.city.name, slug: candidate.city.slug, qid: candidate.qid, imageName: candidate.imageName, sourceUrl: file.directUrl, descriptionUrl: file.descriptionUrl, license, reason: 'license is not an accepted reusable license' });
      continue;
    }
    const destination = path.join(imageDir, `${candidate.city.slug.toLowerCase()}.webp`);
    try {
      await downloadAsWebp(file.directUrl, destination);
      added.push({ country: countryByCode.get(candidate.city.countryCode.toUpperCase())?.name ?? null, countryCode: candidate.city.countryCode, city: candidate.city.name, slug: candidate.city.slug, qid: candidate.qid, verifiedEntityLabel: candidate.label, sourceImageName: candidate.imageName, sourceUrl: file.directUrl, descriptionUrl: file.descriptionUrl, license, licenseUrl: file.metadata.LicenseUrl?.value ?? null, artist: file.metadata.Artist?.value ?? null, file: path.basename(destination) });
    } catch (error) {
      failures.push({ countryCode: candidate.city.countryCode, city: candidate.city.name, slug: candidate.city.slug, qid: candidate.qid, imageName: candidate.imageName, sourceUrl: file.directUrl, descriptionUrl: file.descriptionUrl, license, reason: String(error.message || error) });
    }
    await wait(1000);
  }

  const unresolvedByReason = {};
  for (const item of unresolved) unresolvedByReason[item.reason] = (unresolvedByReason[item.reason] ?? 0) + 1;
  console.log(JSON.stringify({ totalAsianCities: cities.length, countryCount: countries.length, pendingBeforePass: pending.length, queryBatches: queryChunks.length, queryErrors, exactCountryAndCityImageClaims: candidates.length, duplicateImageClaimsRejected: candidates.length - distinctCandidates.length, newWebp: added.length, downloadLicenseOrDecodeFailures: failures.length, failures, unresolvedByReason, added }, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
