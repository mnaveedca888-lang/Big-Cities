const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function parseDateRange(dateText, year = 2026) {
  const text = String(dateText || '').trim().toLowerCase();
  const monthMap = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  const monthOnlyMatch = text.match(/^(january|february|march|april|may|june|july|august|september|october|november|december)$/);
  if (monthOnlyMatch) {
    const month = monthMap[monthOnlyMatch[1]];
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));
    return { startAt: start, endAt: end };
  }

  const rangeMatch = text.match(/^(january|february|march|april|may|june|july|august|september|october|november|december)\s*[-–]\s*(january|february|march|april|may|june|july|august|september|october|november|december)$/);
  if (rangeMatch) {
    const startMonth = monthMap[rangeMatch[1]];
    const endMonth = monthMap[rangeMatch[2]];
    const start = new Date(Date.UTC(year, startMonth, 1));
    const end = new Date(Date.UTC(year, endMonth + 1, 0));
    return { startAt: start, endAt: end };
  }

  const dayMonthMatch = text.match(/^(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)$/);
  if (dayMonthMatch) {
    const day = Number(dayMonthMatch[1]);
    const month = monthMap[dayMonthMatch[2]];
    const start = new Date(Date.UTC(year, month, day));
    const end = new Date(Date.UTC(year, month, day));
    return { startAt: start, endAt: end };
  }

  const seasonMatch = text.match(/^(spring)$/);
  if (seasonMatch) {
    const start = new Date(Date.UTC(year, 2, 1));
    const end = new Date(Date.UTC(year, 5, 31));
    return { startAt: start, endAt: end };
  }

  if (text.includes('throughout the year') || text.includes('usually annually') || text.includes('islamic calendar')) {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));
    return { startAt: start, endAt: end };
  }

  if (text.includes('usually november') || text.includes('november')) {
    const start = new Date(Date.UTC(year, 10, 1));
    const end = new Date(Date.UTC(year, 10, 30));
    return { startAt: start, endAt: end };
  }

  if (text.includes('january-february')) {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 1, 28));
    return { startAt: start, endAt: end };
  }

  return null;
}

const eventDefinitions = [
  { title: 'Pakistan Day', citySlug: null, dateText: '23 March' },
  { title: 'Independence Day', citySlug: null, dateText: '14 August' },
  { title: 'Defence & Martyrs Day', citySlug: null, dateText: '6 September' },
  { title: 'Iqbal Day', citySlug: null, dateText: '9 November' },
  { title: 'Kashmir Solidarity Day', citySlug: null, dateText: '5 February' },
  { title: 'Quaid-e-Azam Day', citySlug: null, dateText: '25 December' },
  { title: 'Pakistan Resolution Day Celebrations', citySlug: null, dateText: 'March' },
  { title: 'Lok Mela', citySlug: null, dateText: 'Usually November' },
  { title: 'Pakistan Flower Show', citySlug: null, dateText: 'February' },
  { title: 'National Horse & Cattle Show', citySlug: null, dateText: 'February-March' },
  { title: 'Basant', citySlug: null, dateText: 'February' },
  { title: 'Sibi Mela', citySlug: null, dateText: 'February' },
  { title: 'Shandur Polo Festival', citySlug: null, dateText: 'July' },
  { title: 'Chilam Joshi Festival', citySlug: null, dateText: 'May' },
  { title: 'Rang-e-Bahar Festival', citySlug: 'pk-faisalabad', dateText: 'February-March' },
  { title: 'Basant (Traditional Kite Festival)', citySlug: 'pk-faisalabad', dateText: 'February' },
  { title: 'Kissan Mela', citySlug: 'pk-faisalabad', dateText: 'March-April' },
  { title: 'Islamabad Literature Festival', citySlug: 'pk-islamabad', dateText: 'February' },
  { title: 'Lok Mela', citySlug: 'pk-islamabad', dateText: 'November' },
  { title: 'Pakistan Flower Show', citySlug: 'pk-karachi', dateText: 'February' },
  { title: 'Karachi Literature Festival', citySlug: 'pk-karachi', dateText: 'February' },
  { title: 'All Pakistan Music Conference', citySlug: 'pk-karachi', dateText: 'January-February' },
  { title: 'Mela Chiraghan', citySlug: 'pk-lahore', dateText: 'March-April' },
  { title: 'Jashn-e-Baharan (Basant)', citySlug: 'pk-lahore', dateText: 'February' },
  { title: 'National Horse & Cattle Show', citySlug: 'pk-lahore', dateText: 'February-March' },
  { title: 'Vaisakhi Festival', citySlug: 'pk-lahore', dateText: 'April' },
  { title: 'Faiz Festival', citySlug: 'pk-lahore', dateText: 'February' },
  { title: 'Data Darbar Urs', citySlug: 'pk-lahore', dateText: 'Islamic calendar' },
  { title: 'Urs of Shah Rukn-e-Alam', citySlug: 'pk-multan', dateText: 'Islamic calendar' },
  { title: 'Urs of Bahauddin Zakariya', citySlug: 'pk-multan', dateText: 'Islamic calendar' },
  { title: 'Jashn-e-Baharan', citySlug: 'pk-peshawar', dateText: 'Spring' },
  { title: 'Pakistan Independence Day Heritage Celebrations', citySlug: 'pk-peshawar', dateText: 'August' },
  { title: 'Sibi Mela (near Quetta, Balochistan)', citySlug: 'pk-quetta', dateText: 'February' },
  { title: 'Baloch Culture Day Celebrations', citySlug: 'pk-quetta', dateText: 'March' },
  { title: 'Pakistan Day Parade', citySlug: 'pk-rawalpindi', dateText: '23 March' },
  { title: 'Lok Virsa Heritage Activities', citySlug: 'pk-rawalpindi', dateText: 'Throughout the year' },
  { title: 'Sialkot Chamber Expo / Industrial Exhibition', citySlug: 'pk-sialkot', dateText: 'Usually annually' },
];

async function main() {
  let updated = 0;
  for (const definition of eventDefinitions) {
    const slug = slugify(`${definition.citySlug || 'pakistan'}-${definition.title}`);
    const range = parseDateRange(definition.dateText);
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (!existing) {
      console.log(`Skipped ${slug}: no matching event found`);
      continue;
    }
    if (!range) {
      console.log(`Skipped ${slug}: no parseable date range for ${definition.dateText}`);
      continue;
    }
    await prisma.event.update({
      where: { id: existing.id },
      data: {
        startAt: range.startAt,
        endAt: range.endAt,
      },
    });
    updated += 1;
    console.log(`Updated ${slug} -> ${range.startAt.toISOString()} / ${range.endAt.toISOString()}`);
  }
  console.log(`Updated ${updated} events.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
