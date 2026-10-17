const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function parseDateRange(input) {
  const text = String(input || '').trim();
  if (!text) return null;
  const year = 2026; // document year to resolve dates
  const monthNames = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
  };

  // Normalize separators and remove ordinal markers
  const normalized = text.replace(/–|—/g, '-').replace(/(st|nd|rd|th)/g, '').toLowerCase();

  // Range like '19-21 mar' or '27-29 may'
  const rangeMatch = normalized.match(/(\d{1,2})\s*-\s*(\d{1,2})\s*([a-z]{3,})/i);
  if (rangeMatch) {
    const startDay = Number(rangeMatch[1]);
    const endDay = Number(rangeMatch[2]);
    const mon = monthNames[rangeMatch[3].slice(0,3)];
    return {
      start: new Date(Date.UTC(year, mon, startDay)),
      end: new Date(Date.UTC(year, mon, endDay, 23, 59, 59))
    };
  }

  // Single day like '19 august' or '21 mar'
  const singleMatch = normalized.match(/(\d{1,2})\s*([a-z]{3,})/i);
  if (singleMatch) {
    const day = Number(singleMatch[1]);
    const mon = monthNames[singleMatch[2].slice(0,3)];
    return { start: new Date(Date.UTC(year, mon, day)), end: new Date(Date.UTC(year, mon, day, 23, 59, 59)) };
  }

  // Month-only (e.g., 'march') or named day like 'nowruz' (map to 21 mar)
  if (normalized.includes('nowruz') || normalized.includes('21 march') || normalized.includes('21 mar')) {
    return { start: new Date(Date.UTC(year, 2, 21)), end: new Date(Date.UTC(year, 2, 21, 23, 59, 59)) };
  }

  return null;
}

function describeEvent(event) {
  const parts = [];
  if (event.dateText) parts.push(`Document date: ${event.dateText}`);
  if (event.significance) parts.push(`Historical/cultural significance: ${event.significance}`);
  if (event.notes) parts.push(`Notes: ${event.notes}`);
  return parts.join('\n\n');
}

const events = [
  {
    slug: 'af-liberation-day-15-feb',
    title: 'Liberation Day',
    dateText: '15 Feb',
    historicalDate: null,
    countryCode: 'AF',
    citySlug: null,
    category: 'national',
    type: 'commemoration',
    status: 'completed',
    description: 'Liberation Day (15 Feb) — national commemoration as listed in dataset.',
    source: 'Afghanistan — Country & 5-City Dataset (8 Aug 2026)'
  },
  {
    slug: 'af-ramadan-begins-18-feb',
    title: 'Ramadan begins',
    dateText: '18 Feb',
    countryCode: 'AF',
    citySlug: null,
    category: 'religious',
    type: 'observance',
    status: 'completed',
    description: 'Beginning of Ramadan (date listed as 18 Feb in dataset).',
    source: 'Afghanistan — Country & 5-City Dataset (8 Aug 2026)'
  },
  {
    slug: 'af-eid-al-fitr-19-21-mar',
    title: 'Eid al-Fitr',
    dateText: '19-21 Mar',
    countryCode: 'AF',
    citySlug: null,
    category: 'religious',
    type: 'holiday',
    status: 'completed',
    description: 'Eid al-Fitr (19–21 Mar) — national religious holiday as listed in dataset.',
    source: 'Afghanistan — Country & 5-City Dataset (8 Aug 2026)'
  },
  {
    slug: 'af-nowruz-21-mar',
    title: 'Nowruz',
    dateText: '21 Mar',
    countryCode: 'AF',
    citySlug: null,
    category: 'cultural',
    type: 'festival',
    status: 'completed',
    description: 'Nowruz (21 Mar) — Persian New Year, cultural celebrations.',
    source: 'Afghanistan — Country & 5-City Dataset (8 Aug 2026)'
  },
  {
    slug: 'af-victory-day-28-apr',
    title: 'Afghan Victory Day',
    dateText: '28 Apr',
    countryCode: 'AF',
    citySlug: null,
    category: 'national',
    type: 'commemoration',
    status: 'completed',
    description: 'Afghan Victory Day (28 Apr).',
    source: 'Afghanistan — Country & 5-City Dataset (8 Aug 2026)'
  },
  {
    slug: 'af-labour-day-1-may',
    title: 'Labour Day',
    dateText: '1 May',
    countryCode: 'AF',
    citySlug: null,
    category: 'national',
    type: 'public holiday',
    status: 'completed',
    description: 'Labour Day (1 May).',
    source: 'Afghanistan — Country & 5-City Dataset (8 Aug 2026)'
  },
  {
    slug: 'af-day-of-arafat-26-may',
    title: 'Day of Arafat',
    dateText: '26 May',
    countryCode: 'AF',
    citySlug: null,
    category: 'religious',
    type: 'observance',
    status: 'completed',
    description: 'Day of Arafat (26 May).',
    source: 'Afghanistan — Country & 5-City Dataset (8 Aug 2026)'
  },
  {
    slug: 'af-eid-al-qurban-27-29-may',
    title: 'Eid al-Qurban',
    dateText: '27-29 May',
    countryCode: 'AF',
    citySlug: null,
    category: 'religious',
    type: 'holiday',
    status: 'completed',
    description: 'Eid al-Qurban (27–29 May).',
    source: 'Afghanistan — Country & 5-City Dataset (8 Aug 2026)'
  },
  {
    slug: 'af-ashura-26-jun',
    title: 'Ashura',
    dateText: '26 Jun',
    countryCode: 'AF',
    citySlug: null,
    category: 'religious',
    type: 'observance',
    status: 'completed',
    description: 'Ashura (26 Jun).',
    source: 'Afghanistan — Country & 5-City Dataset (8 Aug 2026)'
  },
  {
    slug: 'af-independence-day-19-aug',
    title: 'Independence Day',
    dateText: '19 Aug',
    historicalDate: '19 August 1919',
    countryCode: 'AF',
    citySlug: null,
    category: 'national',
    type: 'historical',
    status: 'upcoming',
    description: "Independence Day (19 Aug) — historical date: 19 August 1919. National public holiday in 2026.",
    source: 'Afghanistan — Country & 5-City Dataset (8 Aug 2026)'
  },
  {
    slug: 'af-prophet-birthday-26-aug-prelim',
    title: "Prophet's Birthday (preliminary)",
    dateText: '26 Aug (preliminary)',
    countryCode: 'AF',
    citySlug: null,
    category: 'religious',
    type: 'observance',
    status: 'upcoming',
    description: "Prophet's Birthday listed as preliminary on 26 Aug; verify locally.",
    source: 'Afghanistan — Country & 5-City Dataset (8 Aug 2026)'
  },
  {
    slug: 'af-withdrawal-anniv-31-aug',
    title: 'Anniversary of Withdrawal of Foreign Troops',
    dateText: '31 Aug',
    countryCode: 'AF',
    citySlug: null,
    category: 'commemorative',
    type: 'anniversary',
    status: 'upcoming',
    description: 'Anniversary of Withdrawal of Foreign Troops (31 Aug).',
    source: 'Afghanistan — Country & 5-City Dataset (8 Aug 2026)'
  },
  {
    slug: 'af-martyrs-massoud-day-9-sep',
    title: 'Martyrs & Ahmad Shah Massoud Day',
    dateText: '9 Sep',
    countryCode: 'AF',
    citySlug: null,
    category: 'commemorative',
    type: 'national',
    status: 'upcoming',
    description: 'Martyrs & Ahmad Shah Massoud Day (9 Sep).',
    source: 'Afghanistan — Country & 5-City Dataset (8 Aug 2026)'
  }
];

async function upsertEvent(entry) {
  const baseSlug = entry.slug || slugify(`${entry.countryCode}-${entry.title}`);
  const parsed = parseDateRange(entry.dateText || '');
  const startAt = entry.startAt || (parsed ? parsed.start : new Date(Date.UTC(2026, 7, 19)));
  const endAt = entry.endAt || (parsed ? parsed.end : new Date(startAt.getTime() + 24 * 60 * 60 * 1000));
  const headerParts = [];
  if (entry.dateText) headerParts.push(`Document date: ${entry.dateText}`);
  if (entry.historicalDate) headerParts.push(`Historical date: ${entry.historicalDate}`);
  if (entry.significance) headerParts.push(`Historical/cultural significance: ${entry.significance}`);
  if (entry.notes) headerParts.push(`Notes: ${entry.notes}`);

  const metaParts = [];
  if (entry.category) metaParts.push(`Category: ${entry.category}`);
  if (entry.type) metaParts.push(`Type: ${entry.type}`);
  if (entry.status) metaParts.push(`Status: ${entry.status}`);
  if (entry.source) metaParts.push(`Source: ${entry.source}`);

  const header = headerParts.length ? `${headerParts.join('\n\n')}\n\n` : '';
  const meta = metaParts.length ? `\n\n---\nMetadata:\n${metaParts.join('\n')}` : '';
  const description = `${header}${entry.description || ''}${entry.notes ? `\n\n${entry.notes}` : ''}${meta}`;

  const data = {
    title: entry.title,
    description,
    startAt,
    endAt,
    countryCode: entry.countryCode,
    citySlug: entry.citySlug,
    tags: (entry.tags || []).join(','),
    featured: false,
    enabled: entry.status !== 'cancelled'
  };

  const existing = await prisma.event.findUnique({ where: { slug: baseSlug } }).catch(() => null);
  if (existing) {
    return prisma.event.update({ where: { id: existing.id }, data: { ...data, slug: baseSlug } });
  }

  return prisma.event.create({ data: { slug: baseSlug, ...data } });
}

async function main() {
  for (const entry of events) {
    await upsertEvent(entry);
  }
  console.log(`Imported ${events.length} Afghanistan events.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
