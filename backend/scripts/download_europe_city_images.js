const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const backendDir = path.join(__dirname, '..');
const imageDir = path.join(backendDir, 'public', 'Images', 'Europe cities images');
const manifestPath = path.join(backendDir, 'data', 'europe_city_image_audit.json');
const reportPath = path.join(backendDir, 'data', 'europe_city_image_report.md');

fs.mkdirSync(imageDir, { recursive: true });
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });

const BATCH_SIZE = Number(process.env.EUROPE_IMAGE_BATCH_SIZE || 15);
const REQUEST_DELAY_MS = Number(process.env.EUROPE_IMAGE_REQUEST_DELAY_MS || 1200);
const LANGUAGE_BY_COUNTRY = {
  AT: 'de', BA: 'bs', BE: 'nl', BG: 'bg', BY: 'be', CH: 'de', CZ: 'cs', DE: 'de',
  DK: 'da', EE: 'et', ES: 'es', FI: 'fi', FR: 'fr', GB: 'en', GR: 'el', HR: 'hr',
  HU: 'hu', IE: 'en', IS: 'is', IT: 'it', LI: 'de', LT: 'lt', LU: 'fr', LV: 'lv',
  MD: 'ro', ME: 'sr', MK: 'mk', MT: 'en', NL: 'nl', NO: 'no', PL: 'pl', PT: 'pt',
  RO: 'ro', RS: 'sr', SE: 'sv', SI: 'sl', SK: 'sk', UA: 'uk',
};
const COUNTRY_CONTEXT_ALIASES = {
  CH: ['switzerland', 'swiss', 'valais'],
  GB: ['united kingdom', 'great britain', 'britain', 'england', 'scotland', 'wales', 'northern ireland', 'channel islands'],
  GR: ['greece', 'greek'],
  NO: ['norway', 'norge', 'noreg'],
  PT: ['portugal', 'portuguese', 'azores', 'azorean'],
};
const CITY_SEARCH_ALIASES = {
  'Lakselv , Banak': ['Lakselv'],
  'Doncaster Sheffield': ['Doncaster', 'Sheffield'],
  'Leoš Janáček Ostrava': ['Ostrava'],
  'Adolfo Suárez Madrid–Barajas': ['Madrid'],
  'Castellón–Costa Azahar': ['Castellón de la Plana'],
  'Josep Tarradellas Barcelona–El Prat': ['Barcelona'],
  'George Best Belfast City': ['Belfast'],
  'Aktion': ['Preveza'],
  'Ikaria Island': ['Ikaria'],
  'Kefalonia “Anna Pollatou”': ['Argostoli'],
  'Kithira Island': ['Kythira'],
  'Kos “Hippocrates”': ['Kos'],
  'Ireland West Knock': ['Knock'],
  'Falcone Borsellino': ['Palermo'],
  'Harstad/Narvik , Evenes': ['Evenes'],
  'Kristiansund , Kvernberget': ['Kristiansund'],
  'Svalbard , Longyear': ['Longyearbyen'],
  'Łódź Władysław Reymont': ['Łódź'],
  'João Paulo II': ['Ponta Delgada'],
  'Lajes': ['Praia da Vitória'],
  'Avram Iancu Cluj': ['Cluj-Napoca'],
  'Niš Constantine the Great': ['Niš'],
  'Dala': ['Borlänge'],
  'Sion': ['Sion, Switzerland'],
  'Calvi–Sainte-Catherine': ['Calvi, Haute-Corse'],
  'Newcastle': ['Newcastle upon Tyne'],
  'Shannon': ['Shannon, County Clare'],
  'Horta': ['Horta, Azores'],
  'Santa Maria': ['Santa Maria Island'],
  'Bodø': ['Bodø'],
  'Morava': ['Kraljevo'],
  'Karlsruhe/Baden-Baden': ['Karlsruhe'],
  'Leipzig/Halle': ['Leipzig'],
  'César Manrique–Lanzarote': ['Arrecife'],
  'El Hierro': ['Valverde'],
  'Región de Murcia': ['Murcia'],
  'Santiago–Rosalía de Castro': ['Santiago de Compostela'],
  'Tenerife North–Ciudad de La Laguna': ['San Cristóbal de La Laguna'],
  'Tenerife South': ['Granadilla de Abona'],
  'Helsinki-Vantaa': ['Helsinki'],
  'Dinard–Pleurtuit–Saint-Malo': ['Saint-Malo'],
  'City of Derry': ['Derry'],
  'Isle of Man': ['Douglas, Isle of Man'],
  'Guernsey': ['St Peter Port'],
  'London Luton': ['Luton'],
  'London Stansted': ['Stansted Mountfitchet'],
  'Budapest Ferenc Liszt': ['Budapest'],
  'Ireland West Knock': ['Knock, County Mayo'],
  'Abruzzo': ['Pescara'],
  'Cagliari Elmas': ['Cagliari'],
  'Catania–Fontanarossa': ['Catania'],
  'Federico Fellini': ['Rimini'],
  'Marche': ['Ancona'],
  'Milan Bergamo': ['Bergamo'],
  'Milan Linate': ['Milan'],
  'Milan Malpensa': ['Milan'],
  'Olbia Costa Smeralda': ['Olbia'],
  'Pantelleria': ['Pantelleria'],
  'Maastricht Aachen': ['Maastricht'],
  'Olsztyn-Mazury': ['Olsztyn'],
  'Francisco Sá Carneiro': ['Porto'],
  'Humberto Delgado': ['Lisbon'],
  'Paris Charles de Gaulle': ['Paris'],
  'Aurel Vlaicu': ['Bucharest'],
  'Henri Coandă': ['Bucharest'],
  'Iași': ['Iași'],
  'Maramureș': ['Baia Mare'],
  'Mihail Kogălniceanu': ['Constanța'],
  'Ängelholm–Helsingborg': ['Helsingborg'],
  'Åre Östersund': ['Östersund'],
  'Gällivare Lapland': ['Gällivare'],
  'Göteborg Landvetter': ['Gothenburg'],
  'Stockholm Arlanda': ['Stockholm'],
  'Stockholm Skavsta': ['Nyköping'],
  'Poprad-Tatry': ['Poprad'],
};
const VISUAL_REJECTED_CITY_SLUGS = new Set([
  'ch-geneva-airport', 'de-dresden-airport', 'de-hamburg-airport', 'de-karlsruhe-baden-baden-airport', 'de-leipzig-halle-airport',
  'es-asturias-airport', 'es-c-sar-manrique-lanzarote-airport', 'es-el-hierro-airport', 'es-fuerteventura-airport', 'es-gran-canaria-airport',
  'es-la-gomera-airport', 'es-regi-n-de-murcia-international-airport', 'es-santiago-rosal-a-de-castro-airport',
  'es-tenerife-north-ciudad-de-la-laguna-airport', 'es-tenerife-south-airport', 'es-vigo-airport', 'fi-helsinki-vantaa-airport',
  'fr-dinard-pleurtuit-saint-malo-airport', 'gb-city-of-derry-airport', 'gb-east-midlands-airport', 'gb-guernsey-airport',
  'gb-isle-of-man-airport', 'gb-london-luton-airport', 'gb-london-stansted-airport', 'gb-teesside-international-airport',
  'gr-kefalonia-international-airport-anna-pollatou', 'hu-budapest-ferenc-liszt-international-airport', 'ie-ireland-west-airport-knock',
  'it-abruzzo-airport', 'it-cagliari-elmas-airport', 'it-catania-fontanarossa-airport', 'it-federico-fellini-international-airport',
  'it-lamezia-terme-international-airport', 'it-marche-airport', 'it-milan-bergamo-airport', 'it-milan-linate-airport',
  'it-milan-malpensa-airport', 'it-olbia-costa-smeralda-airport', 'it-pantelleria-airport', 'lt-kaunas-international-airport',
  'nl-maastricht-aachen-airport', 'pl-olsztyn-mazury-airport', 'pt-francisco-s-carneiro-airport', 'pt-humberto-delgado-airport',
  'ro-aurel-vlaicu-international-airport', 'ro-henri-coand-international-airport', 'ro-ia-i-international-airport',
  'ro-maramure-international-airport', 'ro-mihail-kog-lniceanu-international-airport', 'se-ngelholm-helsingborg-airport',
  'se-re-stersund-airport', 'se-g-llivare-lapland-airport', 'se-g-teborg-landvetter-airport', 'se-stockholm-arlanda-airport',
  'se-stockholm-skavsta-airport', 'sk-poprad-tatry-airport',
  'es-fuerteventura-airport', 'es-gran-canaria-airport', 'es-la-gomera-airport',
  'fr-paris-charles-de-gaulle-airport', 'gb-east-midlands-airport', 'gb-guernsey-airport',
  'gb-isle-of-man-airport', 'gb-london-stansted-airport', 'gb-teesside-international-airport',
  'gr-kefalonia-international-airport-anna-pollatou', 'ie-ireland-west-airport-knock',
  'it-abruzzo-airport', 'it-marche-airport', 'pt-francisco-s-carneiro-airport', 'pt-humberto-delgado-airport',
  'ro-aurel-vlaicu-international-airport', 'ro-henri-coand-international-airport', 'ro-ia-i-international-airport',
  'ro-maramure-international-airport', 'ro-mihail-kog-lniceanu-international-airport',
]);
const NON_CITY_GEOGRAPHY_SLUGS = new Set([
  'es-asturias-airport', 'es-el-hierro-airport', 'es-fuerteventura-airport', 'es-gran-canaria-airport',
  'es-la-gomera-airport', 'es-regi-n-de-murcia-international-airport',
  'it-abruzzo-airport', 'it-marche-airport', 'gb-east-midlands-airport',
]);

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'city';
}

function normalizeCityName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeForMatch(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function classifyFileName(fileName) {
  const lc = String(fileName || '').toLowerCase();
  if (lc.includes('none')) return 'PLACEHOLDER';
  if (lc.includes('airport')) return 'AIRPORT_ONLY';
  if (/flag|country|national[-_ ]?park|map|generic/.test(lc)) return 'COUNTRY_GENERIC';
  return 'UNVERIFIED';
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeEntities(value) {
  return String(value || '').replace(/&amp;/g, '&').replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16))).replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'");
}

function metaContent(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1]);
  }
  return '';
}

function articleText(html) {
  const main = html.match(/<div[^>]+id="mw-content-text"[\s\S]*?<\/div>\s*<\/main>/i)?.[0] || html;
  const paragraphs = [...main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].slice(0, 4).map((match) => match[1]);
  return decodeEntities(paragraphs.join(' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '));
}

function htmlAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return decodeEntities(tag.match(new RegExp(`\\b${escaped}=["']([^"']*)["']`, 'i'))?.[1] || '');
}

function extractArticleImages(html, cityName) {
  const candidates = [];
  const ogImage = metaContent(html, 'og:image');
  if (ogImage) candidates.push({ imageUrl: ogImage, resourceUrl: ogImage, alt: '' });
  for (const match of html.matchAll(/<img\b[^>]*class=["'][^"']*mw-file-element[^>]*>/gi)) {
    const tag = match[0];
    const srcset = htmlAttribute(tag, 'srcset').split(',').map((entry) => entry.trim().split(/\s+/)[0]).filter(Boolean);
    const imageUrl = srcset.at(-1) || htmlAttribute(tag, 'src');
    const resourceUrl = htmlAttribute(tag, 'resource') || imageUrl;
    const width = Number(htmlAttribute(tag, 'data-file-width'));
    const height = Number(htmlAttribute(tag, 'data-file-height'));
    if (width && height && (width < 300 || height < 200)) continue;
    candidates.push({ imageUrl, resourceUrl, alt: htmlAttribute(tag, 'alt') });
  }
  const seen = new Set();
  return candidates.filter((candidate) => {
    if (candidate.imageUrl.startsWith('//')) candidate.imageUrl = `https:${candidate.imageUrl}`;
    const rawDescriptor = `${candidate.resourceUrl} ${candidate.alt}`.replace(/&amp;/g, '&');
    let descriptor = rawDescriptor;
    try {
      descriptor = decodeURIComponent(rawDescriptor);
    } catch {
      descriptor = rawDescriptor;
    }
    if (/(?:^|[^a-z])(map|maps|karte|reliefkarte|atlas|locator|flag|coat|wappen|coa|crest|logo|icon|symbol|seal|emblem|disambig|location|portrait|headshot|passport|airport|airfield|terminal|aircraft|airplane|runway)(?:[^a-z]|$)|\.svg(?:[/?#\s]|$)/i.test(descriptor)) return false;
    if (!/^https?:\/\/(upload\.wikimedia\.org|thumb\.wikimedia\.org|commons\.wikimedia\.org)\//i.test(candidate.imageUrl)) return false;
    if (seen.has(candidate.imageUrl)) return false;
    seen.add(candidate.imageUrl);
    return true;
  }).sort((left, right) => {
    const needle = normalizeForMatch(cityName);
    const leftMatches = normalizeForMatch(`${left.resourceUrl} ${left.alt}`).includes(needle);
    const rightMatches = normalizeForMatch(`${right.resourceUrl} ${right.alt}`).includes(needle);
    return Number(rightMatches) - Number(leftMatches);
  }).slice(0, 6);
}

async function fetchWithRetry(url, attempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'EuropeCityImageAudit/1.0 (local asset research; contact: repository maintainers)' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.status === 429 || response.status >= 500) {
        if (attempt + 1 < attempts) {
          const retryAfter = Number(response.headers.get('retry-after')) * 1000;
          await wait(Math.min(Math.max(retryAfter || (1200 * (2 ** attempt)), 1200), 30000));
          continue;
        }
      }
      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt + 1 < attempts) await wait(1200 * (2 ** attempt));
    }
  }
  if (lastError) throw lastError;
  throw new Error(`Request retries exhausted: ${url}`);
}

function sourceHosts(countryCode) {
  const localLanguage = LANGUAGE_BY_COUNTRY[countryCode];
  return [...new Set([localLanguage, 'en'].filter(Boolean))].map((language) => `${language}.wikipedia.org`);
}

function matchesCountryContext(context, country) {
  const normalized = normalizeForMatch(context);
  const parentheticalParts = [...country.name.matchAll(/\(([^)]+)\)/g)].map((match) => match[1]);
  const baseCountryName = country.name.replace(/\s*\([^)]*\)/g, '').trim();
  const aliases = [normalizeForMatch(country.name), normalizeForMatch(baseCountryName), ...parentheticalParts.map(normalizeForMatch), ...(COUNTRY_CONTEXT_ALIASES[country.code] || []).map(normalizeForMatch)];
  return aliases.some((alias) => alias && normalized.includes(alias));
}

function cityAliasTexts(city) {
  const name = normalizeCityName(city.name);
  return [...new Set([
    ...cityIdentityTexts(city),
    ...name.split(/[–—,/-]+/).map((part) => part.trim()),
    name.split(/\s+/)[0],
    name.split(/\s+/).at(-1),
  ].filter((alias) => normalizeForMatch(alias).length > 2))];
}

function cityIdentityTexts(city) {
  return [...new Set([normalizeCityName(city.name), ...(CITY_SEARCH_ALIASES[city.name] || [])])];
}

function cityAliases(city) {
  return [...new Set(cityIdentityTexts(city).map(normalizeForMatch))];
}

function isCityArticleTitle(title, city, country) {
  const normalizedTitle = normalizeForMatch(title).replace(/ wikipedia$/, '');
  const countryName = normalizeForMatch(country.name);
  const allowedTitles = new Set();
  for (const alias of cityAliases(city)) {
    allowedTitles.add(alias);
    allowedTitles.add(`city of ${alias}`);
    allowedTitles.add(`${alias} city`);
    allowedTitles.add(`${alias} municipality`);
    allowedTitles.add(`${alias} ${countryName}`);
  }
  return allowedTitles.has(normalizedTitle);
}

function titleFromPageUrl(pageUrl) {
  try {
    return decodeURIComponent(new URL(pageUrl).pathname.split('/').pop() || '').replace(/_/g, ' ');
  } catch {
    return '';
  }
}

async function resolveWikipediaArticle(city, country) {
  const title = normalizeCityName(city.name).replace(/\s+/g, '_');
  const attempts = [];
  const articleHosts = CITY_SEARCH_ALIASES[city.name]?.length ? [] : sourceHosts(country.code);
  for (const host of articleHosts) {
    const pageUrl = `https://${host}/wiki/${encodeURIComponent(title)}`;
    try {
      const response = await fetchWithRetry(pageUrl);
      attempts.push({ url: response.url || pageUrl, status: response.status, source: host });
      if (!response.ok) continue;
      const html = await response.text();
      const pageTitle = metaContent(html, 'og:title');
      const description = metaContent(html, 'og:description');
      const lead = articleText(html);
      const titleMatchesCity = isCityArticleTitle(pageTitle, city, country);
      const context = normalizeForMatch(`${description} ${lead}`);
      const countryMatches = matchesCountryContext(context, country);
      const images = extractArticleImages(html, city.name);
      if (titleMatchesCity && countryMatches && images.length) {
        return { pageUrl: response.url || pageUrl, images, sourceWebsite: host, pageTitle, description, attempts };
      }
      attempts[attempts.length - 1].reason = !titleMatchesCity ? 'article title does not match city' : !countryMatches ? 'country context not found in article lead' : 'no suitable city-view image candidate';
    } catch (error) {
      attempts.push({ url: pageUrl, source: host, error: String(error.message || error) });
    }
    await wait(REQUEST_DELAY_MS);
  }

  const aliases = cityAliases(city);
  const aliasTexts = cityIdentityTexts(city);
  for (const alias of aliasTexts.slice(1, 5)) {
    const aliasUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(alias.replace(/\s+/g, '_'))}`;
    try {
      await wait(REQUEST_DELAY_MS);
      const response = await fetchWithRetry(aliasUrl);
      attempts.push({ url: response.url || aliasUrl, status: response.status, source: 'en.wikipedia.org city alias', alias });
      if (!response.ok) continue;
      const html = await response.text();
      const pageTitle = metaContent(html, 'og:title');
      const description = metaContent(html, 'og:description');
      const lead = articleText(html);
      const context = normalizeForMatch(`${description} ${lead}`);
      const images = extractArticleImages(html, alias);
      if (isCityArticleTitle(pageTitle, city, country) && matchesCountryContext(context, country) && images.length) {
        return { pageUrl: response.url || aliasUrl, images, sourceWebsite: 'en.wikipedia.org', pageTitle, description, attempts };
      }
      attempts[attempts.length - 1].reason = 'alias page title, country context, or city image did not match';
    } catch (error) {
      attempts.push({ url: aliasUrl, source: 'en.wikipedia.org city alias', alias, error: String(error.message || error) });
    }
  }

  const searchTerms = CITY_SEARCH_ALIASES[city.name]
    ? CITY_SEARCH_ALIASES[city.name].map(normalizeForMatch)
    : cityAliasTexts(city).map(normalizeForMatch).slice(0, 3);
  for (const alias of searchTerms) {
    const query = `${alias} ${country.name} city`;
    const searchUrl = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}&title=Special%3ASearch&fulltext=1`;
    try {
      const searchResponse = await fetchWithRetry(searchUrl);
      attempts.push({ url: searchResponse.url || searchUrl, status: searchResponse.status, source: 'en.wikipedia.org HTML search', query });
      if (!searchResponse.ok) continue;
      const searchHtml = await searchResponse.text();
      const resultLinks = [...searchHtml.matchAll(/class="mw-search-result-heading"[\s\S]*?<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
        .slice(0, 5)
        .map((match) => ({ url: new URL(decodeEntities(match[1]), searchResponse.url || searchUrl).href, title: decodeEntities(match[2].replace(/<[^>]*>/g, '').trim()) }))
        .filter((result) => !/(airport|aerodrome|airfield|disambiguation|list of|football|f\.c\.|association football|demographics|population of|railway station)/i.test(result.title));
      for (const candidate of resultLinks) {
        const candidateIdentity = normalizeForMatch(candidate.title);
        const aliasTokens = normalizeForMatch(alias).split(' ').filter((token) => token.length > 3);
        if (!aliasTokens.some((token) => candidateIdentity.includes(token))) continue;
        await wait(REQUEST_DELAY_MS);
        const articleResponse = await fetchWithRetry(candidate.url);
        attempts.push({ url: articleResponse.url || candidate.url, status: articleResponse.status, source: 'en.wikipedia.org search result', query });
        if (!articleResponse.ok) continue;
        const html = await articleResponse.text();
        const pageTitle = metaContent(html, 'og:title');
        const description = metaContent(html, 'og:description');
        const lead = articleText(html);
        const context = normalizeForMatch(`${description} ${lead}`);
        const countryMatches = matchesCountryContext(context, country);
        const images = extractArticleImages(html, city.name);
        if (isCityArticleTitle(pageTitle, city, country) && countryMatches && images.length) {
          return { pageUrl: articleResponse.url || candidate.url, images, sourceWebsite: 'en.wikipedia.org', pageTitle, description, attempts };
        }
        attempts[attempts.length - 1].reason = !countryMatches ? 'country context not found in article lead' : 'search result article lacked a suitable image';
      }
    } catch (error) {
      attempts.push({ url: searchUrl, source: 'en.wikipedia.org HTML search', query, error: String(error.message || error) });
    }
    await wait(REQUEST_DELAY_MS);
  }
  return { attempts };
}

function profileHero(city) {
  const profile = city.profile && typeof city.profile === 'object' && !Array.isArray(city.profile) ? city.profile : {};
  return typeof profile.heroImageUrl === 'string' ? profile.heroImageUrl.trim() : '';
}

function fileFromHero(hero) {
  if (!hero || /^https?:\/\//i.test(hero)) return null;
  try {
    const name = decodeURIComponent(hero.split(/[?#]/)[0].split('/').pop() || '');
    return name ? path.join(imageDir, name) : null;
  } catch {
    return null;
  }
}

async function inspectImage(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const stats = fs.statSync(filePath);
    const valid = ['webp', 'jpeg', 'png', 'avif', 'tiff'].includes(metadata.format)
      && Number(metadata.width) >= 200 && Number(metadata.height) >= 150 && stats.size > 5000;
    return { readable: true, valid, format: metadata.format || null, width: metadata.width || null, height: metadata.height || null, bytes: stats.size };
  } catch (error) {
    return { readable: false, valid: false, error: String(error.message || error) };
  }
}

async function downloadValidatedImage(imageUrl, targetPath, knownHashes, sameCityFiles) {
  const response = await fetchWithRetry(imageUrl);
  if (!response.ok) throw new Error(`Image HTTP ${response.status}`);
  const mime = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!mime.startsWith('image/')) throw new Error(`Non-image MIME type: ${mime || 'missing'}`);
  const original = Buffer.from(await response.arrayBuffer());
  if (!original.length) throw new Error('Empty image response');
  const sourceMeta = await sharp(original).metadata();
  if (!sourceMeta.width || !sourceMeta.height || sourceMeta.width < 200 || sourceMeta.height < 150) throw new Error('Image dimensions are too small or missing');
  const webp = await sharp(original).rotate().resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
  const outputMeta = await sharp(webp).metadata();
  if (outputMeta.format !== 'webp' || !outputMeta.width || !outputMeta.height || webp.length < 5000) throw new Error('Converted WebP failed validation');
  const sha256 = crypto.createHash('sha256').update(webp).digest('hex');
  const duplicateOwners = knownHashes.get(sha256) || [];
  const duplicateOf = duplicateOwners.find((owner) => owner !== path.basename(targetPath) && !sameCityFiles.has(owner));
  if (duplicateOf) {
    return { duplicate: true, duplicateOf, mime, format: 'webp', width: outputMeta.width, height: outputMeta.height, bytes: webp.length, sha256 };
  }
  const temporaryPath = `${targetPath}.part`;
  fs.writeFileSync(temporaryPath, webp);
  let finalPath = targetPath;
  try {
    if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
    fs.renameSync(temporaryPath, targetPath);
  } catch (error) {
    if (!['EBUSY', 'EPERM', 'EACCES'].includes(error.code)) throw error;
    const basePath = /-city-view(?:-\d+)?\.webp$/i.test(targetPath) ? targetPath.replace(/(?:-\d+)?\.webp$/i, '') : targetPath.replace(/\.webp$/i, '-city-view');
    finalPath = `${basePath}.webp`;
    let sequence = 2;
    while (fs.existsSync(finalPath)) {
      finalPath = `${basePath}-${sequence}.webp`;
      sequence += 1;
    }
    fs.renameSync(temporaryPath, finalPath);
  }
  return { duplicate: false, mime, format: 'webp', width: outputMeta.width, height: outputMeta.height, bytes: webp.length, sha256, filePath: finalPath };
}

function loadPreviousResults() {
  try {
    const previous = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return new Map((previous.cities || []).map((entry) => [entry.slug, entry]));
  } catch {
    return new Map();
  }
}

async function buildFileAudit() {
  const names = fs.readdirSync(imageDir).filter((name) => !name.endsWith('.part'));
  const hashes = new Map();
  const files = [];
  for (const fileName of names) {
    const filePath = path.join(imageDir, fileName);
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) continue;
    const technical = await inspectImage(filePath);
    const classification = classifyFileName(fileName);
    const hash = technical.valid ? crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex') : null;
    const duplicateOf = hash && hashes.has(hash) ? hashes.get(hash) : null;
    if (hash && !duplicateOf) hashes.set(hash, fileName);
    files.push({ fileName, classification, ...technical, duplicateOf, sha256: hash });
  }
  return files;
}

function cityClassification(cityResult) {
  if (cityResult.status === 'valid') return 'VALID_CITY_SPECIFIC_LOCAL';
  if (cityResult.status === 'placeholder') return 'PLACEHOLDER';
  if (cityResult.status === 'airport-only') return 'AIRPORT_ONLY';
  if (cityResult.status === 'duplicate') return 'DUPLICATE_IMAGE';
  if (cityResult.status === 'broken') return 'BROKEN_OR_UNUSABLE';
  return cityResult.heroImageUrl ? 'UNVERIFIED_EXISTING_OR_WRONG_CITY' : 'MISSING_IMAGE';
}

function writeReports(summary) {
  fs.writeFileSync(manifestPath, JSON.stringify(summary, null, 2));
  const lines = [
    '# Europe City Image Audit and Download Report', '',
    `- Generated: ${summary.generatedAt}`,
    `- European countries: ${summary.dataset.europeanCountries}`,
    `- European city records: ${summary.dataset.europeanCities}`,
    `- Valid city-specific images: ${summary.finalCoverage.citiesWithValidImage}`,
    `- Cities without valid city-specific images: ${summary.finalCoverage.citiesWithoutValidImage}`,
    `- Coverage: ${summary.finalCoverage.percentage}%`,
    `- Newly downloaded and validated this execution: ${summary.downloads.newlyDownloadedValidated}`,
    `- Distinct validated city assets collected in this Europe pass: ${summary.downloads.totalDownloadedValidated}`,
    `- Failed downloads: ${summary.downloads.failed}`,
    `- Unresolved: ${summary.downloads.unresolved}`,
    '', '## Filesystem', '',
    `- Total files: ${summary.filesystem.totalFiles}`,
    `- Valid WebP files: ${summary.filesystem.validWebpFiles}`,
    `- Invalid/corrupt files: ${summary.filesystem.invalidOrCorruptFiles}`,
    `- Duplicate files: ${summary.filesystem.duplicateFiles}`,
    `- Previous city images rejected during visual review: ${summary.existingAssets.visuallyRejectedPreviousImages}`,
    `- Placeholder files: ${summary.existingAssets.placeholderFiles}`,
    `- Airport-only files: ${summary.existingAssets.airportOnlyFiles}`,
    `- Generic/country files: ${summary.existingAssets.genericFiles}`,
    '', '## Per-country breakdown', '',
    '| Country | Cities | Already Valid | Downloaded | Invalid/Replaced | Unresolved | Final Coverage |',
    '|---|---:|---:|---:|---:|---:|---:|',
  ];
  for (const country of summary.perCountry) {
    lines.push(`| ${country.country} (${country.countryCode}) | ${country.cities} | ${country.alreadyValid} | ${country.downloaded} | ${country.invalidOrReplaced} | ${country.unresolved} | ${country.coverage}% |`);
  }
  lines.push('', '## Full city queue', '', '| Country | City | Slug | Classification | Status | File | Visual rejection | Verification |', '|---|---|---|---|---|---|---|---|');
  for (const city of summary.cities) {
    lines.push(`| ${city.country} (${city.countryCode}) | ${city.city} | ${city.slug} | ${city.classification} | ${city.status} | ${city.localFile || ''} | ${city.visuallyRejectedPreviousFile || ''} | ${city.verificationStatus || ''} |`);
  }
  lines.push('', '## Unresolved cities', '', '| Country | City | Reason | Sources attempted |', '|---|---|---|---|');
  const unresolved = summary.cities.filter((city) => city.status !== 'valid' && city.status !== 'placeholder');
  for (const city of unresolved) {
    const sources = (city.sourcesAttempted || []).map((source) => source.url).filter(Boolean).join('<br>');
    lines.push(`| ${city.country} (${city.countryCode}) | ${city.city} | ${city.reason || city.classification} | ${sources} |`);
  }
  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);
}

async function main() {
  const countries = await prisma.country.findMany({
    where: { continent: { name: 'Europe' } },
    select: { code: true, name: true },
    orderBy: { name: 'asc' },
  });
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  const cities = await prisma.city.findMany({
    where: { countryCode: { in: countries.map((country) => country.code) } },
    select: { slug: true, name: true, countryCode: true, profile: true },
    orderBy: [{ countryCode: 'asc' }, { name: 'asc' }],
  });
  const previous = loadPreviousResults();
  const results = cities.map((city) => previous.get(city.slug) || {
    country: countryByCode.get(city.countryCode)?.name || city.countryCode,
    countryCode: city.countryCode,
    city: city.name,
    slug: city.slug,
    heroImageUrl: profileHero(city),
    localFile: null,
    status: 'not-processed',
    classification: 'NOT_PROCESSED',
    reason: 'Not yet processed by the current downloader execution',
    sourcesAttempted: [],
    verificationStatus: 'NOT_VERIFIED',
  });
  const startAt = Math.max(0, Number(process.argv.find((arg) => arg.startsWith('--start='))?.split('=')[1] || 0));
  const limit = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || cities.length);
  const runCities = cities.slice(startAt, startAt + limit);
  const existingFiles = await buildFileAudit();
  const hashOwners = new Map();
  for (const file of existingFiles.filter((entry) => entry.sha256)) {
    if (!hashOwners.has(file.sha256)) hashOwners.set(file.sha256, []);
    hashOwners.get(file.sha256).push(file.fileName);
  }
  const cityFiles = new Map();
  for (const city of cities) {
    const countryCode = city.countryCode.toLowerCase();
    const canonicalName = `${countryCode}-${slugify(city.name)}`;
    cityFiles.set(`${canonicalName}.webp`, city.slug);
    cityFiles.set(`${canonicalName}-city-view.webp`, city.slug);
    for (const file of existingFiles) {
      if (file.fileName === `${canonicalName}.webp` || file.fileName.startsWith(`${canonicalName}-`)) cityFiles.set(file.fileName, city.slug);
    }
    const priorFile = previous.get(city.slug)?.localFile;
    if (priorFile) cityFiles.set(priorFile, city.slug);
  }
  let newlyDownloadedValidated = 0;
  let failed = 0;
  let processed = 0;
  const auditOnly = process.argv.includes('--audit-only');

  for (const [index, city] of runCities.entries()) {
    const country = countryByCode.get(city.countryCode) || { code: city.countryCode, name: city.countryCode };
    const heroImageUrl = profileHero(city);
    const citySlug = slugify(city.name);
    const canonicalFileName = `${country.code.toLowerCase()}-${citySlug}.webp`;
    const prior = previous.get(city.slug);
    const visuallyRejectedExisting = VISUAL_REJECTED_CITY_SLUGS.has(city.slug);
    const rejectedFileName = visuallyRejectedExisting ? prior?.localFile || '' : '';
    const fileName = !visuallyRejectedExisting && prior?.sourcePageUrl && prior.imageResourceUrl && prior.localFile ? prior.localFile : canonicalFileName;
    const targetPath = path.join(imageDir, fileName);
    const oldFilePath = fileFromHero(heroImageUrl);
    const candidatePath = visuallyRejectedExisting ? null : fs.existsSync(targetPath) ? targetPath : oldFilePath && fs.existsSync(oldFilePath) ? oldFilePath : null;
    const candidateName = candidatePath ? path.basename(candidatePath) : '';
    const candidateClass = candidateName ? classifyFileName(candidateName) : '';
    const tech = candidatePath ? await inspectImage(candidatePath) : null;
    const sameCityFiles = new Set([fileName, canonicalFileName, ...[...cityFiles.entries()].filter(([, slug]) => slug === city.slug).map(([name]) => name)]);
    const candidateHash = tech?.valid ? crypto.createHash('sha256').update(fs.readFileSync(candidatePath)).digest('hex') : null;
    const candidateOwners = candidateHash ? hashOwners.get(candidateHash) || [] : [];
    const cachedImageUnique = candidateOwners.every((owner) => sameCityFiles.has(owner));
    let result = {
      country: country.name, countryCode: country.code, city: city.name, slug: city.slug,
      heroImageUrl, localFile: candidateName || null, status: 'missing', classification: 'MISSING_IMAGE',
      sourcesAttempted: [], validation: tech, unique: null, verificationStatus: 'NOT_VERIFIED',
      visuallyRejectedPreviousFile: rejectedFileName || undefined,
    };

    if (normalizeForMatch(city.name) === 'none' || /(?:^|[-_/])none(?:$|[-_.])/i.test(city.slug)) {
      result.status = 'placeholder'; result.classification = 'PLACEHOLDER'; result.reason = 'Live City record is a placeholder, not a real city';
    } else if (candidateClass === 'PLACEHOLDER') {
      result.status = 'placeholder'; result.classification = 'PLACEHOLDER'; result.reason = 'Existing asset is an explicit placeholder';
    } else if (auditOnly) {
      result.status = candidatePath ? 'unverified' : 'missing';
      result.classification = candidateClass === 'AIRPORT_ONLY' ? 'AIRPORT_ONLY'
        : candidateClass === 'COUNTRY_GENERIC' ? 'GENERIC_COUNTRY_IMAGE'
          : candidatePath && !tech.valid ? 'BROKEN_OR_UNUSABLE'
            : candidatePath ? 'UNVERIFIED_EXISTING_OR_WRONG_CITY' : 'MISSING_IMAGE';
      result.reason = candidatePath ? (candidateClass === 'AIRPORT_ONLY'
        ? 'Existing asset is airport-named and is not accepted without city-specific evidence'
        : candidateClass === 'COUNTRY_GENERIC' ? 'Existing asset appears generic/country-level'
          : !tech.valid ? tech.error || 'Image failed technical validation'
            : 'Existing image has no auditable city-specific provenance') : 'No local image found';
    } else if (!visuallyRejectedExisting && prior?.status === 'valid' && prior.sourcePageUrl && prior.imageResourceUrl && isCityArticleTitle(prior.pageTitle || titleFromPageUrl(prior.sourcePageUrl), city, country) && fs.existsSync(targetPath) && tech?.valid && cachedImageUnique) {
      result.status = 'valid'; result.classification = 'VALID_CITY_SPECIFIC_LOCAL'; result.localFile = fileName;
      result.sourcePageUrl = prior.sourcePageUrl; result.directImageUrl = prior.directImageUrl;
      result.pageTitle = prior.pageTitle || titleFromPageUrl(prior.sourcePageUrl);
      result.imageAlt = prior.imageAlt; result.imageResourceUrl = prior.imageResourceUrl;
      result.sourceWebsite = prior.sourceWebsite; result.dimensions = prior.dimensions; result.unique = prior.unique;
      result.verificationStatus = prior.verificationStatus;
      result.validation = prior.validation || tech;
      result.downloadedThisExecution = prior.downloadedThisExecution;
      result.downloadedThisEuropePass = prior.downloadedThisEuropePass ?? true;
      result.replacedInvalidOrUnverified = prior.replacedInvalidOrUnverified;
    } else {
      try {
        const resolved = await resolveWikipediaArticle(city, country);
        result.sourcesAttempted = resolved.attempts || [];
        if (NON_CITY_GEOGRAPHY_SLUGS.has(city.slug)) {
          result.status = 'unverified';
          result.classification = 'GENERIC_COUNTRY_IMAGE';
          result.reason = 'The live City label represents a region/island rather than a city; no nearby-city image was substituted';
        } else if (!resolved.images?.length) {
          result.status = candidatePath ? 'unverified' : 'missing';
          result.classification = candidatePath ? 'UNVERIFIED_EXISTING_OR_WRONG_CITY' : 'MISSING_IMAGE';
          result.reason = 'No city-and-country-matched article image was found';
        } else {
          const existingTarget = fs.existsSync(targetPath);
          let selectedImage;
          let downloaded;
          const imageErrors = [];
          for (const image of resolved.images) {
            try {
              downloaded = await downloadValidatedImage(image.imageUrl, targetPath, hashOwners, sameCityFiles);
              if (downloaded.duplicate) {
                imageErrors.push({ imageUrl: image.imageUrl, duplicateOf: downloaded.duplicateOf });
                continue;
              }
              selectedImage = image;
              break;
            } catch (error) {
              imageErrors.push({ imageUrl: image.imageUrl, error: String(error.message || error) });
            }
          }
          if (!downloaded) {
            if (imageErrors.length && imageErrors.every((entry) => entry.duplicateOf)) {
              result.status = 'duplicate'; result.classification = 'DUPLICATE_IMAGE';
              result.reason = `All ${imageErrors.length} suitable article images duplicate another city image`;
              result.sourcesAttempted = [...result.sourcesAttempted, ...imageErrors];
              results[startAt + index] = result;
              processed += 1;
              if (!auditOnly && processed % BATCH_SIZE === 0) {
                const summary = await createSummary(countries, cities, results, { newlyDownloadedValidated, failed, processed, previous });
                writeReports(summary);
                console.log(`CHECKPOINT ${processed + startAt}/${cities.length}: valid=${summary.finalCoverage.citiesWithValidImage}, downloaded=${newlyDownloadedValidated}, unresolved=${summary.downloads.unresolved}`);
              }
              continue;
            }
            throw new Error(`All ${resolved.images.length} article image candidates failed: ${JSON.stringify(imageErrors)}`);
          }
          result.localFile = path.basename(downloaded.filePath);
          result.sourcePageUrl = resolved.pageUrl;
          result.pageTitle = resolved.pageTitle;
          result.directImageUrl = selectedImage.imageUrl;
          result.imageAlt = selectedImage.alt;
          result.imageResourceUrl = selectedImage.resourceUrl;
          result.sourceWebsite = resolved.sourceWebsite;
          result.imageFormat = downloaded.format;
          result.dimensions = { width: downloaded.width, height: downloaded.height };
          result.validation = { valid: true, mime: downloaded.mime, bytes: downloaded.bytes, sha256: downloaded.sha256 };
          const duplicateOwners = hashOwners.get(downloaded.sha256) || [];
          const duplicateOf = duplicateOwners.find((owner) => !sameCityFiles.has(owner));
          const actualFileName = path.basename(downloaded.filePath);
          if (duplicateOf) {
            result.unique = false;
            result.status = 'duplicate'; result.classification = 'DUPLICATE_IMAGE';
            result.reason = `Image content duplicates ${duplicateOf}`;
          } else {
            duplicateOwners.push(actualFileName);
            hashOwners.set(downloaded.sha256, duplicateOwners);
            cityFiles.set(actualFileName, city.slug);
            result.unique = true;
            result.verificationStatus = 'CITY_ARTICLE_AND_COUNTRY_CONTEXT_MATCHED; LEAD_IMAGE_TECHNICALLY_VALID';
            result.status = 'valid'; result.classification = 'VALID_CITY_SPECIFIC_LOCAL';
          }
          result.downloadedThisExecution = true;
                    result.downloadedThisEuropePass = true;
          result.replacedInvalidOrUnverified = existingTarget || !!candidatePath || visuallyRejectedExisting;
          newlyDownloadedValidated += 1;
          await wait(REQUEST_DELAY_MS);
        }
      } catch (error) {
        failed += 1;
        result.status = candidatePath ? 'unverified' : 'failed';
        result.classification = candidatePath ? 'UNVERIFIED_EXISTING_OR_WRONG_CITY' : 'BROKEN_OR_UNUSABLE';
        result.reason = String(error.message || error);
      }
    }
    result.classification = cityClassification(result) === 'MISSING_IMAGE' && result.status === 'generic' ? 'GENERIC_COUNTRY_IMAGE' : result.classification;
    results[startAt + index] = result;
    processed += 1;
    if (!auditOnly && processed % BATCH_SIZE === 0) {
      const summary = await createSummary(countries, cities, results, { newlyDownloadedValidated, failed, processed, previous });
      writeReports(summary);
      console.log(`CHECKPOINT ${processed + startAt}/${cities.length}: valid=${summary.finalCoverage.citiesWithValidImage}, downloaded=${newlyDownloadedValidated}, unresolved=${summary.downloads.unresolved}`);
    }
    if (!auditOnly && (index + 1) % 30 === 0) console.log(`PROGRESS ${index + 1 + startAt}/${cities.length}`);
  }

  const summary = await createSummary(countries, cities, results, { newlyDownloadedValidated, failed, processed, previous });
  summary.notes = [
    'The live Prisma database was queried read-only; no City, profile, API, schema, or frontend records were changed.',
    'Wikipedia article lead images are accepted only when article title and country context match; visual review remains an explicit caveat where automated source metadata cannot establish image subject.',
    'A city record named None is retained in the 378-record audit and excluded from real-city image coverage as a placeholder record.',
    'Existing airport, placeholder, generic, broken, or unproven files are not counted as valid city images.',
  ];
  writeReports(summary);
  console.log(JSON.stringify({ dataset: summary.dataset, finalCoverage: summary.finalCoverage, downloads: summary.downloads, filesystem: summary.filesystem, perCountry: summary.perCountry }, null, 2));
}

async function createSummary(countries, cities, results, state) {
  const files = await buildFileAudit();
  const byCode = new Map();
  for (const country of countries) byCode.set(country.code, { country: country.name, countryCode: country.code, cities: 0, alreadyValid: 0, downloaded: 0, invalidOrReplaced: 0, unresolved: 0 });
  for (const result of results) {
    const item = byCode.get(result.countryCode);
    if (!item) continue;
    item.cities += 1;
    if (result.status === 'valid') {
      if (result.downloadedThisExecution) item.downloaded += 1;
      else item.alreadyValid += 1;
    } else if (result.status !== 'placeholder') item.unresolved += 1;
    if (result.replacedInvalidOrUnverified || ['airport-only', 'broken', 'generic', 'duplicate'].includes(result.status)) item.invalidOrReplaced += 1;
  }
  const perCountry = [...byCode.values()].map((item) => ({ ...item, coverage: item.cities ? Number(((item.alreadyValid + item.downloaded) / item.cities * 100).toFixed(1)) : 0 }));
  const eligibleCities = results.filter((city) => city.status !== 'placeholder').length;
  const validCities = results.filter((city) => city.status === 'valid').length;
  const placeholderFiles = files.filter((file) => file.classification === 'PLACEHOLDER').length;
  const airportOnlyFiles = files.filter((file) => file.classification === 'AIRPORT_ONLY').length;
  const genericFiles = files.filter((file) => file.classification === 'COUNTRY_GENERIC').length;
  const validWebpFiles = files.filter((file) => file.valid && file.format === 'webp').length;
  const duplicateFiles = files.filter((file) => file.duplicateOf).length;
  return {
    generatedAt: new Date().toISOString(),
    dataset: { europeanCountries: countries.length, europeanCities: cities.length, eligibleCities },
    existingAssets: {
      validExistingCityImages: results.filter((city) => city.status === 'valid' && !city.downloadedThisExecution).length,
      visuallyRejectedPreviousImages: results.filter((city) => city.visuallyRejectedPreviousFile).length,
      invalidImages: files.filter((file) => !file.valid).length,
      placeholderFiles, airportOnlyFiles, genericFiles,
      wrongCityImages: results.filter((city) => city.status === 'wrong-city').length,
      duplicates: duplicateFiles,
    },
    downloads: {
      newlyDownloadedValidated: state.newlyDownloadedValidated,
      totalDownloadedValidated: results.filter((city) => city.status === 'valid' && city.downloadedThisEuropePass).length,
      failed: state.failed,
      unresolved: results.filter((city) => !['valid', 'placeholder'].includes(city.status)).length,
      skipped: results.filter((city) => city.status === 'placeholder' || (city.status === 'valid' && !city.downloadedThisExecution)).length,
      processed: state.processed,
    },
    finalCoverage: {
      citiesWithValidImage: validCities,
      citiesWithoutValidImage: eligibleCities - validCities,
      percentage: eligibleCities ? Number((validCities / eligibleCities * 100).toFixed(2)) : 0,
    },
    filesystem: {
      totalFiles: files.length, validWebpFiles,
      invalidOrCorruptFiles: files.filter((file) => !file.valid).length,
      duplicateFiles, files,
    },
    perCountry,
    cities: results,
    notes: [],
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
