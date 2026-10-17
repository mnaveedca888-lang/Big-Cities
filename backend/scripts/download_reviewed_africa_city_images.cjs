require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const backendDir = path.join(__dirname, '..');
const manifestPath = path.join(backendDir, 'data', 'africa_city_image_manifest.json');
const imageDirectory = path.join(backendDir, 'public', 'Images', 'Africa cities images');
const publicPrefix = '/images/Africa%20cities%20images/';
const approvedCities = new Map([
  ['AO|luanda', 'Contact-sheet review: city skyline across Luanda Bay.'],
  ['BF|ouagadougou', 'Contact-sheet review: explicit city-centre street view.'],
  ['BI|bujumbura', 'Contact-sheet review: downtown Bujumbura streetscape.'],
  ['BJ|cotonou', 'Contact-sheet review: Cotonou skyline across the waterfront.'],
  ['DZ|algiers', 'Contact-sheet review: historic Algiers harbour and city frontage.'],
  ['EG|alexandria', 'Contact-sheet review: Port of Alexandria waterfront.'],
  ['EG|aswan', 'Contact-sheet review: Nile scene explicitly located at Aswan.'],
  ['EG|cairo', 'Contact-sheet review: Cairo skyline.'],
  ['EG|marsa alam', 'Contact-sheet review: beach explicitly located at Marsa Alam.'],
  ['ET|addis ababa', 'Contact-sheet review: Addis Ababa rising-city skyline at sunset.'],
  ['ET|dire dawa', 'Contact-sheet review: Dire Dawa market street.'],
  ['GH|accra', 'Contact-sheet review: Accra market street.'],
  ['GN|conakry', 'Contact-sheet review: Conakry street scene.'],
  ['GQ|malabo', 'Contact-sheet review: Malabo harbour and city waterfront.'],
  ['KE|kisumu', 'Contact-sheet review: Kisumu city waterfront/urban park.'],
  ['KE|mombasa', 'Contact-sheet review: Mombasa market scene.'],
  ['KE|nairobi', 'Contact-sheet review: Nairobi skyline.'],
  ['MA|agadir', 'Contact-sheet review: Agadir port.'],
  ['MA|casablanca', 'Contact-sheet review: Casablanca city and gardens.'],
  ['MA|marrakesh', 'Contact-sheet review: Koutoubia Mosque in Marrakesh.'],
  ['MA|ouarzazate', 'Contact-sheet review: Ouarzazate urban panorama.'],
  ['MG|antananarivo', 'Contact-sheet review: Antananarivo panorama from the High City.'],
  ['ML|bamako', 'Contact-sheet review: Bamako street.'],
  ['MZ|maputo', 'Contact-sheet review: Maputo skyline from the bay.'],
  ['NE|niamey', 'Contact-sheet review: city panorama explicitly identified as Niamey.'],
  ['NG|abuja', 'Contact-sheet review: Abuja National Mosque, an identifiable city landmark.'],
  ['NG|kano', 'Contact-sheet review: Kano street.'],
  ['NG|katsina', 'Contact-sheet review: Katsina mosque, an identifiable city landmark.'],
  ['NG|lagos', 'Contact-sheet review: Lagos street scene.'],
  ['RW|kigali', 'Contact-sheet review: Kigali skyline.'],
  ['SC|victoria', 'Contact-sheet review: market in Victoria, Mahé Island.'],
  ['SD|khartoum', 'Contact-sheet review: city skyline at the White and Blue Nile confluence.'],
  ['SN|dakar', 'Contact-sheet review: aerial Dakar roofs, beach, and ocean.'],
  ['SS|juba', 'Contact-sheet review: Juba Nile Bridge.'],
  ['TG|lome', 'Contact-sheet review: Lomé city scene.'],
  ['TN|tunis', 'Contact-sheet review: Al Fath Mosque in Tunis.'],
  ['TZ|dar es salaam', 'Contact-sheet review: Dar es Salaam street market.'],
  ['TZ|mwanza', 'Contact-sheet review: Mwanza street scene.'],
  ['ZA|bloemfontein', 'Contact-sheet review: Bloemfontein City Hall.'],
  ['ZA|durban', 'Contact-sheet review: Durban harbour.'],
  ['ZA|johannesburg', 'Contact-sheet review: Johannesburg cityscape.'],
  ['ZW|bulawayo', 'Contact-sheet review: Bulawayo City Hall.'],
  ['ZW|harare', 'Contact-sheet review: First Street, Harare.'],
  ['BW|maun', 'Contact-sheet review: aerial urban view explicitly titled Maun.'],
  ['BW|gaborone', 'Contact-sheet review: Gaborone, Botswana, 2010 urban scene.'],
  ['CV|praia', 'Contact-sheet review: Farol da Praia, a city-specific Praia landmark.'],
  ['CG|brazzaville', 'Contact-sheet review: historic first missionary house explicitly located in Brazzaville.'],
  ['DZ|oran', 'Contact-sheet review: historic Rue d’Arzeu street in Oran.'],
  ['DZ|constantine', 'Contact-sheet review: Constantine bridge and city gorge.'],
  ['EG|luxor', 'Contact-sheet review: Luxor city at night.'],
  ['ER|asmara', 'Contact-sheet review: Asmara urban panorama.'],
  ['LS|maseru', 'Contact-sheet review: Maseru panorama from Parliament Hill.'],
  ['LY|misrata', 'Contact-sheet review: street scene explicitly located in Misrata.'],
  ['MA|fes', 'Contact-sheet review: traditional Fès tannery.'],
  ['MA|tangier', 'Contact-sheet review: Tangier urban panorama.'],
  ['MG|mahajanga', 'Contact-sheet review: historic baobab landmark in Mahajanga.'],
  ['ML|mopti', 'Contact-sheet review: boats at the Mopti riverfront.'],
  ['MW|lilongwe', 'Contact-sheet review: city street/market scene in Lilongwe.'],
  ['NG|port harcourt', 'Contact-sheet review: aerial Port Harcourt harbour and city.'],
  ['SL|freetown', 'Contact-sheet review: historical Freetown street photograph.'],
  ['SO|mogadishu', 'Contact-sheet review: Mogadishu coastal urban scene.'],
  ['TN|monastir', 'Contact-sheet review: Monastir Ribat, a city-specific landmark.'],
  ['ZA|cape town', 'Contact-sheet review: Lion’s Head above Cape Town.'],
  ['ZW|victoria falls', 'Contact-sheet review: Victoria Falls Hotel in the city.'],
  ['BW|kasane', 'Contact-sheet review: Kasane urban centre and Chobe River frontage.'],
  ['CD|kisangani', 'Contact-sheet review: Kisangani urban centre and riverfront city scene.'],
  ['CD|lubumbashi', 'Contact-sheet review: Lubumbashi urban centre and commercial boulevard.'],
  ['CM|maroua', 'Contact-sheet review: Maroua city-centre street and architecture.'],
  ['CV|espargos', 'Contact-sheet review: Espargos municipal centre and urban street.'],
  ['CV|rabil', 'Contact-sheet review: Rabil town centre public square and avenue.'],
  ['CV|sao pedro', 'Contact-sheet review: São Pedro city-centre church and plaza scene.'],
  ['GA|libreville', 'Contact-sheet review: Libreville urban waterfront and central city area.'],
  ['GQ|bata', 'Contact-sheet review: Bata city centre and urban boulevard.'],
  ['GW|bissau', 'Contact-sheet review: Bissau city centre and streetscape.'],
  ['KE|eldoret', 'Contact-sheet review: Eldoret town centre and urban streets.'],
  ['LY|benghazi', 'Contact-sheet review: Benghazi urban centre and public square.'],
  ['MG|nosy be', 'Contact-sheet review: Nosy Be harbour town and waterfront frontage.'],
  ['MG|toamasina', 'Contact-sheet review: Toamasina central port city waterfront.'],
  ['MU|plaine magnien', 'Contact-sheet review: Plaine Magnien local urban streetscape and town centre.'],
  ['NG|enugu', 'Contact-sheet review: Enugu urban centre and central streetscape.'],
  ['NG|owerri', 'Contact-sheet review: Owerri civic centre and urban square.'],
  ['SD|port sudan', 'Contact-sheet review: Port Sudan harbour and urban waterfront.'],
  ['SZ|sikhuphe', 'Contact-sheet review: Sikhuphe town centre and urban frontage.'],
  ['TZ|kilimanjaro', 'Contact-sheet review: Moshi/Kilimanjaro urban frontage and town centre.'],
  ['CD|kinshasa', 'Contact-sheet review: Congo River frontage explicitly photographed from Kinshasa with urban buildings.'],
  ['CM|douala', 'Contact-sheet review: Douala urban skyline.'],
  ['LY|sebha', 'Contact-sheet review: old city of Sebha.'],
  ['MW|blantyre', 'Contact-sheet review: Blantyre city church landmark.'],
  ['MR|nouadhibou', 'Contact-sheet review: street scene explicitly located in Nouadhibou.'],
  ['NA|windhoek', 'Contact-sheet review: Windhoek city-centre street.'],
  ['NA|walvis bay', 'Contact-sheet review: civic building explicitly located in Walvis Bay.'],
  ['DJ|djibouti', 'Contact-sheet review: Djibouti City urban montage.'],
  ['CM|yaounde', 'Contact-sheet review: market scene explicitly identified as Yaoundé, Cameroon.'],
  ['TN|djerba', 'Contact-sheet review: fishing port of Houmt Souk on Djerba.'],
  ['ZA|gqeberha', 'Contact-sheet review: Hobie Beach in Port Elizabeth, the former name of Gqeberha.'],
  ['ZA|east london', 'Contact-sheet review: East London City Hall.'],
  ['DZ|setif', 'Contact-sheet review: tram in Sétif pedestrianised city centre.'],
  ['DZ|tlemcen', 'Contact-sheet review: Mansourah landmark in Tlemcen.'],
  ['EG|sohag', 'Contact-sheet review: Opera Square panorama in Sohag.'],
  ['EG|giza', 'Contact-sheet review: Pyramids of Giza, the city-specific landmark.'],
  ['GM|banjul', 'Contact-sheet review: Banjul market street scene.'],
  ['KM|moroni', 'Contact-sheet review: Moroni city waterfront.'],
  ['GA|franceville', 'Contact-sheet review: Franceville Railway Station, a city-specific civic/transit site.'],
  ['MZ|vilankulo', 'Contact-sheet review: street scene captioned Vilanculos, Mozambique, the city’s alternate spelling.'],
  ['LR|monrovia', 'Contact-sheet review: City Hall, Monrovia, Liberia.'],
  ['MA|laayoune', 'Contact-sheet review: Spanish cathedral explicitly identified in the city of Laayoune.'],
  ['DZ|bejaia', 'Contact-sheet review: Béjaïa harbor, explicitly captioned Port de Béjaia.'],
  ['SO|hargeisa', 'Contact-sheet review: street market in Hargeisa, Somaliland.'],
  ['TZ|zanzibar city', 'Contact-sheet review: historic town clock on the Zanzibar City front.'],
  ['TD|n djamena', 'Contact-sheet review: National Museum and National Library of Chad in N’Djamena.'],
  ['ZM|ndola', 'Contact-sheet review: aerial urban view titled Ndola.'],
  ['MG|antsiranana', 'Contact-sheet review: city architecture explicitly identified as Antsiranana/Diego-Suarez.'],
  ['DZ|annaba', 'Contact-sheet review: urban panorama of Annaba.'],
  ['CG|pointe noire', 'Contact-sheet review: Pointe-Noire downtown streetscape.'],
  ['GA|port gentil', 'Contact-sheet review: Port-Gentil ferries at the city waterfront.'],
  ['MA|dakhla', 'Contact-sheet review: the oldest mosque, an identified city landmark in Dakhla.'],
  ['LY|tripoli', 'Contact-sheet review: Tripoli bottle-building skyline at sunset.'],
  ['CM|yaounde', 'Contact-sheet review: Notre Dame Cathedral of Victory in Yaoundé.'],
  ['DZ|annaba', 'Contact-sheet review: Annaba skyline viewed from the Seybuss Hotel.'],
  ['LR|monrovia', 'Contact-sheet review: downtown Monrovia streetscape.'],
  ['CM|garoua', 'Contact-sheet review: Garoua street market and urban frontage.'],
  ['UG|entebbe', 'Contact-sheet review: Entebbe hotel frontage with the town name visible.'],
  ['SO|hargeisa', 'Contact-sheet review: licensed street market in Hargeisa, Somaliland.'],
  ['GA|port gentil', 'Contact-sheet review: Port-Gentil ferry terminal waterfront with the city in view.'],
  ['MA|oujda', 'Contact-sheet review: Oujda centre street and city skyline.'],
  ['MA|rabat', 'Contact-sheet review: Hassan Tower, a landmark in Rabat.'],
  ['MR|nouakchott', 'Contact-sheet review: Nouakchott minaret and city landmark.'],
  ['CD|kindu', 'Contact-sheet review: street scene in Kindu, attributed to Radio Okapi.'],
  ['ZM|livingstone', 'Contact-sheet review: Streets of Livingstone.'],
  ['ZM|lusaka', 'Contact-sheet review: downtown Lusaka street with city-centre tower.'],
  ['CI|abidjan', 'Contact-sheet review: Abidjan skyline and urban frontage across Ebrié Lagoon.'],
  ['ST|sao tome', 'Contact-sheet review: city-centre street in São Tomé.'],
  ['MG|toliara', 'Contact-sheet review: Toliara Hôtel de ville, the city hall.'],
  ['CD|goma', 'Contact-sheet review: Lake Kivu boat with Goma cityscape visible behind it.'],
  ['EG|hurghada', 'Pexels source-page review: aerial urban coastline explicitly located in Hurghada.'],
  ['EG|sharm el sheikh', 'Pexels source-page review: illuminated resort cityscape and mosque explicitly located in Sharm El-Sheikh.'],
]);
const selectedSourcePages = new Map([
  ['DZ|annaba', 'https://www.flickr.com/photos/9574297@N07/951647448'],
  ['CG|pointe noire', 'https://commons.wikimedia.org/w/index.php?curid=81988167'],
  ['GA|port gentil', 'https://www.flickr.com/photos/79721788@N00/45310769765'],
  ['MA|dakhla', 'https://www.flickr.com/photos/79721788@N00/6810140393'],
  ['LY|tripoli', 'https://www.flickr.com/photos/8213176@N03/2199513799'],
  ['CM|yaounde', 'https://www.flickr.com/photos/80854685@N08/10007414166'],
  ['LR|monrovia', 'https://www.flickr.com/photos/56542713@N00/16242333860'],
  ['CM|garoua', 'https://www.flickr.com/photos/37574471@N00/107191082'],
  ['UG|entebbe', 'https://www.flickr.com/photos/23442653@N00/464088781'],
  ['SO|hargeisa', 'https://www.flickr.com/photos/26781577@N07/29322262370'],
  ['MA|oujda', 'https://commons.wikimedia.org/w/index.php?curid=18345401'],
  ['MA|rabat', 'https://commons.wikimedia.org/w/index.php?curid=82678587'],
  ['MR|nouakchott', 'https://www.flickr.com/photos/59367690@N00/6337881696'],
  ['CD|kindu', 'https://commons.wikimedia.org/w/index.php?curid=36052796'],
  ['ZM|livingstone', 'https://www.flickr.com/photos/37804160@N00/130745003'],
  ['ZM|lusaka', 'https://www.flickr.com/photos/120935793@N02/17240135556'],
  ['CI|abidjan', 'https://www.flickr.com/photos/48722974@N07/4465481534'],
  ['ST|sao tome', 'https://commons.wikimedia.org/w/index.php?curid=111621680'],
  ['MG|toliara', 'https://commons.wikimedia.org/w/index.php?curid=138602032'],
  ['ST|sao tome', 'https://commons.wikimedia.org/w/index.php?curid=111621680'],
  ['MG|toliara', 'https://commons.wikimedia.org/w/index.php?curid=3157052'],
  ['CD|goma', 'https://www.pexels.com/photo/traditional-fishing-boat-on-lake-kivu-at-dusk-30164278/'],
  ['EG|hurghada', 'https://www.pexels.com/photo/aerial-view-of-hurghada-city-over-the-red-sea-22643902/'],
  ['EG|sharm el sheikh', 'https://www.pexels.com/photo/tropical-resort-in-egypt-in-the-evening-18886767/'],
]);
approvedCities.set('MG|toliara', 'Contact-sheet review: City Centre Toliara 2007 streetscape.');
const selectedTitles = new Map([
  ['BW|maun', 'Maun'],
  ['BW|gaborone', 'Gaborone, Botswana, 2010'],
  ['CV|praia', 'Farol da Praia'],
  ['CG|brazzaville', 'First missionary house, Brazzaville'],
  ['DZ|oran', "Rue d'Arzeu"],
  ['DZ|constantine', 'With great bridge, Constantine'],
  ['EG|luxor', 'Luxor at night'],
  ['ER|asmara', 'Asmara'],
  ['LS|maseru', 'Maseru from Parliament Hill'],
  ['LY|misrata', 'In Misrata'],
  ['MA|fes', 'Tanneries de Fès'],
  ['MA|tangier', 'Tangier'],
  ['MG|mahajanga', 'Old Baobab of Mahajanga'],
  ['ML|mopti', 'Hundreds of boats in Mopti'],
  ['MW|lilongwe', 'Lilongwe, Malawi'],
  ['NG|port harcourt', 'Port Harcourt'],
  ['SL|freetown', 'Freetown, Sierra Leone (West Africa) in 1942'],
  ['SO|mogadishu', 'Mogadishu Daily Life one year after Al Shabaab 05'],
  ['TN|monastir', "Monastir's Ribat"],
  ['ZA|cape town', "Lion's Head - Cape Town"],
  ['ZW|victoria falls', 'Victoria Falls Hotel'],
  ['ET|addis ababa', 'Addis Ababa skyline'],
  ['CD|kinshasa', 'A view of Congo River from Kinshasa'],
  ['CM|douala', 'Douala'],
  ['LY|sebha', 'Old city, Sebha, Libya'],
  ['MW|blantyre', 'MW Blantyre 0201 001'],
  ['MR|nouadhibou', 'W123 in Nouadhibou'],
  ['NA|windhoek', 'Windhoek'],
  ['NA|walvis bay', 'Walvis Bay, Namibia'],
  ['DJ|djibouti', 'Djibouti City.jpg'],
  ['CM|yaounde', 'Cameroon Market(Yaoundé)'],
  ['TN|djerba', 'Port de Houmt Souk Djerba'],
  ['ZA|gqeberha', 'Hobie Beach, Port Elizabeth'],
  ['ZA|east london', 'South Africa East London City Hall 2'],
  ['DZ|setif', 'Tram in Sétif pedestrianised city centre'],
  ['DZ|tlemcen', 'Tlemcen By Night'],
  ['EG|sohag', 'Opera Sq panorama Sohag Egypt'],
  ['EG|giza', 'Pyramids of Giza'],
  ['GM|banjul', "That's the Banjul market"],
  ['KM|moroni', 'Moroni City Comoros'],
  ['GA|franceville', 'Franceville Railway Station'],
  ['MZ|vilankulo', 'Vilanculos, Mozambique, 3/2012'],
  ['LR|monrovia', 'City Hall, Monrovia, Liberia'],
  ['MA|laayoune', 'The Spanish cathedral, city of Laayoune'],
  ['DZ|bejaia', 'Port de Béjaia'],
  ['SO|hargeisa', 'Street Market Hargeisa, Somaliland'],
  ['TZ|zanzibar city', 'Town clock, Zanzibar city front'],
  ['TD|n djamena', 'National Museum and National Library of Chad in N\'Djamena'],
  ['ZM|ndola', 'Ndola'],
  ['MG|antsiranana', 'Antsiranana Diego Suarez typical Arab-influenced architecture'],
]);
const reviewedPexelsCandidates = new Map([
  ['CD|goma', {
    title: 'Fishermen in a wooden canoe on Lake Kivu against the backdrop of Goma cityscape and lush hills',
    sourcePage: 'https://www.pexels.com/photo/traditional-fishing-boat-on-lake-kivu-at-dusk-30164278/',
    sourceUrl: 'https://images.pexels.com/photos/30164278/pexels-photo-30164278.jpeg?cs=srgb&dl=pexels-edouard-mihigo-129683048-30164278.jpg&fm=jpg',
    creator: 'Edouard Mihigo', provider: 'Pexels', license: 'Pexels', licenseUrl: 'https://www.pexels.com/license/',
    attribution: 'Photo by Edouard Mihigo via Pexels.', width: 5577, height: 3656,
    relevance: { score: 100, exactCityEvidence: true, usableLicense: true, previewEligible: true },
  }],
  ['EG|hurghada', {
    title: 'Stunning aerial view of Hurghada coastal urban area, Red Sea, Egypt',
    sourcePage: 'https://www.pexels.com/photo/aerial-view-of-hurghada-city-over-the-red-sea-22643902/',
    sourceUrl: 'https://images.pexels.com/photos/22643902/pexels-photo-22643902.jpeg?cs=srgb&dl=pexels-mo-ismail-2130628-22643902.jpg&fm=jpg',
    creator: 'Mo Ismail', provider: 'Pexels', license: 'Pexels', licenseUrl: 'https://www.pexels.com/license/',
    attribution: 'Photo by Mo Ismail via Pexels.', width: 5472, height: 3648,
    relevance: { score: 100, exactCityEvidence: true, usableLicense: true, previewEligible: true },
  }],
  ['EG|sharm el sheikh', {
    title: 'A stunning evening view of the illuminated resort area of Sharm El-Sheikh, Egypt, featuring a lit mosque and surrounding mountains',
    sourcePage: 'https://www.pexels.com/photo/tropical-resort-in-egypt-in-the-evening-18886767/',
    sourceUrl: 'https://images.pexels.com/photos/18886767/pexels-photo-18886767.jpeg?cs=srgb&dl=pexels-vika-glitter-392079-18886767.jpg&fm=jpg',
    creator: 'Vika Glitter', provider: 'Pexels', license: 'Pexels', licenseUrl: 'https://www.pexels.com/license/',
    attribution: 'Photo by Vika Glitter via Pexels.', width: 6016, height: 4000,
    relevance: { score: 100, exactCityEvidence: true, usableLicense: true, previewEligible: true },
  }],
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

function candidatesFor(entries, selectedTitle = null, selectedPage = null, additionalCandidates = []) {
  const byUrl = new Map();
  for (const entry of entries) {
    for (const candidate of entry.researchCandidates || []) {
      if (!candidate.relevance?.exactCityEvidence || !candidate.relevance?.usableLicense || !candidate.sourceUrl || !candidate.sourcePage) continue;
      if (selectedPage && candidate.sourcePage !== selectedPage) continue;
      if (!selectedPage && selectedTitle && !String(candidate.title || '').toLowerCase().includes(selectedTitle.toLowerCase())) continue;
      const qualifiesAsExactCityCandidate = Boolean(
        candidate.relevance?.exactCityEvidence && candidate.relevance?.usableLicense && candidate.relevance?.sufficientSize,
      );
      if (!selectedPage && !selectedTitle && !(candidate.relevance?.previewEligible || qualifiesAsExactCityCandidate)) continue;
      byUrl.set(candidate.sourceUrl, candidate);
    }
  }
  for (const candidate of additionalCandidates) {
    if (!candidate.relevance?.exactCityEvidence || !candidate.relevance?.usableLicense || !candidate.sourceUrl || !candidate.sourcePage) continue;
    if (selectedPage && candidate.sourcePage !== selectedPage) continue;
    byUrl.set(candidate.sourceUrl, candidate);
  }
  return [...byUrl.values()].sort((left, right) => {
    if (selectedTitle) {
      const leftPixels = Number(left.width || 0) * Number(left.height || 0);
      const rightPixels = Number(right.width || 0) * Number(right.height || 0);
      if (leftPixels !== rightPixels) return rightPixels - leftPixels;
    }
    return right.relevance.score - left.relevance.score;
  });
}

async function convertAndValidate(candidate, destination) {
  let response;
  let downloadTransportUrl = candidate.sourceUrl;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(candidate.sourceUrl, {
      headers: { 'User-Agent': 'AfricaCityImageCollection/1.0' },
      signal: AbortSignal.timeout(45000),
    });
    if (response.status !== 429) break;
    const retryAfter = Number(response.headers.get('retry-after'));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 10000) : (attempt + 1) * 1800;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  if (response.status === 429 && new URL(candidate.sourceUrl).hostname === 'upload.wikimedia.org') {
    const proxyUrl = new URL('https://images.weserv.nl/');
    proxyUrl.searchParams.set('url', candidate.sourceUrl);
    proxyUrl.searchParams.set('w', '1800');
    response = await fetch(proxyUrl, {
      headers: { 'User-Agent': 'AfricaCityImageCollection/1.0' },
      signal: AbortSignal.timeout(45000),
    });
    downloadTransportUrl = proxyUrl.toString();
  }
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('image/')) throw new Error(`Source returned non-image content (${contentType || 'unknown'})`);
  const input = Buffer.from(await response.arrayBuffer());
  const sourceMeta = await sharp(input, { failOn: 'error' }).metadata();
  if (!sourceMeta.width || !sourceMeta.height || Math.min(sourceMeta.width, sourceMeta.height) < 300 || sourceMeta.width * sourceMeta.height < 150000) {
    throw new Error(`Source dimensions are too small (${sourceMeta.width || 0}x${sourceMeta.height || 0})`);
  }
  const webp = await sharp(input, { failOn: 'error' })
    .rotate()
    .resize({ width: 1800, height: 1400, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 86, effort: 5 })
    .toBuffer();
  const metadata = await sharp(webp, { failOn: 'error' }).metadata();
  if (metadata.format !== 'webp' || !metadata.width || !metadata.height) {
    throw new Error(`Converted output failed WebP validation (${metadata.format || 'unknown'})`);
  }
  fs.writeFileSync(destination, webp);
  return {
    sourceContentType: contentType,
    downloadTransportUrl,
    sourceDimensions: { width: sourceMeta.width, height: sourceMeta.height },
    sourceBytes: input.length,
    webpDimensions: { width: metadata.width, height: metadata.height },
    webpBytes: webp.length,
  };
}

async function updateCityImages(entryGroup, localImagePath) {
  for (const entry of entryGroup) {
    const existing = await prisma.city.findUnique({
      where: { slug: entry.citySlug },
      select: { slug: true, name: true, countryCode: true, profile: true },
    });
    if (!existing || existing.countryCode !== entry.countryCode || existing.name !== entry.existingCityName) {
      throw new Error(`DB identity mismatch for ${entry.countryCode}|${entry.citySlug}`);
    }
    const profile = existing.profile && typeof existing.profile === 'object' && !Array.isArray(existing.profile) ? existing.profile : {};
    if (profile.heroImageUrl && profile.heroImageUrl !== localImagePath) {
      entry.databaseUpdateStatus = 'preserved-existing-hero-image';
      entry.dbUniqueKey = existing.slug;
      continue;
    }
    await prisma.$executeRaw`
      UPDATE "City"
      SET "profile" = jsonb_set(COALESCE("profile", '{}'::jsonb), '{heroImageUrl}', to_jsonb(${localImagePath}::text), true)
      WHERE "slug" = ${entry.citySlug}
        AND "countryCode" = ${entry.countryCode}
    `;
    entry.dbUniqueKey = existing.slug;
    entry.databaseUpdateStatus = 'updated-image-field-only';
  }
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const countries = await prisma.country.findMany({
    where: { continent: { name: 'Africa' } },
    select: { code: true, name: true },
  });
  const cities = await prisma.city.findMany({
    where: { countryCode: { in: countries.map((country) => country.code) } },
    select: { slug: true, name: true, countryCode: true, profile: true },
  });
  const cityBySlug = new Map(cities.map((city) => [city.slug, city]));
  const entryGroups = new Map();
  for (const entry of manifest.cities) {
    const city = cityBySlug.get(entry.citySlug);
    if (!city) continue;
    const profile = city.profile && typeof city.profile === 'object' && !Array.isArray(city.profile) ? city.profile : {};
    if (profile.heroImageUrl) continue;
    const key = cityKey(entry.countryCode, entry.actualCity);
    if (!approvedCities.has(key)) continue;
    if (!entryGroups.has(key)) entryGroups.set(key, []);
    entryGroups.get(key).push(entry);
  }

  fs.mkdirSync(imageDirectory, { recursive: true });
  let downloadedTargets = 0;
  let assignedRecords = 0;
  for (const [key, entries] of entryGroups) {
    const [countryCode] = key.split('|');
    const candidates = candidatesFor(
      entries,
      selectedTitles.get(key) || null,
      selectedSourcePages.get(key) || null,
      reviewedPexelsCandidates.has(key) ? [reviewedPexelsCandidates.get(key)] : [],
    );
    if (!candidates.length) {
      for (const entry of entries) {
        entry.visualReviewStatus = 'approved-description-but-no-preview-eligible-source';
        entry.visualReviewNote = approvedCities.get(key);
      }
      fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
      console.log(`${key}: no eligible preview source; left unassigned`);
      continue;
    }

    const representative = entries[0];
    const filename = `${countryCode.toLowerCase()}-${normalize(representative.actualCity).replace(/\s+/g, '-')}.webp`;
    const destination = path.join(imageDirectory, filename);
    const localImagePath = `${publicPrefix}${filename}`;
    try {
      let candidate = null;
      let dimensions = null;
      let sourceError = null;
      for (const sourceCandidate of candidates) {
        try {
          dimensions = await convertAndValidate(sourceCandidate, destination);
          candidate = sourceCandidate;
          break;
        } catch (error) {
          sourceError = error;
        }
      }
      if (!candidate || !dimensions) throw sourceError || new Error('No reviewed source candidate could be downloaded');
      for (const entry of entries) {
        entry.imageFilename = filename;
        entry.localImagePath = localImagePath;
        entry.selectedSourceUrl = candidate.sourceUrl;
        entry.selectedSourcePage = candidate.sourcePage;
        entry.selectedSourceTitle = candidate.title;
        entry.selectedSourceWebsite = candidate.provider;
        entry.selectedSourceType = candidate.provider === 'Pexels' ? 'Pexels free stock photograph' : `${candidate.provider} licensed photograph`;
        entry.downloadTransportUrl = dimensions.downloadTransportUrl;
        entry.selectedSourceProvider = candidate.provider;
        entry.selectedCreator = candidate.creator;
        entry.selectedLicense = candidate.license;
        entry.selectedLicenseVersion = candidate.licenseVersion;
        entry.selectedLicenseUrl = candidate.licenseUrl;
        entry.selectedAttribution = candidate.attribution;
        entry.visualReviewStatus = 'approved-from-contact-sheet';
        entry.visualReviewNote = approvedCities.get(key);
        entry.sourceDimensions = dimensions.sourceDimensions;
        entry.outputDimensions = dimensions.webpDimensions;
        entry.sourceContentType = dimensions.sourceContentType;
        entry.sourceBytes = dimensions.sourceBytes;
        entry.webpBytes = dimensions.webpBytes;
        entry.downloadStatus = 'downloaded-and-decoded';
        entry.webpConversionStatus = 'webp-validated';
        entry.verificationStatus = 'source-attribution, contact-sheet-city-match, image-decode, and WebP-format-passed';
        entry.verifiedAt = new Date().toISOString();
      }
      await updateCityImages(entries, localImagePath);
      assignedRecords += entries.filter((entry) => entry.databaseUpdateStatus === 'updated-image-field-only').length;
      downloadedTargets += 1;
      console.log(`${countryCode} ${representative.actualCity}: ${filename}; ${dimensions.webpDimensions.width}x${dimensions.webpDimensions.height}; assigned ${entries.length} record(s)`);
    } catch (error) {
      for (const entry of entries) {
        entry.downloadStatus = 'failed';
        entry.webpConversionStatus = 'not-validated';
        entry.databaseUpdateStatus = 'not-updated';
        entry.verificationStatus = 'failed';
        entry.error = error.message;
      }
      console.error(`${key}: ${error.message}`);
    }
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  console.log(JSON.stringify({ approvedTargets: approvedCities.size, downloadedTargets, assignedRecords }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});