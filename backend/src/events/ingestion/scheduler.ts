import type { PrismaClient } from '@prisma/client';
import { syncPakistanEvents } from './sync-service';
import { DAILY_EVENT_CATEGORIES, type DailyEventCategory, type SyncLogger } from './types';
import { discoverAndStoreEvents, selectOldestCategory } from '../discovery.service';

let schedulerStarted = false;

export async function expireYouComEvents(prisma: PrismaClient, now = new Date()) {
  return prisma.event.updateMany({
    where: { sourceName: 'You.com free web search', enabled: true, endAt: { lt: now } },
    data: { enabled: false },
  });
}

function positiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function runAutomaticDiscovery(prisma: PrismaClient, logger: SyncLogger) {
  const codes = (process.env.EVENT_AI_DISCOVERY_COUNTRIES || '').split(',').map((code) => code.trim().toUpperCase()).filter(Boolean);
  if (!codes.length) {
    logger.warn('Automatic web discovery skipped: EVENT_AI_DISCOVERY_COUNTRIES is empty');
    return;
  }

  const countries = await prisma.country.findMany({ where: { code: { in: codes } }, select: { code: true, name: true } });
  for (const country of countries) {
    const processedCategories: DailyEventCategory[] = [];
    let totalInserted = 0;
    logger.info('Daily Events AI discovery started', {
      country: country.code,
      categories: DAILY_EVENT_CATEGORIES,
      dailyLimit: process.env.EVENT_DISCOVERY_DAILY_LIMIT || '100',
    });
    while (processedCategories.length < DAILY_EVENT_CATEGORIES.length) {
      try {
        const category = await selectOldestCategory(prisma, country.code, processedCategories);
        if (!category) break;
        processedCategories.push(category);
        const result = await discoverAndStoreEvents(prisma, country, category, { maxQueries: 1 });
        totalInserted += result.stored;
        if (result.budgetReached && result.metrics.searches === 0) {
          logger.info('Daily Events AI category deferred because the search budget is exhausted', {
            country: country.code,
            category,
            dailyLimit: process.env.EVENT_DISCOVERY_DAILY_LIMIT || '100',
          });
          break;
        }
        logger.info('Daily Events AI category completed', {
          country: country.code,
          category,
          queries: result.metrics.queries,
          resultUrls: result.metrics.resultUrls,
          candidateRejections: result.metrics.candidateRejections,
          searchCalls: result.metrics.searches,
          resultsFound: result.metrics.resultsFound,
          relevantEventPages: result.metrics.relevantEventPages,
          pagesFetched: result.metrics.pagesFetched,
          pagesFailed: result.metrics.pagesFailed,
          eventsDetected: result.metrics.eventsDetected,
          datesExtracted: result.metrics.datesExtracted,
          within48Hours: result.metrics.within48Hours,
          outside48Hours: result.metrics.outside48Hours,
          pakistanVerificationFailed: result.metrics.pakistanVerificationFailed,
          sourceVerificationFailed: result.metrics.sourceVerificationFailed,
          categoryRejected: result.metrics.categoryRejected,
          extractionRejected: result.metrics.extractionRejected,
          verificationPassed: result.metrics.verificationPassed,
          verificationFailed: result.metrics.verificationFailed,
          duplicates: result.metrics.duplicates,
          databaseErrors: result.metrics.databaseErrors,
          saved: result.metrics.saved,
          stored: result.stored,
          budgetReached: result.budgetReached ?? false,
        });
        if (result.budgetReached) break;
      } catch (error) {
        logger.warn('Automatic You.com web discovery failed', { country: country.code, category: processedCategories.at(-1), error });
      }
    }
    logger.info('Daily Events AI discovery completed', {
      country: country.code,
      categoriesProcessed: processedCategories,
      categoryCount: processedCategories.length,
      totalStored: totalInserted,
      totalVerified: 'see category verificationPassed metrics',
      totalInserted: totalInserted,
    });
  }
}

export function startEventSyncScheduler(prisma: PrismaClient, logger: SyncLogger) {
  if (process.env.EVENT_SYNC_ENABLED === 'false') {
    logger.info('Event sync scheduler is disabled');
    return null;
  }

  if (schedulerStarted) {
    logger.warn('Pakistan event sync scheduler was already started; ignoring duplicate start');
    return null;
  }
  schedulerStarted = true;

  const legacyIntervalMinutes = process.env.EVENT_SYNC_INTERVAL_HOURS
    ? positiveNumber(process.env.EVENT_SYNC_INTERVAL_HOURS, 24) * 60
    : 60;
  const intervalMinutes = Math.max(1, positiveNumber(process.env.EVENT_DISCOVERY_INTERVAL_MINUTES, legacyIntervalMinutes || 60));
  const intervalMs = intervalMinutes * 60 * 1000;
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await expireYouComEvents(prisma);
      await syncPakistanEvents(prisma, logger);
      await runAutomaticDiscovery(prisma, logger);
    } catch (error) {
      logger.error('Automatic event sync failed', error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => { void run(); }, intervalMs);
  const now = new Date();
  const nextWindow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), Math.floor(now.getUTCHours() / 6) * 6 + 6, 0, 0, 0));
  const boundaryTimer = setTimeout(() => { void run(); }, Math.max(1, nextWindow.getTime() - now.getTime()));
  if (typeof timer.unref === 'function') timer.unref();
  if (typeof boundaryTimer.unref === 'function') boundaryTimer.unref();
  if (process.env.EVENT_SYNC_RUN_ON_START !== 'false') void run();
  logger.info('Automatic event discovery scheduler enabled', { intervalMinutes, runOnStart: process.env.EVENT_SYNC_RUN_ON_START !== 'false' });
  return () => {
    clearInterval(timer);
    clearTimeout(boundaryTimer);
    schedulerStarted = false;
  };
}