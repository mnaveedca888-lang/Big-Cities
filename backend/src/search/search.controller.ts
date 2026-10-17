import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const MAX_RESULTS_PER_GROUP = 8;
const excludedEventTitles = new Set(['Jashn-e-Baharan (Basant)']);

function normalizeQuery(value: string) {
  return value.trim();
}

export function registerSearchRoutes(app: FastifyInstance, prisma: PrismaClient) {
  app.get('/search', async (request, reply) => {
    const queryValue = (request.query as Record<string, unknown> | undefined)?.q;
    const query = normalizeQuery(typeof queryValue === 'string' ? queryValue : '');

    if (!query || query.length < 2) {
      return {
        success: true,
        data: {
          query,
          events: [],
          countries: [],
          cities: [],
          categories: [],
          hasMore: {
            events: false,
            countries: false,
            cities: false,
            categories: false,
          },
        },
      };
    }

    try {
      const [matchedCategories, matchedCountries, matchedCities] = await Promise.all([
        prisma.category.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { slug: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { id: true, name: true, slug: true },
          take: MAX_RESULTS_PER_GROUP + 1,
        }),
        prisma.country.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { code: { contains: query, mode: 'insensitive' } },
            ],
          },
          select: { code: true, name: true },
          take: MAX_RESULTS_PER_GROUP + 1,
        }),
        prisma.city.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { slug: { contains: query, mode: 'insensitive' } },
              {
                countryCode: {
                  in: (await prisma.country.findMany({
                    where: {
                      OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { code: { contains: query, mode: 'insensitive' } },
                      ],
                    },
                    select: { code: true },
                  })).map((country) => country.code),
                },
              },
            ],
          },
          select: { slug: true, name: true, countryCode: true },
          take: MAX_RESULTS_PER_GROUP + 1,
        }),
      ]);

      const categoryIds = matchedCategories.map((category) => category.id);
      const countryCodes = matchedCountries.map((country) => country.code);
      const citySlugs = matchedCities.map((city) => city.slug);

      const events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { contains: query, mode: 'insensitive' } },
            ...(categoryIds.length ? [{ categoryId: { in: categoryIds } }] : []),
            ...(countryCodes.length ? [{ countryCode: { in: countryCodes } }] : []),
            ...(citySlugs.length ? [{ citySlug: { in: citySlugs } }] : []),
          ],
          NOT: { title: { in: Array.from(excludedEventTitles) } },
        },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          categoryId: true,
          countryCode: true,
          citySlug: true,
          startAt: true,
          endAt: true,
          tags: true,
          featured: true,
          image: true,
        },
        orderBy: { startAt: 'desc' },
        take: MAX_RESULTS_PER_GROUP + 1,
      });

      const categoryLookup = new Map(matchedCategories.map((category) => [category.id, category]));
      const countryLookup = new Map(matchedCountries.map((country) => [country.code, country]));
      const cityLookup = new Map(matchedCities.map((city) => [city.slug, city]));

      const mappedEvents = events.map((event) => {
        const category = event.categoryId ? categoryLookup.get(event.categoryId) : undefined;
        const country = event.countryCode ? countryLookup.get(event.countryCode) : undefined;
        const city = event.citySlug ? cityLookup.get(event.citySlug) : undefined;
        const tags = event.tags ? event.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];

        return {
          id: event.id,
          slug: event.slug,
          title: event.title,
          description: event.description ?? '',
          category: category?.name ?? '',
          country: country?.name ?? '',
          city: city?.name ?? '',
          date: event.startAt.toISOString(),
          time: event.startAt.toISOString(),
          price: '',
          image: event.image ?? null,
          featured: event.featured,
          organizer: '',
          venue: '',
          language: '',
          tags,
          attendees: 0,
        };
      });

      return {
        success: true,
        data: {
          query,
          events: mappedEvents.slice(0, MAX_RESULTS_PER_GROUP),
          countries: matchedCountries.slice(0, MAX_RESULTS_PER_GROUP),
          cities: matchedCities.slice(0, MAX_RESULTS_PER_GROUP),
          categories: matchedCategories.slice(0, MAX_RESULTS_PER_GROUP),
          hasMore: {
            events: events.length > MAX_RESULTS_PER_GROUP,
            countries: matchedCountries.length > MAX_RESULTS_PER_GROUP,
            cities: matchedCities.length > MAX_RESULTS_PER_GROUP,
            categories: matchedCategories.length > MAX_RESULTS_PER_GROUP,
          },
        },
      };
    } catch (error) {
      app.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          message: 'Search is temporarily unavailable. Please try again shortly.',
        },
      });
    }
  });
}

export default registerSearchRoutes;
