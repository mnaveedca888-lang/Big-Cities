import { describe, expect, it } from 'vitest';
import { mapCategory } from './categories';
import { parseEventbriteJsonLd } from './eventbrite';

describe('Eventbrite ingestion', () => {
  it('extracts a valid Pakistan event from Schema.org JSON-LD', () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      itemListElement: [{ item: {
        name: 'Pakistan Tech Summit',
        description: 'A technology conference for builders.',
        url: 'https://www.eventbrite.com/e/pakistan-tech-summit-tickets-12345?aff=listing',
        image: 'https://img.evbuc.com/example.jpg',
        startDate: '2026-10-10',
        endDate: '2026-10-10',
        location: { name: 'Expo Center', address: { addressCountry: 'PK', addressLocality: 'Lahore' } },
      } }],
    })}</script>`;

    const [event] = parseEventbriteJsonLd(html);
    expect(event.title).toBe('Pakistan Tech Summit');
    expect(event.countryCode).toBe('PK');
    expect(event.sourceCity).toBe('Lahore');
    expect(event.externalEventId).toBe('12345');
    expect(event.categoryName).toBe('Tech Events');
    expect(event.endAt.toISOString()).toBe('2026-10-10T23:59:59.999Z');
  });

  it('rejects foreign, undated, and uncategorized records', () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      itemListElement: [
        { item: { name: 'Foreign Concert', url: 'https://www.eventbrite.com/e/foreign-tickets-1', startDate: '2026-10-10', location: { address: { addressCountry: 'US' } } } },
        { item: { name: 'Pakistan Listing', url: 'https://www.eventbrite.com/e/pakistan-tickets-2', startDate: '2026-10-10', location: { address: { addressCountry: 'PK' } } } },
      ],
    })}</script>`;

    expect(parseEventbriteJsonLd(html)).toHaveLength(0);
  });

  it('maps source language to only the configured Daily Events categories', () => {
    expect(mapCategory('Annual Cricket Match', null)).toBe('Sports Events');
    expect(mapCategory('University workshop', null)).toBe('Educational Seminars');
    expect(mapCategory('Unrelated listing', null)).toBeNull();
  });
});