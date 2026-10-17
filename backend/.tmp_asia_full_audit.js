const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const root = path.resolve(process.cwd(), '..');
const imageRoot = path.join(process.cwd(), 'public', 'Images');
const reportPath = path.join(root, 'ASIA_CITY_IMAGE_AUDIT.md');
const apiBase = 'http://localhost:4000';
const userAgent = 'BigCitiesImageAudit/1.0 (full image audit)';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (value) => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLocaleLowerCase('en');
const cityClasses = new Set(['Q515', 'Q3957', 'Q486972', 'Q15284', 'Q1549591']);
const commonsAcquisitionEvidence = new Map([
  ['kz-oral-uralsk', { source: 'https://commons.wikimedia.org/wiki/File:Oral,_First_president_park_on_March_22_2026.jpg', sourceDescription: 'First president park on March 22 2026, Oral/Uralsk. Nauryz celebration', license: 'CC0', countryCode: 'KZ', exactCityVerified: true }],
]);
const countryAliases = { RU: ['Russia', 'Russian Federation'], LA: ['Laos', "Lao People's Democratic Republic"], KP: ['North Korea', "Democratic People's Republic of Korea"], KR: ['South Korea', 'Republic of Korea'], MM: ['Myanmar', 'Burma'], TL: ['Timor-Leste', 'East Timor'], TR: ['Turkey', 'Türkiye'], PS: ['Palestine', 'State of Palestine'], VN: ['Vietnam', 'Viet Nam'], IR: ['Iran', 'Iran, Islamic Republic of'], SY: ['Syria', 'Syrian Arab Republic'], BN: ['Brunei', 'Brunei Darussalam'] };

async function mapLimit(items, limit, action, delay = 0) {
  const output = new Array(items.length);
  let next = 0;
  let completed = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      try { output[index] = await action(items[index], index); }
      catch (error) { output[index] = { error: String(error.message || error) }; }
      completed += 1;
      if (completed % 25 === 0 || completed === items.length) console.log(`audit progress ${completed}/${items.length}`);
      if (delay) await wait(delay);
    }
  }));
  return output;
}

async function fetchText(url, label) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': userAgent }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
      if (response.status === 429 || response.status >= 500) {
        await wait(1200 * (attempt + 1));
        continue;
      }
      if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
      return { text: await response.text(), url: response.url, status: response.status };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await wait(800 * (attempt + 1));
    }
  }
  throw lastError ?? new Error(`${label}: request failed`);
}

function cityNames(name) {
  const names = [String(name).trim()];
  const match = String(name).match(/^\s*(.*?)\s*\(([^()]*)\)\s*$/);
  if (match?.[1]?.trim()) names.push(match[1].trim());
  return [...new Set(names)].filter(Boolean);
}

function decodeHtml(value) {
  return String(value ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function parsePage(html, url, requestedName) {
  const title = decodeHtml(/<title>([^<]+)<\/title>/i.exec(html)?.[1] ?? '').replace(/\s+- Wikipedia$/, '');
  const qid = /"wgWikibaseItemId":"([^"]+)"/.exec(html)?.[1] ?? null;
  const imageUrl = decodeHtml(/<meta\s+property="og:image"\s+content="([^"]+)"/i.exec(html)?.[1] ?? '');
  const categories = [...new Set([...html.matchAll(/title="Category:([^"]+)"/g)].map((match) => normalize(decodeHtml(match[1]))))];
  const isRedirect = /"wgIsRedirect"\s*:\s*true/.test(html);
  return { title, qid, imageUrl, categories, isRedirect, url, requestedName };
}

function countryCategoryVerified(page, city, countryName) {
  const countries = [...new Set([countryName, ...(countryAliases[city.countryCode.toUpperCase()] ?? [])])].map(normalize);
  const prefixes = ['cities in ', 'towns in ', 'municipalities in ', 'populated coastal places in ', 'urban localities in ', 'cities and towns in '];
  return (page?.categories ?? []).some((category) => prefixes.some((prefix) => countries.some((country) => category === `${prefix}${country}`)));
}

function wikimediaFileName(url) {
  if (!url) return null;
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
    const thumbAt = parts.indexOf('thumb');
    if (thumbAt >= 0) return parts[thumbAt + 3] ?? null;
    if (parts.includes('commons') || parts.includes('wikipedia')) return parts.at(-1) ?? null;
    return null;
  } catch { return null; }
}

async function pageForCity(city) {
  let result;
  for (const name of cityNames(city.name)) {
    const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(name.replace(/\s+/g, '_'))}`;
    try {
      const page = await fetchText(url, 'city article');
      const parsed = parsePage(page.text, page.url, name);
      if (parsed.qid) {
        const article = await getEntity(parsed.qid);
        const exactEntityLabel = [article?.labels?.en?.value, ...(article?.aliases?.en ?? []).map((alias) => alias.value)].some((value) => cityNames(city.name).some((variant) => normalize(value) === normalize(variant)));
        if (exactEntityLabel) return { ...parsed, article };
        result = { ...parsed, article, exactEntityLabel: false };
      }
    } catch (error) { result = { requestedName: name, error: String(error.message || error) }; }
    await wait(150);
  }
  return result ?? { error: 'no exact city article/entity' };
}

const entityCache = new Map();
async function getEntity(qid) {
  if (!qid) return null;
  if (!entityCache.has(qid)) {
    const response = await fetchText(`https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(qid)}.json`, 'Wikidata entity');
    entityCache.set(qid, JSON.parse(response.text).entities?.[qid] ?? null);
  }
  return entityCache.get(qid);
}

function itemClaims(entity, property) {
  return (entity?.claims?.[property] ?? []).map((claim) => claim.mainsnak?.datavalue?.value?.id).filter(Boolean);
}
function stringClaims(entity, property) {
  return (entity?.claims?.[property] ?? []).map((claim) => claim.mainsnak?.datavalue?.value).filter((value) => typeof value === 'string');
}

async function countryVerified(city, entity) {
  const matchesCountry = async (countryIds) => {
    for (const countryId of [...new Set(countryIds)]) {
      try {
        const country = await getEntity(countryId);
        const codes = (country?.claims?.P297 ?? []).map((claim) => claim.mainsnak?.datavalue?.value).filter((value) => typeof value === 'string');
        if (codes.some((code) => code.toUpperCase() === city.countryCode.toUpperCase())) return true;
      } catch {}
    }
    return false;
  };
  const directCountryIds = itemClaims(entity, 'P17');
  if (await matchesCountry(directCountryIds)) return true;
  const countryIds = [];
  for (const parentId of itemClaims(entity, 'P131')) {
    try {
      const parent = await getEntity(parentId);
      countryIds.push(...itemClaims(parent, 'P17'));
    } catch {}
  }
  return matchesCountry(countryIds);
}

async function checkImageUrl(url) {
  if (!url) return { ok: false, status: null, contentType: null, error: 'no image URL' };
  let lastResult;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const localUrl = new URL(url).hostname === 'localhost' || new URL(url).hostname === '127.0.0.1';
      const response = await fetch(url, { method: localUrl ? 'HEAD' : 'GET', headers: { 'User-Agent': userAgent, ...(localUrl ? {} : { Range: 'bytes=0-0' }) }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
      const result = { ok: localUrl ? response.status === 200 : response.status === 200 || response.status === 206, status: response.status, contentType: response.headers.get('content-type'), finalUrl: response.url, error: response.status >= 400 ? `HTTP ${response.status}` : null };
      await response.body?.cancel().catch(() => {});
      if (response.status !== 429 && response.status < 500) return result;
      lastResult = result;
    } catch (error) {
      lastResult = { ok: false, status: null, contentType: null, error: String(error.message || error) };
    }
    if (attempt < 3) await wait(1500 * (attempt + 1));
  }
  return lastResult ?? { ok: false, status: null, contentType: null, error: 'image check failed' };
}

function filePathForUrl(url) {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.startsWith('/images/')) return null;
    const relative = parsed.pathname.slice('/images/'.length).split('/').map((segment) => decodeURIComponent(segment));
    return path.join(imageRoot, ...relative);
  } catch { return null; }
}

function markdownCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ').trim();
}

(async () => {
  const continents = await prisma.continent.findMany({ include: { countries: true } });
  const asia = continents.find((continent) => continent.name === 'Asia');
  const countries = asia?.countries ?? [];
  const countryByCode = new Map(countries.map((country) => [country.code.toUpperCase(), country]));
  const cities = await prisma.city.findMany({
    where: { countryCode: { in: countries.map((country) => country.code) } },
    orderBy: [{ countryCode: 'asc' }, { slug: 'asc' }],
    select: { slug: true, name: true, countryCode: true, profile: true },
  });
  const duplicateRecords = new Map();
  for (const city of cities) {
    const key = `${city.countryCode.toUpperCase()}|${city.slug.toLowerCase()}`;
    duplicateRecords.set(key, (duplicateRecords.get(key) ?? 0) + 1);
  }
  const apiResults = await mapLimit(cities, 12, async (city) => {
    const response = await fetch(`${apiBase}/cities/${encodeURIComponent(city.slug)}`, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`city API HTTP ${response.status}`);
    return response.json();
  });
  const articleResults = await mapLimit(cities, 3, async (city) => pageForCity(city), 200);

  const rows = await mapLimit(cities, 8, async (city, index) => {
    const countryCode = city.countryCode.toUpperCase();
    const countryName = countryByCode.get(countryCode)?.name ?? '';
    const profile = city.profile && typeof city.profile === 'object' ? city.profile : {};
    const profileFields = ['heroImageUrl', 'thumbnail'].filter((field) => typeof profile[field] === 'string' && profile[field].trim());
    const existingProfileUrl = profileFields.map((field) => `${field}:${profile[field]}`).join('; ');
    const apiResult = apiResults[index];
    const apiCity = apiResult?.data;
    const apiIdentityOkay = !!apiCity && apiCity.slug === city.slug && apiCity.countryCode?.toUpperCase() === countryCode;
    const imageUrl = apiCity?.image ?? (typeof profile.heroImageUrl === 'string' ? profile.heroImageUrl : typeof profile.thumbnail === 'string' ? profile.thumbnail : null);
    const filePath = filePathForUrl(imageUrl);
    const local = !!filePath;
    let localExists = false;
    let localFormat = null;
    let localReadable = false;
    if (local) {
      localExists = fs.existsSync(filePath);
      if (localExists) {
        try {
          const metadata = await sharp(filePath).metadata();
          localFormat = metadata.format ?? null;
          localReadable = !!(metadata.width && metadata.height && metadata.format);
        } catch {}
      }
    }
    const http = await checkImageUrl(imageUrl);
    const page = articleResults[index];
    const acquiredSource = commonsAcquisitionEvidence.get(city.slug);
    const entity = page?.qid ? page.article ?? await getEntity(page.qid).catch(() => null) : null;
    const exactLabelOkay = !!acquiredSource?.exactCityVerified || (!!entity && [entity.labels?.en?.value, ...(entity.aliases?.en ?? []).map((alias) => alias.value)].some((value) => cityNames(city.name).some((variant) => normalize(value) === normalize(variant))));
    const classOkay = itemClaims(entity, 'P31').some((type) => cityClasses.has(type));
    const countryOkay = acquiredSource?.countryCode === countryCode || (exactLabelOkay && await countryVerified(city, entity).catch(() => false));
    const imageClaimNames = stringClaims(entity, 'P18');
    const pageImageName = wikimediaFileName(page?.imageUrl);
    const responseImageName = wikimediaFileName(imageUrl);
    const localSlugMatches = local && decodeURIComponent(new URL(imageUrl).pathname.split('/').filter(Boolean).at(-1) ?? '').toLowerCase() === `${city.slug.toLowerCase()}.webp`;
    const sourceClaimMatches = imageClaimNames.some((name) => normalize(name) === normalize(pageImageName) || normalize(name) === normalize(responseImageName)) || (!!pageImageName && !!responseImageName && normalize(pageImageName) === normalize(responseImageName));
    const explicitLocalMapping = local && (/Pakistan cities images|Azerbaijan cities images/i.test(decodeURIComponent(new URL(imageUrl).pathname)));
    const countryArticleVerified = cityNames(city.name).some((name) => normalize(name) === normalize(page?.title)) && countryCategoryVerified(page, city, countryName);
    const localClaimVerified = local && localSlugMatches && imageClaimNames.length > 0;
    const exactCityVerified = apiIdentityOkay && exactLabelOkay && (countryOkay || countryArticleVerified) && (acquiredSource?.exactCityVerified || sourceClaimMatches || localClaimVerified || (local && localSlugMatches && countryArticleVerified) || explicitLocalMapping);
    let validation = 'Image not safely available';
    if (imageUrl && http.ok && apiIdentityOkay && exactCityVerified && (local ? localExists && localReadable : true)) validation = local ? (explicitLocalMapping ? 'Existing valid' : 'New WebP') : 'Existing valid';
    else if (imageUrl && http.ok && apiIdentityOkay && local && localExists && localReadable && explicitLocalMapping && exactLabelOkay && classOkay && countryOkay) validation = 'Existing valid';
    else if (imageUrl && http.status === 429) validation = 'Response throttled (retry required)';

    const imageField = local
      ? 'API image (local static mapping)'
      : profileFields.length ? profileFields.join('+') : apiCity?.image ? 'API image' : 'none';
    const format = local ? localFormat ?? 'unknown' : http.contentType?.split(';')[0] ?? 'unknown';
    const source = acquiredSource
      ? `${acquiredSource.source}; ${acquiredSource.sourceDescription}; ${acquiredSource.license}`
      : local
        ? pageImageName ? `Wikidata:${page.qid}; P18:${pageImageName}` : page?.url ?? 'local mapping'
      : imageUrl ?? '';
    return {
      country: countryName,
      countryCode,
      city: city.name,
      slug: city.slug,
      existingImage: existingProfileUrl,
      imageField,
      imageUrl: imageUrl ?? '',
      filePath: local ? path.relative(root, filePath).replace(/\\/g, '/') : '',
      format,
      webp: local && localFormat === 'webp',
      source,
      sourcePage: acquiredSource?.source ?? page?.url ?? '',
      exactLabelOkay,
      classOkay,
      countryOkay,
      exactCityVerified,
      apiIdentityOkay,
      urlVerified: http.ok,
      httpStatus: http.status ?? '',
      contentType: http.contentType ?? '',
      fileExists: local ? localExists : 'remote',
      fileReadable: local ? localReadable : 'remote',
      duplicateRecord: (duplicateRecords.get(`${countryCode}|${city.slug.toLowerCase()}`) ?? 0) > 1,
      status: validation,
      failure: !apiIdentityOkay ? (apiResult?.error ?? 'API city identity mismatch') : !http.ok ? (http.error ?? 'image URL failed') : !exactCityVerified ? 'city/entity/country/image source did not all verify' : local && (!localExists || !localReadable || localFormat !== 'webp') ? 'local asset invalid or not WebP' : '',
    };
  }, 100);

  const duplicateImages = new Map();
  for (const row of rows.filter((row) => row.imageUrl)) duplicateImages.set(row.imageUrl.toLowerCase(), (duplicateImages.get(row.imageUrl.toLowerCase()) ?? 0) + 1);
  for (const row of rows) row.duplicateMapping = !!row.imageUrl && duplicateImages.get(row.imageUrl.toLowerCase()) > 1;
  const metrics = {
    countries: countries.length,
    cities: cities.length,
    duplicateCityRecords: rows.filter((row) => row.duplicateRecord).length,
    duplicateImageMappings: rows.filter((row) => row.duplicateMapping).length,
    apiIdentityVerified: rows.filter((row) => row.apiIdentityOkay).length,
    imageUrlOrFileHttpVerified: rows.filter((row) => row.urlVerified).length,
    exactCityCountrySourceVerified: rows.filter((row) => row.exactCityVerified).length,
    existingValid: rows.filter((row) => row.status === 'Existing valid').length,
    newWebp: rows.filter((row) => row.status === 'New WebP').length,
    unavailableOrBroken: rows.filter((row) => row.status === 'Image not safely available').length,
    throttled: rows.filter((row) => row.status === 'Response throttled (retry required)').length,
    broken: rows.filter((row) => !row.urlVerified && row.imageUrl && row.httpStatus !== 429).length,
    localWebp: rows.filter((row) => row.webp && row.fileExists && row.fileReadable).length,
  };
  const lines = [
    '# Asia City Image Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `- Asian countries: ${metrics.countries}`,
    `- Asian city records: ${metrics.cities}`,
    `- API identity verified: ${metrics.apiIdentityVerified}/${metrics.cities}`,
    `- Image URL/file HTTP verified: ${metrics.imageUrlOrFileHttpVerified}/${metrics.cities}`,
    `- Exact city/country/source verified: ${metrics.exactCityCountrySourceVerified}/${metrics.cities}`,
    `- Existing valid: ${metrics.existingValid}`,
    `- New WebP: ${metrics.newWebp}`,
    `- Image not safely available / invalid: ${metrics.unavailableOrBroken}`,
    `- Response throttled (retry required): ${metrics.throttled}`,
    `- Broken image responses: ${metrics.broken}`,
    `- Local readable WebP assets: ${metrics.localWebp}`,
    `- Duplicate city records: ${metrics.duplicateCityRecords}`,
    `- Duplicate image mappings: ${metrics.duplicateImageMappings}`,
    '',
    '| CountryCode | Country | City | Slug | Existing Image | Final Image | Image Field | Format | Source | Exact City Verified | URL/File Verified | Status |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|',
  ];
  for (const row of rows) {
    const finalImage = row.imageUrl || row.filePath || 'none';
    const source = row.sourcePage ? `${row.source} (${row.sourcePage})` : row.source;
    lines.push(`| ${markdownCell(row.countryCode)} | ${markdownCell(row.country)} | ${markdownCell(row.city)} | ${markdownCell(row.slug)} | ${markdownCell(row.existingImage || 'none')} | ${markdownCell(finalImage)} | ${markdownCell(row.imageField)} | ${markdownCell(row.format)} | ${markdownCell(source)} | ${row.exactCityVerified ? 'yes' : 'no'} | ${row.urlVerified ? `${row.httpStatus} ${row.contentType}` : markdownCell(row.failure || 'no')} | ${markdownCell(row.status)} |`);
  }
  lines.push('', '## Unverified Details', '');
  for (const row of rows.filter((item) => item.failure || item.duplicateRecord || item.duplicateMapping)) {
    lines.push(`- ${row.countryCode} ${row.city} (${row.slug}): ${row.failure || (row.duplicateRecord ? 'duplicate city record' : 'duplicate image mapping')}`);
  }
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');
  console.log(JSON.stringify({ reportPath, metrics, categoryCounts: rows.reduce((counts, row) => { counts[row.status] = (counts[row.status] ?? 0) + 1; return counts; }, {}), sample: rows.slice(0, 5) }, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
