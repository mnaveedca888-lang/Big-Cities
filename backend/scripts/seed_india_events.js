const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function parseExactDate(dateText) {
  if (!dateText) return null;
  // Expecting format like '3 Mar' or '08 Nov' (day month)
  const parts = String(dateText).trim().split(/\s+/);
  if (parts.length === 2) {
    const day = Number(parts[0]);
    const monthName = parts[1].toLowerCase();
    const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
    const mon = months[monthName.slice(0,3)];
    if (!Number.isNaN(day) && mon !== undefined) {
      return new Date(Date.UTC(2026, mon, day));
    }
  }
  // Fallback for month-only or named day handled externally
  return null;
}

function describeEvent(entry) {
  const parts = [];
  if (entry.dateText) parts.push(`Document date: ${entry.dateText}`);
  if (entry.significance) parts.push(`Significance: ${entry.significance}`);
  if (entry.notes) parts.push(`Notes: ${entry.notes}`);
  return parts.join('\n\n');
}

// Verified 2026 dates from publicholidays.in, Wikipedia, and official event pages where available.
// Entries marked 'tentative' in the description require authoritative confirmation if needed.
const events = [
  { title: 'Republic Day', countryCode: 'IN', citySlug: null, dateText: '26 Jan', tags: ['national'], significance: 'National holiday' },
  { title: 'Vasant Panchami', countryCode: 'IN', citySlug: null, dateText: '23 Jan', tags: ['religious'], significance: 'Observed in several states' },
  { title: 'Maha Shivratri', countryCode: 'IN', citySlug: null, dateText: '15 Feb', tags: ['religious'] , significance: 'National observance'},
  { title: 'Goa Carnival', countryCode: 'IN', citySlug: 'in-panjim', dateText: '13 Feb', tags: ['festival'], notes: 'Multi-day (13 Feb — 17 Feb 2026) per local schedules', significance: 'Goa tourism event' },
  { title: 'Holika Dahan', countryCode: 'IN', citySlug: null, dateText: '2 Mar', tags: ['festival'] , significance: 'Eve of Holi'},
  { title: 'Holi', countryCode: 'IN', citySlug: null, dateText: '3 Mar', tags: ['festival'] },
  { title: 'Lathmar Holi', countryCode: 'IN', citySlug: 'in-barsana', dateText: '3 Mar', tags: ['festival'], notes: 'Regional (Barsana/Nandgaon) — aligns with Holi', significance: 'Regional tradition' },
  { title: 'Rangotsav', countryCode: 'IN', citySlug: 'in-shantiniketan', dateText: '3 Mar', tags: ['festival'], notes: 'Tagore-era celebrations at Shantiniketan; date aligns with Holi (tentative)', significance: 'Cultural' },
  { title: 'Ram Navami', countryCode: 'IN', citySlug: null, dateText: '26 Mar', tags: ['religious'] },
  { title: 'Mahavir Jayanti', countryCode: 'IN', citySlug: null, dateText: '31 Mar', tags: ['religious'] },
  { title: 'Baisakhi', countryCode: 'IN', citySlug: 'in-amritsar', dateText: '14 Apr', tags: ['harvest'] },
  { title: 'Bihu', countryCode: 'IN', citySlug: 'in-guwahati', dateText: '14 Apr', tags: ['harvest'], notes: 'Bohag Bihu season' },
  { title: 'Buddha Purnima', countryCode: 'IN', citySlug: null, dateText: '1 May', tags: ['religious'] },
  { title: 'Thrissur Pooram', countryCode: 'IN', citySlug: 'in-thrissur', dateText: '06 May', tags: ['festival'], notes: 'Date tentative; verify with Kerala tourism' },
  { title: 'Rath Yatra', countryCode: 'IN', citySlug: 'in-puri', dateText: '16 Jul', tags: ['festival'] },
  { title: 'Hemis Festival', countryCode: 'IN', citySlug: 'in-leh', dateText: '10 Jul', tags: ['festival'], notes: 'Tentative — lunar calendar; verify with Ladakh sources' },
  { title: 'Guru Purnima', countryCode: 'IN', citySlug: null, dateText: '10 Jul', tags: ['religious'], notes: 'Verify exact 2026 Purnima (Ashadha month)' },
  { title: 'Bonalu', countryCode: 'IN', citySlug: 'in-hyderabad', dateText: '10 Aug', tags: ['regional'] , notes:'Telangana festival (first Onam week shown in publicholidays.in) '},
  { title: 'Ashadhi Ekadashi', countryCode: 'IN', citySlug: null, dateText: '15 Jun', tags: ['religious'] , notes:'Verify state specifics' },
  { title: 'Independence Day', countryCode: 'IN', citySlug: null, dateText: '15 Aug', tags: ['national'] },
  { title: 'Jaipur Teej Festival', countryCode: 'IN', citySlug: 'in-jaipur', dateText: '20 Aug', tags: ['regional'], notes: 'Teej date varies; tentative' },
  { title: 'Janmashtami', countryCode: 'IN', citySlug: null, dateText: '04 Sep', tags: ['religious'] },
  { title: 'Onam', countryCode: 'IN', citySlug: 'in-thiruvananthapuram', dateText: '26 Aug', tags: ['harvest'] },
  { title: 'Ganesh Chaturthi', countryCode: 'IN', citySlug: 'in-mumbai', dateText: '14 Sep', tags: ['festival'] },
  { title: 'Ladakh Festival', countryCode: 'IN', citySlug: 'in-leh', dateText: '01 Aug', tags: ['regional'], notes: 'Tentative — local tourism site to confirm' },
  { title: 'Navratri', countryCode: 'IN', citySlug: null, dateText: '20 Oct', tags: ['festival'] },
  { title: 'Garba', countryCode: 'IN', citySlug: 'in-ahmedabad', dateText: '20 Oct', tags: ['festival'] },
  { title: 'Dandiya', countryCode: 'IN', citySlug: 'in-ahmedabad', dateText: '20 Oct', tags: ['festival'] },
  { title: 'Durga Puja', countryCode: 'IN', citySlug: 'in-kolkata', dateText: '20 Oct', tags: ['festival'] },
  { title: 'Mysuru Dasara', countryCode: 'IN', citySlug: 'in-mysuru', dateText: '20 Oct', tags: ['festival'], notes: 'Dasara celebrations span multiple days; this is the Vijayadashami date' },
  { title: 'Kullu Dussehra', countryCode: 'IN', citySlug: 'in-kullu', dateText: '20 Oct', tags: ['festival'] },
  { title: 'Dussehra', countryCode: 'IN', citySlug: null, dateText: '20 Oct', tags: ['festival'] },
  { title: 'Bathukamma', countryCode: 'IN', citySlug: 'in-hyderabad', dateText: '11 Oct', tags: ['regional'] },
  { title: 'Tawang Festival', countryCode: 'IN', citySlug: 'in-tawang', dateText: '01 Oct', tags: ['regional'], notes: 'Tentative — verify with Arunachal tourism' },
  { title: 'Gandhi Jayanti', countryCode: 'IN', citySlug: null, dateText: '02 Oct', tags: ['national'] },
  { title: 'Diwali', countryCode: 'IN', citySlug: null, dateText: '08 Nov', tags: ['festival'] },
  { title: 'Dhanteras', countryCode: 'IN', citySlug: null, dateText: '07 Nov', tags: ['festival'] },
  { title: 'Govardhan Puja', countryCode: 'IN', citySlug: null, dateText: '09 Nov', tags: ['festival'] },
  { title: 'Bhai Dooj', countryCode: 'IN', citySlug: null, dateText: '11 Nov', tags: ['festival'] },
  { title: 'Pushkar Camel Fair', countryCode: 'IN', citySlug: 'in-pushkar', dateText: '01 Nov', tags: ['fair'], notes: 'Traditionally around Kartik Purnima (late Oct–Nov); date used is typical Kartik Purnima period — verify official 2026 schedule' },
  { title: 'Guru Nanak Jayanti', countryCode: 'IN', citySlug: null, dateText: '24 Nov', tags: ['religious'] },
  { title: 'Rann Utsav', countryCode: 'IN', citySlug: 'in-district-kutch', dateText: '01 Dec', tags: ['regional'], notes: 'Seasonal festival spanning winter months; start date used as representative (verify official program)' },
  { title: 'Hornbill Festival', countryCode: 'IN', citySlug: 'in-kohima', dateText: '01 Dec', tags: ['regional'], notes: 'Annual festival (Dec); verify exact 2026 schedule with Nagaland tourism' },
  { title: 'Kochi-Muziris Biennale', countryCode: 'IN', citySlug: 'in-kochi', dateText: '13 Dec', tags: ['arts'], notes: 'Kochi Biennale 2025–26 edition spans into 2026; representative date used (verify if needed)' }
];

async function upsertEvent(entry) {
  const baseSlug = slugify(`${entry.countryCode}-${entry.citySlug || 'all'}-${entry.title}`);
  const parsed = parseExactDate(entry.dateText);
  const startAt = parsed || new Date(Date.UTC(2026, 0, 1));
  const endAt = new Date(startAt.getTime() + 24 * 60 * 60 * 1000 - 1);
  const description = describeEvent(entry);
  const data = {
    title: entry.title,
    description,
    startAt,
    endAt,
    countryCode: entry.countryCode,
    citySlug: entry.citySlug || null,
    tags: (entry.tags || []).join(','),
    featured: false,
    enabled: true,
  };

  const existing = await prisma.event.findUnique({ where: { slug: baseSlug } }).catch(() => null);
  if (existing) {
    return prisma.event.update({ where: { id: existing.id }, data: { ...data, slug: baseSlug } });
  }

  return prisma.event.create({ data: { slug: baseSlug, ...data } });
}

async function main() {
  // Ensure referenced city slugs exist (some may not be in DB yet)
  const neededCitySlugs = new Set(events.map(e => e.citySlug).filter(Boolean));
  for (const slug of neededCitySlugs) {
    const found = await prisma.city.findUnique({ where: { slug } });
    if (!found) {
      // create a minimal city record so FK constraints do not fail
      await prisma.city.create({ data: { slug, name: slug.replace(/^in-/, '').replace(/-/g, ' '), countryCode: 'IN' } }).catch(() => null);
    }
  }

  let added = 0;
  for (const entry of events) {
    await upsertEvent(entry);
    added += 1;
  }
  console.log(`Seeded ${added} India events (upsert).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Export events and slugify for other maintenance scripts
module.exports = { events, slugify };
