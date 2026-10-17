import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseLumsEvents } from './lums';

afterEach(() => {
  vi.useRealTimers();
});

describe('LUMS ingestion', () => {
  it('extracts a dated Lahore event from the upcoming card markup', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-17T12:00:00.000Z'));
    const html = `<li class="col-xs12 col-sm-4 col-md-3"><div class="event-category">Conference</div><h2><a href="/events/aas-asia-2026-conference-lums">AAS-in-Asia 2026 Conference at LUMS</a></h2><img src="/sites/default/files/styles/thumbnail_most_popular_news/public/2025-10/banner.jpg" /><div class="event-dates-info"><time datetime="2026-09-25T12:00:00Z">September 25, 2026</time><time datetime="2026-09-27T12:00:00Z">September 27, 2026</time></div><div class="event-location">LUMS</div></li>`;

    const [event] = parseLumsEvents(html);
    expect(event.title).toBe('AAS-in-Asia 2026 Conference at LUMS');
    expect(event.sourceCity).toBe('Lahore');
    expect(event.categoryName).toBe('Conferences');
    expect(event.externalEventId).toBe('aas-asia-2026-conference-lums');
    expect(event.startAt.toISOString()).toBe('2026-09-25T11:00:00.000Z');
    expect(event.endAt.toISOString()).toBe('2026-09-25T12:00:00.000Z');
    expect(event.dateOnly).toBe(false);
  });

  it('rejects malformed, undated, and uncategorized cards', () => {
    const html = `<li class="col-xs12"><h2><a href="/events/no-date">Uncategorized notice</a></h2></li><li class="col-xs12"><h2><a href="/events/no-category">Some unknown listing</a></h2><time datetime="2026-09-25T12:00:00Z">September 25, 2026</time></li>`;
    expect(parseLumsEvents(html)).toHaveLength(0);
  });
});
