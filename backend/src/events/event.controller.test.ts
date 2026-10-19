import Fastify, { type FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EVENT_SLUG_MAX_LENGTH, registerEventRoutes, resolveCategoryId } from './event.controller';

const apps: FastifyInstance[] = [];

async function createEventApi(events: Map<string, Record<string, unknown>>) {
  const eventFindUnique = vi.fn(async ({ where }: { where: { slug: string } }) => events.get(where.slug) ?? null);
  const eventCreate = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'created-event', ...data }));
  const prisma = {
    event: { findUnique: eventFindUnique, create: eventCreate },
    category: { findFirst: vi.fn() },
    user: { findUnique: vi.fn().mockResolvedValue({ id: 'admin-user', role: { name: 'admin' } }) },
  } as any;
  const app = Fastify({ maxParamLength: EVENT_SLUG_MAX_LENGTH });
  apps.push(app);
  registerEventRoutes(app, prisma);
  await app.ready();
  return { app, eventFindUnique, eventCreate };
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

describe('event image writes', () => {
  const originalSecret = process.env.JWT_ACCESS_TOKEN_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_ACCESS_TOKEN_SECRET;
    else process.env.JWT_ACCESS_TOKEN_SECRET = originalSecret;
  });

  it.each([
    'https://images.unsplash.com/photo.jpg',
    '/images/not-downloaded/event.webp',
  ])('rejects non-local or missing image path %s before creating an event', async (image) => {
    process.env.JWT_ACCESS_TOKEN_SECRET = 'test-access-secret';
    const { app, eventCreate } = await createEventApi(new Map());
    const token = jwt.sign({ sub: 'admin-user' }, 'test-access-secret');

    const response = await app.inject({
      method: 'POST',
      url: '/events',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Local Image Validation Event',
        startAt: '2026-11-01T10:00:00.000Z',
        endAt: '2026-11-01T11:00:00.000Z',
        image,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it('accepts an existing local image path', async () => {
    process.env.JWT_ACCESS_TOKEN_SECRET = 'test-access-secret';
    const { app, eventCreate } = await createEventApi(new Map());
    const token = jwt.sign({ sub: 'admin-user' }, 'test-access-secret');
    const image = '/images/Logo_design_for_Big_Cities_202608061337_11zon.webp';

    const response = await app.inject({
      method: 'POST',
      url: '/events',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Local Image Validation Event',
        startAt: '2026-11-01T10:00:00.000Z',
        endAt: '2026-11-01T11:00:00.000Z',
        image,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(eventCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ image }) }));
  });
});
