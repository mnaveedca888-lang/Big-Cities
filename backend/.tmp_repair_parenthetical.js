const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const userAgent = 'BigCitiesImageAudit/1.0 (city image verification)';
const imageDir = path.join(process.cwd(), 'public', 'Images', 'Asia cities images');
const cityClasses = new Set(['Q515', 'Q3957', 'Q486972', 'Q15284', 'Q1549591']);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const norm = (value) => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase('en');

async function getText(url) {
  const response = await fetch(url, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function getJson(url) {
  return JSON.parse(await getText(url));
}

function idValues(entity, property) {
  return (entity?.claims?.[property] ?? []).map((claim) => claim.mainsnak?.datavalue?.value?.id).filter(Boolean);
}

function stringValues(entity, property) {
  return (entity?.claims?.[property] ?? []).map((claim) => claim.mainsnak?.datavalue?.value).filter((value) => typeof value === 'string');
}

function nameVariants(name) {
  const result = [String(name).trim()];
  const match = String(name).match(/^\s*(.*?)\s*\(([^()]*)\)\s*$/);
  if (match?.[1]?.trim()) result.push(match[1].trim());
  return [...new Set(result)];
}

function decodeHtml(value) {
  return String(value ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function extractPage(html) {
  return {
    title: decodeHtml(/<title>([^<]+)<\/title>/i.exec(html)?.[1] ?? '').replace(/\s+- Wikipedia$/, ''),
    qid: /"wgWikibaseItemId":"([^"]+)"/.exec(html)?.[1] ?? null,
    isRedirect: /"wgIsRedirect"\s*:\s*true/.test(html),
  };
}

async function fetchCityItems(city) {
  const candidates = [];
  for (const title of nameVariants(city.name)) {
    const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
    try {
      const html = await getText(url);
      const page = extractPage(html);
      if (page.qid && !page.isRedirect) candidates.push({ ...page, requestedTitle: title });
    } catch {}
    await wait(250);
  }
  return [...new Map(candidates.map((candidate) => [candidate.qid, candidate])).values()];
}

async function getEntity(qid) {
  const result = await getJson(`https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(qid)}.json`);
  return result.entities?.[qid] ?? null;
}

async function getCountryCode(entityId, cache) {
  if (!cache.has(entityId)) cache.set(entityId, await getEntity(entityId));
  const entity = cache.get(entityId);
  return (entity?.claims?.P297 ?? []).map((claim) => claim.mainsnak?.datavalue?.value).filter((value) => typeof value === 'string').map((value) => value.toUpperCase());
}

async function metadataForFile(fileName) {
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(`File:${fileName}`.replace(/\s+/g, '_'))}`;
  const html = await getText(url);
  const license = decodeHtml(/<span\s+class="licensetpl_short"[^>]*>(.*?)<\/span>/is.exec(html)?.[1] ?? '').replace(/<[^>]+>/g, '').trim();
  const licenseUrl = decodeHtml(/<link\s+rel="license"\s+href="([^"]+)"/i.exec(html)?.[1] ?? '');
  const imageUrl = decodeHtml(/<meta\s+property="og:image"\s+content="([^"]+)"/i.exec(html)?.[1] ?? '');
  const reusable = /CC0|public domain|CC BY(?:-SA)?(?:\s|$)/i.test(license) || /creativecommons\.org\/(publicdomain\/zero|licenses\/(by|by-sa)\/)/i.test(licenseUrl);
  return { pageUrl: url, license, licenseUrl, imageUrl, reusable };
}

async function writeWebp(url, destination) {
  const response = await fetch(url, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`image HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 35 * 1024 * 1024) throw new Error('image size outside bounds');
  const image = sharp(bytes, { failOn: 'error', limitInputPixels: 120000000 });
  const info = await image.metadata();
  if (!info.format || !info.width || !info.height || info.format === 'svg') throw new Error('invalid source image');
  await image.rotate().resize({ width: 1800, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(destination);
  const output = await sharp(destination).metadata();
  if (output.format !== 'webp') throw new Error('output not WebP');
}

(async () => {
  const folderNames = fs.readdirSync(imageDir).filter((name) => name.endsWith('.webp'));
  const slugs = folderNames.map((name) => name.slice(0, -5));
  const cities = await prisma.city.findMany({ where: { slug: { in: slugs }, name: { contains: '(' } }, orderBy: { slug: 'asc' }, select: { slug: true, name: true, countryCode: true } });
  const rows = [];
  const entityCache = new Map();
  for (const city of cities) {
    const pageCandidates = await fetchCityItems(city);
    const verified = [];
    for (const page of pageCandidates) {
      const entity = await getEntity(page.qid);
      if (!entity) continue;
      const labels = [entity.labels?.en?.value, ...(entity.aliases?.en ?? []).map((alias) => alias.value)].map(norm);
      if (!nameVariants(city.name).some((name) => labels.includes(norm(name)))) continue;
      if (!idValues(entity, 'P31').some((type) => cityClasses.has(type))) continue;
      const countryIds = idValues(entity, 'P17');
      for (const parentId of idValues(entity, 'P131')) {
        const parent = await getEntity(parentId);
        countryIds.push(...idValues(parent, 'P17'));
      }
      const countryMatches = [];
      for (const countryId of [...new Set(countryIds)]) {
        const codes = await getCountryCode(countryId, entityCache);
        if (codes.includes(city.countryCode.toUpperCase())) countryMatches.push(countryId);
      }
      if (!countryMatches.length) continue;
      const p18 = stringValues(entity, 'P18');
      if (p18.length !== 1) continue;
      verified.push({ city, page, entity, imageName: p18[0] });
    }
    const unique = new Map(verified.map((item) => [item.entity.id, item]));
    if (unique.size !== 1) {
      rows.push({ city: city.name, slug: city.slug, countryCode: city.countryCode, status: 'Image not safely available', reason: unique.size ? 'ambiguous exact city entity' : 'no exact city-class entity, country claim, and P18 claim' });
      continue;
    }
    const item = [...unique.values()][0];
    try {
      const source = await metadataForFile(item.imageName);
      if (!source.reusable || !source.imageUrl) {
        rows.push({ city: city.name, slug: city.slug, countryCode: city.countryCode, qid: item.page.qid, sourceImage: item.imageName, status: 'Image not safely available', reason: `reusable license unavailable: ${source.license || 'unknown'}` });
        continue;
      }
      await writeWebp(source.imageUrl, path.join(imageDir, `${city.slug.toLowerCase()}.webp`));
      rows.push({ city: city.name, slug: city.slug, countryCode: city.countryCode, qid: item.page.qid, verifiedLabel: item.entity.labels?.en?.value, sourceImage: item.imageName, sourcePage: item.page.requestedTitle, filePage: source.pageUrl, license: source.license, licenseUrl: source.licenseUrl, status: 'reverified-webp' });
    } catch (error) {
      rows.push({ city: city.name, slug: city.slug, countryCode: city.countryCode, qid: item.page.qid, sourceImage: item.imageName, status: 'verification-failed', reason: String(error.message || error) });
    }
    await wait(400);
  }

  const duplicateImages = new Map();
  for (const row of rows.filter((item) => item.status === 'reverified-webp')) duplicateImages.set(row.sourceImage, (duplicateImages.get(row.sourceImage) ?? 0) + 1);
  for (const row of rows.filter((item) => item.status === 'reverified-webp' && duplicateImages.get(item.sourceImage) > 1)) row.status = 'duplicate-image-claim';
  console.log(JSON.stringify({ checked: cities.length, counts: rows.reduce((counts, row) => { counts[row.status] = (counts[row.status] ?? 0) + 1; return counts; }, {}), rows }, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
