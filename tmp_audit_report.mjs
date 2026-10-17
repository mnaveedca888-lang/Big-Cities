import { buildDiscoveryQuery } from './backend/src/events/discovery.service.ts';
import { mapCategory } from './backend/src/events/ingestion/categories.ts';

const categories = ['Conferences', 'Concerts', 'Sports Events', 'Tourism & Travel', 'Tech Events'];
const country = { code: 'PK', name: 'Pakistan' };
const cities = [
  { slug: 'pk-lahore', name: 'Lahore' }, { slug: 'pk-karachi', name: 'Karachi' },
  { slug: 'pk-islamabad', name: 'Islamabad' }, { slug: 'pk-rawalpindi', name: 'Rawalpindi' },
  { slug: 'pk-faisalabad', name: 'Faisalabad' }, { slug: 'pk-multan', name: 'Multan' },
  { slug: 'pk-peshawar', name: 'Peshawar' }, { slug: 'pk-quetta', name: 'Quetta' },
  { slug: 'pk-gujranwala', name: 'Gujranwala' }, { slug: 'pk-sialkot', name: 'Sialkot' },
  { slug: 'pk-hyderabad', name: 'Hyderabad' }, { slug: 'pk-bahawalpur', name: 'Bahawalpur' },
  { slug: 'pk-abbottabad', name: 'Abbottabad' }, { slug: 'pk-murree', name: 'Murree' }
];
const MAX_RESULTS = 20;
const cityNames = cities.map((city) => city.name);
const reasons = [
  'titleEventKeywordFailed',
  'pakistanValidationFailed',
  'cityValidationFailed',
  'dateParsingFailed',
  'outsideFiveDayWindow',
  'categoryMappingFailed',
  'duplicate',
  'saved'
];

const monthNumber = (value) => ['january','february','march','april','may','june','july','august','september','october','november','december'].indexOf(String(value).toLowerCase());
const text = (value) => typeof value === 'string' ? value.trim() : '';
const normalize = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const asObject = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : null;
const visibleText = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#038;|&amp;/gi, '&')
  .replace(/&nbsp;/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function hasCountryEvidence(html, content, countryValue) {
  const countryName = new RegExp(`\\b${countryValue.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  const dateIndex = content.search(/(?:from\s+\w+,\s+)?[A-Za-z]+\s+\d{1,2}(?:\s+to\s+\w+,\s+[A-Za-z]+\s+\d{1,2})?,\s+\d{4}/i);
  const eventContext = dateIndex >= 0 ? content.slice(Math.max(0, dateIndex - 80), dateIndex + 160) : '';
  if (countryName.test(eventContext)) return true;
  const metadata = [...html.matchAll(/<meta\b[^>]*(?:name|property)=["'][^"']*(?:country|location)[^"']*["'][^>]*content=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
  return metadata.some((value) => countryName.test(value) || new RegExp(`\\b${countryValue.code}\\b`, 'i').test(value));
}

async function youSearch(query) {
  const YDC_MCP_URL = 'https://api.you.com/mcp?profile=free';
  const requestBody = [
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'global-event-monitor', version: '1.0.0' } } },
    { jsonrpc: '2.0', method: 'notifications/initialized', params: {} },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'you-search', arguments: { query, count: MAX_RESULTS, freshness: 'month', extraction: 'highlights' } } },
  ];
  const response = await fetch(YDC_MCP_URL, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify(requestBody[0]) });
  if (!response.ok) throw new Error(`init failed: ${response.status}`);
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
    } catch {
      // ignore malformed Search SSE frames
    }
  }
  return [];
}

function canonicalUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function classifyPage(html, result, category) {
  const content = visibleText(html);
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, ' ');
  const documentTitle = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, ' ');
  const title = text(heading || documentTitle || result.title).trim();
  const hasEventTitle = /\b(event|concert|festival|conference|summit|expo|exhibition|workshop|match|series|cup)\b/i.test(title);
  if (!title || !hasEventTitle) return { reason: 'titleEventKeywordFailed', title, description: content.slice(0, 220) };
  const city = cities.find((item) => new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(`${title} ${content}`));
  if (!city) return { reason: 'cityValidationFailed', title, description: content.slice(0, 220) };
  if (!hasCountryEvidence(html, content, country)) return { reason: 'pakistanValidationFailed', title, description: content.slice(0, 220) };
  const dateMatch = content.match(/from\s+\w+,\s+([A-Za-z]+)\s+(\d{1,2})\s+to\s+\w+,\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/i) || content.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/i);
  if (!dateMatch) return { reason: 'dateParsingFailed', title, description: content.slice(0, 220) };
  const startMonth = monthNumber(dateMatch[1]);
  const startDay = Number(dateMatch[2]);
  const year = Number(dateMatch[5] || dateMatch[3]);
  const endMonth = dateMatch[3] ? monthNumber(dateMatch[3]) : startMonth;
  const endDay = Number(dateMatch[4] || dateMatch[2]);
  if (startMonth < 0 || endMonth < 0 || !year) return { reason: 'dateParsingFailed', title, description: content.slice(0, 220) };
  const startAt = new Date(Date.UTC(year, startMonth, startDay));
  const endAt = new Date(Date.UTC(year, endMonth, endDay, 23, 59, 59, 999));
  if (endAt < new Date() || endAt < startAt) return { reason: 'outsideFiveDayWindow', title, description: content.slice(0, 220), startAt, endAt };
  const mapped = mapCategory(title, content.slice(0, 2000));
  if (!mapped) return { reason: 'categoryMappingFailed', title, description: content.slice(0, 220) };
  return { reason: null, title, description: content.slice(0, 220), city, category: mapped, startAt, endAt };
}

const report = {};
for (const category of categories) {
  const query = buildDiscoveryQuery(country, category, cityNames, new Date());
  const results = await youSearch(query);
  const counts = {
    youComSearchResults: results.length,
    candidatePagesInspected: 0,
    titleEventKeywordFailed: 0,
    pakistanValidationFailed: 0,
    cityValidationFailed: 0,
    dateParsingFailed: 0,
    outsideFiveDayWindow: 0,
    categoryMappingFailed: 0,
    duplicate: 0,
    finalSaved: 0
  };
  const examples = Object.fromEntries(reasons.map((reason) => [reason, []]));
  const seen = new Set();

  for (const result of results.slice(0, MAX_RESULTS)) {
    const url = canonicalUrl(text(result.url));
    if (!url) continue;
    counts.candidatePagesInspected += 1;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { accept: 'text/html', 'user-agent': 'Mozilla/5.0' } });
      if (!response.ok) continue;
      const html = await response.text();
      const classification = classifyPage(html, result, category);
      const reason = classification.reason;
      if (!reason) {
        const hash = `${normalize(classification.title)}|${normalize(url)}|${category}`;
        if (seen.has(hash)) {
          counts.duplicate += 1;
          examples.duplicate.push({ title: classification.title, url, found: classification.description, rule: 'duplicate' });
          continue;
        }
        seen.add(hash);
        counts.finalSaved += 1;
        continue;
      }
      counts[reason] += 1;
      if (examples[reason].length < 3) {
        examples[reason].push({ title: classification.title || '(no title)', url, found: classification.description, rule: reason, whyMaybeIncorrect: reason === 'titleEventKeywordFailed' ? 'The title is generic or not obviously an event name, even though the page may still be a real event listing.' : reason === 'pakistanValidationFailed' ? 'The page references Pakistan indirectly, but without explicit event-context evidence.' : reason === 'cityValidationFailed' ? 'The city may appear in a nearby article or subheading but not in the event-specific context.' : reason === 'dateParsingFailed' ? 'The page contains a date but not in the exact format the parser expects.' : reason === 'outsideFiveDayWindow' ? 'The item may be a legitimate upcoming event but outside the current five-day policy window.' : 'The content is event-like, but the page lacks the category keywords required by the mapper.' });
      }
    } catch {
      // ignore fetch/page failures so the audit stays focused on validation decisions
    }
  }

  report[category] = { counts, examples };
}

console.log(JSON.stringify(report, null, 2));
