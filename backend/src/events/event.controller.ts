import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import EventService from './event.service';
import AuthService from '../auth/auth.service';
import { z } from 'zod';
import { isSafePersistentUploadUrl, normalizeLocalImageUrl } from '../images/local-image';
import { drainImageCleanupQueue } from '../uploads/image-lifecycle';
import { sendApiError } from '../utils/api-error';

const localImageSchema = z.string().trim().refine(
  (value) => normalizeLocalImageUrl(value) !== null || isSafePersistentUploadUrl(value),
  'Image URL must reference an existing local /images/ file',
);
const externalHttpUrlSchema = z.string().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === 'http:' || protocol === 'https:';
}, 'URL must use HTTP or HTTPS');

const createSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  startAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' }),
  endAt: z.string().refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Invalid date' }),
  categoryId: z.string().uuid().optional().nullable(),
  countryCode: z.string().optional().nullable(),
  citySlug: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  featured: z.boolean().optional(),
  trending: z.boolean().optional(),
  enabled: z.boolean().optional(),
  image: localImageSchema.optional().nullable(),
  dateOnly: z.boolean().optional(),
  venue: z.string().trim().optional().nullable(),
  organizer: z.string().trim().optional().nullable(),
  province: z.string().trim().optional().nullable(),
  sourceName: z.string().trim().optional().nullable(),
  sourceUrl: externalHttpUrlSchema.optional().nullable(),
  sourceType: z.string().trim().optional().nullable(),
  primarySourceUrl: externalHttpUrlSchema.optional().nullable(),
  primarySourceName: z.string().trim().optional().nullable(),
  primarySourceType: z.string().trim().optional().nullable(),
  discoverySourceUrl: externalHttpUrlSchema.optional().nullable(),
  discoverySourceName: z.string().trim().optional().nullable(),
});

const updateSchema = createSchema.partial();

// Fastify applies maxParamLength to every route parameter on the server instance.
export const EVENT_SLUG_MAX_LENGTH = 200;
const eventSlugSchema = z.string()
  .min(1)
  .max(EVENT_SLUG_MAX_LENGTH)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid event slug');

const listQuery = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  country: z.string().optional(),
  continent: z.string().optional(),
  city: z.string().optional(),
  exactCity: z.string().optional(),
  tags: z.string().optional(),
  includeDisabled: z.string().optional(),
  enabled: z.enum(['true', 'false']).optional(),
  dailyOnly: z.string().optional(),
  page: z.string().transform((s) => parseInt(s || '1', 10)).optional(),
  perPage: z.string().transform((s) => parseInt(s || '20', 10)).optional(),
  sort: z.string().optional(),
  featured: z.string().optional(),
  verificationStatus: z.enum(['VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED', 'REJECTED']).optional(),
});

function hasRole(prisma: PrismaClient, auth: AuthService, token: string | null, allowed: string[]) {
  return (async () => {
    if (!token) return false;
    const userId = await auth.verifyAccessToken(token).catch(() => null);
    if (!userId) return false;
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) return false;
    const roleName = user.role?.name || 'user';
    return allowed.includes(roleName);
  })();
}

export async function resolveCategoryId(prisma: PrismaClient, selector: string) {
  const value = selector.trim();
  if (!value) throw new Error('Invalid category');
  const category = await prisma.category.findFirst({
    where: {
      OR: [
        { id: value },
        { slug: value.toLowerCase() },
        { name: { equals: value, mode: 'insensitive' } },
      ],
    },
    select: { id: true },
  });
  if (!category) throw new Error('Invalid category');
  return category.id;
}

async function validateEventRelationships(
  prisma: PrismaClient,
  values: { categoryId?: string | null; countryCode?: string | null; citySlug?: string | null },
) {
  if (values.categoryId && !await prisma.category.findUnique({ where: { id: values.categoryId } })) {
    return 'Category not found';
  }

  if (values.countryCode && !await prisma.country.findUnique({ where: { code: values.countryCode } })) {
    return 'Country not found';
  }

  if (values.citySlug) {
    const city = await prisma.city.findUnique({ where: { slug: values.citySlug } });
    if (!city) return 'City not found';
    if (!values.countryCode || city.countryCode !== values.countryCode) {
      return 'Event city must belong to the selected country';
    }
  }

  return null;
}

export function registerEventRoutes(app: FastifyInstance, prisma: PrismaClient) {
  const service = new EventService(prisma as any);
  const auth = new AuthService(prisma as any);

  app.get('/events', async (request, reply) => {
    try {
      const query = listQuery.parse(request.query || {});
      const tags = query.tags ? query.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined;
      const featured = query.featured ? query.featured === 'true' : undefined;
      const categoryId = query.category ? await resolveCategoryId(prisma, query.category) : undefined;
      let includeDisabled = false;
      if (query.includeDisabled === 'true') {
        const authHeader = (request.headers.authorization || '') as string;
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
        const allowed = ['admin', 'organizer'];
        const ok = await hasRole(prisma, auth, token, allowed);
        if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
        includeDisabled = true;
      }
      const res = await service.list({
        q: query.q,
        categoryId,
        countryCode: query.country || undefined,
        continentName: query.continent || undefined,
        citySlug: query.city || undefined,
        exactCity: query.exactCity === 'true',
        tags,
        featured,
        verificationStatus: query.verificationStatus,
        includeDisabled,
        enabled: query.enabled === undefined ? undefined : query.enabled === 'true',
        dailyOnly: query.dailyOnly === 'true',
        page: (query.page as unknown as number) || 1,
        perPage: (query.perPage as unknown as number) || 20,
        sort: query.sort || undefined,
      });
      reply.send({ success: true, data: res });
    } catch (err: any) {
      return sendApiError(reply, app.log, err, 'Event request failed.');
    }
  });

  app.get('/events/featured', async (request, reply) => {
    const res = await service.list({
      page: 1,
      perPage: 3,
      sort: 'startAt:asc',
      upcomingOnly: true,
      verificationStatus: 'VERIFIED',
    });
    reply.send({ success: true, data: res.items });
  });

  app.get('/events/:slug', async (request, reply) => {
    try {
      const slug = eventSlugSchema.parse((request.params as any).slug);
      const ev = await service.getBySlug(slug);
      if (!ev) return reply.code(404).send({ success: false, error: { message: 'Not found' } });
      reply.send({ success: true, data: ev });
    } catch (err: any) {
      return sendApiError(reply, app.log, err, 'Event request failed.');
    }
  });

  app.post('/events', async (request, reply) => {
    try {
      const authHeader = (request.headers.authorization || '') as string;
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
      const allowed = ['admin', 'organizer'];
      const ok = await hasRole(prisma, auth, token, allowed);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const body = createSchema.parse(request.body);
      if (new Date(body.startAt) > new Date(body.endAt)) return reply.code(400).send({ success: false, error: { message: 'startAt must be before endAt' } });
      const relationshipError = await validateEventRelationships(prisma, body);
      if (relationshipError) return reply.code(400).send({ success: false, error: { message: relationshipError } });
      const created = await service.create({
        title: body.title,
        description: body.description || null,
        startAt: new Date(body.startAt),
        endAt: new Date(body.endAt),
        categoryId: body.categoryId || null,
        countryCode: body.countryCode || null,
        citySlug: body.citySlug || null,
        tags: body.tags || null,
        featured: body.featured || false,
        trending: body.trending || false,
        enabled: body.enabled !== undefined ? body.enabled : true,
        image: body.image || null,
        dateOnly: body.dateOnly,
        venue: body.venue,
        organizer: body.organizer,
        province: body.province,
        sourceName: body.sourceName,
        sourceUrl: body.sourceUrl,
        sourceType: body.sourceType,
        primarySourceUrl: body.primarySourceUrl,
        primarySourceName: body.primarySourceName,
        primarySourceType: body.primarySourceType,
        discoverySourceUrl: body.discoverySourceUrl,
        discoverySourceName: body.discoverySourceName,
      });
      reply.code(201).send({ success: true, data: created });
    } catch (err: any) {
      return sendApiError(reply, app.log, err, 'Event request failed.');
    }
  });

  app.patch('/events/:slug', async (request, reply) => {
    try {
      const authHeader = (request.headers.authorization || '') as string;
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
      const allowed = ['admin', 'organizer'];
      const ok = await hasRole(prisma, auth, token, allowed);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const body = updateSchema.parse(request.body || {});
      const slug = eventSlugSchema.parse((request.params as any).slug);
      const existing = await service.getBySlug(slug);
      if (!existing) return reply.code(404).send({ success: false, error: { message: 'Not found' } });
      const nextStartAt = body.startAt ? new Date(body.startAt) : new Date(existing.startAt);
      const nextEndAt = body.endAt ? new Date(body.endAt) : new Date(existing.endAt);
      if (nextStartAt > nextEndAt) return reply.code(400).send({ success: false, error: { message: 'startAt must be before endAt' } });
      const relationshipError = await validateEventRelationships(prisma, {
        categoryId: body.categoryId !== undefined ? body.categoryId : existing.categoryId,
        countryCode: body.countryCode !== undefined ? body.countryCode : existing.countryCode,
        citySlug: body.citySlug !== undefined ? body.citySlug : existing.citySlug,
      });
      if (relationshipError) return reply.code(400).send({ success: false, error: { message: relationshipError } });
      const patch: any = {};
      if (body.title) patch.title = body.title;
      if (body.description !== undefined) patch.description = body.description;
      if (body.startAt) patch.startAt = new Date(body.startAt);
      if (body.endAt) patch.endAt = new Date(body.endAt);
      if (body.categoryId !== undefined) patch.categoryId = body.categoryId;
      if (body.countryCode !== undefined) patch.countryCode = body.countryCode;
      if (body.citySlug !== undefined) patch.citySlug = body.citySlug;
      if (body.tags !== undefined) patch.tags = body.tags;
      if (body.featured !== undefined) patch.featured = body.featured;
      if (body.trending !== undefined) patch.trending = body.trending;
      if (body.enabled !== undefined) patch.enabled = body.enabled;
      if (body.image !== undefined) patch.image = body.image;
      if (body.dateOnly !== undefined) patch.dateOnly = body.dateOnly;
      if (body.venue !== undefined) patch.venue = body.venue;
      if (body.organizer !== undefined) patch.organizer = body.organizer;
      if (body.province !== undefined) patch.province = body.province;
      if (body.sourceName !== undefined) patch.sourceName = body.sourceName;
      if (body.sourceUrl !== undefined) patch.sourceUrl = body.sourceUrl;
      if (body.sourceType !== undefined) patch.sourceType = body.sourceType;
      if (body.primarySourceUrl !== undefined) patch.primarySourceUrl = body.primarySourceUrl;
      if (body.primarySourceName !== undefined) patch.primarySourceName = body.primarySourceName;
      if (body.primarySourceType !== undefined) patch.primarySourceType = body.primarySourceType;
      if (body.discoverySourceUrl !== undefined) patch.discoverySourceUrl = body.discoverySourceUrl;
      if (body.discoverySourceName !== undefined) patch.discoverySourceName = body.discoverySourceName;
      const updated = await service.updateBySlug(slug, patch);
      await drainImageCleanupQueue(prisma, app.log);
      reply.send({ success: true, data: updated });
    } catch (err: any) {
      return sendApiError(reply, app.log, err, 'Event request failed.');
    }
  });

  app.delete('/events/:slug', async (request, reply) => {
    try {
      const authHeader = (request.headers.authorization || '') as string;
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
      const allowed = ['admin', 'organizer'];
      const ok = await hasRole(prisma, auth, token, allowed);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const slug = eventSlugSchema.parse((request.params as any).slug);
      const existing = await service.getBySlug(slug);
      if (!existing) return reply.code(404).send({ success: false, error: { message: 'Not found' } });
      const savedEventCount = await prisma.savedEvent.count({ where: { eventId: existing.id } });
      if (savedEventCount) {
        return reply.code(409).send({ success: false, error: { message: 'Event cannot be deleted while users have saved it.' } });
      }
      await service.deleteBySlug(slug);
      await drainImageCleanupQueue(prisma, app.log);
      reply.code(204).send();
    } catch (err: any) {
      return sendApiError(reply, app.log, err, 'Event request failed.');
    }
  });
}

export default registerEventRoutes;
