import { describe, expect, it } from 'vitest';
import { extractPrimarySourceUrl, sourceVerification } from './discovery.service';

describe('event source verification', () => {
  it('classifies secondary aggregators without treating them as verified sources', () => {
    expect(sourceVerification('https://www.eventbrite.com/e/example-123')).toMatchObject({
      sourceType: 'secondary',
    });
    expect(sourceVerification('https://eventsinlahore.com/event/example')).toMatchObject({
      sourceType: 'secondary',
    });
  });

  it('prioritizes official government and university domains', () => {
    expect(sourceVerification('https://example.gov.pk/events/example').sourceType).toBe('official-government');
    expect(sourceVerification('https://events.example.edu.pk/example').sourceType).toBe('official-university');
  });

  it('follows an authoritative organizer URL from a secondary event page', () => {
    const secondaryHtml = `<script type="application/ld+json">${JSON.stringify({
      '@type': 'Event',
      name: 'University Conference',
      organizer: { '@type': 'Organization', name: 'Example University', url: 'https://events.example.edu.pk/conference' },
    })}</script>`;
    expect(extractPrimarySourceUrl(secondaryHtml, 'https://www.eventbrite.com/e/conference-123')).toBe('https://events.example.edu.pk/conference');
  });

  it('returns no primary source when a secondary page exposes no authoritative link', () => {
    const secondaryHtml = '<h1>Generic Event Listing</h1><p>Tickets available.</p>';
    expect(extractPrimarySourceUrl(secondaryHtml, 'https://www.eventbrite.com/e/conference-123')).toBeNull();
  });
});
