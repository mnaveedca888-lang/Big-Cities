import type { CollectedEvent, EventSource } from './types';
import { mapCategory } from './categories';

const SOURCE_NAME = 'Eventbrite Pakistan';
const DEFAULT_URL = 'https://www.eventbrite.com/d/pakistan--events/';

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonObject : null;
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function canonicalUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !['eventbrite.com', 'www.eventbrite.com'].includes(url.hostname.toLowerCase())) return null;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function parseDate(value: string, endOfDay: boolean) {
  if (!value) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z` : value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function externalIdFromUrl(url: string) {
  return url.match(/tickets-(\d+)/i)?.[1] ?? null;
}

function trustedImageUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || !(hostname === 'evbuc.com' || hostname.endsWith('.evbuc.com'))) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function extractJsonLd(html: string): unknown[] {
  const values: unknown[] = [];
  const scriptPattern = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    try {
      values.push(JSON.parse(match[1]));
    } catch {
      continue;
    }
  }
  return values;
}

function listItems(value: unknown): JsonObject[] {
  const object = asObject(value);
  if (!object) return [];
  const items = Array.isArray(object.itemListElement) ? object.itemListElement : [];
  return items.map((entry) => asObject(asObject(entry)?.item)).filter((entry): entry is JsonObject => Boolean(entry));
}

export function parseEventbriteJsonLd(html: string): CollectedEvent[] {
  const events: CollectedEvent[] = [];
  for (const jsonLd of extractJsonLd(html)) {
    for (const event of listItems(jsonLd)) {
      const title = text(event.name);
      const description = text(event.description) || null;
      const sourceUrlValue = text(event.url);
      const sourceUrl = sourceUrlValue ? canonicalUrl(sourceUrlValue) : null;
      const location = asObject(event.location);
      const address = asObject(location?.address);
      const countryCode = text(address?.addressCountry).toUpperCase();
      const sourceCity = text(address?.addressLocality) || null;
      const venue = text(location?.name) || null;
      const startValue = text(event.startDate);
      const endValue = text(event.endDate) || startValue;
      const startAt = parseDate(startValue, false);
      const endAt = parseDate(endValue, Boolean(text(event.endDate) && /^\d{4}-\d{2}-\d{2}$/.test(endValue)));
      const categoryName = mapCategory(title, description);

      if (!title || !sourceUrl || countryCode !== 'PK' || !startAt || !endAt || endAt < startAt || !categoryName) continue;
      events.push({
        title,
        description,
        countryCode: 'PK',
        sourceCity,
        venue,
        startAt,
        endAt,
        dateOnly: /^\d{4}-\d{2}-\d{2}$/.test(startValue),
        image: trustedImageUrl(text(event.image)),
        sourceName: SOURCE_NAME,
        sourceUrl,
        externalEventId: externalIdFromUrl(sourceUrl),
        categoryName,
        tags: [categoryName.toLowerCase(), 'pakistan'],
      });
    }
  }
  return events;
}

function assertSourceUrl(value: string) {
  const url = new URL(value || DEFAULT_URL);
  if (url.protocol !== 'https:' || !['eventbrite.com', 'www.eventbrite.com'].includes(url.hostname.toLowerCase())) {
    throw new Error('Eventbrite source URL must use HTTPS and an eventbrite.com hostname');
  }
  return url.toString();
}

export function createEventbriteSource(options: { url?: string; timeoutMs?: number } = {}): EventSource {
  const url = assertSourceUrl(options.url || process.env.EVENT_SYNC_EVENTBRITE_URL || DEFAULT_URL);
  const configuredTimeout = options.timeoutMs ?? Number(process.env.EVENT_SYNC_TIMEOUT_MS || 15000);
  const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 15000;

  return {
    name: SOURCE_NAME,
    url,
    async collect() {
      let lastError: unknown;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'GlobalAIEventMonitoringPlatform/1.0 (+event-monitor)' },
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return parseEventbriteJsonLd(await response.text());
        } catch (error) {
          lastError = error;
          if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
        } finally {
          clearTimeout(timeout);
        }
      }
      throw lastError instanceof Error ? lastError : new Error('Eventbrite request failed');
    },
  };
}