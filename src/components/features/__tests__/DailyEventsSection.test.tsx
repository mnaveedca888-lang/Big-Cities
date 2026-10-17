import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DailyEventsSection } from '../DailyEventsSection';

function renderSection(props: Parameters<typeof DailyEventsSection>[0]) {
  return render(
    <MemoryRouter>
      <DailyEventsSection {...props} />
    </MemoryRouter>,
  );
}

describe('DailyEventsSection', () => {
  it('keeps a verified event that is already in progress today', () => {
    const now = new Date();
    const startAt = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const endAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    renderSection({
      events: [{ id: 'ongoing', slug: 'ongoing', title: 'Ongoing Conference', description: 'Pakistan event', startAt, endAt, category: 'Conferences', sourceName: 'You.com free web search' }],
      categories: [{ id: 'conference', name: 'Conferences', slug: 'conferences' }],
    });
    const eventLink = screen.getByRole('link', { name: 'Ongoing Conference' });
    expect(eventLink).toHaveAttribute('href', '/event/ongoing');
    expect(eventLink).toHaveTextContent(/^Ongoing Conference$/);
    expect(within(eventLink).queryByRole('img')).not.toBeInTheDocument();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows current and upcoming events and filters by category', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    renderSection({
          categories: [{ id: 'sports', name: 'Sports Events', slug: 'sports-events' }],
          events: [
            { id: 'future-sport', slug: 'future-sport', title: 'Pakistan Cricket Match', description: 'Match', categoryId: 'sports', tags: ['cricket'], startAt: tomorrow, endAt: tomorrow },
            { id: 'future-tech', slug: 'future-tech', title: 'Pakistan Tech Forum', description: 'Forum', category: 'Tech Events', startAt: tomorrow, endAt: tomorrow },
            { id: 'expired', slug: 'expired', title: 'Expired Event', description: 'Expired', startAt: yesterday, endAt: yesterday },
          ],
        });

    expect(await screen.findByText('Pakistan Cricket Match')).toBeInTheDocument();
    expect(screen.getByText('Pakistan Tech Forum')).toBeInTheDocument();
    expect(screen.queryByText('Expired Event')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sports Events' }));
    expect(screen.getByRole('button', { name: 'Golf Courses' })).toBeInTheDocument();
    expect(screen.queryByText('Pakistan Tech Forum')).not.toBeInTheDocument();
  });

  it('excludes events that ended earlier today', () => {
    const today = new Date();
    const endedToday = new Date(today.getTime() - 60 * 60 * 1000).toISOString();
    const laterToday = new Date(today.getTime() + 60 * 60 * 1000).toISOString();

    renderSection({
          events: [
            { id: 'ended-today', slug: 'ended-today', title: 'Ended Today', description: 'Ended', startAt: endedToday, endAt: endedToday },
            { id: 'later-today', slug: 'later-today', title: 'Later Today', description: 'Upcoming', startAt: laterToday, endAt: laterToday },
          ],
          categories: [],
        });

    expect(screen.queryByText('Ended Today')).not.toBeInTheDocument();
    expect(screen.getByText('Later Today')).toBeInTheDocument();
  });

  it('shows events through exactly 48 hours from now and hides events beyond the window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:00:00.000Z'));
    const eventAt = (hours: number) => new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    renderSection({
      categories: [],
      events: [
        { id: 'today', slug: 'today', title: 'Today Event', description: 'Today', startAt: eventAt(0), endAt: eventAt(0) },
        { id: 'two-days', slug: 'two-days', title: 'Two Day Event', description: '47 hours away', startAt: eventAt(47), endAt: eventAt(47) },
        { id: 'exactly-two-days', slug: 'exactly-two-days', title: 'Exactly Two Day Event', description: 'Exactly 48 hours away', startAt: eventAt(48), endAt: eventAt(48) },
        { id: 'over-two-days', slug: 'over-two-days', title: 'Over Two Day Event', description: '48 hours and one minute away', startAt: eventAt(48 + 1 / 60), endAt: eventAt(48 + 1 / 60) },
        { id: 'three-days', slug: 'three-days', title: 'Three Day Event', description: '72 hours away', startAt: eventAt(72), endAt: eventAt(72) },
        { id: 'past', slug: 'past', title: 'Past Event', description: 'Already started', startAt: eventAt(-1), endAt: eventAt(-1) },
      ],
    });

    expect(screen.getByText('Today Event')).toBeInTheDocument();
    expect(screen.getByText('Two Day Event')).toBeInTheDocument();
    expect(screen.getByText('Exactly Two Day Event')).toBeInTheDocument();
    expect(screen.queryByText('Over Two Day Event')).not.toBeInTheDocument();
    expect(screen.queryByText('Three Day Event')).not.toBeInTheDocument();
    expect(screen.queryByText('Past Event')).not.toBeInTheDocument();
  });

  it('handles date-only events and keeps expired and historical events out of Daily Events', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:00:00.000Z'));

    renderSection({
      categories: [],
      events: [
        { id: 'date-only', slug: 'date-only', title: 'Date Only Event', description: 'Pakistan event', startAt: '2026-09-11T12:00:00.000Z', endAt: '2026-09-11T23:59:59.999Z', dateOnly: true, sourceName: 'You.com free web search' },
        { id: 'expired', slug: 'expired', title: 'Expired Event', description: 'Expired', startAt: '2026-09-08T00:00:00.000Z', endAt: '2026-09-08T23:59:59.999Z', sourceName: 'Eventbrite Pakistan' },
        { id: 'historical', slug: 'historical', title: 'Historical Event', description: 'Document date: 1 January\n\nHistorical/cultural significance: Legacy record.' },
      ],
    });

    expect(screen.getByText('Date Only Event')).toBeInTheDocument();
    expect(screen.queryByText('Expired Event')).not.toBeInTheDocument();
    expect(screen.queryByText('Historical Event')).not.toBeInTheDocument();
  });

  it('excludes legacy historical catalog records with placeholder future dates', () => {
    renderSection({
          events: [{
            id: 'legacy-history',
            slug: 'legacy-history',
            title: 'Quaid-e-Azam Day',
            description: 'Document date: 25 December\n\nHistorical/cultural significance: Commemorates a historical occasion.',
            startAt: '2026-12-25T00:00:00.000Z',
            endAt: '2026-12-25T00:00:00.000Z',
          }],
          categories: [],
        });

    expect(screen.queryByText('Quaid-e-Azam Day')).not.toBeInTheDocument();
  });

  it('shows tourism, conference, and golf course filters in the daily event category list', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    renderSection({
      categories: [
        { id: 'sports', name: 'Sports Events', slug: 'sports-events' },
        { id: 'tourism', name: 'Tourism & Travel', slug: 'tourism-travel' },
        { id: 'conferences', name: 'Conferences', slug: 'conferences' },
      ],
      events: [
        { id: 'golf', slug: 'golf-event', title: 'Pakistan Open Golf Championship', description: 'Golf event', categoryId: 'sports', tags: ['golf course'], startAt: tomorrow, endAt: tomorrow },
        { id: 'tourism', slug: 'tourism-event', title: 'Pakistan Tourism Festival', description: 'Tourism event', categoryId: 'tourism', startAt: tomorrow, endAt: tomorrow },
        { id: 'conference', slug: 'conference-event', title: 'AI Summit Pakistan', description: 'Conference event', categoryId: 'conferences', startAt: tomorrow, endAt: tomorrow },
      ],
    });

    expect(screen.getByRole('button', { name: 'Sports Events' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tourism & Travel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Conferences' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sports Events' }));
    expect(screen.getByRole('button', { name: 'Golf Courses' })).toBeInTheDocument();
    expect(screen.getByText('Pakistan Open Golf Championship')).toBeInTheDocument();
    expect(screen.queryByText('Pakistan Tourism Festival')).not.toBeInTheDocument();
    expect(screen.queryByText('AI Summit Pakistan')).not.toBeInTheDocument();
  });

  it('keeps Golf Courses scoped to Sports Events instead of the global category list', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    renderSection({
      categories: [
        { id: 'sports', name: 'Sports Events', slug: 'sports-events' },
        { id: 'tourism', name: 'Tourism & Travel', slug: 'tourism-travel' },
        { id: 'conferences', name: 'Conferences', slug: 'conferences' },
      ],
      events: [
        { id: 'golf', slug: 'golf-event', title: 'Pakistan Open Golf Championship', description: 'Golf event', categoryId: 'sports', tags: ['golf courses'], startAt: tomorrow, endAt: tomorrow },
      ],
    });

    expect(screen.queryByRole('button', { name: 'Golf Courses' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sports Events' }));
    expect(screen.getByRole('button', { name: 'Golf Courses' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tourism & Travel' }));
    expect(screen.queryByRole('button', { name: 'Golf Courses' })).not.toBeInTheDocument();
  });

  it('renders the empty state when no current or upcoming events exist', () => {
    renderSection({ events: [], categories: [] });

    expect(screen.getByText('No daily events found')).toBeInTheDocument();
  });
});