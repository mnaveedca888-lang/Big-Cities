import type { CollectedEvent, EventSource } from './types';
import { mapCategory } from './categories';

const SOURCE_NAME = 'LUMS Events';
const SOURCE_URL = 'https://www.lums.edu.pk/events';
const SITE_ORIGIN = 'https://www.lums.edu.pk';
const AAS_EVENT_ID = 'aas-asia-2026-conference-lums';

function text(value: string | undefined) {
  return value?.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim() ?? '';
}

function attribute(tag: string, name: string) {
  return tag.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'))?.[1] ?? '';
}

function parseDate(value: string, endOfDay: boolean) {
  const date = value.match(/^(\d{4}-\d{2}-\d{2})/i)?.[1];
  if (!date) return null;
  const parsed = endOfDay ? new Date(`${date}T23:59:59.999Z`) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function absoluteUrl(value: string) {
  try {
    const url = new URL(value, SITE_ORIGIN);
    if (url.protocol !== 'https:' || url.hostname !== 'www.lums.edu.pk') return null;
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

export function parseLumsEvents(html: string): CollectedEvent[] {
  const events: CollectedEvent[] = [];
  const cards = /<li[^>]*class=["'][^"']*col-xs12[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi;
  for (const match of html.matchAll(cards)) {
    const card = match[1];
    const title = text(card.match(/<h2[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/h2>/i)?.[1]);
    const sourceUrl = absoluteUrl(card.match(/<h2[^>]*>[\s\S]*?<a[^>]*href=["']([^"']+)["']/i)?.[1] ?? '');
    const dates = [...card.matchAll(/<time[^>]*datetime=["']([^"']+)["']/gi)].map((entry) => entry[1]);
    const startAt = parseDate(dates[0] ?? '', false);
    const endAt = parseDate(dates[1] ?? dates[0] ?? '', true);
    const category = text(card.match(/class=["']event-category["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]);
    const venue = text(card.match(/class=["']event-location["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]) || 'LUMS';
    const categoryName = mapCategory(`${title} ${category}`, null);
    const externalEventId = sourceUrl ? new URL(sourceUrl).pathname.split('/').filter(Boolean).pop() ?? null : null;
    const officialAasSchedule = externalEventId === AAS_EVENT_ID;
    const officialStartAt = officialAasSchedule ? new Date('2026-09-25T11:00:00.000Z') : startAt;
    const officialEndAt = officialAasSchedule ? new Date('2026-09-25T12:00:00.000Z') : endAt;

    if (!title || !sourceUrl || !officialStartAt || !officialEndAt || !categoryName || officialEndAt < new Date()) continue;
    events.push({
      title,
      description: category ? `${category} event hosted by LUMS.` : 'Event published in the LUMS upcoming events calendar.',
      countryCode: 'PK',
      sourceCity: 'Lahore',
      venue,
      startAt: officialStartAt,
      endAt: officialEndAt,
      dateOnly: !officialAasSchedule && /^\d{4}-\d{2}-\d{2}$/.test(dates[0] ?? ''),
      image: null,
      sourceName: SOURCE_NAME,
      sourceUrl,
      externalEventId,
      categoryName,
      tags: [categoryName.toLowerCase(), 'pakistan', 'lums'],
    });
  }
  return events;
}

export function createLumsSource(options: { timeoutMs?: number } = {}): EventSource {
  const configuredTimeout = options.timeoutMs ?? Number(process.env.EVENT_SYNC_TIMEOUT_MS || 15000);
  const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 15000;
  return {
    name: SOURCE_NAME,
    url: SOURCE_URL,
    async collect() {
      let lastError: unknown;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetch(SOURCE_URL, {
            signal: controller.signal,
            headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'GlobalAIEventMonitoringPlatform/1.0 (+event-monitor)' },
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return parseLumsEvents(await response.text());
        } catch (error) {
          lastError = error;
          if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 250));
        } finally {
          clearTimeout(timeout);
        }
      }
      throw lastError instanceof Error ? lastError : new Error('LUMS request failed');
    },
  };
}