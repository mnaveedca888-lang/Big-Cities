import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { categorySlug } from './ingestion/categories';
import { normalizeLocalImageUrl } from '../images/local-image';

export class EventService {
  constructor(private prisma: PrismaClient) {}

  private slugify(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private tagsToString(tags?: string[] | string | null) {
    if (!tags) return null;
    if (Array.isArray(tags)) return tags.map((t) => t.trim()).filter(Boolean).join(',');
    return (tags as string).split(',').map((t) => t.trim()).filter(Boolean).join(',');
  }

  private mapEvent(event: any) {
    return {
      ...event,
      image: normalizeLocalImageUrl(event.image),
    };
  }

  async create(data: {
    title: string;
    description?: string | null;
    startAt: Date;
    endAt: Date;
    categoryId?: string | null;
    countryCode?: string | null;
    continentName?: string | null;
    citySlug?: string | null;
    exactCity?: boolean | null;
    tags?: string[] | string | null;
    featured?: boolean | null;
    verificationStatus?: string | null;
    trending?: boolean | null;
    enabled?: boolean | null;
    image?: string | null;
    dateOnly?: boolean;
    venue?: string | null;
    organizer?: string | null;
    province?: string | null;
    sourceName?: string | null;
    sourceUrl?: string | null;
    sourceType?: string | null;
    primarySourceUrl?: string | null;
    primarySourceName?: string | null;
    primarySourceType?: string | null;
    discoverySourceUrl?: string | null;
    discoverySourceName?: string | null;
  }) {
    const baseSlug = this.slugify(data.title || 'event');
    let slug = baseSlug;
    // ensure slug uniqueness by appending short id on conflict
    for (let i = 0; i < 5; i++) {
      try {
        const created = await this.prisma.event.create({
          data: {
            slug,
            title: data.title,
            description: data.description || null,
            categoryId: data.categoryId || null,
            countryCode: data.countryCode || null,
            citySlug: data.citySlug || null,
            startAt: data.startAt,
            endAt: data.endAt,
            tags: this.tagsToString(data.tags) || null,
            featured: data.featured || false,
            trending: data.trending || false,
            enabled: data.enabled ?? true,
            image: normalizeLocalImageUrl(data.image),
            dateOnly: data.dateOnly ?? false,
            venue: data.venue ?? null,
            organizer: data.organizer ?? null,
            province: data.province ?? null,
            sourceName: data.sourceName ?? null,
            sourceUrl: data.sourceUrl ?? null,
            sourceType: data.sourceType ?? null,
            primarySourceUrl: data.primarySourceUrl ?? null,
            primarySourceName: data.primarySourceName ?? null,
            primarySourceType: data.primarySourceType ?? null,
            discoverySourceUrl: data.discoverySourceUrl ?? null,
            discoverySourceName: data.discoverySourceName ?? null,
          },
        });
        return created;
      } catch (err: any) {
        // unique constraint on slug -> append random suffix and retry
        if (err?.code !== 'P2002') throw err;
        slug = `${baseSlug}-${randomUUID().slice(0, 8)}`;
      }
    }
    // final attempt, let Prisma raise the error
    return this.prisma.event.create({
      data: {
        slug,
        title: data.title,
        description: data.description || null,
        categoryId: data.categoryId || null,
        countryCode: data.countryCode || null,
        citySlug: data.citySlug || null,
        startAt: data.startAt,
        endAt: data.endAt,
        tags: this.tagsToString(data.tags) || null,
        featured: data.featured || false,
        trending: data.trending || false,
        enabled: data.enabled ?? true,
        image: normalizeLocalImageUrl(data.image),
        dateOnly: data.dateOnly ?? false,
        venue: data.venue ?? null,
        organizer: data.organizer ?? null,
        province: data.province ?? null,
        sourceName: data.sourceName ?? null,
        sourceUrl: data.sourceUrl ?? null,
        sourceType: data.sourceType ?? null,
        primarySourceUrl: data.primarySourceUrl ?? null,
        primarySourceName: data.primarySourceName ?? null,
        primarySourceType: data.primarySourceType ?? null,
        discoverySourceUrl: data.discoverySourceUrl ?? null,
        discoverySourceName: data.discoverySourceName ?? null,
      },
    });
  }

  async upsertVerifiedSeed(data: {
    title: string;
    description: string;
    category: string;
    citySlug: string;
    venue: string;
    startAt: Date;
    endAt: Date;
    dateOnly?: boolean;
    sourceUrl: string;
    sourceName: string;
    verificationReason?: string;
  }) {
    const city = await this.prisma.city.findUnique({ where: { slug: data.citySlug }, select: { slug: true, countryCode: true } });
    if (!city || city.countryCode !== 'PK') throw new Error(`Invalid Pakistan city: ${data.citySlug}`);
    const categoryRecord = await this.prisma.category.upsert({
      where: { slug: categorySlug(data.category as any) },
      update: { name: data.category },
      create: { name: data.category, slug: categorySlug(data.category as any) },
    });
    const contentHash = createHash('sha256')
      .update(`${this.slugify(data.title)}|${data.citySlug}|${data.startAt.toISOString().slice(0, 10)}|${data.venue.toLowerCase()}`)
      .digest('hex');
    const dayStart = new Date(Date.UTC(data.startAt.getUTCFullYear(), data.startAt.getUTCMonth(), data.startAt.getUTCDate()));
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const existing = await this.prisma.event.findFirst({
      where: {
        OR: [
          { sourceUrl: data.sourceUrl, title: { equals: data.title, mode: 'insensitive' } },
          { contentHash },
          { title: { equals: data.title, mode: 'insensitive' }, countryCode: 'PK', citySlug: data.citySlug, startAt: { gte: dayStart, lt: dayEnd } },
        ],
      },
    });
    const now = new Date();
    const eventData: any = {
      title: data.title,
      description: data.description,
      categoryId: categoryRecord.id,
      countryCode: 'PK',
      citySlug: data.citySlug,
      startAt: data.startAt,
      endAt: data.endAt,
      dateOnly: data.dateOnly ?? false,
      tags: `${data.category.toLowerCase()},pk,verified seed`,
      venue: data.venue,
      sourceName: data.sourceName,
      sourceUrl: data.sourceUrl,
      sourceType: 'verified-seed',
      verificationStatus: 'VERIFIED',
      verificationScore: 1,
      verificationReason: data.verificationReason || 'Explicitly supplied verified seed event.',
      verifiedAt: now,
      lastCheckedAt: now,
      lastSeenAt: now,
      lastCollectedAt: now,
      contentHash,
      enabled: true,
    };
    if (existing) {
      await this.prisma.event.update({ where: { id: existing.id }, data: eventData });
      return { action: 'updated' as const, event: { ...existing, ...eventData } };
    }
    const slugBase = `${this.slugify(data.title)}-${contentHash.slice(0, 10)}`;
    let slug = slugBase;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const event = await this.prisma.event.create({ data: { ...eventData, slug } });
        return { action: 'inserted' as const, event };
      } catch (error: any) {
        if (error?.code !== 'P2002') throw error;
        slug = `${slugBase}-${randomUUID().slice(0, 8)}`;
      }
    }
    const event = await this.prisma.event.create({ data: { ...eventData, slug } });
    return { action: 'inserted' as const, event };
  }

  async updateBySlug(slug: string, patch: Partial<{
    title: string;
    description: string | null;
    startAt: Date;
    endAt: Date;
    categoryId: string | null;
    countryCode: string | null;
    citySlug: string | null;
    tags: string[] | string | null;
    featured: boolean;
    trending: boolean;
    enabled: boolean;
    image: string | null;
    dateOnly: boolean;
    venue: string | null;
    organizer: string | null;
    province: string | null;
    sourceName: string | null;
    sourceUrl: string | null;
    sourceType: string | null;
    primarySourceUrl: string | null;
    primarySourceName: string | null;
    primarySourceType: string | null;
    discoverySourceUrl: string | null;
    discoverySourceName: string | null;
  }>) {
    const data: any = {};
    if (patch.title) data.title = patch.title;
    if (patch.description !== undefined) data.description = patch.description;
    if (patch.startAt) data.startAt = patch.startAt;
    if (patch.endAt) data.endAt = patch.endAt;
    if (patch.categoryId !== undefined) data.categoryId = patch.categoryId;
    if (patch.countryCode !== undefined) data.countryCode = patch.countryCode;
    if (patch.citySlug !== undefined) data.citySlug = patch.citySlug;
    if (patch.tags !== undefined) data.tags = this.tagsToString(patch.tags as any);
    if (patch.featured !== undefined) data.featured = patch.featured;
    if (patch.trending !== undefined) data.trending = patch.trending;
    if (patch.enabled !== undefined) data.enabled = patch.enabled;
    if (patch.image !== undefined) data.image = normalizeLocalImageUrl(patch.image);
    if (patch.dateOnly !== undefined) data.dateOnly = patch.dateOnly;
    if (patch.venue !== undefined) data.venue = patch.venue;
    if (patch.organizer !== undefined) data.organizer = patch.organizer;
    if (patch.province !== undefined) data.province = patch.province;
    if (patch.sourceName !== undefined) data.sourceName = patch.sourceName;
    if (patch.sourceUrl !== undefined) data.sourceUrl = patch.sourceUrl;
    if (patch.sourceType !== undefined) data.sourceType = patch.sourceType;
    if (patch.primarySourceUrl !== undefined) data.primarySourceUrl = patch.primarySourceUrl;
    if (patch.primarySourceName !== undefined) data.primarySourceName = patch.primarySourceName;
    if (patch.primarySourceType !== undefined) data.primarySourceType = patch.primarySourceType;
    if (patch.discoverySourceUrl !== undefined) data.discoverySourceUrl = patch.discoverySourceUrl;
    if (patch.discoverySourceName !== undefined) data.discoverySourceName = patch.discoverySourceName;

    return this.prisma.event.update({ where: { slug }, data });
  }

  async deleteBySlug(slug: string) {
    return this.prisma.event.delete({ where: { slug } });
  }

  async getBySlug(slug: string) {
    const event = await this.prisma.event.findUnique({ where: { slug } });
    if (!event) return null;
    return this.mapEvent(event);
  }

  async getById(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    return event ? this.mapEvent(event) : null;
  }

  async list(opts: {
    q?: string | null;
    categoryId?: string | null;
    countryCode?: string | null;
    continentName?: string | null;
    citySlug?: string | null;
    exactCity?: boolean | null;
    tags?: string[] | null;
    featured?: boolean | null;
    verificationStatus?: string | null;
    includeDisabled?: boolean | null;
    dailyOnly?: boolean | null;
    upcomingOnly?: boolean | null;
    page?: number;
    perPage?: number;
    sort?: string | null;
  }) {
    const page = Math.max(1, opts.page || 1);
    const perPage = Math.min(100, Math.max(1, opts.perPage || 20));
    const where: any = {};
    if (opts.includeDisabled !== true) where.enabled = true;

    if (opts.upcomingOnly) {
      const now = new Date();
      where.startAt = { gte: now };
      where.endAt = { gte: now };
    }

    if (opts.dailyOnly) {
      const now = new Date();
      const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      where.startAt = { lte: cutoff };
      where.endAt = { gte: now };
      where.verificationStatus = 'VERIFIED';
    }

    if (opts.q) {
      where.OR = [
        { title: { contains: opts.q, mode: 'insensitive' } },
        { description: { contains: opts.q, mode: 'insensitive' } },
      ];
    }
    if (opts.categoryId) where.categoryId = opts.categoryId;
    if (opts.countryCode) where.countryCode = opts.countryCode;
    if (opts.continentName && !opts.countryCode) {
      const countries = await this.prisma.country.findMany({ where: { continent: { name: opts.continentName } }, select: { code: true } });
      where.countryCode = { in: countries.map((country: { code: string }) => country.code) };
    }
    if (opts.featured !== undefined && opts.featured !== null) where.featured = opts.featured;
    if (opts.verificationStatus) where.verificationStatus = opts.verificationStatus;
    if (opts.tags && opts.tags.length) {
      where.AND = (where.AND || []).concat(opts.tags.map((t) => ({ tags: { contains: t, mode: 'insensitive' } })));
    }

    if (opts.citySlug) {
      if (opts.exactCity) {
        where.citySlug = opts.citySlug;
      } else {
        const city = await this.prisma.city.findUnique({ where: { slug: opts.citySlug }, select: { countryCode: true } });
        if (city?.countryCode) {
          where.AND = (where.AND || []).concat({
            OR: [
              { citySlug: opts.citySlug },
              { countryCode: city.countryCode, citySlug: null },
            ],
          });
        } else {
          where.citySlug = opts.citySlug;
        }
      }
    }

    // sorting
    let orderBy: any = { startAt: 'desc' };
    if (opts.sort) {
      const [field, dir] = opts.sort.split(':');
      const allowed = ['startAt', 'createdAt', 'updatedAt', 'title'];
      if (allowed.includes(field)) orderBy = { [field]: dir === 'asc' ? 'asc' : 'desc' };
    }

    const total = await this.prisma.event.count({ where });
    const rawItems = await this.prisma.event.findMany({ where, orderBy, skip: (page - 1) * perPage, take: perPage });
    const citySlugs = [...new Set(rawItems.map((event: any) => event.citySlug).filter(Boolean))];
    const categoryIds = [...new Set(rawItems.map((event: any) => event.categoryId).filter(Boolean))];
    const cities = citySlugs.length
      ? await this.prisma.city.findMany({ where: { slug: { in: citySlugs } }, select: { slug: true, name: true } })
      : [];
    const categories = categoryIds.length
      ? await this.prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } })
      : [];
    const cityNames = new Map(cities.map((city: { slug: string; name: string }) => [city.slug, city.name]));
    const categoryNames = new Map(categories.map((category: { id: string; name: string }) => [category.id, category.name]));
    const items = rawItems.map((event: any) => this.mapEvent({
      ...event,
      category: event.categoryId ? categoryNames.get(event.categoryId) || null : null,
      city: event.citySlug ? cityNames.get(event.citySlug) || event.citySlug : null,
    }));

    return {
      items,
      pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }
}

export default EventService;
