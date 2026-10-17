require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const backendDir = path.join(__dirname, '..');
const manifestPath = path.join(backendDir, 'data', 'africa_city_image_manifest.json');
const previewDir = path.join(os.tmpdir(), 'africa-city-image-review');
const previewWidth = 300;
const previewHeight = 230;
const previewsPerSheet = 12;
const openverseUrl = 'https://api.openverse.org/v1/images/';
const cityAliases = new Map([
  ['CG|pointe noire', ['Pointe Noire', 'Pointe Noire Republic of Congo']],
  ['GA|franceville', ['Masuku', 'Franceville Gabon']],
  ['ZA|gqeberha', ['Port Elizabeth', 'PE South Africa']],
  ['BW|kasane', ['Kasane Botswana Chobe']],
  ['CD|kisangani', ['Stanleyville Congo', 'Wagenia Falls Kisangani']],
  ['CD|goma', ['Goma North Kivu', 'Goma DRC']],
  ['CD|kindu', ['Kindu Maniema']],
  ['CD|lubumbashi', ['Elisabethville Congo', 'Lubumbashi Katanga']],
  ['CD|kinshasa', ['Leopoldville Congo', 'Kinshasa DRC']],
  ['CI|abidjan', ['Abidjan Cote d Ivoire cityscape']],
  ['CM|garoua', ['Garoua Cameroon city centre']],
  ['CM|maroua', ['Maroua Cameroon city centre']],
  ['CV|praia', ['Praia Santiago Cape Verde']],
  ['CV|espargos', ['Espargos Sal', 'Sal island town']],
  ['CV|rabil', ['Rabil Boa Vista']],
  ['CV|sao pedro', ['Sao Pedro Cape Verde', 'Sao Pedro Sao Vicente']],
  ['DJ|djibouti', ['Djibouti City Djibouti']],
  ['DZ|setif', ['Setif Algeria city centre']],
  ['DZ|bejaia', ['Bougie Algeria', 'Bejaia Algeria city']],
  ['DZ|annaba', ['Bone Algeria', 'Annaba Algeria']],
  ['DZ|tlemcen', ['Tlemcen Algeria old city']],
  ['EG|sohag', ['Sohag Egypt city centre']],
  ['EG|giza', ['Giza Egypt city centre', 'Giza Cairo urban']],
  ['EG|hurghada', ['Hurghada Egypt marina', 'Hurghada Red Sea city']],
  ['GA|libreville', ['Libreville Gabon city centre']],
  ['GA|port-gentil', ['Port Gentil', 'Mandji']],
  ['GQ|bata', ['Bata Equatorial Guinea city']],
  ['GW|bissau', ['Bissau Guinea Bissau city centre']],
  ['KE|eldoret', ['Eldoret Kenya town centre']],
  ['KM|moroni', ['Moroni Comoros city centre']],
  ['LR|monrovia', ['Monrovia Liberia downtown']],
  ['LY|benghazi', ['Benghazi Libya city centre']],
  ['LY|misrata', ['Misrata Libya city centre']],
  ['LY|tripoli', ['Tripoli Libya city centre']],
  ['LY|sebha', ['Sabha Libya old city']],
  ['MA|dakhla', ['Dakhla Western Sahara city']],
  ['MA|fes', ['Fes Morocco old city']],
  ['MA|oujda', ['Oujda Morocco city centre']],
  ['MA|rabat', ['Rabat Morocco city centre']],
  ['MA|tangier', ['Tangier Morocco city centre']],
  ['MG|antsiranana', ['Diego Suarez Madagascar']],
  ['MG|nosy be', ['Hell-Ville', 'Andoany']],
  ['MG|toamasina', ['Tamatave Madagascar']],
  ['MG|toliara', ['Tulear Madagascar']],
  ['MR|nouadhibou', ['Nouadhibou Mauritania city']],
  ['MR|nouakchott', ['Nouakchott Mauritania city']],
  ['MU|plaine magnien', ['Plaine Magnien Mauritius', 'Mahebourg airport area']],
  ['MZ|vilankulo', ['Vilanculos', 'Vilanculos Mozambique']],
  ['NA|walvis bay', ['Walvis Bay Namibia town']],
  ['NG|enugu', ['Enugu Nigeria city centre']],
  ['NG|owerri', ['Owerri Nigeria city centre']],
  ['SD|port sudan', ['Port Sudan Sudan city centre']],
  ['SO|hargeisa', ['Hargeisa Somaliland', 'Hargeysa Somaliland']],
  ['ST|sao tome', ['Sao Tome city centre', 'Sao Tome and Principe']],
  ['SZ|sikhuphe', ['Sikhuphe Eswatini']],
  ['TD|n djamena', ["N'Djamena Chad city centre", 'Fort-Lamy Chad']],
  ['TN|djerba', ['Houmt Souk', 'Houmt Souk Djerba Tunisia']],
  ['TN|monastir', ['Monastir Tunisia city centre']],
  ['TZ|kilimanjaro', ['Moshi Kilimanjaro Tanzania']],
  ['UG|entebbe', ['Entebbe Uganda town centre']],
  ['ZM|livingstone', ['Livingstone City Centre', 'Livingstone Zambia street']],
  ['ZM|lusaka', ['Lusaka Zambia city centre']],
  ['ZM|ndola', ['Ndola Zambia city centre']],
]);

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function cityKey(countryCode, city) {
  return `${countryCode}|${normalize(city)}`;
}

function containsPhrase(value, phrase) {
  const normalizedValue = normalize(value);
  const normalizedPhrase = normalize(phrase);
  return normalizedPhrase.length > 1 && ` ${normalizedValue} `.includes(` ${normalizedPhrase} `);
}

function candidateRelevance(result, target) {
  const title = result.title || '';
  const tags = (result.tags || []).map((tag) => tag.name || '').join(' ');
  const locationTerms = [target.actualCity, ...(target.aliases || [])];
  const matchedTitleTerm = locationTerms.find((term) => containsPhrase(title, term)) || null;
  const matchedTagTerm = locationTerms.find((term) => containsPhrase(tags, term)) || null;
  const titleCityMatch = !!matchedTitleTerm;
  const tagCityMatch = !!matchedTagTerm;
  const text = `${title} ${tags} ${result.foreign_landing_url || ''}`;
  const countryMatch = containsPhrase(text, target.country);
  const urbanWords = /\b(city|town|urban|skyline|street|cityscape|centre|center|downtown|aerial|panorama|buildings|architecture|landmark|village|harbour|harbor|port|market|square|mosque|church|bridge|river|lake|mountain|falls|beach|coast)\b/i;
  const titleUrbanMatch = urbanWords.test(title);
  const disqualifyingTitle = /\b(portrait|selfie|fashion|model|wedding|baby|pregnant|headshot|studio|product|food|recipe|animal|wildlife|footballer|soccer player|satellite|landsat|planet|map|earth)\b/i.test(title);
  const exactCityEvidence = titleCityMatch || tagCityMatch;
  const usableLicense = ['by', 'by-sa', 'cc0', 'pdm'].includes(String(result.license || '').toLowerCase());
  const sufficientSize = Number(result.width || 0) >= 600 && Number(result.height || 0) >= 400;
  let score = 0;
  if (titleCityMatch) score += 5;
  if (tagCityMatch) score += 2;
  if (countryMatch) score += 3;
  if (titleUrbanMatch) score += 2;
  if (result.provider === 'wikimedia' || result.source === 'wikimedia') score += 1;
  if (disqualifyingTitle) score -= 8;
  return {
    score,
    matchedLocationTerm: matchedTitleTerm || matchedTagTerm,
    titleCityMatch,
    tagCityMatch,
    countryMatch,
    titleUrbanMatch,
    disqualifyingTitle,
    exactCityEvidence,
    usableLicense,
    sufficientSize,
    previewEligible: titleCityMatch && titleUrbanMatch && (!target.cityNameAmbiguous || countryMatch) && !disqualifyingTitle && usableLicense && sufficientSize,
  };
}

function serializeCandidate(result, target) {
  const relevance = candidateRelevance(result, target);
  return {
    title: result.title || null,
    sourcePage: result.foreign_landing_url || null,
    sourceUrl: result.url || null,
    previewUrl: result.thumbnail || null,
    creator: result.creator || null,
    license: result.license || null,
    licenseVersion: result.license_version || null,
    licenseUrl: result.license_url || null,
    provider: result.provider || result.source || null,
    width: result.width || null,
    height: result.height || null,
    fieldsMatched: result.fields_matched || [],
    tags: (result.tags || []).map((tag) => tag.name).filter(Boolean).slice(0, 30),
    attribution: result.attribution || null,
    relevance,
    verificationStatus: 'pending-visual-review',
    downloadStatus: 'not-downloaded',
    webpValidationStatus: 'not-validated',
  };
}

function entryCandidates(entries) {
  const candidatesByUrl = new Map();
  for (const entry of entries) {
    for (const candidate of entry.researchCandidates || []) {
      candidatesByUrl.set(candidate.sourceUrl, candidate);
    }
  }
  return [...candidatesByUrl.values()].sort((left, right) => right.relevance.score - left.relevance.score);
}

async function searchOpenverse(target, query, page = 1) {
  const url = new URL(openverseUrl);
  url.searchParams.set('q', query);
  url.searchParams.set('license', 'by,by-sa,cc0,pdm');
  url.searchParams.set('page_size', '20');
  url.searchParams.set('page', String(page));
  const response = await fetch(url, {
    headers: { 'User-Agent': 'AfricaCityImageResearch/1.0 (city image provenance collection)' },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Openverse returned HTTP ${response.status}`);
  const data = await response.json();
  return {
    query,
    resultCount: data.result_count || 0,
    candidates: (data.results || []).map((result) => serializeCandidate(result, target)),
  };
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
}

async function makePreview(candidate, label, includeBroadCandidate = false) {
  if ((!includeBroadCandidate && !candidate.relevance.previewEligible) || !candidate.previewUrl) return null;
  const imageUrls = [candidate.previewUrl, candidate.sourceUrl].filter(Boolean);
  for (const imageUrl of imageUrls) {
    try {
      const response = await fetch(imageUrl, {
        headers: { 'User-Agent': 'AfricaCityImageResearch/1.0' },
        signal: AbortSignal.timeout(25000),
      });
      if (!response.ok || !(response.headers.get('content-type') || '').toLowerCase().startsWith('image/')) continue;
      const input = Buffer.from(await response.arrayBuffer());
      const thumbnail = await sharp(input, { failOn: 'error' })
        .rotate()
        .resize(previewWidth, 170, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 78 })
        .toBuffer();
      const thumbnailMetadata = await sharp(thumbnail).metadata();
      const labelSvg = Buffer.from(`<svg width="${previewWidth}" height="60"><rect width="100%" height="100%" fill="#fff"/><text x="8" y="22" font-size="14" font-family="Arial" fill="#111">${escapeXml(label.slice(0, 35))}</text><text x="8" y="44" font-size="11" font-family="Arial" fill="#444">${escapeXml(candidate.title || '').slice(0, 68)}</text></svg>`);
      const canvas = await sharp({ create: { width: previewWidth, height: previewHeight, channels: 3, background: '#fff' } })
        .composite([
          { input: thumbnail, top: 0, left: Math.max(0, Math.floor((previewWidth - thumbnailMetadata.width) / 2)) },
          { input: labelSvg, top: 170, left: 0 },
        ])
        .jpeg({ quality: 80 })
        .toBuffer();
      return { label, buffer: canvas };
    } catch (error) {
      continue;
    }
  }
  return null;
}

async function writeContactSheets(previews, outputDir = previewDir) {
  if (!previews.length) return [];
  fs.mkdirSync(outputDir, { recursive: true });
  const sheetPaths = [];
  for (let start = 0; start < previews.length; start += previewsPerSheet) {
    const group = previews.slice(start, start + previewsPerSheet);
    const columns = 3;
    const rows = Math.ceil(group.length / columns);
    const composites = group.map((preview, index) => ({
      input: preview.buffer,
      left: (index % columns) * previewWidth,
      top: Math.floor(index / columns) * previewHeight,
    }));
    const outputPath = path.join(outputDir, `africa-cities-${String(start / previewsPerSheet + 1).padStart(2, '0')}.jpg`);
    await sharp({ create: { width: columns * previewWidth, height: rows * previewHeight, channels: 3, background: '#ddd' } })
      .composite(composites)
      .jpeg({ quality: 82 })
      .toFile(outputPath);
    sheetPaths.push(outputPath);
  }
  return sheetPaths;
}

async function research() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const countries = await prisma.country.findMany({
    where: { continent: { name: 'Africa' } },
    select: { code: true, name: true },
  });
  const countryByCode = new Map(countries.map((country) => [country.code, country]));
  const cities = await prisma.city.findMany({
    where: { countryCode: { in: countries.map((country) => country.code) } },
    select: { slug: true, name: true, countryCode: true, profile: true },
    orderBy: [{ countryCode: 'asc' }, { name: 'asc' }],
  });
  const manifestBySlug = new Map(manifest.cities.map((entry) => [entry.citySlug, entry]));
  const targets = new Map();
  for (const city of cities) {
    const profile = city.profile && typeof city.profile === 'object' && !Array.isArray(city.profile) ? city.profile : {};
    if (profile.heroImageUrl) continue;
    const entry = manifestBySlug.get(city.slug);
    if (!entry?.actualCity) continue;
    const key = cityKey(city.countryCode, entry.actualCity);
    if (!targets.has(key)) {
      targets.set(key, {
        key,
        countryCode: city.countryCode,
        country: countryByCode.get(city.countryCode)?.name || '',
        actualCity: entry.actualCity,
        aliases: cityAliases.get(cityKey(city.countryCode, entry.actualCity)) || [],
        entries: [],
      });
    }
    targets.get(key).entries.push(entry);
  }

  const countryCodesByCity = new Map();
  for (const target of targets.values()) {
    const normalizedCity = normalize(target.actualCity);
    if (!countryCodesByCity.has(normalizedCity)) countryCodesByCity.set(normalizedCity, new Set());
    countryCodesByCity.get(normalizedCity).add(target.countryCode);
  }
  for (const target of targets.values()) {
    target.aliases = cityAliases.get(cityKey(target.countryCode, target.actualCity)) || [];
    target.cityNameAmbiguous = countryCodesByCity.get(normalize(target.actualCity)).size > 1 || target.aliases.length > 0;
  }

  const previews = [];
  let completed = 0;
  const alternatePass = process.argv.includes('--alternates');
  const deepPass = process.argv.includes('--deep');
  const pageTwoPass = process.argv.includes('--page-two');
  const aliasOnlyPass = process.argv.includes('--aliases-only');
  const pageThreePass = process.argv.includes('--page-three');
  const pageArg = process.argv.find((arg) => arg.startsWith('--page='));
  const requestedPage = pageArg ? Number.parseInt(pageArg.split('=')[1], 10) : 0;
  const paginatedPass = Number.isInteger(requestedPage) && requestedPage > 1;
  const activePreviewDir = paginatedPass ? `${previewDir}-page-${requestedPage}` : aliasOnlyPass ? `${previewDir}-aliases` : pageTwoPass ? `${previewDir}-page-two` : pageThreePass ? `${previewDir}-page-three` : deepPass ? `${previewDir}-deep` : alternatePass ? `${previewDir}-alternate` : previewDir;
  const allTargets = process.argv.includes('--all');
  for (const target of targets.values()) {
    const alreadyResearched = aliasOnlyPass || pageTwoPass || pageThreePass || paginatedPass || deepPass
      ? false
      : alternatePass
        ? !allTargets && entryCandidates(target.entries).some((candidate) => candidate.relevance.previewEligible)
        : target.entries.every((entry) => ['candidates-collected-pending-review', 'no-exact-licensed-candidates'].includes(entry.researchStatus));
    if (alreadyResearched) continue;

    const queries = pageThreePass || paginatedPass
      ? [`"${target.actualCity}" ${target.country} city`, `${target.actualCity} ${target.country} skyline`]
      : aliasOnlyPass
      ? [...new Set([target.actualCity, ...(target.aliases || [])])]
      : pageTwoPass
      ? [`"${target.actualCity}" ${target.country} city`, `${target.actualCity} ${target.country} skyline`]
      : deepPass
      ? [
        `"${target.actualCity}" ${target.country} skyline`,
        `"${target.actualCity}" ${target.country} street landmark city centre`,
        ...(target.aliases || []).map((alias) => `"${alias}"`),
      ]
      : alternatePass
        ? [`${target.actualCity} skyline ${target.country}`, `${target.actualCity} ${target.country} street market landmark`]
        : [`"${target.actualCity}" ${target.country} city`];
    const queriedAt = new Date().toISOString();
    const newCandidates = [];
    const failures = [];
    for (const query of queries) {
      try {
        const result = await searchOpenverse(target, query, paginatedPass ? requestedPage : pageThreePass ? 3 : pageTwoPass ? 2 : 1);
        const ranked = result.candidates
          .filter((candidate) => candidate.relevance.exactCityEvidence && candidate.relevance.usableLicense)
          .sort((left, right) => right.relevance.score - left.relevance.score)
          .slice(0, 8);
        newCandidates.push(...ranked.map((candidate) => ({ ...candidate, query })));
      } catch (error) {
        failures.push(`${query}: ${error.message}`);
      }
      if (queries.length > 1 || pageTwoPass || pageThreePass || paginatedPass) await new Promise((resolve) => setTimeout(resolve, 3200));
    }
    for (const entry of target.entries) {
      const candidatesByUrl = new Map([...(entry.researchCandidates || []), ...newCandidates].map((candidate) => [candidate.sourceUrl, candidate]));
      entry.researchCandidates = [...candidatesByUrl.values()];
      entry.researchStatus = entry.researchCandidates.length ? 'candidates-collected-pending-review' : 'no-exact-licensed-candidates';
      entry.researchQueries = [...new Set([...(entry.researchQueries || []), ...queries])];
      entry.researchCheckedAt = queriedAt;
      entry.researchError = failures.length ? failures.join('; ') : null;
      entry.imageFilename = entry.imageFilename || `${target.countryCode.toLowerCase()}-${normalize(target.actualCity).replace(/\s+/g, '-')}.webp`;
      entry.localImagePath = entry.localImagePath || `${manifest.publicPathPrefix}${entry.imageFilename}`;
      entry.downloadStatus = entry.downloadStatus || 'not-downloaded';
      entry.webpConversionStatus = entry.webpConversionStatus || 'not-converted';
      entry.databaseUpdateStatus = entry.databaseUpdateStatus || 'not-updated';
    }

    const topPreview = entryCandidates(target.entries).find((candidate) => candidate.relevance.previewEligible);
    if (topPreview) {
      const preview = await makePreview(topPreview, `${target.countryCode} ${target.actualCity}`);
      if (preview) previews.push(preview);
    }
    const status = topPreview ? 'preview candidate ready' : 'no strict preview candidate';
    const failureSummary = failures.length ? `; ${failures.length} query errors` : '';
    console.log(`${target.countryCode} ${target.actualCity}: ${entryCandidates(target.entries).length} exact licensed candidates; ${status}${failureSummary}`);

    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    completed += 1;
    if (completed % 15 === 0) console.log(`persisted ${completed} city research records`);
    await new Promise((resolve) => setTimeout(resolve, 3200));
  }

  const sheetPaths = await writeContactSheets(previews, activePreviewDir);
  console.log(JSON.stringify({
    missingDbRows: cities.filter((city) => {
      const profile = city.profile && typeof city.profile === 'object' && !Array.isArray(city.profile) ? city.profile : {};
      return !profile.heroImageUrl;
    }).length,
    uniqueTargets: targets.size,
    targetsResearchedThisRun: completed,
    previews: previews.length,
    contactSheets: sheetPaths,
    previewDirectory: previewDir,
  }, null, 2));
}

async function buildReviewSheets() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const countries = await prisma.country.findMany({
    where: { continent: { name: 'Africa' } },
    select: { code: true },
  });
  const cities = await prisma.city.findMany({
    where: { countryCode: { in: countries.map((country) => country.code) } },
    select: { slug: true, profile: true },
  });
  const missingSlugs = new Set(cities.filter((city) => {
    const profile = city.profile && typeof city.profile === 'object' && !Array.isArray(city.profile) ? city.profile : {};
    return !profile.heroImageUrl;
  }).map((city) => city.slug));
  const grouped = new Map();
  for (const entry of manifest.cities) {
    if (!missingSlugs.has(entry.citySlug)) continue;
    const key = cityKey(entry.countryCode, entry.actualCity);
    if (!grouped.has(key)) grouped.set(key, { countryCode: entry.countryCode, actualCity: entry.actualCity, entries: [] });
    grouped.get(key).entries.push(entry);
  }
  const previews = [];
  const candidateLimit = process.argv.includes('--wide-preview') ? 5 : 2;
  for (const target of grouped.values()) {
    const candidatesByUrl = new Map();
    for (const entry of target.entries) {
      for (const candidate of entry.researchCandidates || []) {
        if (!candidate.sourceUrl || !candidate.sourcePage || !candidate.previewUrl || !candidate.relevance?.exactCityEvidence || !candidate.relevance?.usableLicense || candidate.relevance?.disqualifyingTitle) continue;
        candidatesByUrl.set(candidate.sourceUrl, candidate);
      }
    }
    const candidates = [...candidatesByUrl.values()].sort((left, right) => {
      if (left.relevance.titleCityMatch !== right.relevance.titleCityMatch) return left.relevance.titleCityMatch ? -1 : 1;
      return right.relevance.score - left.relevance.score;
    }).slice(0, candidateLimit);
    for (let index = 0; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      const preview = await makePreview(candidate, `${target.countryCode} ${target.actualCity} #${index + 1}`, true);
      if (preview) previews.push(preview);
    }
  }
  const outputDir = process.argv.includes('--wide-preview') ? `${previewDir}-broad-wide` : `${previewDir}-broad`;
  const sheetPaths = await writeContactSheets(previews, outputDir);
  console.log(JSON.stringify({ missingDbRows: missingSlugs.size, uniqueTargets: grouped.size, previews: previews.length, contactSheets: sheetPaths, previewDirectory: outputDir }, null, 2));
}

async function main() {
  if (process.argv.includes('--research')) return research();
  if (process.argv.includes('--preview-ledger')) return buildReviewSheets();
  const probeArg = process.argv.find((arg) => arg.startsWith('--probe='));
  if (probeArg) {
    const city = probeArg.slice('--probe='.length);
    const countryArg = process.argv.find((arg) => arg.startsWith('--country='));
    const countryName = countryArg?.slice('--country='.length);
    if (!countryName) throw new Error('Use --probe="City Name" --country="Country Name"');
    const target = { actualCity: city, country: countryName };
    const result = await searchOpenverse(target, `"${city}" ${countryName} city`);
    console.log(JSON.stringify(result.candidates.map((candidate) => ({ title: candidate.title, sourcePage: candidate.sourcePage, sourceUrl: candidate.sourceUrl, license: candidate.license, width: candidate.width, height: candidate.height, relevance: candidate.relevance })), null, 2));
    return;
  }
  throw new Error('Use --research or --probe="City Name" --country="Country Name"');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});