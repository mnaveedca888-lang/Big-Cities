const categories = ['Conferences','Concerts','Sports Events','Tourism & Travel','Tech Events'];
const MAX_SEARCH_RESULTS = 20;
const YDC_MCP_URL = 'https://api.you.com/mcp?profile=free';
const pakistanDiscoveryCities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot', 'Hyderabad', 'Bahawalpur', 'Abbottabad', 'Murree'];
const categoryQueryTerms = {
  'Sports Events': 'sports events cricket matches football tournaments golf tournament golf championship golf cup amateur golf professional golf ladies golf junior golf senior golf inter-club golf corporate golf invitational golf qualifying golf Pakistan Golf Federation golf club tournament',
  Concerts: 'concerts live music music festivals singers bands',
  'Theatre Shows': 'theatre shows theater performances plays musicals',
  'Art Exhibitions': 'art exhibitions gallery exhibitions painting sculpture',
  'Educational Seminars': 'seminars workshops lectures educational conferences symposiums',
  'Film Festivals': 'film festivals movie screenings cinema events',
  'Food Festivals': 'food festivals culinary festivals food expos cooking events',
  'Fashion Shows': 'fashion shows runway designer events couture',
  'Tech Events': 'technology events tech conferences startup events hackathons software conferences',
  'Dignitary Visits': 'official visits minister visits president visits dignitary events',
  'Government Events': 'government events public hearings ministry events policy conferences',
  'Tourism & Travel': 'Pakistan tourism events tourism festival Pakistan travel expo Pakistan tourism conference Pakistan tourism forum Pakistan tourism investment conference Pakistan destination event Pakistan cultural tourism festival Pakistan adventure tourism event Pakistan',
  Conferences: 'conference Pakistan international conference Pakistan business conference Pakistan technology conference Pakistan AI conference Pakistan medical conference Pakistan academic conference Pakistan research conference Pakistan trade conference Pakistan investment conference Pakistan tourism conference Pakistan industry conference Pakistan',
};
const secondarySourceHosts = new Set(['eventbrite.com','www.eventbrite.com','ticketwala.pk','allevents.in','district.in','allconferencealert.com','conferenceineurope.org','ticmint.com','events.sulekha.com','eventsinlahore.com']);

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function normalize(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function asObject(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : null; }
function canonicalUrl(value) { try { const url = new URL(value); if (url.protocol !== 'https:') return null; url.hash = ''; return url.toString(); } catch { return null; } }
function monthNumber(value) { return ['january','february','march','april','may','june','july','august','september','october','november','december'].indexOf(value.toLowerCase()); }
function dateValue(value, endOfDay = false) { const raw = text(value); if (!raw) return null; const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw); const date = new Date(dateOnly ? `${raw}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z` : raw); return Number.isNaN(date.getTime()) ? null : date; }
function sourceVerification(url) {
  const hostname = new URL(url).hostname.toLowerCase();
  const isSecondary = [...secondarySourceHosts].some((host) => hostname === host || hostname.endsWith(`.${host}`));
  if (isSecondary) return { sourceType: 'secondary', score: 0.45, reason: 'Secondary listing or ticketing source; not sufficient for VERIFIED status.' };
  if (hostname.endsWith('.gov.pk')) return { sourceType: 'official-government', score: 0.98, reason: 'Official Pakistan government domain.' };
  if (hostname.endsWith('.edu.pk')) return { sourceType: 'official-university', score: 0.95, reason: 'Official Pakistan educational institution domain.' };
  if (hostname.endsWith('.org.pk')) return { sourceType: 'official-organization', score: 0.9, reason: 'Pakistan organization domain with event-page evidence.' };
  return { sourceType: 'organizer-or-venue', score: 0.8, reason: 'Specific event page with structured or visible event evidence from a non-directory source.' };
}
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#038;|&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function eventObjects(value) {
  const object = asObject(value); if (!object) return [];
  if (Array.isArray(object.itemListElement)) return object.itemListElement.flatMap((item) => eventObjects(asObject(item)?.item));
  return object['@type'] === 'Event' || (Array.isArray(object['@type']) && object['@type'].includes('Event')) ? [object] : [];
}
function extractJsonLd(html) {
  const values = []; const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) { try { values.push(JSON.parse(match[1])); } catch {} }
  return values.flatMap(eventObjects);
}
function hasCountryEvidence(html, content, country) {
  const countryName = new RegExp(`\\b${country.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  const dateIndex = content.search(/(?:from\s+\w+,\s+)?[A-Za-z]+\s+\d{1,2}(?:\s+to\s+\w+,\s+[A-Za-z]+\s+\d{1,2})?,\s+\d{4}/i);
  const eventContext = dateIndex >= 0 ? content.slice(Math.max(0, dateIndex - 80), dateIndex + 160) : '';
  if (countryName.test(eventContext)) return true;
  const metadata = [...html.matchAll(/<meta\b[^>]*(?:name|property)=["'][^"']*(?:country|location)[^"']*["'][^>]*content=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
  return metadata.some((value) => countryName.test(value) || new RegExp(`\\b${country.code}\\b`, 'i').test(value));
}
function buildDiscoveryQuery(country, category, cityNames, now = new Date()) {
  const months = Array.from({ length: 4 }, (_, index) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + index, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }));
  const cities = [...new Set([...cityNames, ...pakistanDiscoveryCities])].slice(0, 20).join(' ');
  const golfVenueTargets = category === 'Sports Events' ? ['Defence Raya Golf & Country Club','Royal Palm Golf & Country Club','Lahore Garrison Golf & Country Club','Lahore Gymkhana Golf Club','PAF Skyview Golf & Country Club','Karachi Golf Club','Defence Authority Country & Golf Club','Airmen Golf Club & Recreational Park','Arabian Sea Country Club','Rawalpindi Golf Club','Islamabad Golf Club','Margalla Greens Golf Club','Chinar Golf Club','Rumanza Golf & Country Club'].join(' ') : '';
  return `upcoming "${country.name}" "${category}" ${categoryQueryTerms[category]} ${months.join(' ')} ${now.getUTCFullYear()} ${cities} ${golfVenueTargets} official event page organizer venue registration tickets -wikipedia -directory -generic -travel`;
}
function extractPrimarySourceUrl(html, discoveryUrl) {
  const discoveryHost = new URL(discoveryUrl).hostname.toLowerCase();
  for (const event of extractJsonLd(html)) {
    const organizer = asObject(event.organizer);
    const candidates = [text(organizer?.url), text(asObject(organizer?.sameAs)?.url), text(event.url)];
    for (const candidate of candidates) {
      const url = canonicalUrl(candidate);
      if (!url) continue;
      const host = new URL(url).hostname.toLowerCase();
      if (host !== discoveryHost && sourceVerification(url).sourceType !== 'secondary') return url;
    }
  }
  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)?.[1];
  const canonicalUrlValue = canonicalUrl(canonical || '');
  if (canonicalUrlValue && new URL(canonicalUrlValue).hostname.toLowerCase() !== discoveryHost && sourceVerification(canonicalUrlValue).sourceType !== 'secondary') return canonicalUrlValue;
  return null;
}
function categoryRules() {
  return [
    { category: 'Sports Events', keywords: ['sport', 'cricket', 'football', 'soccer', 'hockey', 'tennis', 'badminton', 'basketball', 'volleyball', 'golf', 'athletics', 'running', 'cycling', 'boxing', 'martial arts', 'motorsport', 'swimming', 'aquatics', 'squash', 'table tennis', 'snooker', 'billiards', 'esports', 'match', 'race', 'cup', 'championship', 'tournament'] },
    { category: 'Conferences', keywords: ['technology conference', 'business conference', 'finance conference', 'banking conference', 'healthcare conference', 'medical conference', 'education conference', 'science conference', 'research conference', 'engineering conference', 'ai conference', 'data conference', 'agriculture conference', 'energy conference', 'trade conference', 'investment conference', 'tourism conference', 'government conference', 'policy conference', 'international conference', 'academic conference', 'industry conference', 'conference', 'summit'] },
    { category: 'Tourism & Travel', keywords: ['tourism festival', 'travel expo', 'travel show', 'tourism conference', 'tourism forum', 'tourism investment conference', 'destination promotion', 'cultural tourism', 'adventure tourism', 'mountain trekking', 'heritage tourism', 'tourism workshop', 'tourism roadshow', 'tourism event', 'travel fair', 'tourism networking event'] },
    { category: 'Concerts', keywords: ['concert', 'music', 'singer', 'band', 'orchestra', 'live music'] },
    { category: 'Theatre Shows', keywords: ['theatre', 'theater', 'drama', 'stage play', 'musical play'] },
    { category: 'Art Exhibitions', keywords: ['art exhibition', 'art show', 'gallery', 'painting', 'sculpture'] },
    { category: 'Tech Events', keywords: ['technology', 'tech ', 'agritech', 'agriculture technology', 'startup', 'hackathon', 'software', 'artificial intelligence', ' ai ', 'developer'] },
    { category: 'Educational Seminars', keywords: ['seminar', 'summit', 'workshop', 'education', 'educational event', 'educational fair', 'training', 'symposium', 'lecture', 'talk', 'panel discussion', 'book launch', 'university event', 'information session', 'phd defence', 'webinar', 'global fair'] },
    { category: 'Film Festivals', keywords: ['film festival', 'movie festival', 'cinema', 'screening', 'film'] },
    { category: 'Food Festivals', keywords: ['food festival', 'food expo', 'culinary', 'taste', 'cooking'] },
    { category: 'Fashion Shows', keywords: ['fashion', 'runway', 'designer', 'couture'] },
    { category: 'Dignitary Visits', keywords: ['president', 'prime minister', 'minister', 'ambassador', 'dignitary', 'official visit'] },
    { category: 'Government Events', keywords: ['government', 'ministry', 'parliament', 'policy', 'public hearing', 'assembly'] },
  ];
}
function mapCategory(title, description) {
  const textValue = ` ${title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} ${description ? description.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() : ''} `;
  const match = categoryRules().find((rule) => rule.keywords.some((keyword) => textValue.includes(` ${keyword.toLowerCase()} `)));
  return match?.category ?? null;
}
function extractVisibleContentEvent(html, result, cities, country) {
  const content = visibleText(html);
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, ' ');
  const documentTitle = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, ' ');
  const title = text(heading || documentTitle || result.title).trim();
  const hasEventTitle = /\b(event|concert|festival|conference|summit|expo|exhibition|workshop|match|series|cup)\b/i.test(title);
  if (!title || !hasEventTitle) return null;
  const city = cities.find((item) => new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(`${title} ${content}`));
  if (!city) return null;
  if (!hasCountryEvidence(html, content, country)) return null;
  const dateMatch = content.match(/from\s+\w+,\s+([A-Za-z]+)\s+(\d{1,2})\s+to\s+\w+,\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/i) || content.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/i);
  if (!dateMatch) return null;
  let startMonth = monthNumber(dateMatch[1]);
  let startDay = Number(dateMatch[2]);
  let year = Number(dateMatch[5] || dateMatch[3]);
  let endMonth = dateMatch[3] ? monthNumber(dateMatch[3]) : startMonth;
  let endDay = Number(dateMatch[4] || dateMatch[2]);
  if (startMonth < 0 || endMonth < 0 || !year) return null;
  const startAt = new Date(Date.UTC(year, startMonth, startDay));
  const endAt = new Date(Date.UTC(year, endMonth, endDay, 23, 59, 59, 999));
  const category = mapCategory(title, content.slice(0, 2000));
  if (!category || endAt < new Date() || endAt < startAt) return null;
  return { title, description: content.slice(0, 1000), startAt, endAt, dateOnly: true, city, venue: null, category, image: null };
}
async function youSearch(query) {
  const requestBody = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'global-event-monitor', version: '1.0.0' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'you-search', arguments: { query, count: MAX_SEARCH_RESULTS, freshness: 'month', extraction: 'highlights' } } },
  ];
  const response = await fetch(YDC_MCP_URL, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify(requestBody[0]) });
  if (!response.ok) throw new Error(`init: ${response.status}`);
  await fetch(YDC_MCP_URL, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify(requestBody[1]) });
  const searchResponse = await fetch(YDC_MCP_URL, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify(requestBody[2]) });
  const textData = await searchResponse.text();
  const lines = textData.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    try {
      const payload = JSON.parse(trimmed.slice(5).trim());
      const content = Array.isArray(payload?.result?.content) ? payload.result.content : [];
      const item = content.find((entry) => entry?.type === 'text' && typeof entry.text === 'string');
      if (item) {
        const parsed = JSON.parse(item.text);
        if (parsed?.results?.web) return parsed.results.web;
      }
    } catch {}
  }
  return [];
}
function cityList() { return [
  { slug: 'pk-lahore', name: 'Lahore' }, { slug: 'pk-karachi', name: 'Karachi' }, { slug: 'pk-islamabad', name: 'Islamabad' }, { slug: 'pk-rawalpindi', name: 'Rawalpindi' }, { slug: 'pk-faisalabad', name: 'Faisalabad' }, { slug: 'pk-multan', name: 'Multan' }, { slug: 'pk-peshawar', name: 'Peshawar' }, { slug: 'pk-quetta', name: 'Quetta' }, { slug: 'pk-gujranwala', name: 'Gujranwala' }, { slug: 'pk-sialkot', name: 'Sialkot' }, { slug: 'pk-hyderabad', name: 'Hyderabad' }, { slug: 'pk-bahawalpur', name: 'Bahawalpur' }, { slug: 'pk-abbottabad', name: 'Abbottabad' }, { slug: 'pk-murree', name: 'Murree' }];
}
function auditPage(category, html, result, citySet) {
  const pageTitle = text(result.title || (/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1] || /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1])?.replace(/<[^>]+>/g, ' '));
  const reasonCounts = {
    titleEventKeywordFailed: 0,
    pakistanValidationFailed: 0,
    cityValidationFailed: 0,
    dateParsingFailed: 0,
    outsideFiveDayWindow: 0,
    categoryMappingFailed: 0,
    duplicate: 0,
    saved: 0,
  };
  let failedReason = null;
  const hasEventTitle = /\b(event|concert|festival|conference|summit|expo|exhibition|workshop|match|series|cup)\b/i.test(pageTitle);
  if (!pageTitle || !hasEventTitle) { failedReason = 'titleEventKeywordFailed'; reasonCounts.titleEventKeywordFailed++; return { ...reasonCounts, failedReason, title: pageTitle || '(no title)', url: text(result.url) } }
  const city = citySet.find((item) => new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(`${pageTitle} ${visibleText(html)}`));
  if (!city) { failedReason = 'cityValidationFailed'; reasonCounts.cityValidationFailed++; return { ...reasonCounts, failedReason, title: pageTitle, url: text(result.url) } }
  const content = visibleText(html);
  if (!hasCountryEvidence(html, content, { code: 'PK', name: 'Pakistan' })) { failedReason = 'pakistanValidationFailed'; reasonCounts.pakistanValidationFailed++; return { ...reasonCounts, failedReason, title: pageTitle, url: text(result.url) } }
  const dateMatch = content.match(/from\s+\w+,\s+([A-Za-z]+)\s+(\d{1,2})\s+to\s+\w+,\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/i) || content.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/i);
  if (!dateMatch) { failedReason = 'dateParsingFailed'; reasonCounts.dateParsingFailed++; return { ...reasonCounts, failedReason, title: pageTitle, url: text(result.url) } }
  const startMonth = monthNumber(dateMatch[1]);
  const startDay = Number(dateMatch[2]);
  const year = Number(dateMatch[5] || dateMatch[3]);
  const endMonth = dateMatch[3] ? monthNumber(dateMatch[3]) : startMonth;
  const endDay = Number(dateMatch[4] || dateMatch[2]);
  if (startMonth < 0 || endMonth < 0 || !year) { failedReason = 'dateParsingFailed'; reasonCounts.dateParsingFailed++; return { ...reasonCounts, failedReason, title: pageTitle, url: text(result.url) } }
  const startAt = new Date(Date.UTC(year, startMonth, startDay));
  const endAt = new Date(Date.UTC(year, endMonth, endDay, 23, 59, 59, 999));
  if (endAt < new Date() || endAt < startAt) { failedReason = 'outsideFiveDayWindow'; reasonCounts.outsideFiveDayWindow++; return { ...reasonCounts, failedReason, title: pageTitle, url: text(result.url) } }
  const cat = mapCategory(pageTitle, content.slice(0, 2000));
  if (!cat) { failedReason = 'categoryMappingFailed'; reasonCounts.categoryMappingFailed++; return { ...reasonCounts, failedReason, title: pageTitle, url: text(result.url) } }
  return { ...reasonCounts, failedReason: 'saved', title: pageTitle, url: text(result.url), saved: 1 };
}
for (const category of categories) {
  const citySet = cityList();
  const query = buildDiscoveryQuery({ name: 'Pakistan' }, category, citySet.map(c => c.name), new Date());
  const results = await youSearch(query);
  const counters = { youSearchResults: results.length, candidatePagesInspected: 0, titleEventKeywordFailed: 0, pakistanValidationFailed: 0, cityValidationFailed: 0, dateParsingFailed: 0, outsideFiveDayWindow: 0, categoryMappingFailed: 0, duplicate: 0, saved: 0 };
  const examples = { titleEventKeywordFailed: [], pakistanValidationFailed: [], cityValidationFailed: [], dateParsingFailed: [], outsideFiveDayWindow: [], categoryMappingFailed: [], duplicate: [] };
  const seenHashes = new Set();
  let inspected = 0;
  for (const result of results.slice(0, MAX_SEARCH_RESULTS)) {
    const url = canonicalUrl(text(result.url));
    if (!url) continue;
    inspected += 1;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0' } });
    if (!response.ok) continue;
    let html = await response.text();
    const pageTitle = text(result.title || /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1])?.replace(/<[^>]+>/g, ' ');
    const audit = auditPage(category, html, result, citySet);
    const reason = audit.failedReason;
    if (reason === 'saved') {
      const hash = `${normalize(audit.title)}|${category}|${normalize(new URL(url).hostname)}`;
      if (seenHashes.has(hash)) {
        counters.duplicate++;
        examples.duplicate.push({ title: audit.title, url, reason: 'duplicate source/hash', note: 'same normalized title+category+domain appears again in the same result batch' });
        continue;
      }
      seenHashes.add(hash);
      counters.saved++;
      continue;
    }
    if (reason) counters[reason === 'titleEventKeywordFailed' ? 'titleEventKeywordFailed' : reason === 'pakistanValidationFailed' ? 'pakistanValidationFailed' : reason === 'cityValidationFailed' ? 'cityValidationFailed' : reason === 'dateParsingFailed' ? 'dateParsingFailed' : reason === 'outsideFiveDayWindow' ? 'outsideFiveDayWindow' : 'categoryMappingFailed']++;
    if (reason && examples[reason]?.length < 3) {
      examples[reason].push({ title: audit.title || '(no title)', url, note: 'real example captured from live search output' });
    }
  }
  counters.candidatePagesInspected = inspected;
  console.log('\nCATEGORY=' + category);
  console.log(JSON.stringify(counters, null, 2));
  for (const [reason, items] of Object.entries(examples)) {
    if (items.length) {
      console.log('EXAMPLES:' + reason);
      for (const item of items) console.log(JSON.stringify(item));
    }
  }
}
