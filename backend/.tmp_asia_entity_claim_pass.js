const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const userAgent = 'BigCitiesImageAudit/1.0 (city image verification)';
const imageDir = path.join(process.cwd(), 'public', 'Images', 'Asia cities images');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (value) => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase('en');
const cityTypes = new Set(['Q515', 'Q3957', 'Q486972', 'Q15284', 'Q1549591']);
const existingPakistanSlugs = new Set(['pk-lahore','pk-karachi','pk-islamabad','pk-rawalpindi','pk-faisalabad','pk-multan','pk-peshawar','pk-quetta','pk-sialkot']);
const existingAzerbaijanSlugs = new Set(['az-baku','az-ganja','az-lankaran','az-nakhchivan','az-gabala','az-lachin','az-fuzuli','az-zangilan','az-zaqatala']);

async function get(url, label) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': userAgent }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
      if (response.status === 429 || response.status >= 500) {
        await wait(1500 * (attempt + 1));
        continue;
      }
      if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
      return { response, text: await response.text() };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await wait(1000 * (attempt + 1));
    }
  }
  throw lastError ?? new Error(`${label}: retry budget exhausted`);
}

async function mapLimit(items, limit, action) {
  const output = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      output[index] = await action(items[index]);
      await wait(350);
    }
  }));
  return output;
}

function nameVariants(name) {
  const variants = [String(name).trim()];
  const match = String(name).match(/^\s*(.*?)\s*\(([^()]*)\)\s*$/);
  if (match?.[1]?.trim()) variants.push(match[1].trim());
  return [...new Set(variants)].filter(Boolean);
}

function decode(value) {
  return String(value ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function extractPage(html, finalUrl, requestedTitle) {
  return {
    title: decode(/<title>([^<]+)<\/title>/i.exec(html)?.[1] ?? '').replace(/\s+- Wikipedia$/, ''),
    qid: /"wgWikibaseItemId":"([^"]+)"/.exec(html)?.[1] ?? null,
    finalUrl,
    requestedTitle,
  };
}

async function getPageItems(city) {
  const results = [];
  for (const title of nameVariants(city.name)) {
    const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
    try {
      const result = await get(url, 'city page');
      const page = extractPage(result.text, result.response.url, title);
      if (page.qid) results.push({ ...page, html: result.text });
    } catch {}
  }
  return [...new Map(results.map((item) => [item.qid, item])).values()];
}

async function getEntity(qid, cache) {
  if (!cache.has(qid)) {
    const result = await get(`https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(qid)}.json`, 'Wikidata entity');
    const entity = JSON.parse(result.text).entities?.[qid] ?? null;
    cache.set(qid, entity);
  }
  return cache.get(qid);
}

function claimIds(entity, property) {
  return (entity?.claims?.[property] ?? []).map((claim) => claim.mainsnak?.datavalue?.value?.id).filter(Boolean);
}

function claimStrings(entity, property) {
  return (entity?.claims?.[property] ?? []).map((claim) => claim.mainsnak?.datavalue?.value).filter((value) => typeof value === 'string');
}

function exactAlias(entity, cityName) {
  const entityNames = [entity.labels?.en?.value, ...(entity.aliases?.en ?? []).map((alias) => alias.value)].map(normalize);
  return nameVariants(cityName).some((name) => entityNames.includes(normalize(name)));
}

async function countryCodeMatches(entity, cityCode, cache) {
  const countryIds = claimIds(entity, 'P17');
  for (const parentId of claimIds(entity, 'P131')) {
    const parent = await getEntity(parentId, cache);
    countryIds.push(...claimIds(parent, 'P17'));
  }
  for (const countryId of [...new Set(countryIds)]) {
    const country = await getEntity(countryId, cache);
    const codes = (country?.claims?.P297 ?? []).map((claim) => claim.mainsnak?.datavalue?.value).filter((value) => typeof value === 'string');
    if (codes.some((code) => code.toUpperCase() === cityCode.toUpperCase())) return true;
  }
  return false;
}

function imageFileName(imageUrl) {
  const pathSegments = new URL(imageUrl).pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
  const thumb = pathSegments.indexOf('thumb');
  return thumb >= 0 ? pathSegments[thumb + 3] ?? null : pathSegments.at(-1) ?? null;
}

async function fileInfo(fileName) {
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(`File:${fileName}`.replace(/\s+/g, '_'))}`;
  const result = await get(url, 'Commons file page');
  const html = result.text;
  const license = decode(/<span\s+class="licensetpl_short"[^>]*>(.*?)<\/span>/is.exec(html)?.[1] ?? '').replace(/<[^>]+>/g, '').trim();
  const licenseUrl = decode(/<link\s+rel="license"\s+href="([^"]+)"/i.exec(html)?.[1] ?? '');
  const imageUrl = decode(/<meta\s+property="og:image"\s+content="([^"]+)"/i.exec(html)?.[1] ?? '');
  const reusable = /CC0|public domain|CC BY(?:-SA)?(?:\s|$)|GFDL/i.test(license) || /creativecommons\.org\/(publicdomain\/zero|licenses\/(by|by-sa)\/)/i.test(licenseUrl);
  return { filePage: result.response.url, license, licenseUrl, imageUrl, reusable };
}

async function createWebp(sourceUrl, destination) {
  const response = await fetch(sourceUrl, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`image HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!response.headers.get('content-type')?.toLowerCase().startsWith('image/')) throw new Error('source content-type is not image');
  if (!bytes.length || bytes.length > 35 * 1024 * 1024) throw new Error('source image size outside bounds');
  const image = sharp(bytes, { failOn: 'error', limitInputPixels: 120000000 });
  const sourceMetadata = await image.metadata();
  if (!sourceMetadata.format || !sourceMetadata.width || !sourceMetadata.height || sourceMetadata.format === 'svg') throw new Error('source image invalid/unsupported');
  await image.rotate().resize({ width: 1800, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(destination);
  const output = await sharp(destination).metadata();
  if (output.format !== 'webp') throw new Error('output is not WebP');
}

(async () => {
  fs.mkdirSync(imageDir, { recursive: true });
  const continents = await prisma.continent.findMany({ include: { countries: true } });
  const asia = continents.find((continent) => continent.name === 'Asia');
  const countries = asia?.countries ?? [];
  const cities = await prisma.city.findMany({ where: { countryCode: { in: countries.map((country) => country.code) } }, orderBy: [{ countryCode: 'asc' }, { slug: 'asc' }], select: { slug: true, name: true, countryCode: true, profile: true } });
  const pending = cities.filter((city) => {
    const profile = city.profile && typeof city.profile === 'object' ? city.profile : {};
    const hasImage = ['heroImageUrl', 'thumbnail'].some((key) => typeof profile[key] === 'string' && profile[key].trim());
    return !hasImage && !existingPakistanSlugs.has(city.slug.toLowerCase()) && !existingAzerbaijanSlugs.has(city.slug.toLowerCase()) && !fs.existsSync(path.join(imageDir, `${city.slug.toLowerCase()}.webp`));
  });
  const pageRows = await mapLimit(pending, 3, async (city) => ({ city, pages: await getPageItems(city) }));
  const cityEntityCache = new Map();
  const verificationRows = [];
  const verifiedItems = [];
  for (const { city, pages } of pageRows) {
    const candidates = [];
    for (const page of pages) {
      const entity = await getEntity(page.qid, cityEntityCache);
      if (!entity || !exactAlias(entity, city.name)) continue;
      if (!claimIds(entity, 'P31').some((type) => cityTypes.has(type))) continue;
      if (!await countryCodeMatches(entity, city.countryCode, cityEntityCache)) continue;
      const imageNames = claimStrings(entity, 'P18');
      if (!imageNames.length) continue;
      const articleImage = /<meta\s+property="og:image"\s+content="([^"]+)"/i.exec(page.html ?? '')?.[1];
      const articleFile = articleImage ? imageFileName(decode(articleImage)) : null;
      const imageName = articleFile && imageNames.includes(articleFile) ? articleFile : imageNames.length === 1 ? imageNames[0] : null;
      if (!imageName) continue;
      candidates.push({ city, page, entity, imageName });
    }
    const unique = new Map(candidates.map((candidate) => [candidate.entity.id, candidate]));
    if (unique.size !== 1) {
      verificationRows.push({ countryCode: city.countryCode, city: city.name, slug: city.slug, status: 'Image not safely available', reason: unique.size ? 'multiple exact entity matches' : pages.length ? 'country/city/entity/image claims did not all verify' : 'no exact city article/entity' });
      continue;
    }
    verifiedItems.push([...unique.values()][0]);
  }

  const usedImages = new Set();
  for (const item of verifiedItems) {
    if (usedImages.has(item.imageName)) {
      verificationRows.push({ countryCode: item.city.countryCode, city: item.city.name, slug: item.city.slug, qid: item.entity.id, status: 'Image not safely available', reason: `duplicate image claim ${item.imageName}` });
      continue;
    }
    usedImages.add(item.imageName);
    try {
      const source = await fileInfo(item.imageName);
      if (!source.reusable || !source.imageUrl) {
        verificationRows.push({ countryCode: item.city.countryCode, city: item.city.name, slug: item.city.slug, qid: item.entity.id, status: 'Image not safely available', reason: `file license not reusable: ${source.license || 'unknown'}` });
        continue;
      }
      const file = path.join(imageDir, `${item.city.slug.toLowerCase()}.webp`);
      await createWebp(source.imageUrl, file);
      verificationRows.push({ countryCode: item.city.countryCode, city: item.city.name, slug: item.city.slug, qid: item.entity.id, entityLabel: item.entity.labels?.en?.value, imageName: item.imageName, filePage: source.filePage, sourceUrl: source.imageUrl, license: source.license, licenseUrl: source.licenseUrl, file: path.basename(file), status: 'New WebP' });
    } catch (error) {
      verificationRows.push({ countryCode: item.city.countryCode, city: item.city.name, slug: item.city.slug, qid: item.entity.id, imageName: item.imageName, status: 'Image not safely available', reason: String(error.message || error) });
    }
    await wait(700);
  }
  console.log(JSON.stringify({ totalCities: cities.length, pending: pending.length, cityPagesChecked: pageRows.length, entitiesVerified: verifiedItems.length, resultCounts: verificationRows.reduce((counts, item) => { counts[item.status] = (counts[item.status] ?? 0) + 1; return counts; }, {}), results: verificationRows }, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
