const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const userAgent = 'BigCitiesImageAudit/1.0 (city image verification)';
const imageDir = path.join(process.cwd(), 'public', 'Images', 'Asia cities images');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (value) => String(value ?? '').normalize('NFKC').trim().replace(/_/g, ' ').toLocaleLowerCase('en');
const countryAliases = {
  RU: ['Russia', 'Russian Federation'], LA: ['Laos', "Lao People's Democratic Republic"],
  KP: ['North Korea', "Democratic People's Republic of Korea"], KR: ['South Korea', 'Republic of Korea'],
  MM: ['Myanmar', 'Burma'], TL: ['Timor-Leste', 'East Timor'], TR: ['Turkey', 'Türkiye'],
  PS: ['Palestine', 'State of Palestine'], VN: ['Vietnam', 'Viet Nam'], IR: ['Iran', 'Iran, Islamic Republic of'],
  SY: ['Syria', 'Syrian Arab Republic'], BN: ['Brunei', 'Brunei Darussalam'],
};

async function requestText(url, label) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': userAgent }, redirect: 'follow', signal: AbortSignal.timeout(25000) });
      if (response.status === 429 || response.status >= 500) {
        await wait(1500 * (attempt + 1));
        continue;
      }
      if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
      return { html: await response.text(), url: response.url, status: response.status };
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
      output[index] = await action(items[index], index);
      await wait(450);
    }
  }));
  return output;
}

function htmlDecode(value) {
  return String(value ?? '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function matchOne(html, regex) {
  return htmlDecode(regex.exec(html)?.[1] ?? '');
}

function cityTitleVariants(name) {
  const variants = new Set([String(name).trim()]);
  const parentheses = String(name).match(/^\s*(.*?)\s*\(([^()]*)\)\s*$/);
  if (parentheses) {
    if (parentheses[1].trim()) variants.add(parentheses[1].trim());
  }
  return [...variants].filter(Boolean);
}

function extractCategories(html) {
  return [...new Set([...html.matchAll(/title="Category:([^"]+)"/g)].map((match) => normalize(htmlDecode(match[1]))))];
}

function countryCategoryVerified(categories, city) {
  const aliases = [...new Set([city.countryName, ...(countryAliases[city.countryCode.toUpperCase()] ?? [])])].map(normalize);
  const prefixes = ['cities in ', 'towns in ', 'municipalities in ', 'populated coastal places in ', 'urban localities in ', 'cities and towns in '];
  return categories.some((category) => prefixes.some((prefix) => aliases.some((country) => category === `${prefix}${country}`)));
}

function extractArticleImage(html) {
  const image = matchOne(html, /<meta\s+property="og:image"\s+content="([^"]+)"/i) || matchOne(html, /<meta\s+content="([^"]+)"\s+property="og:image"/i);
  return image || null;
}

function extractFileName(imageUrl) {
  const segments = new URL(imageUrl).pathname.split('/').filter(Boolean).map((part) => decodeURIComponent(part));
  const thumbIndex = segments.indexOf('thumb');
  if (thumbIndex >= 0) return segments[thumbIndex + 3] ?? null;
  return segments.at(-1) ?? null;
}

function parseArticle(city, html, finalUrl, requestedTitle) {
  const pageTitle = matchOne(html, /"wgTitle"\s*:\s*"((?:\\.|[^"\\])*)"/);
  const wikidataId = matchOne(html, /"wgWikibaseItemId"\s*:\s*"([^"]+)"/);
  const canonicalUrl = matchOne(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i);
  const imageUrl = extractArticleImage(html);
  const categories = extractCategories(html);
  const exactTitle = cityTitleVariants(city.name).some((variant) => normalize(variant) === normalize(pageTitle));
  const countryVerified = countryCategoryVerified(categories, city);
  const isRedirect = /"wgIsRedirect"\s*:\s*true/.test(html);
  if (!exactTitle || !countryVerified || !imageUrl || !wikidataId || isRedirect) {
    return { city, status: 'not-verified', requestedTitle, pageTitle, wikidataId, finalUrl, canonicalUrl, imageUrl, categories: categories.filter((category) => /cities in |towns in |municipalities in |populated places in |populated coastal places in /i.test(category)), exactTitle, countryVerified, reason: !exactTitle ? 'article title not exact city label/approved parenthetical variant' : !countryVerified ? 'no exact country-specific city/populated-place category' : !imageUrl ? 'no article lead image' : !wikidataId ? 'no page Wikidata item' : 'redirected title is not exact' };
  }
  const sourceFile = extractFileName(imageUrl);
  if (!sourceFile) return { city, status: 'not-verified', requestedTitle, pageTitle, wikidataId, finalUrl, canonicalUrl, imageUrl, reason: 'could not derive shared image filename' };
  return { city, status: 'article-verified', requestedTitle, pageTitle, wikidataId, finalUrl, canonicalUrl, imageUrl, sourceFile, categories };
}

async function fetchArticle(city) {
  let lastFailure = null;
  for (const title of cityTitleVariants(city.name)) {
    try {
      const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
      const response = await requestText(url, 'city article');
      const result = parseArticle(city, response.html, response.url, title);
      if (result.status === 'article-verified') return result;
      lastFailure = result;
    } catch (error) {
      lastFailure = { city, status: 'request-failed', requestedTitle: title, reason: String(error.message || error) };
    }
  }
  return lastFailure ?? { city, status: 'not-verified', reason: 'no exact article found' };
}

async function fetchFileDetails(article) {
  const title = `File:${article.sourceFile}`;
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, '_'))}`;
  const response = await requestText(url, 'shared file page');
  const license = matchOne(response.html, /<span\s+class="licensetpl_short"[^>]*>(.*?)<\/span>/is) || matchOne(response.html, /<link\s+rel="license"\s+href="([^"]+)"/i);
  const licenseUrl = matchOne(response.html, /<link\s+rel="license"\s+href="([^"]+)"/i);
  const directImage = matchOne(response.html, /<meta\s+property="og:image"\s+content="([^"]+)"/i) || article.imageUrl;
  const normalizedLicense = license.replace(/<[^>]+>/g, '').trim();
  const reusable = /CC0|public domain|CC BY(?:-SA)?(?:\s|$)/i.test(normalizedLicense) || /creativecommons\.org\/(publicdomain\/zero|licenses\/(by|by-sa)\/)/i.test(licenseUrl);
  return { ...article, sourcePage: response.url, sourceUrl: directImage, license: normalizedLicense || 'unknown', licenseUrl: licenseUrl || null, reusable };
}

async function acquire(article) {
  const destination = path.join(imageDir, `${article.city.slug.toLowerCase()}.webp`);
  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await fetch(article.sourceUrl, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(45000) });
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
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || !metadata.format || metadata.format === 'svg') throw new Error('invalid or unsupported source image');
  await image.rotate().resize({ width: 1800, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(destination);
  const output = await sharp(destination).metadata();
  if (output.format !== 'webp' || !output.width || !output.height) throw new Error('output is not a valid WebP');
  return { outputFormat: output.format, sourceFormat: metadata.format, file: path.basename(destination) };
}

(async () => {
  fs.mkdirSync(imageDir, { recursive: true });
  const continents = await prisma.continent.findMany({ include: { countries: true } });
  const asia = continents.find((continent) => continent.name === 'Asia');
  const countries = asia?.countries ?? [];
  const countryByCode = new Map(countries.map((country) => [country.code.toUpperCase(), country]));
  const cities = await prisma.city.findMany({ where: { countryCode: { in: countries.map((country) => country.code) } }, orderBy: [{ countryCode: 'asc' }, { slug: 'asc' }], select: { slug: true, name: true, countryCode: true, profile: true } });
  const records = cities.map((city) => ({ ...city, countryName: countryByCode.get(city.countryCode.toUpperCase())?.name ?? '' }));
  const pending = records.filter((city) => {
    const profile = city.profile && typeof city.profile === 'object' ? city.profile : {};
    const hasProfileImage = ['heroImageUrl', 'thumbnail'].some((key) => typeof profile[key] === 'string' && profile[key].trim());
    return !hasProfileImage && !fs.existsSync(path.join(imageDir, `${city.slug.toLowerCase()}.webp`));
  });
  const articles = await mapLimit(pending, 3, fetchArticle);
  const verifiedArticles = articles.filter((article) => article.status === 'article-verified');
  const fileDetails = await mapLimit(verifiedArticles, 2, async (article) => {
    try { return await fetchFileDetails(article); }
    catch (error) { return { ...article, reusable: false, license: 'unknown', licenseUrl: null, reason: String(error.message || error) }; }
  });
  const newImages = [];
  const failures = [];
  for (const article of fileDetails) {
    if (!article.reusable) {
      failures.push({ countryCode: article.city.countryCode, city: article.city.name, slug: article.city.slug, reason: article.reason ?? `license not confirmed: ${article.license}`, sourcePage: article.sourcePage ?? article.canonicalUrl });
      continue;
    }
    try {
      const output = await acquire(article);
      newImages.push({ countryCode: article.city.countryCode, city: article.city.name, slug: article.city.slug, pageTitle: article.pageTitle, wikidataId: article.wikidataId, sourcePage: article.canonicalUrl, sourceFilePage: article.sourcePage, sourceImageUrl: article.sourceUrl, license: article.license, licenseUrl: article.licenseUrl, ...output });
    } catch (error) {
      failures.push({ countryCode: article.city.countryCode, city: article.city.name, slug: article.city.slug, reason: String(error.message || error), sourcePage: article.canonicalUrl, sourceImageUrl: article.sourceUrl, license: article.license });
    }
    await wait(1000);
  }
  const rejectedCounts = {};
  for (const article of articles.filter((item) => item.status !== 'article-verified')) rejectedCounts[article.reason] = (rejectedCounts[article.reason] ?? 0) + 1;
  console.log(JSON.stringify({ total: cities.length, countries: countries.length, pendingBeforePass: pending.length, articlePagesChecked: articles.length, exactTitleAndCountryVerified: verifiedArticles.length, rejectedCounts, licenseOrDownloadFailures: failures.length, failures, newWebp: newImages.length, newImages, unverified: articles.filter((item) => item.status !== 'article-verified').map((item) => ({ countryCode: item.city.countryCode, city: item.city.name, slug: item.city.slug, reason: item.reason })) }, null, 2));
  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
