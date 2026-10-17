const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function formatDateShort(d) {
  if (!d) return '';
  const dt = new Date(d);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${dt.getUTCDate()} ${months[dt.getUTCMonth()]}`;
}

async function main() {
  const events = await prisma.event.findMany({ where: { countryCode: 'AF' } });
  for (const ev of events) {
    if (!ev.description || !ev.description.includes('Document date:')) {
      const dateText = formatDateShort(ev.startAt || ev.createdAt);
      const header = dateText ? `Document date: ${dateText}\n\n` : '';
      const meta = `\n\n---\nMetadata:\nSource: Afghanistan — Country & 5-City Dataset (8 Aug 2026)`;
      const newDesc = `${header}${ev.description || ev.title}${meta}`;
      await prisma.event.update({ where: { id: ev.id }, data: { description: newDesc } });
      console.log(`Patched ${ev.slug}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
