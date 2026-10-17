const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..', '..');
const manifestPath = path.join(root, 'ASIA_HISTORICAL_EVENT_IMAGE_COLLECTION.json');
const collectionManifestPath = path.join(root, 'ASIA_HISTORICAL_EVENT_IMAGE_COLLECTION_MANIFEST.md');
const imageDir = path.join(root, 'backend', 'public', 'Images', 'Asia historical events');
const userAgent = 'AsiaHistoricalImageCollector/1.0 (event image collection)';
const ignoredTokens = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'from', 'by', 'as', 'and', 'day', 'event', 'anniversary', 'commemoration', 'celebration', 'begins', 'began', 'started', 'founded', 'established', 'historical', 'milestone', 'sheikh', 'bin', 'al', 'sultan', 'king', 'queen']);
const synonyms = new Map([
  ['republic', 'independence'],
  ['independence', 'republic'],
  ['novruz', 'nowruz'],
  ['nowruz', 'novruz'],
  ['qurban', 'adha'],
  ['adha', 'qurban'],
  ['national', 'independence'],
]);
const countryAliases = {
  AE: ['UAE', 'Emirati'], AF: ['Afghan'], AM: ['Armenian'], AZ: ['Azerbaijani'], BD: ['Bangladeshi'],
  BH: ['Bahraini'], BN: ['Bruneian'], BT: ['Bhutanese'], CN: ['Chinese'], CY: ['Cypriot'], GE: ['Georgian'],
  ID: ['Indonesian'], IL: ['Israeli'], IN: ['Indian'], IQ: ['Iraqi'], IR: ['Iranian'], JO: ['Jordanian'],
  JP: ['Japanese'], KG: ['Kyrgyz'], KH: ['Cambodian'], KP: ['North Korean', 'Korean'], KR: ['South Korean', 'Korean'],
  KW: ['Kuwaiti'], KZ: ['Kazakh'], LA: ['Lao', 'Laotian'], LB: ['Lebanese'], LK: ['Sri Lankan'], MM: ['Burmese'],
  MN: ['Mongolian'], MV: ['Maldivian'], MY: ['Malaysian'], NP: ['Nepali', 'Nepalese'], OM: ['Omani'],
  PH: ['Filipino', 'Philippine'], PK: ['Pakistani'], QA: ['Qatari'], RU: ['Russian'], SA: ['Saudi'],
  RU: ['Russia', 'Russian'], SG: ['Singaporean'], SY: ['Syrian'], TJ: ['Tajik'], TL: ['Timorese', 'East Timor'], TM: ['Turkmen'],
  TH: ['Thai'], TR: ['Turkish', 'Turkiye'], UZ: ['Uzbek'], VN: ['Vietnamese'], YE: ['Yemeni'],
};
const verifiedLocalReuses = new Map([
  ['AM|yerevan historical milestone', 'AM-founding-of-yerevan-erebuni-fortress.jpg'],
  ['MN|naadam festival wrestling archery horse racing', 'MN-mongolia-national-day-naadam.jpg'],
  ['TL|timor leste independence restoration day', 'TL-1999-independence-referendum.png'],
]);

function pause(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function meaningfulTokens(value) {
  return normalize(value).split(/\s+/).filter((token) => token.length > 2 && !ignoredTokens.has(token));
}

function eventTokens(event) {
  const countryTokens = new Set([
    ...meaningfulTokens(event.country),
    ...(countryAliases[event.countryCode.toUpperCase()] ?? []).flatMap(meaningfulTokens),
  ]);
  return [...new Set(meaningfulTokens(event.title).filter((token) => !countryTokens.has(token)))];
}

function pageRelevance(event, pageTitle, description) {
  const terms = eventTokens(event);
  const countryTokens = new Set(meaningfulTokens(event.country));
  const aliases = countryAliases[event.countryCode.toUpperCase()] ?? [];
  const countryNameTokens = new Set([...countryTokens, ...aliases.flatMap(meaningfulTokens)]);
  const pageTokens = new Set(meaningfulTokens(pageTitle).filter((token) => !countryTokens.has(token)));
  const descriptionTokens = new Set(meaningfulTokens(description).filter((token) => !countryTokens.has(token)));
  const titleCountryTokens = new Set(meaningfulTokens(pageTitle));
  const descriptionCountryTokens = new Set(meaningfulTokens(description));
  const countryMentioned = [...countryNameTokens].some((token) => titleCountryTokens.has(token) || descriptionCountryTokens.has(token));
  const titleOverlap = terms.filter((token) => pageTokens.has(token) || pageTokens.has(synonyms.get(token))).length;
  const descriptionOverlap = terms.filter((token) => descriptionTokens.has(token) || descriptionTokens.has(synonyms.get(token))).length;
  const overlap = new Set([
    ...terms.filter((token) => pageTokens.has(token) || pageTokens.has(synonyms.get(token))),
    ...terms.filter((token) => descriptionTokens.has(token) || descriptionTokens.has(synonyms.get(token))),
  ]).size;
  const requiredOverlap = terms.length > 2 ? 2 : terms.length;
  const vagueMilestone = /historical milestone/i.test(event.title);
  return {
    overlap,
    vagueMilestone,
    countryMentioned,
    relevant: overlap >= requiredOverlap && (titleOverlap > 0 || descriptionOverlap > 1) && countryMentioned && !vagueMilestone,
  };
}

function existingRelatedFile(event) {
  const verifiedReuse = verifiedLocalReuses.get(`${event.countryCode.toUpperCase()}|${normalize(event.title)}`);
  if (verifiedReuse && fs.existsSync(path.join(imageDir, verifiedReuse))) return verifiedReuse;
  const terms = eventTokens(event);
  if (!terms.length) return null;
  return fs.readdirSync(imageDir).find((file) => {
    if (!file.toLowerCase().endsWith('.webp') || file.slice(0, 2).toUpperCase() !== event.countryCode.toUpperCase()) return false;
    const fileTerms = new Set(meaningfulTokens(file));
    return terms.every((term) => fileTerms.has(term) || fileTerms.has(synonyms.get(term)));
  }) ?? null;
}

async function apiJson(parameters) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await pause(1100);
    const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ ...parameters, format: 'json' })}`;
    const response = await fetch(url, { headers: { 'User-Agent': userAgent }, signal: AbortSignal.timeout(25000) });
    if (response.status === 429 && attempt === 0) {
      const retryAfter = Number(response.headers.get('retry-after'));
      await pause(Math.min(Math.max(retryAfter * 1000 || 12000, 5000), 60000));
      continue;
    }
    if (!response.ok) throw new Error(`Wikipedia API HTTP ${response.status}`);
    return response.json();
  }
  throw new Error('Wikipedia API rate limit retry exhausted');
}

async function getImageCandidates(pages) {
  const withImages = pages.filter((page) => page.pageimage && page.original?.source);
  if (!withImages.length) return [];
  const titles = withImages.map((page) => `File:${page.pageimage}`).join('|');
  const fileResult = await apiJson({ action: 'query', titles, prop: 'imageinfo', iiprop: 'url|thumburl|extmetadata', iiurlwidth: '1280' });
  const filePages = Object.values(fileResult.query.pages ?? {});
  return withImages.flatMap((page) => {
    const filePage = filePages.find((item) => normalize(item.title) === normalize(`File:${page.pageimage}`));
    const info = filePage?.imageinfo?.[0];
    if (!info?.url) return [];
    const metadata = info.extmetadata ?? {};
    const license = String(metadata.LicenseShortName?.value ?? '').replace(/<[^>]+>/g, '').trim();
    const allowedLicense = /^(CC BY(-SA)?( [0-9.]+)?|CC0|Public domain|PD[- /])/i.test(license) && !/NC|non.?commercial|fair use|all rights reserved/i.test(license);
    const description = String(metadata.ImageDescription?.value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return [{
      pageTitle: page.title,
      fileTitle: filePage.title,
        originalUrl: info.url,
        downloadUrl: info.thumburl ?? thumbnailUrl(info.url, 1280),
      description,
      license,
      licenseUrl: metadata.LicenseUrl?.value ?? null,
      author: String(metadata.Artist?.value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      allowedLicense,
      dimensions: { width: info.width ?? page.original.width, height: info.height ?? page.original.height },
      searchRank: page.index ?? Number.MAX_SAFE_INTEGER,
    }];
  }).sort((left, right) => left.searchRank - right.searchRank);
}

function thumbnailUrl(originalUrl, width) {
  const source = new URL(originalUrl);
  const segments = source.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (segments.length < 5 || segments[0] !== 'wikipedia' || segments[1] !== 'commons') {
    throw new Error('Original image URL is not a Wikimedia Commons file');
  }
  const filename = segments.at(-1);
  const thumbPath = `/${segments.slice(0, 2).join('/')}/thumb/${segments.slice(2).map(encodeURIComponent).join('/')}/${width}px-${encodeURIComponent(filename)}`;
  return `https://thumb.wikimedia.org${thumbPath}`;
}

function outputName(event) {
  const countryCode = event.countryCode.toUpperCase();
  const slug = event.slug.replace(new RegExp(`^${countryCode}-`, 'i'), '');
  return `${countryCode}-${slug}.webp`;
}

async function downloadAndConvert(event, image) {
  const width = Math.min(1280, Math.max(640, Math.min(image.dimensions.width ?? 1280, 1280)));
  const url = image.downloadUrl ?? thumbnailUrl(image.originalUrl, width);
  const response = await fetch(url, { headers: { 'User-Agent': userAgent, Accept: 'image/*' }, signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`Image download HTTP ${response.status}`);
  if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error('Downloaded response is not an image');

  const bytes = Buffer.from(await response.arrayBuffer());
  const source = sharp(bytes, { failOn: 'error' });
  const sourceMetadata = await source.metadata();
  if (!sourceMetadata.width || !sourceMetadata.height || sourceMetadata.width < 400 || sourceMetadata.height < 300) {
    throw new Error(`Source image dimensions are unusable: ${sourceMetadata.width}x${sourceMetadata.height}`);
  }

  const filePath = path.join(imageDir, outputName(event));
  if (fs.existsSync(filePath)) return { status: 'EXISTING_FILE', file: path.basename(filePath) };
  const result = await source.rotate().webp({ quality: 88 }).toFile(filePath);
  const outputMetadata = await sharp(filePath, { failOn: 'error' }).metadata();
  if (outputMetadata.format !== 'webp' || !outputMetadata.width || !outputMetadata.height) {
    fs.unlinkSync(filePath);
    throw new Error('Output failed WebP format/dimension validation');
  }
  return { status: 'DOWNLOADED_WEBP', file: path.basename(filePath), width: result.width, height: result.height, size: result.size };
}

async function processEvent(event) {
  if (/historical milestone/i.test(event.title)) return { eventId: event.eventId, title: event.title, status: 'UNRESOLVED', reason: 'Event title does not identify a specific milestone' };
  const existingFile = existingRelatedFile(event);
  if (existingFile) return { eventId: event.eventId, title: event.title, country: event.country, status: 'EXISTING_VALID_ASSET', file: existingFile };
  const country = event.country;
  const query = `${country} ${event.title}`;
  const search = await apiJson({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '0',
    gsrwhat: 'text',
    gsrlimit: '20',
    prop: 'pageimages',
    piprop: 'name|original',
  });
  const pages = Object.values(search.query.pages ?? {}).sort((left, right) => left.index - right.index);
  const candidates = await getImageCandidates(pages);
  for (const image of candidates) {
    const relevance = pageRelevance(event, image.pageTitle, image.description);
    if (!relevance.relevant || !image.allowedLicense) continue;
    if (image.dimensions.width < 400 || image.dimensions.height < 300) continue;
    const result = await downloadAndConvert(event, image);
    return {
      eventId: event.eventId,
      title: event.title,
      country,
      file: result.file,
      source: image.fileTitle,
      sourceUrl: image.originalUrl,
      sourcePage: `https://en.wikipedia.org/wiki/${encodeURIComponent(image.pageTitle.replace(/ /g, '_'))}`,
      license: image.license,
      licenseUrl: image.licenseUrl,
      author: image.author,
      imageDescription: image.description,
      imageType: relevance.overlap > 1 ? 'EXACT_EVENT_IMAGE' : 'REPRESENTATIVE_EVENT_IMAGE',
      verification: 'UNRESOLVED',
      ...result,
    };
  }
  return { eventId: event.eventId, title: event.title, country, status: 'UNRESOLVED', reason: 'No relevant article image with a reusable verified license' };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const collectionManifest = fs.readFileSync(collectionManifestPath, 'utf8');
  const coveredEventIds = new Set([...collectionManifest.matchAll(/`([0-9a-f]{8}-[0-9a-f-]{27})`/g)].map((match) => match[1]));
  const requestedCountry = process.argv.find((argument) => argument.startsWith('--country='))?.split('=')[1]?.toUpperCase();
  const requestedCountries = new Set((process.argv.find((argument) => argument.startsWith('--countries='))?.split('=')[1] ?? '').split(',').filter(Boolean).map((code) => code.toUpperCase()));
  const limitArgument = Number(process.argv.find((argument) => argument.startsWith('--limit='))?.split('=')[1] ?? 0);
  const includeLocalCandidates = process.argv.includes('--include-local-candidates');
  const queue = manifest.queue.filter((event) => {
    const needsImage = !event.currentImage || event.localExists === false;
    const noLocalMatch = !event.localCandidates?.length;
    const countryMatches = (!requestedCountry || event.countryCode.toUpperCase() === requestedCountry)
      && (!requestedCountries.size || requestedCountries.has(event.countryCode.toUpperCase()));
    return needsImage && !coveredEventIds.has(event.eventId) && (includeLocalCandidates || noLocalMatch) && countryMatches;
  });
  const grouped = new Map();
  for (const event of queue) {
    const key = `${event.countryCode.toUpperCase()}|${normalize(event.title)}`;
    if (!grouped.has(key)) grouped.set(key, event);
  }
  const events = [...grouped.values()].slice(0, limitArgument || undefined);
  console.log(`Uncovered event rows in selected countries: ${queue.length}; unique event titles to search: ${events.length}`);
  const results = [];
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    try {
      const result = await processEvent(event);
      results.push(result);
      console.log(`[${index + 1}/${events.length}] ${event.countryCode} ${event.title}: ${result.status ?? result.reason}`);
    } catch (error) {
      results.push({ eventId: event.eventId, title: event.title, country: event.country, status: 'UNRESOLVED', reason: String(error.message || error) });
      console.log(`[${index + 1}/${events.length}] ${event.countryCode} ${event.title}: UNRESOLVED (${error.message || error})`);
    }
    await pause(350);
  }
  const downloaded = results.filter((result) => result.status === 'DOWNLOADED_WEBP').length;
  const unresolved = results.filter((result) => result.status === 'UNRESOLVED').length;
  console.log(JSON.stringify({ processed: results.length, downloadedWebp: downloaded, unresolved, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});