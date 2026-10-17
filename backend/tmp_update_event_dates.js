const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
  {
    slug: 'pk-lahore-data-darbar-urs',
    description: 'Document date: Islamic Calendar (Date varies annually)\n\nHistorical/cultural significance: A historic Sufi pilgrimage and religious gathering of deep significance to Lahore.\n\nNotes: The document describes it as an annual gathering with centuries of history.',
  },
  {
    slug: 'pk-multan-urs-of-shah-rukn-e-alam',
    description: 'Document date: Islamic Calendar (Date varies annually)\n\nHistorical/cultural significance: One of Pakistan’s largest annual Sufi gatherings, rooted in Multan’s spiritual history.\n\nNotes: The document identifies it as one of the country’s largest annual Sufi festivals.',
  },
  {
    slug: 'pk-multan-urs-of-bahauddin-zakariya',
    description: 'Document date: Islamic Calendar (Date varies annually)\n\nHistorical/cultural significance: A historic Sufi festival attracting devotees from across the region.\n\nNotes: The document highlights its continuity and spiritual importance.',
  },
];

(async () => {
  for (const item of updates) {
    await prisma.event.update({
      where: { slug: item.slug },
      data: { description: item.description },
    });
  }
  console.log('Updated 3 events in the database.');
  await prisma.$disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
