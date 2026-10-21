import { createHash } from 'crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { DAILY_EVENT_CATEGORIES, type DailyEventCategory } from './ingestion/types';
import { inferSubcategoryTags, mapCategory, categorySlug, PAKISTAN_GOLF_VENUES } from './ingestion/categories';

const MAX_SEARCH_RESULTS = 20;
const YDC_MCP_URL = 'https://api.you.com/mcp?profile=free';
const YDC_TIMEOUT_MS = 30_000;
export type DiscoveryMetrics = {
  queries: string[];
  resultUrls: Array<{ query: string; title: string; url: string }>;
  candidateRejections: Array<{ query: string; url: string; title: string; stage: string; reason: string }>;
  searches: number;
  resultsFound: number;
  relevantEventPages: number;
  pagesFetched: number;
  pagesFailed: number;
  eventsDetected: number;
  datesExtracted: number;
  within48Hours: number;
  outside48Hours: number;
  pakistanVerificationFailed: number;
  sourceVerificationFailed: number;
  categoryRejected: number;
  extractionRejected: number;
  verificationPassed: number;
  verificationFailed: number;
  duplicates: number;
  databaseErrors: number;
  saved: number;
  inserted: number;
  updated: number;
};
type DiscoveryResult = { stored: number; events: any[]; budgetReached?: boolean; metrics: DiscoveryMetrics };
const inflight = new Map<string, Promise<DiscoveryResult>>();

type JsonObject = Record<string, unknown>;

function text(value: unknown) { return typeof value === 'string' ? value.trim() : ''; }
function normalize(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function asObject(value: unknown): JsonObject | null { return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : null; }
function canonicalUrl(value: string) { try { const url = new URL(value); if (url.protocol !== 'https:') return null; url.hash = ''; return url.toString(); } catch { return null; } }
function dateValue(value: unknown, endOfDay = false) {
  const raw = text(value);
  if (!raw) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const normalized = dateOnly
    ? `${raw}T${endOfDay ? '23:59:59.999' : '00:00:00'}+05:00`
    : /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw) ? raw : `${raw}+05:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}
function categoryHash(title: string, city: string, startAt: Date, venue = '', organizer = '') { return createHash('sha256').update(`${normalize(title)}|${normalize(city)}|${startAt.toISOString().slice(0, 10)}|${normalize(venue)}|${normalize(organizer)}`).digest('hex'); }

const secondarySourceHosts = new Set([
  'eventbrite.com', 'www.eventbrite.com', 'ticketwala.pk', 'allevents.in', 'district.in',
  'allconferencealert.com', 'conferenceineurope.org', 'ticmint.com', 'events.sulekha.com', 'eventsinlahore.com',
]);

export function sourceVerification(url: string) {
  const hostname = new URL(url).hostname.toLowerCase();
  const isSecondary = [...secondarySourceHosts].some((host) => hostname === host || hostname.endsWith(`.${host}`));
  if (isSecondary) return { sourceType: 'secondary', score: 0.45, reason: 'Secondary listing or ticketing source; not sufficient for VERIFIED status.' };
  if (hostname.endsWith('.gov.pk')) return { sourceType: 'official-government', score: 0.98, reason: 'Official Pakistan government domain.' };
  if (hostname.endsWith('.edu.pk')) return { sourceType: 'official-university', score: 0.95, reason: 'Official Pakistan educational institution domain.' };
  if (hostname.endsWith('.org.pk')) return { sourceType: 'official-organization', score: 0.9, reason: 'Pakistan organization domain with event-page evidence.' };
  return { sourceType: 'organizer-or-venue', score: 0.8, reason: 'Specific event page with structured or visible event evidence from a non-directory source.' };
}

export function extractPrimarySourceUrl(html: string, discoveryUrl: string) {
  const discoveryHost = new URL(discoveryUrl).hostname.toLowerCase();
  for (const event of extractJsonLd(html)) {
    const organizer = asObject(event.organizer);
    const candidates = [
      text(organizer?.url),
      text(asObject(organizer?.sameAs)?.url),
      text(event.url),
    ];
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

function eventObjects(value: unknown): JsonObject[] {
  const object = asObject(value); if (!object) return [];
  if (Array.isArray(object.itemListElement)) return object.itemListElement.flatMap((item) => eventObjects(asObject(item)?.item));
  return object['@type'] === 'Event' || (Array.isArray(object['@type']) && object['@type'].includes('Event')) ? [object] : [];
}

export function extractJsonLd(html: string) {
  const values: unknown[] = []; const pattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) { try { values.push(JSON.parse(match[1])); } catch { /* reject malformed structured data */ } }
  return values.flatMap(eventObjects);
}

function visibleText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#038;|&amp;/gi, '&')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function monthNumber(value: string) {
  return ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].indexOf(value.toLowerCase());
}

function hasCountryEvidence(html: string, content: string, country: { code: string; name: string }, locationText = '', organizerText = '') {
  const countryName = new RegExp(`\\b${country.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  const countryCode = new RegExp(`\\b${country.code}\\b`, 'i');
  const dateIndex = content.search(/(?:from\s+\w+,\s+)?[A-Za-z]+\s+\d{1,2}(?:\s+to\s+\w+,\s+[A-Za-z]+\s+\d{1,2})?,\s+\d{4}/i);
  const eventContext = dateIndex >= 0 ? content.slice(Math.max(0, dateIndex - 80), dateIndex + 160) : content.slice(0, 220);
  if (/\b(?:India|Delhi|Mumbai|Bengaluru|United States|USA|United Kingdom|UAE|Dubai|Bangladesh|Sri Lanka)\b/i.test(eventContext)
    && !countryName.test(eventContext) && !countryCode.test(eventContext)) return false;
  if (countryName.test(`${locationText} ${organizerText}`) || countryCode.test(`${locationText} ${organizerText}`)) return true;
  if (countryName.test(eventContext) || countryCode.test(eventContext)) return true;
  const metadata = [...html.matchAll(/<meta\b[^>]*(?:name|property)=['"][^'"]*(?:country|location)[^'"]*['"][^>]*content=['"]([^'"]+)['"][^>]*>/gi)]
    .map((match) => match[1]);
  return metadata.some((value) => countryName.test(value) || countryCode.test(value));
}

export function extractVisibleContentEvent(html: string, result: any, cities: Array<{ slug: string; name: string }>, country: { code: string; name: string }) {
  const content = visibleText(html);
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, ' ');
  const documentTitle = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, ' ');
  const cardTitle = content.match(/(?:upcoming event|conference|alumni event|educational event|university event|lecture|exhibition)\s+(.{5,140}?)(?=\s+date\b)/i)?.[1];
  const specificTitle = content.match(/([A-Z][^.!?]{5,100}(?:exhibition|expo|festival|conference|concert|show)[^.!?]{0,30})(?=\s+(?:📍|date\b|timing\b|venue\b))/i)?.[1];
  const firstDateIndex = content.search(/\d{1,2}(?:\s*[-–]\s*\d{1,2}){1,2}\s+[A-Za-z]+\s+\d{4}/i);
  const titleAfterDate = firstDateIndex >= 0
    ? content.slice(firstDateIndex, firstDateIndex + 260).match(/\b([A-Z][A-Za-z0-9'’&-]*(?:\s+[A-Za-z][A-Za-z0-9'’&-]*){0,3}\s+(?:Exhibition|Expo|Festival|Conference|Concert|Show)\s+\d{4})\b/i)?.[1]
    : null;
  const namedEvent = [...content.matchAll(/\b([A-Za-z][A-Za-z0-9'’&-]*(?:\s+[A-Za-z][A-Za-z0-9'’&-]*){0,3}\s+(?:Exhibition|Expo|Festival|Conference|Concert|Show)\s+\d{4})\b/g)]
    .filter((match) => firstDateIndex < 0 || (match.index ?? 0) < firstDateIndex)
    .at(-1)?.[1];
  const title = text(heading || documentTitle || result.title).trim();
  const eventTitle = text((titleAfterDate || namedEvent || specificTitle || cardTitle || title).replace(/^(?:upcoming event|event alert)\s+/i, ''));
  const hasEventTitle = /\b(event|concert|festival|conference|summit|expo|exhibition|workshop|match|series|cup|show|fair|tournament|meetup|forum)\b/i.test(eventTitle);
  if (!eventTitle || !hasEventTitle) return null;
  const city = cities.find((item) => new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i').test(`${eventTitle} ${specificTitle ? specificTitle : content}`));
  if (!city) return null;
  const officialPakistanSource = typeof result?.url === 'string'
    && ['official-government', 'official-university', 'official-organization'].includes(sourceVerification(result.url).sourceType);
  if (!officialPakistanSource && !hasCountryEvidence(html, content, country, `${eventTitle} ${content.slice(0, 1200)}`)) return null;

  const dayFirstMatch = content.match(/(\d{1,2})(?:\s*[-–]\s*(\d{1,2})){1,2}\s+([A-Za-z]+)\s+(\d{4})/i);
  const dateMatch = dayFirstMatch || content.match(/from\s+\w+,\s+([A-Za-z]+)\s+(\d{1,2})\s+to\s+\w+,\s+([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/i)
    || content.match(/(?:from|on|date[s]?:?)\s*(?:\w+,\s+)?([A-Za-z]+)\s+(\d{1,2})(?:\s*(?:-|to|–)\s*(?:([A-Za-z]+)\s+)?(\d{1,2}))?(?:,\s*(\d{4}))?/i)
    || content.match(/([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})/i);
  if (!dateMatch) return null;

  const startMonth = monthNumber(dayFirstMatch ? dateMatch[3] : dateMatch[1]);
  const startDay = Number(dayFirstMatch ? dateMatch[1] : dateMatch[2]);
  const endMonth = dayFirstMatch ? startMonth : dateMatch[3] ? monthNumber(dateMatch[3]) : startMonth;
  const endDay = Number(dayFirstMatch ? dateMatch[2] || dateMatch[1] : dateMatch[4] || dateMatch[2]);
  const year = Number(dayFirstMatch ? dateMatch[4] : dateMatch[5] || new Date().getUTCFullYear());
  if (startMonth < 0 || endMonth < 0 || !year) return null;
  const startAt = dateValue(`${year}-${String(startMonth + 1).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`);
  const endAt = dateValue(`${year}-${String(endMonth + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`, true);
  if (!startAt || !endAt) return null;
  const category = mapCategory(eventTitle, content.slice(0, 2000));
  if (!category || endAt < new Date() || endAt < startAt) return null;
  const eventIndex = content.toLowerCase().indexOf(eventTitle.toLowerCase());
  const description = content.slice(Math.max(0, eventIndex), Math.max(0, eventIndex) + 1000);
  return { title: eventTitle, description, startAt, endAt, dateOnly: true, city, venue: null, organizer: null, category, image: null };
}

const categoryQueryTerms: Record<DailyEventCategory, string> = {
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
  'Cultural Celebration': 'cultural celebrations cultural festivals heritage festivals traditional celebrations cultural events Pakistan',
  'Tourism & Travel': 'Pakistan tourism events tourism festival Pakistan travel expo Pakistan tourism conference Pakistan tourism forum Pakistan tourism investment conference Pakistan destination event Pakistan cultural tourism festival Pakistan adventure tourism event Pakistan',
  Conferences: 'conference Pakistan international conference Pakistan business conference Pakistan technology conference Pakistan AI conference Pakistan medical conference Pakistan academic conference Pakistan research conference Pakistan trade conference Pakistan investment conference Pakistan tourism conference Pakistan industry conference Pakistan',
};

const categorySearchIntents: Record<DailyEventCategory, string> = {
  'Sports Events': 'sports event match tournament golf tournament',
  Concerts: 'concert live music',
  'Theatre Shows': 'theatre performance play show',
  'Art Exhibitions': 'art exhibition gallery expo',
  'Educational Seminars': 'seminar workshop lecture',
  'Film Festivals': 'film festival cinema screening',
  'Food Festivals': 'food festival food expo',
  'Fashion Shows': 'fashion show runway',
  'Tech Events': 'tech event technology conference hackathon',
  'Dignitary Visits': 'official visit minister visit',
  'Government Events': 'government event public hearing',
  'Cultural Celebration': 'cultural festival celebration',
  'Tourism & Travel': 'tourism festival travel expo',
  Conferences: 'conference summit forum',
};

const pakistanDiscoveryCities = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta',
  'Gujranwala', 'Sialkot', 'Hyderabad', 'Bahawalpur', 'Abbottabad', 'Murree',
];

const SIX_HOUR_WINDOW_MS = 6 * 60 * 60 * 1000;
const DAILY_SEARCH_LIMIT = 20;
const SIX_HOUR_WINDOW_LIMIT = 20;

function getDailySearchLimit() {
  const limit = Number(process.env.EVENT_DISCOVERY_DAILY_LIMIT ?? String(DAILY_SEARCH_LIMIT));
  return Number.isFinite(limit) && limit > 0 ? Math.min(limit, DAILY_SEARCH_LIMIT) : DAILY_SEARCH_LIMIT;
}

export function dayStartUtc(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
}

export function windowStartUtc(now = new Date()) {
  const utcHours = now.getUTCHours();
  const windowHour = Math.floor(utcHours / 6) * 6;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), windowHour, 0, 0, 0));
}

export function isWithin48HourWindow(startAt: Date, endAt: Date, now = new Date()) {
  const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  return endAt >= now && startAt <= cutoff;
}

function utcDateValue() {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

export async function selectOldestCategory(prisma: PrismaClient, countryCode: string, excludedCategories: DailyEventCategory[] = []) {
  const excluded = new Set(excludedCategories);
  const categories = DAILY_EVENT_CATEGORIES.filter((category) => !excluded.has(category));
  const states = await prisma.eventDiscoveryState.findMany({
    where: { countryCode: countryCode.toUpperCase(), category: { in: categories } },
    select: { category: true, lastAttemptedAt: true },
  });
  const stateByCategory = new Map(states.map((state) => [state.category, state.lastAttemptedAt]));
  return categories.sort((left, right) => {
    const leftTime = stateByCategory.get(left)?.getTime() ?? Number.NEGATIVE_INFINITY;
    const rightTime = stateByCategory.get(right)?.getTime() ?? Number.NEGATIVE_INFINITY;
    return leftTime - rightTime || left.localeCompare(right);
  })[0];
}

export async function reserveDailySearch(prisma: PrismaClient, countryCode: string, now = new Date()) {
  const limit = getDailySearchLimit();
  const sixHourLimit = Math.min(SIX_HOUR_WINDOW_LIMIT, limit);
  const normalizedCountryCode = countryCode.toUpperCase();
  const currentDayStart = dayStartUtc(now);
  const currentWindowStart = windowStartUtc(now);
  const currentWindowEnd = new Date(currentWindowStart.getTime() + SIX_HOUR_WINDOW_MS);
  const nextDayStart = new Date(currentDayStart.getTime() + 24 * 60 * 60 * 1000);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const dayRows = await tx.eventDiscoveryBudget.findMany({
          where: {
            countryCode: normalizedCountryCode,
            utcDate: { gte: currentDayStart, lt: nextDayStart },
          },
          select: { id: true, countryCode: true, utcDate: true, searchCount: true },
        });

        const currentWindowRow = dayRows.find((row) => row.utcDate.getTime() === currentWindowStart.getTime()) ?? null;
        const currentWindowCount = dayRows
          .filter((row) => row.utcDate >= currentWindowStart && row.utcDate < currentWindowEnd)
          .reduce((sum, row) => sum + (row.searchCount ?? 0), 0);
        const dailyTotal = dayRows.reduce((sum, row) => sum + (row.searchCount ?? 0), 0);

        if (currentWindowCount >= sixHourLimit || dailyTotal >= limit) {
          console.info('Daily Events search reservation blocked by configured limits', {
            country: normalizedCountryCode,
            dailyTotal,
            dailyLimit: limit,
            currentWindowCount,
            windowLimit: sixHourLimit,
            currentWindowStart: currentWindowStart.toISOString(),
          });
          return false;
        }

        if (!currentWindowRow) {
          await tx.eventDiscoveryBudget.create({
            data: { countryCode: normalizedCountryCode, utcDate: currentWindowStart, searchCount: 1 },
          });
          return true;
        }

        const updated = await tx.eventDiscoveryBudget.updateMany({
          where: { id: currentWindowRow.id, searchCount: { lt: sixHourLimit } },
          data: { searchCount: { increment: 1 } },
        });
        return updated.count === 1;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: any) {
      if (error?.code !== 'P2034' && error?.code !== 'P2002') throw error;
      console.warn('Daily Events search reservation transaction retry', {
        country: normalizedCountryCode,
        attempt: attempt + 1,
        code: error.code,
        message: error.message,
        currentDayStart: currentDayStart.toISOString(),
        currentWindowStart: currentWindowStart.toISOString(),
      });
    }
  }
  console.error('Daily Events search reservation failed after transaction retries', {
    country: normalizedCountryCode,
    currentDayStart: currentDayStart.toISOString(),
    currentWindowStart: currentWindowStart.toISOString(),
    dailyLimit: limit,
    windowLimit: sixHourLimit,
  });
  return false;
}

async function markSearchAttempt(prisma: PrismaClient, countryCode: string, category: DailyEventCategory, attemptedAt: Date, nextQueryIndex?: number) {
  await prisma.eventDiscoveryState.upsert({
    where: { countryCode_category: { countryCode: countryCode.toUpperCase(), category } },
    create: { countryCode: countryCode.toUpperCase(), category, lastAttemptedAt: attemptedAt, ...(nextQueryIndex === undefined ? {} : { nextQueryIndex }) },
    update: { lastAttemptedAt: attemptedAt, ...(nextQueryIndex === undefined ? {} : { nextQueryIndex }) },
  });
}

async function markSearchCompleted(prisma: PrismaClient, countryCode: string, category: DailyEventCategory, resultCount: number) {
  await prisma.eventDiscoveryState.update({
    where: { countryCode_category: { countryCode: countryCode.toUpperCase(), category } },
    data: { lastSuccessfulAt: resultCount > 0 ? new Date() : null, lastResultCount: resultCount },
  });
}

export function parseYouSearchResponse(responseText: string) {
  const payloads: any[] = [];
  try { payloads.push(JSON.parse(responseText)); } catch { /* MCP normally returns SSE */ }
  for (const line of responseText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) continue;
    try { payloads.push(JSON.parse(trimmed.slice(5).trim())); } catch { /* ignore non-JSON SSE frames */ }
  }
  for (const payload of payloads) {
    if (Array.isArray(payload?.results?.web)) return payload.results.web;
    if (Array.isArray(payload?.result?.results?.web)) return payload.result.results.web;
    const content = Array.isArray(payload?.result?.content) ? payload.result.content : [];
    for (const item of content) {
      if (item?.type !== 'text' || typeof item.text !== 'string') continue;
      try {
        const parsed = JSON.parse(item.text);
        if (Array.isArray(parsed?.results?.web)) return parsed.results.web;
      } catch { /* ignore informational or non-search content */ }
    }
  }
  return [];
}

async function youSearch(query: string) {
  const apiKey = process.env.YOU_API_KEY || process.env.YOUCOM_API_KEY;
  const headers = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
  };
  const request = async (body: JsonObject, requestHeaders = headers) => fetch(YDC_MCP_URL, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(YDC_TIMEOUT_MS),
  });
  const response = await request({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'global-event-monitor', version: '1.0.0' } } });
  if (!response.ok) {
    throw new Error(`You.com initialize failed: ${response.status} ${response.statusText}`);
  }
  const sessionId = response.headers.get('mcp-session-id');
  const sessionHeaders = sessionId ? { ...headers, 'mcp-session-id': sessionId } : headers;
  const initialized = await request({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }, sessionHeaders);
  if (!initialized.ok) {
    throw new Error(`You.com initialized notification failed: ${initialized.status} ${initialized.statusText}`);
  }
  const searchResponse = await request({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'you-search', arguments: { query, count: MAX_SEARCH_RESULTS, freshness: 'week', extraction: 'highlights' } } }, sessionHeaders);
  if (!searchResponse.ok) {
    throw new Error(`You.com search failed: ${searchResponse.status} ${searchResponse.statusText}`);
  }

  return { results: parseYouSearchResponse(await searchResponse.text()), httpStatus: searchResponse.status };
}

export function buildDiscoveryQuery(country: { name: string }, category: DailyEventCategory, cityNames: string[], now = new Date()) {
  const today = now.toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'long', day: 'numeric', year: 'numeric' });
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'long', day: 'numeric', year: 'numeric' });
  const cities = [...new Set([...cityNames, ...pakistanDiscoveryCities])].slice(0, 20).join(' ');
  const intent = categorySearchIntents[category];
  const golfVenues = category === 'Sports Events' ? PAKISTAN_GOLF_VENUES.join(' ') : '';
  return `"${country.name}" "${category}" ${intent} upcoming events today ${today} events tomorrow ${tomorrow} ${cities} ${golfVenues} official venue tickets -weather -news -jobs`.trim();
}

export function buildDiscoveryQueries(country: { name: string }, category: DailyEventCategory, cityNames: string[], now = new Date()) {
  const cities = [...new Set([...cityNames, ...pakistanDiscoveryCities])].slice(0, 14);
  const today = now.toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'long', day: 'numeric', year: 'numeric' });
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { timeZone: 'Asia/Karachi', month: 'long', day: 'numeric', year: 'numeric' });
  const intent = categorySearchIntents[category];
  const exclusions = '-weather -news -jobs';
  const cityQueries = cities.map((city) => `${city} ${country.name} ${category.toLowerCase()} ${intent} today ${today} tomorrow ${tomorrow} event venue tickets ${exclusions}`);
  return [
    ...cityQueries,
    `${country.name} ${category} ${intent} events today ${today} official venue tickets ${exclusions}`,
    `${country.name} ${category} ${intent} events tomorrow ${tomorrow} official venue tickets ${exclusions}`,
    `${country.name} ${category} events next 48 hours ${today} ${tomorrow} official event page ${exclusions}`,
    `site:.pk ${country.name} ${intent} event today ${today} venue tickets ${exclusions}`,
    `site:.pk ${country.name} ${intent} event tomorrow ${tomorrow} venue tickets ${exclusions}`,
    `${country.name} ${category} upcoming events within next 48 hours ${today} ${tomorrow} official venue tickets ${exclusions}`,
  ];
}

function emptyDiscoveryMetrics(): DiscoveryMetrics {
  return { queries: [], resultUrls: [], candidateRejections: [], searches: 0, resultsFound: 0, relevantEventPages: 0, pagesFetched: 0, pagesFailed: 0, eventsDetected: 0, datesExtracted: 0, within48Hours: 0, outside48Hours: 0, pakistanVerificationFailed: 0, sourceVerificationFailed: 0, categoryRejected: 0, extractionRejected: 0, verificationPassed: 0, verificationFailed: 0, duplicates: 0, databaseErrors: 0, saved: 0, inserted: 0, updated: 0 };
}

async function discoverRecordsForQuery(prisma: PrismaClient, country: { code: string; name: string }, category: DailyEventCategory, query: string) {
  const cities = await prisma.city.findMany({ where: { countryCode: country.code }, select: { slug: true, name: true } });
  const search = await youSearch(query);
  const results = search.results;
  const records: any[] = [];
  const metrics = emptyDiscoveryMetrics();
  metrics.searches = 1;
  metrics.queries = [query];
  metrics.resultsFound = results.length;
  for (const result of results.slice(0, MAX_SEARCH_RESULTS)) {
    const rawUrl = text(result.url);
    const resultSummary = `${text(result.title)} ${text(result.description)} ${rawUrl}`;
    if (/\b(event|concert|festival|conference|summit|expo|exhibition|workshop|match|tournament|show|fair|performance|screening|seminar)\b/i.test(resultSummary)) metrics.relevantEventPages += 1;
    const url = canonicalUrl(rawUrl);
    if (!url) {
      metrics.candidateRejections.push({ query, url: rawUrl, title: text(result.title), stage: 'source-url', reason: 'Result URL was missing or not an HTTPS URL.' });
      continue;
    }
    metrics.resultUrls.push({ query, title: text(result.title), url });
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { accept: 'text/html' } });
      if (!response.ok) {
        metrics.pagesFailed += 1;
        metrics.candidateRejections.push({ query, url, title: text(result.title), stage: 'source-page', reason: `HTTP ${response.status}` });
        continue;
      }
      metrics.pagesFetched += 1;
      let html = await response.text();
      const discoverySourceUrl = url;
      const discoverySourceName = new URL(url).hostname;
      let primarySourceUrl: string | null = null;
      let source = sourceVerification(url);
      if (source.sourceType === 'secondary') {
        primarySourceUrl = extractPrimarySourceUrl(html, url);
        if (primarySourceUrl) {
          const primaryResponse = await fetch(primarySourceUrl, { signal: AbortSignal.timeout(8000), headers: { accept: 'text/html' } });
          if (primaryResponse.ok) {
            html = await primaryResponse.text();
            source = sourceVerification(primarySourceUrl);
          }
        }
      }
      const structuredEvents = extractJsonLd(html);
      let acceptedStructuredEvent = false;
      for (const event of structuredEvents) {
        const location = asObject(event.location);
        const address = asObject(location?.address);
        const eventCountry = text(address?.addressCountry).toUpperCase();
        const cityName = text(address?.addressLocality);
        const city = cities.find((item) => normalize(item.name) === normalize(cityName))
          || cities.find((item) => new RegExp(`\\b${item.name.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'i').test(`${cityName} ${text(location?.name)}`));
        const title = text(event.name) || text(result.title);
        const description = text(event.description) || text(result.description);
        const startAt = dateValue(event.startDate);
        const endAt = dateValue(event.endDate, true) ?? startAt;
        const category = mapCategory(title, description);
        if (!title || !startAt || !endAt) {
          metrics.extractionRejected += 1;
          metrics.candidateRejections.push({ query, url, title, stage: 'date-extraction', reason: 'Event title or valid start/end date was missing.' });
          continue;
        }
        metrics.eventsDetected += 1;
        metrics.datesExtracted += 1;
        const organizerObject = asObject(event.organizer);
        const organizer = text(organizerObject?.name) || null;
        const countryMatches = eventCountry === country.code || eventCountry === country.name.toUpperCase() || Boolean(city);
        if (!countryMatches || !city) {
          metrics.pakistanVerificationFailed += 1;
          metrics.verificationFailed += 1;
          metrics.candidateRejections.push({ query, url, title, stage: 'pakistan-verification', reason: 'No verified Pakistan country and city evidence.' });
          continue;
        }
        if (!category) {
          metrics.categoryRejected += 1;
          metrics.candidateRejections.push({ query, url, title, stage: 'category', reason: 'No approved category matched the event title or description.' });
          continue;
        }
        if (!isWithin48HourWindow(startAt, endAt)) {
          metrics.outside48Hours += 1;
          metrics.candidateRejections.push({ query, url, title, stage: '48-hour-window', reason: 'Event interval does not overlap the rolling next 48 hours.' });
          continue;
        }
        if (source.sourceType === 'secondary') {
          metrics.sourceVerificationFailed += 1;
          metrics.verificationFailed += 1;
          metrics.candidateRejections.push({ query, url, title, stage: 'source-verification', reason: 'Only a secondary source was available.' });
          continue;
        }
        metrics.within48Hours += 1;
        metrics.verificationPassed += 1;
        records.push({ title, description: description || null, sourceUrl: primarySourceUrl || url, discoverySourceUrl, discoverySourceName, primarySourceUrl, primarySourceName: primarySourceUrl ? new URL(primarySourceUrl).hostname : null, image: null, startAt, endAt, dateOnly: /^\d{4}-\d{2}-\d{2}$/.test(text(event.startDate)), city, venue: text(location?.name) || null, organizer, category, source });
        acceptedStructuredEvent = true;
      }
      if (!acceptedStructuredEvent) {
        const fallback = extractVisibleContentEvent(html, result, cities, country);
        if (fallback) {
          metrics.eventsDetected += 1;
          metrics.datesExtracted += 1;
          if (!isWithin48HourWindow(fallback.startAt, fallback.endAt)) metrics.outside48Hours += 1;
          else if (source.sourceType === 'secondary') {
            metrics.sourceVerificationFailed += 1;
            metrics.verificationFailed += 1;
            metrics.candidateRejections.push({ query, url, title: fallback.title, stage: 'source-verification', reason: 'Only a secondary source was available.' });
          } else {
            metrics.within48Hours += 1;
            metrics.verificationPassed += 1;
            records.push({ ...fallback, sourceUrl: primarySourceUrl || url, discoverySourceUrl, discoverySourceName, primarySourceUrl, primarySourceName: primarySourceUrl ? new URL(primarySourceUrl).hostname : null, source });
          }
        } else {
          metrics.extractionRejected += 1;
          metrics.candidateRejections.push({ query, url, title: text(result.title), stage: 'event-extraction', reason: 'No JSON-LD Event or verified visible event content was extracted.' });
        }
      }
    } catch (error) {
      metrics.pagesFailed += 1;
      metrics.candidateRejections.push({ query, url, title: text(result.title), stage: 'source-page', reason: error instanceof Error ? error.message : 'Source page fetch or parse failed.' });
    }
  }
  const now = new Date();
  const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  return {
    records: records.filter((record) => record.source.sourceType !== 'secondary' && record.endAt >= now && record.startAt <= cutoff),
    resultCount: results.length,
    metrics,
  };
}

async function discoverRecords(prisma: PrismaClient, country: { code: string; name: string }, category: DailyEventCategory, reserveQuery: () => Promise<boolean>, onSearchReserved: (queryIndex: number, query: string) => Promise<void>, maxQueries = Number.POSITIVE_INFINITY) {
  const cities = await prisma.city.findMany({ where: { countryCode: country.code }, select: { slug: true, name: true } });
  const allQueries = process.env.EVENT_DISCOVERY_QUERY?.trim()
    ? [process.env.EVENT_DISCOVERY_QUERY.trim()]
    : buildDiscoveryQueries(country, category, cities.map((city) => city.name));
  const state = (await prisma.eventDiscoveryState.findMany({ where: { countryCode: country.code, category: { in: [category] } }, select: { nextQueryIndex: true } })).at(0);
  const startIndex = state?.nextQueryIndex ?? 0;
  const queries = Array.from({ length: Math.min(maxQueries, allQueries.length) }, (_, offset) => allQueries[(startIndex + offset) % allQueries.length]);
  const combined = { records: [] as any[], resultCount: 0, metrics: emptyDiscoveryMetrics(), budgetReached: undefined as boolean | undefined };
  const seenUrls = new Set<string>();
  for (let queryOffset = 0; queryOffset < queries.length; queryOffset += 1) {
    const query = queries[queryOffset];
    if (!(await reserveQuery())) { combined.budgetReached = true; break; }
    await onSearchReserved((startIndex + queryOffset + 1) % allQueries.length, query);
    const audit = (prisma as any).eventDiscoveryRun?.create
      ? await (prisma as any).eventDiscoveryRun.create({ data: { countryCode: country.code, category, query, budgetWindow: windowStartUtc(), reserved: true } })
      : null;
    const result = await discoverRecordsForQuery(prisma, country, category, query);
    if (audit && (prisma as any).eventDiscoveryRun?.update) {
      const rejectionCounts = result.metrics.candidateRejections.reduce((counts, rejection) => ({ ...counts, [rejection.stage]: (counts[rejection.stage] || 0) + 1 }), {} as Record<string, number>);
      await (prisma as any).eventDiscoveryRun.update({ where: { id: audit.id }, data: { youHttpStatus: 200, resultsFound: result.metrics.resultsFound, relevantEventPages: result.metrics.relevantEventPages, pagesFetched: result.metrics.pagesFetched, pagesFailed: result.metrics.pagesFailed, eventsDetected: result.metrics.eventsDetected, datesExtracted: result.metrics.datesExtracted, within48Hours: result.metrics.within48Hours, verificationPassed: result.metrics.verificationPassed, rejectionCounts, resultUrls: result.metrics.resultUrls, candidateRejections: result.metrics.candidateRejections } });
    }
    combined.resultCount += result.resultCount;
    for (const [key, value] of Object.entries(result.metrics)) {
      if (key === 'queries') combined.metrics.queries.push(...(value as string[]));
      else if (key === 'resultUrls') combined.metrics.resultUrls.push(...(value as DiscoveryMetrics['resultUrls']));
      else if (key === 'candidateRejections') combined.metrics.candidateRejections.push(...(value as DiscoveryMetrics['candidateRejections']).slice(0, 200));
      else {
        const numericKey = key as Exclude<keyof DiscoveryMetrics, 'queries' | 'resultUrls' | 'candidateRejections'>;
        combined.metrics[numericKey] += value as number;
      }
    }
    for (const record of result.records) {
      const key = `${record.sourceUrl}|${record.title}|${record.startAt.toISOString()}`;
      if (seenUrls.has(key)) { combined.metrics.duplicates += 1; continue; }
      seenUrls.add(key);
      combined.records.push(record);
    }
  }
  return combined;
}

export async function discoverAndStoreEvents(prisma: PrismaClient, country: { code: string; name: string }, category: DailyEventCategory, options: { maxQueries?: number } = {}): Promise<DiscoveryResult> {
  const key = country.code.toUpperCase();
  const cacheKey = `${key}:${category}`;
  const running = inflight.get(cacheKey); if (running) return running;
  const attemptedAt = new Date();
  const request = (async () => { const discovery = await discoverRecords(prisma, country, category, () => reserveDailySearch(prisma, key), async (nextQueryIndex, query) => { await markSearchAttempt(prisma, key, category, attemptedAt, nextQueryIndex); }, options.maxQueries); await markSearchCompleted(prisma, key, category, discovery.resultCount); const saved: any[] = []; for (const record of discovery.records.filter((event) => event.category === category)) { const categoryRecord = await prisma.category.upsert({ where: { slug: categorySlug(category) }, update: { name: category }, create: { name: category, slug: categorySlug(category) } }); const hash = categoryHash(record.title, record.city.name, record.startAt, record.venue || '', record.organizer || ''); const now = new Date(); const isVerified = record.source.sourceType !== 'secondary'; const data = { title: record.title, description: record.description, categoryId: categoryRecord.id, countryCode: country.code, citySlug: record.city.slug, startAt: record.startAt, endAt: record.endAt, dateOnly: record.dateOnly, tags: `${category.toLowerCase()},${country.code.toLowerCase()}`, image: record.image, venue: record.venue, organizer: record.organizer || null, sourceName: record.primarySourceName || 'You.com free web search', sourceUrl: record.sourceUrl, sourceType: record.source.sourceType, primarySourceUrl: record.primarySourceUrl || null, primarySourceName: record.primarySourceName || null, primarySourceType: record.primarySourceUrl ? record.source.sourceType : null, discoverySourceUrl: record.discoverySourceUrl || record.sourceUrl, discoverySourceName: record.discoverySourceName || 'You.com', verificationStatus: isVerified ? 'VERIFIED' : 'PARTIALLY_VERIFIED', verificationScore: isVerified ? record.source.score : 0.45, verificationReason: isVerified ? record.source.reason : 'Partially verified because only a secondary event listing was found.', verifiedAt: isVerified ? now : null, lastCheckedAt: now, externalEventId: null, lastSeenAt: now, lastCollectedAt: now, contentHash: hash, enabled: true }; const existing = await prisma.event.findFirst({ where: { OR: [{ sourceUrl: record.sourceUrl }, { contentHash: hash }] } }); if (existing) { discovery.metrics.duplicates += 1; saved.push(await prisma.event.update({ where: { id: existing.id }, data })); discovery.metrics.updated += 1; } else { saved.push(await prisma.event.create({ data: { ...data, slug: `${normalize(record.title).replace(/ /g, '-')}-${hash.slice(0, 10)}` } })); discovery.metrics.inserted += 1; } } discovery.metrics.saved = saved.length; return { stored: saved.length, events: saved, budgetReached: discovery.budgetReached, metrics: discovery.metrics }; })();
  inflight.set(cacheKey, request); try { const result = await request; if ((prisma as any).eventDiscoveryRun?.findFirst && (prisma as any).eventDiscoveryRun?.update) { const audit = await (prisma as any).eventDiscoveryRun.findFirst({ where: { countryCode: key, category, reserved: true }, orderBy: { startedAt: 'desc' } }); if (audit) await (prisma as any).eventDiscoveryRun.update({ where: { id: audit.id }, data: { finishedAt: new Date(), saved: result.metrics.saved, inserted: result.metrics.inserted, updated: result.metrics.updated, duplicates: result.metrics.duplicates } }); } return result; } finally { inflight.delete(cacheKey); }
}

export { DAILY_EVENT_CATEGORIES };
