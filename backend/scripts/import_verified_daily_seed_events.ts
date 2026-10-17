import { PrismaClient } from '@prisma/client';
import EventService from '../src/events/event.service';

const prisma = new PrismaClient();
const service = new EventService(prisma);
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

function pktDate(day: string, hour: number, minute = 0) {
  return new Date(Date.parse(`${day}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+05:00`));
}

function dateOnly(day: string) {
  const startAt = new Date(`${day}T00:00:00.000Z`);
  return { startAt, endAt: new Date(`${day}T23:59:59.999Z`), dateOnly: true };
}

const seeds = [
  { title: 'Pakistan Lifestyle Furniture Expo 2026', category: 'Art Exhibitions', citySlug: 'pk-quetta', venue: 'BA Mall, Quetta Cantt', sourceUrl: 'https://manahilestate.com/news/pakistan-lifestyle-furniture-expo-announces-multi-city-september-2026-exhibition-schedule/', sourceName: 'manahilestate.com', ...{ startAt: pktDate('2026-09-11', 11), endAt: pktDate('2026-09-11', 19), dateOnly: false }, verificationReason: 'Explicitly supplied verified seed; source confirms the Quetta exhibition schedule and venue.' },
  { title: '4th Pakistan Hajj and Umrah Exhibition (PHUEX 2026)', category: 'Conferences', citySlug: 'pk-islamabad', venue: 'Pakistan-China Friendship Center', sourceUrl: 'https://10times.com/islamabad-pk', sourceName: '10times.com', ...{ startAt: pktDate('2026-09-11', 11), endAt: pktDate('2026-09-11', 19), dateOnly: false }, verificationReason: 'Explicitly supplied verified seed; official exhibition source and supplied listing identify the event and venue.' },
  { title: 'Karachi Ijtema 2026', category: 'Cultural Celebration', citySlug: 'pk-karachi', venue: 'Korangi Ground', sourceUrl: 'https://happeningnext.com/event/karachi-ijtema-eid3a0e2uj3bx', sourceName: 'happeningnext.com', ...{ startAt: pktDate('2026-09-11', 17), endAt: pktDate('2026-09-11', 20), dateOnly: false }, verificationReason: 'Explicitly supplied verified seed; source URL retained for audit.' },
  { title: '47th Mid-Career Management Course (MCMC) Delegation Visit', category: 'Dignitary Visits', citySlug: 'pk-islamabad', venue: 'Islamabad Police Headquarters', sourceUrl: 'https://www.nation.com.pk/11-Sep-2026/nation-observes-quaid-e-azam-s-78th-death-anniversary-today', sourceName: 'thenation.com', ...dateOnly('2026-09-11'), verificationReason: 'Explicitly supplied verified seed; daytime time remains uncertain and is represented as dateOnly.' },
  { title: 'Higher Education Sector Digital Readiness Session & Sports Arena Inauguration', category: 'Educational Seminars', citySlug: 'pk-islamabad', venue: 'Bahria University', sourceUrl: 'https://www.nation.com.pk/11-Sep-2026/nation-observes-quaid-e-azam-s-78th-death-anniversary-today', sourceName: 'thenation.com', ...dateOnly('2026-09-11'), verificationReason: 'Explicitly supplied verified seed; daytime time remains uncertain and is represented as dateOnly.' },
  { title: '78th Death Anniversary Commemoration of Quaid-e-Azam Muhammad Ali Jinnah', category: 'Government Events', citySlug: 'pk-karachi', venue: 'Mazar-e-Quaid (Mausoleum)', sourceUrl: 'https://www.radio.gov.pk/11-09-2026/nation-observes-quaid-e-azam-muhammad-ali-jinnahs-78th-death-anniversary-today', sourceName: 'radio.gov.pk', ...dateOnly('2026-09-11'), verificationReason: 'Explicitly supplied verified seed; morning/daytime time remains uncertain and is represented as dateOnly.' },
  { title: 'DHA Phase 10 Official Launching Ceremony', category: 'Government Events', citySlug: 'pk-lahore', venue: 'Defence Raya Golf & Country Club', sourceUrl: 'https://maanestate.com/dha-phase-10-launching-ceremony-2026/', sourceName: 'maanestate.com', ...dateOnly('2026-09-11'), verificationReason: 'Explicitly supplied verified seed; source confirms date and venue, while time remains unspecified and is represented as dateOnly.' },
  { title: "Blufy's Alphabattle Speed Scrabble Tournament", category: 'Sports Events', citySlug: 'pk-karachi', venue: 'The Social Karachi, Razi Road, Block 6', sourceUrl: 'https://townevent.pk/events/all', sourceName: 'townevent.pk', ...{ startAt: pktDate('2026-09-11', 18), endAt: pktDate('2026-09-11', 20), dateOnly: false }, verificationReason: 'Explicitly supplied verified seed; supplied date retained despite source-listing discrepancy, recorded for audit.' },
  { title: 'Gunjalpur - A Comedy Theatre Play', category: 'Theatre Shows', citySlug: 'pk-lahore', venue: 'Alhamra Hall 1, Mall Road', sourceUrl: 'https://ticketwala.pk/event/gunjalpur-theatre-play-7183', sourceName: 'ticketwala.pk', ...{ startAt: pktDate('2026-09-11', 19), endAt: pktDate('2026-09-11', 21), dateOnly: false }, verificationReason: 'Explicitly supplied verified seed; source confirms the date, time, venue, and Lahore location.' },
  { title: '02 Days Tour to Shogran From Lahore and Islamabad', category: 'Tourism & Travel', citySlug: 'pk-lahore', venue: 'Thokar Niaz Baig', sourceUrl: 'https://allevents.in/lahore/september', sourceName: 'allevents.in', ...{ startAt: pktDate('2026-09-11', 23), endAt: pktDate('2026-09-13', 23), dateOnly: false }, verificationReason: 'Explicitly supplied verified seed; supplied listing identifies the departure date, time, venue, and Lahore.' },
  { title: 'Inclusion Rocks - Lahore', category: 'Concerts', citySlug: 'pk-lahore', venue: 'Al-Hamra Open Air Theater, Lawn', sourceUrl: 'https://ticketwala.pk/event/inclusion-rocks-lahore-6644', sourceName: 'Ticketwala', ...{ startAt: pktDate('2026-09-12', 18), endAt: pktDate('2026-09-12', 22), dateOnly: false }, verificationReason: 'Source page title and event listing confirm the Lahore concert and event venue.' },
  { title: 'Plastic, Packaging & Print Asia 2026', category: 'Conferences', citySlug: 'pk-lahore', venue: 'Expo Centre Lahore', sourceUrl: 'https://eventsinlahore.com/etn/plastic-packaging-print-asia-2026-lahore/', sourceName: 'LahoreEvents / Ecommerce Gateway', ...{ startAt: pktDate('2026-09-12', 10), endAt: pktDate('2026-09-12', 18), dateOnly: false }, verificationReason: 'Source page title and event page metadata confirm the Lahore conference and venue.' },
  { title: 'AGT Game Night', category: 'Sports Events', citySlug: 'pk-lahore', venue: 'SteakAway, Block E2 Gulberg III, Lahore', sourceUrl: 'https://ticketwala.pk/event/agt-game-night-12th-september-7311', sourceName: 'Ticketwala', ...{ startAt: pktDate('2026-09-12', 19), endAt: pktDate('2026-09-12', 23), dateOnly: false }, verificationReason: 'Source page title and event listing confirm the Lahore sports night and venue.' },
] as const;

async function main() {
  const now = new Date();
  const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const report: any[] = [];
  for (const seed of seeds) {
    const result = await service.upsertVerifiedSeed({
      title: seed.title,
      description: `${seed.title} verified seed event in Pakistan.`,
      category: seed.category,
      citySlug: seed.citySlug,
      venue: seed.venue,
      startAt: seed.startAt,
      endAt: seed.endAt,
      dateOnly: seed.dateOnly,
      sourceUrl: seed.sourceUrl,
      sourceName: seed.sourceName,
      verificationReason: seed.verificationReason,
    });
    const dailyEligible = seed.startAt >= now && seed.startAt <= cutoff;
    report.push({
      title: seed.title,
      category: seed.category,
      sourceName: seed.sourceName,
      sourceUrl: seed.sourceUrl,
      verificationStatus: 'VERIFIED',
      startAt: seed.startAt.toISOString(),
      timeCertain: !seed.dateOnly,
      dailyEligible,
      action: result.action === 'inserted' ? 'INSERTED' : 'UPDATED_OR_DEDUPLICATED',
      reason: seed.verificationReason,
    });
  }
  console.log(JSON.stringify({ now: now.toISOString(), cutoff: cutoff.toISOString(), report }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
