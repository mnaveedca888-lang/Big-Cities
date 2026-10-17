import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { categorySlug } from './categories';
import { createEventbriteSource } from './eventbrite';
import { createLumsSource } from './lums';
import { DAILY_EVENT_CATEGORIES, type EventSource, type SourceSyncResult, type SyncLogger, type SyncResult } from './types';

function normalize(value: string | null | undefined) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function contentHash(title: string, citySlug: string | null, startAt: Date) {
  return createHash('sha256')
    .update(`${normalize(title)}|${citySlug ?? ''}|${startAt.toISOString().slice(0, 10)}`)
    .digest('hex');
}

function sourcePriority(sourceName: string | null | undefined) {
  if (sourceName === 'LUMS Events') return 1;
  if (sourceName === 'Eventbrite Pakistan') return 2;
  return 10;
}

function cityMap(cities: Array<{ slug: string; name: string }>) {
  const map = new Map<string, string>();
  for (const city of cities) {
    map.set(normalize(city.name), city.slug);
    map.set(normalize(city.slug.replace(/^pk-/, '').replace(/-/g, ' ')), city.slug);
  }
  return map;
}

async function ensureCategories(prisma: PrismaClient) {
  const entries = await Promise.all(DAILY_EVENT_CATEGORIES.map(async (name) => prisma.category.upsert({
    where: { slug: categorySlug(name) },
    update: { name },
    create: { name, slug: categorySlug(name) },
  })));
  return new Map(entries.map((category) => [category.name, category.id]));
}

async function findExisting(prisma: PrismaClient, event: {
  title: string;
  sourceName: string;
  sourceUrl: string;
  externalEventId: string | null;
  contentHash: string;
  citySlug: string | null;
  startAt: Date;
}) {
  const identityMatches: Array<Record<string, unknown>> = [
    { sourceUrl: event.sourceUrl },
    { contentHash: event.contentHash },
  ];
  if (event.externalEventId) identityMatches.unshift({ sourceName: event.sourceName, externalEventId: event.externalEventId });

  const dayStart = new Date(Date.UTC(event.startAt.getUTCFullYear(), event.startAt.getUTCMonth(), event.startAt.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  identityMatches.push({
    title: { equals: event.title, mode: 'insensitive' },
    countryCode: 'PK',
    citySlug: event.citySlug,
    startAt: { gte: dayStart, lt: dayEnd },
  });

  return prisma.event.findFirst({ where: { OR: identityMatches } as any });
}

export async function syncPakistanEvents(prisma: PrismaClient, logger: SyncLogger, configuredSources?: EventSource[]): Promise<SyncResult> {
  const started = new Date();
  const result: SyncResult = {
    startedAt: started.toISOString(),
    finishedAt: started.toISOString(),
    collected: 0,
    inserted: 0,
    updated: 0,
    rejected: 0,
    expired: 0,
    failedSources: [],
    sources: [],
  };

  const sources = configuredSources ?? [createLumsSource(), createEventbriteSource()];
  const [categories, cities] = await Promise.all([
    ensureCategories(prisma),
    prisma.city.findMany({ where: { countryCode: 'PK' }, select: { slug: true, name: true } }),
  ]);
  const citiesByName = cityMap(cities);

  for (const source of sources) {
    const sourceStarted = new Date();
    const sourceResult: SourceSyncResult = {
      source: source.name,
      startedAt: sourceStarted.toISOString(),
      finishedAt: sourceStarted.toISOString(),
      fetched: 0,
      inserted: 0,
      updated: 0,
      rejected: 0,
      expired: 0,
      error: null,
    };
    logger.info(`Event source sync started: ${source.name}`);
    try {
      const events = await source.collect();
      result.collected += events.length;
      sourceResult.fetched = events.length;
      for (const event of events) {
        const citySlug = event.sourceCity ? citiesByName.get(normalize(event.sourceCity)) ?? null : null;
        const categoryId = categories.get(event.categoryName);
        if (!categoryId || event.countryCode !== 'PK' || !event.sourceUrl || !event.title || event.endAt < event.startAt) {
          result.rejected += 1;
          sourceResult.rejected += 1;
          continue;
        }
        const hash = contentHash(event.title, citySlug, event.startAt);
        const existing = await findExisting(prisma, { ...event, citySlug, contentHash: hash });
        if (existing && existing.sourceName && existing.sourceName !== event.sourceName && sourcePriority(existing.sourceName) < sourcePriority(event.sourceName)) {
          continue;
        }
        const data = {
          title: event.title,
          description: event.description,
          categoryId,
          countryCode: 'PK',
          citySlug,
          startAt: event.startAt,
          endAt: event.endAt,
          dateOnly: event.dateOnly ?? false,
          tags: event.tags.join(','),
          image: event.image,
          venue: event.venue,
          sourceName: event.sourceName,
          sourceUrl: event.sourceUrl,
          sourceType: event.sourceName === 'LUMS Events' ? 'official-university' : 'secondary',
          verificationStatus: event.sourceName === 'LUMS Events' ? 'VERIFIED' : 'PARTIALLY_VERIFIED',
          verificationScore: event.sourceName === 'LUMS Events' ? 0.95 : 0.55,
          verificationReason: event.sourceName === 'LUMS Events' ? 'Official LUMS events calendar.' : 'Secondary event platform; details should be confirmed by a primary source.',
          verifiedAt: event.sourceName === 'LUMS Events' ? new Date() : null,
          lastCheckedAt: new Date(),
          externalEventId: event.externalEventId,
          lastSeenAt: new Date(),
          lastCollectedAt: new Date(),
          contentHash: hash,
          enabled: true,
        };

        if (existing) {
          await prisma.event.update({ where: { id: existing.id }, data });
          result.updated += 1;
          sourceResult.updated += 1;
        } else {
          const baseSlug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'event';
          const suffix = event.externalEventId || hash.slice(0, 10);
          const slug = `${baseSlug}-${suffix}`.slice(0, 190);
          await prisma.event.create({ data: { ...data, slug } });
          result.inserted += 1;
          sourceResult.inserted += 1;
        }
      }

      const stale = await prisma.event.updateMany({
        where: { sourceName: source.name, lastSeenAt: { lt: started }, enabled: true },
        data: { enabled: false },
      });
      const expired = await prisma.event.updateMany({
        where: { sourceName: source.name, endAt: { lt: new Date() }, enabled: true },
        data: { enabled: false },
      });
      result.expired += stale.count + expired.count;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown source failure';
      result.failedSources.push({ source: source.name, message });
      sourceResult.error = message;
      logger.warn(`Event source failed: ${source.name}`, message);
    }
    sourceResult.finishedAt = new Date().toISOString();
    result.sources.push(sourceResult);
    logger.info(`Event source sync completed: ${source.name}`, sourceResult);
  }

  result.finishedAt = new Date().toISOString();
  logger.info('Pakistan event sync completed', result);
  return result;
}