import fs from 'fs';
import path from 'path';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import AuthService from '../auth/auth.service';
import { buildPagination } from '../utils/pagination';
import { buildCanonicalCountryProfile } from './countryProfile';
import { buildCanonicalCityProfile } from './cityProfile';
import { localImageUrl, normalizeLocalImageUrl } from '../images/local-image';

const PAKISTAN_IMAGE_FOLDER = 'Pakistan cities images';
const PAKISTAN_COUNTRY_IMAGE_FILE = 'Pakistan.jpg';
const PAKISTAN_CITY_IMAGE_FILES: Record<string, string> = {
  'pk-lahore': 'Lahore.png',
  'pk-karachi': 'Karachi.png',
  'pk-islamabad': 'Islamabad.jpg',
  'pk-rawalpindi': 'Rawalpindi.jpeg',
  'pk-faisalabad': 'Faisalabad.png',
  'pk-multan': 'Multan.png',
  'pk-peshawar': 'Peshawar.png',
  'pk-quetta': 'Quetta.png',
  'pk-sialkot': 'Sialkot.png',
};

const AZERBAIJAN_IMAGE_FOLDER = 'Azerbaijan cities images';
const AZERBAIJAN_CITY_IMAGE_FILES: Record<string, string> = {
  'az-baku': 'BAKU.jpg',
  'az-ganja': 'Ganja.jpg',
  'az-lankaran': 'Lankaran.jpeg',
  'az-nakhchivan': 'Nakhchivan.jpg',
  'az-gabala': 'Gabala.jpg',
  'az-lachin': 'Lachin.jpg',
  'az-fuzuli': 'Fuzuli.jpg',
  'az-zangilan': 'Zangilan.jpg',
  'az-zaqatala': 'Zaqatala.jpg',
};

const ASIA_IMAGE_FOLDER = 'Asia cities images';
const SOUTH_AMERICA_IMAGE_FOLDER = 'South America cities images';
const NORTH_AMERICA_IMAGE_FOLDER = 'North America cities images';
const NORTH_AMERICA_CITY_IMAGE_ALIASES: Record<string, string> = {
  'ag-v-c-bird-international-airport': 'ag-st-johns.webp',
  'bs-exuma-international-airport': 'bs-george-town.webp',
  'cu-ignacio-agramonte-international-airport': 'cu-camag-ey.webp',
  'cu-frank-pa-s-international-airport': 'cu-holgu-n.webp',
  'cu-jardines-del-rey-airport': 'cu-cayo-coco.webp',
  'cu-jos-mart-international-airport': 'cu-havana.webp',
  'cu-juan-gualberto-g-mez-international-airport': 'cu-varadero.webp',
  'cu-vilo-acu-a-airport': 'cu-cayo-largo-del-sur.webp',
  'cr-guanacaste-airport-daniel-oduber-quir-s-international-airport': 'cr-liberia.webp',
  'do-gregorio-luper-n-international-airport': 'do-puerto-plata.webp',
  'do-las-am-ricas-international-airport': 'do-santo-domingo.webp',
  'do-la-romana-international-airport': 'do-la-romana.webp',
  'hn-golos-n-international-airport': 'hn-la-ceiba.webp',
  'hn-juan-manuel-g-lvez-international-airport': 'hn-roat-n.webp',
  'hn-palmerola-international-airport': 'hn-comayagua.webp',
  'hn-ram-n-villeda-morales-international-airport': 'hn-san-pedro-sula.webp',
  'hn-toncont-n-international-airport': 'hn-tegucigalpa.webp',
  'ht-toussaint-louverture-international-airport': 'ht-port-au-prince.webp',
  'jm-ian-fleming-international-airport': 'jm-ocho-rios.webp',
  'mx-general-ignacio-pesqueira-garc-a-international-airport': 'mx-hermosillo.webp',
  'mx-general-mariano-escobedo-international-airport': 'mx-monterrey.webp',
  'mx-general-rafael-buelna-international-airport': 'mx-mazatl-n.webp',
  'mx-hermanos-serd-n-international-airport': 'mx-puebla.webp',
  'mx-general-lucio-blanco-international-airport': 'mx-reynosa.webp',
  'mx-xoxocotl-n-international-airport': 'mx-oaxaca.webp',
  'mx-carlos-rovirosa-p-rez-international-airport': 'mx-villahermosa.webp',
  'mx-don-miguel-hidalgo-y-costilla-international-airport': 'mx-guadalajara.webp',
  'mx-federal-de-bachigualato-international-airport': 'mx-culiac-n.webp',
  'mx-general-abelardo-l-rodr-guez-international-airport': 'mx-tijuana.webp',
  'mx-tapachula-international-airport': 'mx-tapachula.webp',
  'mx-abraham-gonz-lez-international-airport': 'mx-ciudad-ju-rez.webp',
  'mx-ngel-albino-corzo-international-airport': 'mx-tuxtla-guti-rrez.webp',
  'mx-baj-o-international-airport': 'mx-le-n.webp',
  'mx-felipe-ngeles-international-airport': 'mx-mexico-city.webp',
  'mx-francisco-sarabia-international-airport': 'mx-torre-n.webp',
  'mx-general-francisco-j-mujica-international-airport': 'mx-morelia.webp',
  'mx-ixtapa-zihuatanejo-international-airport': 'mx-ixtapa-zihuatanejo.webp',
  'mx-lic-adolfo-l-pez-mateos-international-airport': 'mx-toluca.webp',
  'mx-lic-jes-s-ter-n-peredo-international-airport': 'mx-aguascalientes.webp',
  'mx-lic-gustavo-d-az-ordaz-international-airport': 'mx-puerto-vallarta.webp',
  'mx-manuel-crescencio-rej-n-international-airport': 'mx-m-rida.webp',
  'mx-manuel-m-rquez-de-le-n-international-airport': 'mx-la-paz.webp',
  'mx-puerto-escondido-international-airport': 'mx-puerto-escondido.webp',
  'mx-ponciano-arriaga-international-airport': 'mx-san-luis-potos.webp',
  'pa-tocumen-international-airport': 'pa-panama-city.webp',
  'sv-ilopango-international-airport': 'sv-san-salvador.webp',
  'us-albuquerque-international-sunport': 'us-albuquerque.webp',
  'us-cincinnati-northern-kentucky-international-airport': 'us-cincinnati.webp',
  'us-dallas-fort-worth-international-airport': 'us-dallas.webp',
  'us-daniel-k-inouye-international-airport': 'us-honolulu.webp',
  'us-milwaukee-mitchell-international-airport': 'us-milwaukee.webp',
  'us-minneapolis-saint-paul-international-airport': 'us-minneapolis.webp',
  'us-norman-y-mineta-san-jos-international-airport': 'us-san-jose.webp',
  'us-o-hare-international-airport': 'us-chicago.webp',
  'us-palm-beach-international-airport': 'us-west-palm-beach.webp',
  'us-raleigh-durham-international-airport': 'us-raleigh.webp',
  'us-sarasota-bradenton-international-airport': 'us-sarasota.webp',
  'us-seattle-tacoma-international-airport': 'us-seattle.webp',
  'us-washington-dulles-international-airport': 'us-washington-d-c.webp',
};
const AUSTRALIA_IMAGE_FOLDER = 'Australia cities images';
const AUSTRALIA_COUNTRY_CODES = new Set(['AU', 'FJ', 'KI', 'MH', 'FM', 'NR', 'NZ', 'PW', 'WS', 'TO', 'TV', 'VU', 'SB', 'PG']);
const AUSTRALIA_CITY_IMAGE_ALIASES: Record<string, string> = {
  'fj-nausori-international-airport': 'fj-suva.webp',
  'fm-chuuk-international-airport': 'fm-weno.webp',
  'ki-bonriki-international-airport': 'ki-tarawa.webp',
  'ki-cassidy-international-airport': 'ki-kiritimati.webp',
  'mh-bucholz-army-airfield': 'mh-kwajalein.webp',
  'mh-marshall-islands-international-airport': 'mh-majuro.webp',
  'nz-bay-of-islands-airport': 'nz-kerikeri.webp',
  'nz-hawke-s-bay-airport': 'nz-napier.webp',
  'nz-marlborough-airport': 'nz-blenheim.webp',
  'pg-jacksons-international-airport': 'pg-port-moresby.webp',
  'pw-roman-tmetuchl-international-airport': 'pw-koror.webp',
  'to-fua-amotu-international-airport': 'to-nukualofa.webp',
  'vu-bauerfield-international-airport': 'vu-port-vila.webp',
  'vu-santo-pekoa-international-airport': 'vu-luganville.webp',
  'ws-faleolo-international-airport': 'ws-apia.webp',
};
const COUNTRY_IMAGE_FOLDER = 'Country images';

function getPakistanImageUrl(filename: string, request: FastifyRequest) {
  return localImageUrl(PAKISTAN_IMAGE_FOLDER, filename);
}

function getPakistanCityImageUrl(slug: string | undefined | null, request: FastifyRequest) {
  if (!slug) return null;
  const normalizedSlug = slug.trim().toLowerCase();
  const filename = PAKISTAN_CITY_IMAGE_FILES[normalizedSlug];
  return filename ? getPakistanImageUrl(filename, request) : null;
}

function getPakistanCountryImageUrl(request: FastifyRequest) {
  return getPakistanImageUrl(PAKISTAN_COUNTRY_IMAGE_FILE, request);
}

function getAzerbaijanImageUrl(filename: string, request: FastifyRequest) {
  return localImageUrl(AZERBAIJAN_IMAGE_FOLDER, filename);
}

function getAzerbaijanCityImageUrl(slug: string | undefined | null, request: FastifyRequest) {
  if (!slug) return null;
  const normalizedSlug = slug.trim().toLowerCase();
  const filename = AZERBAIJAN_CITY_IMAGE_FILES[normalizedSlug];
  return filename ? getAzerbaijanImageUrl(filename, request) : null;
}

function getAsiaImageUrl(filename: string, request: FastifyRequest) {
  return localImageUrl(ASIA_IMAGE_FOLDER, filename);
}

function getCountryImageFilenameByCode(directoryName: string, countryCode: string) {
  const normalizedCode = countryCode.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(normalizedCode)) return null;
  const folderPath = path.join(__dirname, '..', '..', 'public', 'Images', directoryName);
  if (!fs.existsSync(folderPath)) return null;
  const files = fs.readdirSync(folderPath)
    .filter((fileName) => /\.(jpg|jpeg|png|webp|svg)$/i.test(fileName))
    .filter((fileName) => fileName.toLowerCase().startsWith(`${normalizedCode}-`))
    .sort((left, right) => right.length - left.length);
  return files[0] ?? null;
}

function getStaticCountryImageUrl(directoryName: string, countryCode: string, request: FastifyRequest) {
  const filename = getCountryImageFilenameByCode(directoryName, countryCode);
  if (!filename) return null;
  return localImageUrl(directoryName, filename);
}

function getCountryImageUrl(country: { code?: string | null; continent?: { name?: string | null } | null }, request: FastifyRequest) {
  if (!country.code) return null;
  if (country.continent?.name === 'Asia') {
    return getStaticCountryImageUrl(ASIA_IMAGE_FOLDER, country.code, request);
  }
  return getStaticCountryImageUrl(COUNTRY_IMAGE_FOLDER, country.code, request);
}

function getAsiaCountryImageUrl(country: { code?: string | null; name?: string | null; continent?: { name?: string | null } | null }, request: FastifyRequest) {
  if (country.continent?.name !== 'Asia' || !country.code) return null;
  return getStaticCountryImageUrl(ASIA_IMAGE_FOLDER, country.code, request);
}

function getAsiaCityImageUrl(slug: string | undefined | null, request: FastifyRequest) {
  if (!slug) return null;
  const normalizedSlug = slug.trim().toLowerCase();
  const filename = `${normalizedSlug}.webp`;
  const imagePath = path.join(__dirname, '..', '..', 'public', 'Images', ASIA_IMAGE_FOLDER, filename);
  if (!fs.existsSync(imagePath)) return null;
  return getAsiaImageUrl(filename, request);
}

function getSouthAmericaCityImageUrl(countryCode: string | undefined | null, slug: string | undefined | null, request: FastifyRequest) {
  if (!countryCode || !slug || !/^[A-Z]{2}$/i.test(countryCode.trim())) return null;
  const normalizedCode = countryCode.trim().toLowerCase();
  const normalizedSlug = slug.trim().toLowerCase();
  if (!normalizedSlug.startsWith(`${normalizedCode}-`)) return null;
  const filename = `${normalizedSlug}.webp`;
  const imagePath = path.join(__dirname, '..', '..', 'public', 'Images', SOUTH_AMERICA_IMAGE_FOLDER, filename);
  if (!fs.existsSync(imagePath)) return null;
  return localImageUrl(SOUTH_AMERICA_IMAGE_FOLDER, filename);
}

function normalizeLookupToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getNorthAmericaCityImageUrl(countryCode: string | undefined | null, slug: string | undefined | null, cityName: string | undefined | null, request: FastifyRequest) {
  if (!countryCode || (!slug && !cityName)) return null;

  const folderPath = path.join(__dirname, '..', '..', 'public', 'Images', NORTH_AMERICA_IMAGE_FOLDER);
  if (!fs.existsSync(folderPath)) return null;

  const normalizedCountryCode = countryCode.trim().toLowerCase();
  const normalizedSlug = slug?.trim().toLowerCase();
  const aliasFilename = normalizedSlug ? NORTH_AMERICA_CITY_IMAGE_ALIASES[normalizedSlug] : null;
  if (aliasFilename?.startsWith(`${normalizedCountryCode}-`) && fs.existsSync(path.join(folderPath, aliasFilename))) {
    return localImageUrl(NORTH_AMERICA_IMAGE_FOLDER, aliasFilename);
  }

  const cityNameSlug = cityName?.trim().toLowerCase().replace(/'/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const citySlug = normalizedSlug ? normalizeLookupToken(normalizedSlug).replace(new RegExp(`^${normalizeLookupToken(countryCode)}-`), '') : '';
  const expectedStems = new Set([cityNameSlug, citySlug].filter(Boolean).map((value) => `${normalizedCountryCode}-${value}`));
  const imageFiles = fs.readdirSync(folderPath).filter((fileName) => /\.(jpg|jpeg|png|webp|svg)$/i.test(fileName));
  const match = imageFiles.find((fileName) => expectedStems.has(path.basename(fileName, path.extname(fileName)).toLowerCase()));

  if (!match) return null;

  return localImageUrl(NORTH_AMERICA_IMAGE_FOLDER, match);
}

function getAustraliaCityImageUrl(countryCode: string | undefined | null, slug: string | undefined | null, request: FastifyRequest) {
  if (!countryCode || !slug) return null;
  const normalizedCountryCode = countryCode.trim().toUpperCase();
  const normalizedSlug = slug.trim().toLowerCase();
  if (!AUSTRALIA_COUNTRY_CODES.has(normalizedCountryCode) || !normalizedSlug.startsWith(`${normalizedCountryCode.toLowerCase()}-`)) return null;
  const imageDirectory = path.join(__dirname, '..', '..', 'public', 'Images', AUSTRALIA_IMAGE_FOLDER);
  if (!fs.existsSync(imageDirectory)) return null;
  const aliasFilename = AUSTRALIA_CITY_IMAGE_ALIASES[normalizedSlug];
  const filename = aliasFilename ?? fs.readdirSync(imageDirectory)
    .filter((fileName) => fileName.toLowerCase().startsWith(`${normalizedCountryCode.toLowerCase()}-`) && fileName.toLowerCase().endsWith('.webp'))
    .filter((fileName) => {
      const imageSlug = fileName.slice(0, -'.webp'.length).toLowerCase();
      return normalizedSlug === imageSlug || normalizedSlug.startsWith(`${imageSlug}-`);
    })
    .sort((left, right) => right.length - left.length)[0];
  if (!filename || !fs.existsSync(path.join(imageDirectory, filename))) return null;
  return localImageUrl(AUSTRALIA_IMAGE_FOLDER, filename);
}

const listQuery = z.object({
  country: z.string().optional(),
});

const categoryListQuery = z.object({
  q: z.string().optional(),
  page: z.string().transform((value) => Number.parseInt(value || '1', 10)).optional(),
  perPage: z.string().transform((value) => Number.parseInt(value || '12', 10)).optional(),
  sort: z.enum(['name', 'createdAt']).optional(),
});

const countryListQuery = z.object({
  q: z.string().optional(),
  continent: z.string().optional(),
  page: z.string().transform((value) => Number.parseInt(value || '1', 10)).optional(),
  perPage: z.string().transform((value) => Number.parseInt(value || '12', 10)).optional(),
  sort: z.enum(['name']).optional(),
});

const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, 'Category name is required'),
  slug: z.string().trim().min(2, 'Category slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, or dashes'),
  description: z.string().trim().max(500).optional(),
});

const categoryUpdateSchema = categoryCreateSchema.partial();

function hasInvalidProfileImage(value: unknown, path: Array<string | number>, context: z.RefinementCtx): boolean {
  if (!value || typeof value !== 'object') return false;
  let invalid = false;
  for (const [key, entry] of Object.entries(value)) {
    const entryPath = [...path, key];
    if (/(image|thumbnail|avatar|flag|logo)/i.test(key)) {
      if (entry !== null && (typeof entry !== 'string' || normalizeLocalImageUrl(entry) === null)) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: entryPath, message: 'Image references must use an existing local /images/ file.' });
        invalid = true;
      }
    } else if (entry && typeof entry === 'object') {
      invalid = hasInvalidProfileImage(entry, entryPath, context) || invalid;
    }
  }
  return invalid;
}

const profileSchema = z.object({}).catchall(z.any()).superRefine((profile, context) => {
  hasInvalidProfileImage(profile, [], context);
});

const countryCreateSchema = z.object({
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
  continentId: z.string().uuid().optional().nullable(),
  profile: profileSchema.optional().nullable(),
});

const countryUpdateSchema = countryCreateSchema.partial();

const cityCreateSchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1),
  countryCode: z.string().trim().min(1),
  profile: profileSchema.optional().nullable(),
});

const cityUpdateSchema = cityCreateSchema.partial();

const countryParamSchema = z.object({
  code: z.string().trim().min(1),
});

const categoryParamSchema = z.object({
  slug: z.string().trim().min(1),
});

function getBearerToken(request: any) {
  const authHeader = (request.headers.authorization || '') as string;
  return authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
}

async function isAdmin(prisma: PrismaClient, auth: AuthService, token: string | null) {
  if (!token) return false;
  const userId = await auth.verifyAccessToken(token).catch(() => null);
  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  return user?.role?.name === 'admin';
}

function normalizeCategory(category: any) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: null,
    createdAt: category.createdAt,
    count: 0,
  };
}

function normalizeCountry(country: any, cityCount = 0, eventCount = 0, request: FastifyRequest) {
  const rawProfile = typeof country.profile === 'object' && country.profile ? country.profile : null;
  const profile = buildCanonicalCountryProfile(convertProfileToCamelCase(sanitizeProfileImages(rawProfile)));
  const localCountryImage = country.code?.toString().trim().toUpperCase() === 'PK' ? getPakistanCountryImageUrl(request) : null;
  const staticCountryImage = getCountryImageUrl(country, request);
  const asiaCountryImage = getAsiaCountryImageUrl(country, request);
  const resolvedCountryImage = localCountryImage ?? staticCountryImage ?? asiaCountryImage;
  if (profile && resolvedCountryImage) {
    profile.heroImageUrl = resolvedCountryImage;
  }
  return {
    code: country.code,
    name: country.name,
    continent: country.continent?.name ?? null,
    cities: cityCount,
    events: eventCount,
    image: resolvedCountryImage ?? profile?.heroImageUrl ?? null,
    flagImage: profile?.flagImageUrl ?? null,
    profile,
  };
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function convertProfileToCamelCase(profile: any): any {
  if (!profile || typeof profile !== 'object') return profile;
  const converted: Record<string, any> = {};
  for (const [key, value] of Object.entries(profile)) {
    const camelKey = snakeToCamel(key);
    // Handle special field mapping
    if (key === 'unicode_sites') {
      // Fix typo: unicode_sites → unescoSites
      converted['unescoSites'] = value;
    } else if (key === 'coordinates' && typeof value === 'object' && value !== null) {
      // Format coordinates object to readable string
      const coords = value as any;
      if (coords.latitude !== undefined && coords.longitude !== undefined) {
        converted[camelKey] = `${coords.latitude.toFixed(4)}°N, ${coords.longitude.toFixed(4)}°E`;
      } else {
        converted[camelKey] = value;
      }
    } else {
      converted[camelKey] = value;
    }
  }
  return converted;
}

function normalizeCity(city: any, request: FastifyRequest) {
  const rawProfile = typeof city.profile === 'object' && city.profile ? city.profile : null;
  const profile = buildCanonicalCityProfile(convertProfileToCamelCase(sanitizeProfileImages(rawProfile)));
  let localCityImage = null;
  if (city.countryCode?.toString().trim().toUpperCase() === 'PK') {
    localCityImage = getPakistanCityImageUrl(city.slug, request);
  } else if (city.countryCode?.toString().trim().toUpperCase() === 'AZ') {
    localCityImage = getAzerbaijanCityImageUrl(city.slug, request);
  } else {
    localCityImage = getSouthAmericaCityImageUrl(city.countryCode, city.slug, request) ?? getAustraliaCityImageUrl(city.countryCode, city.slug, request) ?? getAsiaCityImageUrl(city.slug, request) ?? getNorthAmericaCityImageUrl(city.countryCode, city.slug, city.name, request);
  }
  return {
    slug: city.slug,
    name: city.name,
    countryCode: city.countryCode,
    image: localCityImage ?? profile?.heroImageUrl ?? null,
    population: profile?.population ?? null,
    shortDescription: profile?.shortDescription ?? null,
    profile,
  };
}

function sanitizeProfileImages(profile: any): any {
  if (!profile || typeof profile !== 'object') return null;
  if (Array.isArray(profile)) return profile.map(sanitizeProfileImages);

  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(profile as Record<string, unknown>)) {
    if (/(image|thumbnail|avatar|flag|logo)/i.test(key)) {
      normalized[key] = value == null ? null : normalizeLocalImageUrl(value);
    } else if (value && typeof value === 'object') {
      normalized[key] = sanitizeProfileImages(value);
    } else {
      normalized[key] = value;
    }
  }
  return normalized;
}

function normalizeContinent(continent: any) {
  return {
    id: continent.id,
    name: continent.name,
    countries: continent._count?.countries ?? 0,
  };
}

export function registerCatalogRoutes(app: FastifyInstance, prisma: PrismaClient) {
  const auth = new AuthService(prisma as any);

  app.get('/continents', async (request, reply) => {
    try {
      const items = await prisma.continent.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { countries: true } } } });
      reply.send({ success: true, data: items.map(normalizeContinent) });
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.get('/categories', async (request, reply) => {
    try {
      const query = categoryListQuery.parse(request.query || {});
      const search = query.q?.trim();
      const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : undefined;
      const page = Math.max(1, query.page || 1);
      const perPage = Math.min(100, Math.max(1, query.perPage || 12));
      const [items, total] = await Promise.all([
        prisma.category.findMany({
          where,
          orderBy: query.sort === 'createdAt' ? { createdAt: 'desc' } : { name: 'asc' },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.category.count({ where }),
      ]);
      reply.send({ success: true, data: { items: items.map(normalizeCategory), pagination: buildPagination(page, perPage, total) } });
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.get('/categories/:slug', async (request, reply) => {
    try {
      const { slug } = categoryParamSchema.parse(request.params || {});
      const category = await prisma.category.findUnique({ where: { slug } });
      if (!category) return reply.code(404).send({ success: false, error: { message: 'Category not found' } });
      reply.send({ success: true, data: normalizeCategory(category) });
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.post('/categories', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const ok = await isAdmin(prisma, auth, token);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const body = categoryCreateSchema.parse(request.body || {});
      const exists = await prisma.category.findUnique({ where: { slug: body.slug } });
      if (exists) return reply.code(409).send({ success: false, error: { message: 'Category slug already exists' } });
      const category = await prisma.category.create({ data: { name: body.name, slug: body.slug } as any });
      reply.code(201).send({ success: true, data: normalizeCategory(category) });
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.patch('/categories/:slug', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const ok = await isAdmin(prisma, auth, token);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const { slug } = categoryParamSchema.parse(request.params || {});
      const body = categoryUpdateSchema.parse(request.body || {});
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (!existing) return reply.code(404).send({ success: false, error: { message: 'Category not found' } });
      if (body.slug && body.slug !== slug) {
        const conflict = await prisma.category.findUnique({ where: { slug: body.slug } });
        if (conflict) return reply.code(409).send({ success: false, error: { message: 'Category slug already exists' } });
      }
      const category = await prisma.category.update({
        where: { slug },
        data: {
          ...(body.name ? { name: body.name } : {}),
          ...(body.slug ? { slug: body.slug } : {}),
        },
      });
      reply.send({ success: true, data: normalizeCategory(category) });
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.delete('/categories/:slug', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const ok = await isAdmin(prisma, auth, token);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const { slug } = categoryParamSchema.parse(request.params || {});
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (!existing) return reply.code(404).send({ success: false, error: { message: 'Category not found' } });
      await prisma.category.delete({ where: { slug } });
      reply.code(204).send();
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.post('/countries', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const ok = await isAdmin(prisma, auth, token);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const body = countryCreateSchema.parse(request.body || {});
      const normalizedCode = body.code.trim().toUpperCase();
      const exists = await prisma.country.findUnique({ where: { code: normalizedCode } });
      if (exists) return reply.code(409).send({ success: false, error: { message: 'Country code already exists' } });
      const country = await prisma.country.create({ data: { code: normalizedCode, name: body.name, continentId: body.continentId || null, profile: body.profile === undefined ? undefined : body.profile } as any });
      reply.code(201).send({ success: true, data: normalizeCountry(country, 0, 0, request) });
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.patch('/countries/:code', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const ok = await isAdmin(prisma, auth, token);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const { code } = countryParamSchema.parse(request.params || {});
      const normalizedCode = code.trim().toUpperCase();
      const body = countryUpdateSchema.parse(request.body || {});
      const existing = await prisma.country.findUnique({ where: { code: normalizedCode } });
      if (!existing) return reply.code(404).send({ success: false, error: { message: 'Country not found' } });
      const updated = await prisma.country.update({ where: { code: normalizedCode }, data: { name: body.name ?? existing.name, continentId: body.continentId !== undefined ? body.continentId : existing.continentId, profile: body.profile !== undefined ? body.profile : existing.profile } as any });
      const [cityCount, eventCount] = await Promise.all([
        prisma.city.count({ where: { countryCode: normalizedCode } }),
        prisma.event.count({ where: { countryCode: normalizedCode } }),
      ]);
      reply.send({ success: true, data: normalizeCountry(updated, cityCount, eventCount, request) });
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.delete('/countries/:code', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const ok = await isAdmin(prisma, auth, token);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const { code } = countryParamSchema.parse(request.params || {});
      const normalizedCode = code.trim().toUpperCase();
      const existing = await prisma.country.findUnique({ where: { code: normalizedCode } });
      if (!existing) return reply.code(404).send({ success: false, error: { message: 'Country not found' } });
      await prisma.country.delete({ where: { code: normalizedCode } });
      reply.code(204).send();
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.post('/countries/:code/cities', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const ok = await isAdmin(prisma, auth, token);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const { code } = countryParamSchema.parse(request.params || {});
      const normalizedCode = code.trim().toUpperCase();
      const body = cityCreateSchema.parse(request.body || {});
      if (body.countryCode && body.countryCode.trim().toUpperCase() !== normalizedCode) {
        return reply.code(400).send({ success: false, error: { message: 'City countryCode must match URL country code' } });
      }
      const country = await prisma.country.findUnique({ where: { code: normalizedCode } });
      if (!country) return reply.code(404).send({ success: false, error: { message: 'Country not found' } });
      const exists = await prisma.city.findUnique({ where: { slug: body.slug } });
      if (exists) return reply.code(409).send({ success: false, error: { message: 'City slug already exists' } });
      const city = await prisma.city.create({ data: { slug: body.slug, name: body.name, countryCode: normalizedCode, profile: buildCanonicalCityProfile(body.profile ?? null) } as any });
      reply.code(201).send({ success: true, data: normalizeCity(city, request) });
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.patch('/cities/:slug', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const ok = await isAdmin(prisma, auth, token);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const { slug } = categoryParamSchema.parse(request.params || {});
      const body = cityUpdateSchema.parse(request.body || {});
      const existing = await prisma.city.findUnique({ where: { slug } });
      if (!existing) return reply.code(404).send({ success: false, error: { message: 'City not found' } });
      const updated = await prisma.city.update({ where: { slug }, data: { name: body.name ?? existing.name, countryCode: body.countryCode ?? existing.countryCode, profile: buildCanonicalCityProfile(body.profile !== undefined ? body.profile : (existing.profile as Record<string, unknown> | null)) } as any });
      reply.send({ success: true, data: normalizeCity(updated, request) });
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.delete('/cities/:slug', async (request, reply) => {
    try {
      const token = getBearerToken(request);
      if (!token) return reply.code(401).send({ success: false, error: { message: 'Missing token' } });
      const ok = await isAdmin(prisma, auth, token);
      if (!ok) return reply.code(403).send({ success: false, error: { message: 'Forbidden' } });
      const { slug } = categoryParamSchema.parse(request.params || {});
      const existing = await prisma.city.findUnique({ where: { slug } });
      if (!existing) return reply.code(404).send({ success: false, error: { message: 'City not found' } });
      await prisma.city.delete({ where: { slug } });
      reply.code(204).send();
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.get('/countries', async (request, reply) => {
    try {
      const query = countryListQuery.parse(request.query || {});
      const search = query.q?.trim();
      const page = Math.max(1, query.page || 1);
      const perPage = Math.min(500, Math.max(1, query.perPage || 12));
      const where = {
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { code: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
        ...(query.continent ? { continent: { name: query.continent } } : {}),
      };
      const [items, total] = await Promise.all([
        prisma.country.findMany({
          where,
          orderBy: query.sort === 'name' ? { name: 'asc' } : { name: 'asc' },
          skip: (page - 1) * perPage,
          take: perPage,
          include: { continent: true },
        }),
        prisma.country.count({ where }),
      ]);
      const countryCodes = items.map((item) => item.code);
      const [cityCounts, eventCounts] = await Promise.all([
        prisma.city.groupBy({ by: ['countryCode'], _count: { _all: true }, where: { countryCode: { in: countryCodes } } }),
        prisma.event.groupBy({ by: ['countryCode'], _count: { _all: true }, where: { countryCode: { in: countryCodes } } }),
      ]);
      const cityCountMap = new Map(cityCounts.map((row: any) => [row.countryCode, Number(row._count._all)]));
      const eventCountMap = new Map(eventCounts.map((row: any) => [row.countryCode, Number(row._count._all)]));
      reply.send({ success: true, data: { items: items.map((country) => normalizeCountry(country, cityCountMap.get(country.code) ?? 0, eventCountMap.get(country.code) ?? 0, request)), pagination: buildPagination(page, perPage, total, 500) } });
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.get('/countries/:code', async (request, reply) => {
    try {
      const { code } = countryParamSchema.parse(request.params || {});
      const normalizedCode = code.trim().toUpperCase();
      const country = await prisma.country.findUnique({ where: { code: normalizedCode }, include: { continent: true } });
      if (!country) return reply.code(404).send({ success: false, error: { message: 'Country not found' } });
      const [cityCount, eventCount] = await Promise.all([
        prisma.city.count({ where: { countryCode: normalizedCode } }),
        prisma.event.count({ where: { countryCode: normalizedCode } }),
      ]);
      reply.send({ success: true, data: normalizeCountry(country, cityCount, eventCount, request) });
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.get('/cities', async (request, reply) => {
    const query = listQuery.parse(request.query || {});
    const where = { isVerifiedCity: true, ...(query.country ? { countryCode: query.country } : {}) };
    const cities = await prisma.city.findMany({ where, orderBy: { name: 'asc' } });
    reply.send({ success: true, data: cities.map((city) => normalizeCity(city, request)) });
  });

  app.get('/countries/:code/cities', async (request, reply) => {
    try {
      const { code } = countryParamSchema.parse(request.params || {});
      const normalizedCode = code.trim().toUpperCase();
      const country = await prisma.country.findUnique({
        where: { code: normalizedCode },
        include: { continent: { select: { name: true } } },
      });
      if (!country) return reply.code(404).send({ success: false, error: { message: 'Country not found' } });
      const cityWhere = country.continent?.name === 'South America'
        ? { countryCode: normalizedCode, isVerifiedCity: true }
        : { countryCode: normalizedCode };
      const cities = await prisma.city.findMany({ where: cityWhere, orderBy: { name: 'asc' } });
      reply.send({ success: true, data: cities.map((city) => normalizeCity(city, request)) });
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });

  app.get('/cities/:slug', async (request, reply) => {
    try {
      const { slug } = categoryParamSchema.parse(request.params || {});
      const city = await prisma.city.findUnique({ where: { slug } });
      if (!city) return reply.code(404).send({ success: false, error: { message: 'City not found' } });
      reply.send({ success: true, data: normalizeCity(city, request) });
    } catch (error: any) {
      reply.code(400).send({ success: false, error: { message: error.message } });
    }
  });
}

export default registerCatalogRoutes;
