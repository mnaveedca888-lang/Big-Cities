import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EVENT_SLUG_MAX_LENGTH, registerEventRoutes, resolveCategoryId } from './event.controller';

const apps: FastifyInstance[] = [];

async function createEventApi(events: Map<string, Record<string, unknown>>) {
  const eventFindUnique = vi.fn(async ({ where }: { where: { slug: string } }) => events.get(where.slug) ?? null);
  const prisma = {
    event: { findUnique: eventFindUnique },
    category: { findFirst: vi.fn() },
  } as any;
  const app = Fastify({ maxParamLength: EVENT_SLUG_MAX_LENGTH });
  apps.push(app);
  registerEventRoutes(app, prisma);
  await app.ready();
  return { app, eventFindUnique };
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('event category API selector', () => {
  const prisma = {
    category: { findFirst: vi.fn() },
  } as any;

  it.each([
    ['category id', 'category-id'],
    ['category name', 'Film Festivals'],
    ['category slug', 'film-festivals'],
  ])('resolves %s', async (_label, selector) => {
    prisma.category.findFirst.mockResolvedValue({ id: 'resolved-id' });
    await expect(resolveCategoryId(prisma, selector)).resolves.toBe('resolved-id');
  });

  it('rejects an invalid category', async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    await expect(resolveCategoryId(prisma, 'not-a-category')).rejects.toThrow('Invalid category');
  });
});

describe('event detail slug route', () => {
  const ordinarySlug = 'community-film-festival';
  const longSlug = 'lums-live-session-41-art-and-education-in-pakistan-practice-and-scope-part-1-lums-live-session-41-art-and-education-pakistan-practice-and-scope-part-1';
  const longestFindingSlug = 'the-street-law-clinical-legal-education-programme-and-social-justice-around-street-law-clinical-legal-education-programme-and-social-justice-around-world-afghanistan';

  it('resolves an ordinary event slug', async () => {
    const { app, eventFindUnique } = await createEventApi(new Map([[ordinarySlug, { id: 'event-1', slug: ordinarySlug, title: 'Community Film Festival' }]]));

    const response = await app.inject({ method: 'GET', url: `/events/${ordinarySlug}` });

    expect(response.statusCode).toBe(200);
    expect(response.json().data.slug).toBe(ordinarySlug);
    expect(eventFindUnique).toHaveBeenCalledWith({ where: { slug: ordinarySlug } });
  });

  it('resolves a valid slug longer than Fastify’s default 100-character limit', async () => {
    const { app } = await createEventApi(new Map([[longSlug, { id: 'event-long', slug: longSlug, title: 'Long Slug Event' }]]));

    const response = await app.inject({ method: 'GET', url: `/events/${longSlug}` });

    expect(longSlug.length).toBeGreaterThan(100);
    expect(response.statusCode).toBe(200);
    expect(response.json().data.slug).toBe(longSlug);
  });

  it('resolves the longest event slug in the audit findings', async () => {
    const { app } = await createEventApi(new Map([[longestFindingSlug, { id: 'event-longest', slug: longestFindingSlug, title: 'The Street Law Clinical Legal Education Programme' }]]));

    const response = await app.inject({ method: 'GET', url: `/events/${longestFindingSlug}` });

    expect(longestFindingSlug.length).toBe(165);
    expect(response.statusCode).toBe(200);
    expect(response.json().data.slug).toBe(longestFindingSlug);
  });

  it('preserves the existing 404 response for an unknown valid slug', async () => {
    const { app } = await createEventApi(new Map());

    const response = await app.inject({ method: 'GET', url: '/events/unknown-event-slug' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ success: false, error: { message: 'Not found' } });
  });

  it('rejects malformed and excessively long slugs without a database lookup', async () => {
    const { app, eventFindUnique } = await createEventApi(new Map());

    const malformedResponse = await app.inject({ method: 'GET', url: '/events/not_a-valid-slug' });
    const excessiveResponse = await app.inject({ method: 'GET', url: `/events/${'a'.repeat(EVENT_SLUG_MAX_LENGTH + 1)}` });

    expect(malformedResponse.statusCode).toBe(400);
    expect(excessiveResponse.statusCode).toBe(404);
    expect(eventFindUnique).not.toHaveBeenCalled();
  });
});
