export const DAILY_EVENT_CATEGORIES = [
  'Art Exhibitions',
  'Concerts',
  'Conferences',
  'Cultural Celebration',
  'Dignitary Visits',
  'Educational Seminars',
  'Fashion Shows',
  'Film Festivals',
  'Food Festivals',
  'Government Events',
  'Sports Events',
  'Tech Events',
  'Theatre Shows',
  'Tourism & Travel',
] as const;

export type DailyEventCategory = (typeof DAILY_EVENT_CATEGORIES)[number];

export interface CollectedEvent {
  title: string;
  description: string | null;
  countryCode: 'PK';
  sourceCity: string | null;
  venue: string | null;
  startAt: Date;
  endAt: Date;
  dateOnly?: boolean;
  image: string | null;
  sourceName: string;
  sourceUrl: string;
  externalEventId: string | null;
  categoryName: DailyEventCategory;
  tags: string[];
}

export interface EventSource {
  name: string;
  url: string;
  collect(): Promise<CollectedEvent[]>;
}

export interface SyncLogger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface SyncResult {
  startedAt: string;
  finishedAt: string;
  collected: number;
  inserted: number;
  updated: number;
  rejected: number;
  expired: number;
  failedSources: Array<{ source: string; message: string }>;
  sources: SourceSyncResult[];
}

export interface SourceSyncResult {
  source: string;
  startedAt: string;
  finishedAt: string;
  fetched: number;
  inserted: number;
  updated: number;
  rejected: number;
  expired: number;
  error: string | null;
}