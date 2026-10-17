const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const userAgent = 'BigCitiesImageAudit/1.0 (Commons exact-city search)';
const imageDir = path.join(process.cwd(), 'public', 'Images', 'Asia cities images');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (value) => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLocaleLowerCase('en');
const countryAliases = { RU: ['Russia', 'Russian Federation'], LA: ['Laos', "Lao People's Democratic Republic"], KP: ['North Korea', "Democratic People's Republic of Korea"], KR: ['South Korea', 'Republic of Korea'], MM: ['Myanmar', 'Burma'], TL: ['Timor-Leste', 'East Timor'], TR: ['Turkey', 'Türkiye'], PS: ['Palestine', 'State of Palestine'], VN: ['Vietnam', 'Viet Nam'], IR: ['Iran', 'Iran, Islamic Republic of'], SY: ['Syria', 'Syrian Arab Republic'], BN: ['Brunei', 'Brunei Darussalam'] };
const existingPakistan = new Set(['pk-lahore','pk-karachi','pk-islamabad','pk-rawalpindi','pk-faisalabad','pk-multan','pk-peshawar','pk-quetta','pk-sialkot']);
const existingAzerbaijan = new Set(['az-baku','az-ganja','az-lankaran','az-nakhchivan','az-gabala','az-lachin','az-fuzuli','az-zangilan','az-zaqatala']);

async function requestJson(url, label) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(25000) });
      if (response.status === 429 || response.status >= 500) {
        await sleep(1200 * (attempt + 1));
        continue;
      }
      if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(800 * (attempt + 1));
    }
  }
  throw lastError ?? new Error(`${label}: request failed`);
}

function mapLimit(items, limit, action, delay = 300) {
  const output = new Array(items.length);
  let next = 0;
  return Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      try { output[index] = await action(items[index]); }
      catch (error) { output[index] = { error: String(error.message || error) }; }
      await sleep(delay);
    }
  })).then(() => output);
}

function escapeRegex(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function exactPhrase(text, phrase) {
  const value = normalize(text);
  const target = normalize(phrase);
  if (!target) return false;
  const expression = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegex(target)}($|[^\\p{L}\\p{N}])`, 'iu');
  return expression.test(value);
}
function decodeHtml(value) {
  return String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/\s+/g, ' ').trim();
}
function reusableLicense(name, url) {
  return /CC0|public domain|CC BY(?:-SA)?(?:\s|$)|GFDL/i.test(name) || /creativecommons\.org\/(publicdomain\/zero|licenses\/(by|by-sa)\/)/i.test(url);
}
function cityQueryName(city) {
  return String(city.name).trim();
}
function imageFilename(title) { return String(title ?? '').replace(/^File:/i, '').trim(); }

async function commonsSearch(city, countryName) {
  const query = `${cityQueryName(city)} ${countryName}`;
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.search = new URLSearchParams({ action: 'query', format: 'json', generator: 'search', gsrsearch: query, gsrnamespace: '6', gsrlimit: '10', prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1600' });
  const result = await requestJson(url, 'Commons file search');
  const candidates = [];
  for (const page of Object.values(result.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    const metadata = info?.extmetadata ?? {};
    const title = page.title ?? '';
    const description = decodeHtml(metadata.ImageDescription?.value ?? '');
    const categories = decodeHtml(metadata.Categories?.value ?? '');
    const sourceText = `${title} ${description} ${categories}`;
    const cityVerified = exactPhrase(description, cityQueryName(city));
    const countryNames = [countryName, ...(countryAliases[city.countryCode.toUpperCase()] ?? [])];
    const countryVerified = countryNames.some((name) => exactPhrase(description, name));
    const license = decodeHtml(metadata.LicenseShortName?.value ?? 'unknown');
    const licenseUrl = metadata.LicenseUrl?.value ?? '';
    if (!info?.url || !/\.(jpe?g|png|webp)$/i.test(title) || !cityVerified || !countryVerified || !reusableLicense(license, licenseUrl)) continue;
    candidates.push({ title, filename: imageFilename(title), description, categories, sourceUrl: info.thumburl ?? info.url, descriptionUrl: info.descriptionurl ?? '', license, licenseUrl, artist: decodeHtml(metadata.Artist?.value ?? '') });
  }
  return candidates;
}

async function writeWebp(candidate, destination) {
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(candidate.sourceUrl, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(45000) });
    if ((response.status === 429 || response.status >= 500) && attempt < 4) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    break;
  }
  if (!response?.ok) throw new Error(`source HTTP ${response?.status ?? 'no response'}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('image/')) throw new Error(`source content-type ${contentType}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 35 * 1024 * 1024) throw new Error('source size outside bounds');
  const image = sharp(bytes, { failOn: 'error', limitInputPixels: 120000000 });
  const metadata = await image.metadata();
  if (!metadata.format || !metadata.width || !metadata.height || metadata.format === 'svg') throw new Error('invalid/unsupported source image');
  await image.rotate().resize({ width: 1800, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(destination);
  const output = await sharp(destination).metadata();
  if (output.format !== 'webp') throw new Error('output format is not WebP');
  return { sourceFormat: metadata.format, outputFormat: output.format, contentType, sourceBytes: bytes.length };
}

(async () => {
  fs.mkdirSync(imageDir, { recursive: true });
  const continents = await prisma.continent.findMany({ include: { countries: true } });
  const asia = continents.find((continent) => continent.name === 'Asia');
  const countries = asia?.countries ?? [];
  const countryByCode = new Map(countries.map((country) => [country.code.toUpperCase(), country]));
  const cities = await prisma.city.findMany({ where: { countryCode: { in: countries.map((country) => country.code) } }, orderBy: [{ countryCode: 'asc' }, { slug: 'asc' }], select: { slug: true, name: true, countryCode: true, profile: true } });
  const pending = cities.filter((city) => {
    const profile = city.profile && typeof city.profile === 'object' ? city.profile : {};
    const profileImage = ['heroImageUrl','thumbnail'].some((field) => typeof profile[field] === 'string' && profile[field].trim());
    return !profileImage && !existingPakistan.has(city.slug.toLowerCase()) && !existingAzerbaijan.has(city.slug.toLowerCase()) && !fs.existsSync(path.join(imageDir, `${city.slug.toLowerCase()}.webp`));
  });
  const searchResults = await mapLimit(pending, 2, async (city) => {
    try { return { city, candidates: await commonsSearch(city, countryByCode.get(city.countryCode.toUpperCase())?.name ?? '') }; }
    catch (error) { return { city, error: String(error.message || error), candidates: [] }; }
  }, 450);
  const fileUseCounts = new Map();
  for (const result of searchResults) for (const candidate of result.candidates ?? []) fileUseCounts.set(candidate.filename, (fileUseCounts.get(candidate.filename) ?? 0) + 1);
  const acquired = [];
  const unresolved = [];
  const failures = [];
  for (const result of searchResults) {
    const { city, candidates } = result;
    if (result.error) {
      unresolved.push({ countryCode: city.countryCode, city: city.name, slug: city.slug, reason: `search endpoint error: ${result.error}` });
      continue;
    }
    const unique = new Map((candidates ?? []).map((candidate) => [candidate.filename, candidate]));
    if (!unique.size) {
      unresolved.push({ countryCode: city.countryCode, city: city.name, slug: city.slug, reason: 'no Commons image description explicitly names exact city and country with reusable license' });
      continue;
    }
    const candidate = [...unique.values()][0];
    if (fileUseCounts.get(candidate.filename) > 1) {
      unresolved.push({ countryCode: city.countryCode, city: city.name, slug: city.slug, reason: `duplicate source file maps to multiple city records: ${candidate.filename}` });
      continue;
    }
    try {
      const destination = path.join(imageDir, `${city.slug.toLowerCase()}.webp`);
      const conversion = await writeWebp(candidate, destination);
      acquired.push({ country: countryByCode.get(city.countryCode.toUpperCase())?.name, countryCode: city.countryCode, city: city.name, slug: city.slug, imageField: 'local city slug asset', imagePath: `backend/public/Images/Asia cities images/${city.slug.toLowerCase()}.webp`, format: 'webp', source: candidate.descriptionUrl, sourceImageUrl: candidate.sourceUrl, sourceTitle: candidate.title, sourceDescription: candidate.description, categories: candidate.categories, license: candidate.license, licenseUrl: candidate.licenseUrl, artist: candidate.artist, ...conversion });
    } catch (error) {
      failures.push({ countryCode: city.countryCode, city: city.name, slug: city.slug, source: candidate.descriptionUrl, reason: String(error.message || error) });
    }
    await sleep(700);
  }
  console.log(JSON.stringify({ totalAsianCities: cities.length, pendingAtStart: pending.length, searched: searchResults.length, candidates: searchResults.reduce((sum, result) => sum + (result.candidates?.length ?? 0), 0), acquiredCount: acquired.length, unresolvedCount: unresolved.length, failures, acquired, unresolved }, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
