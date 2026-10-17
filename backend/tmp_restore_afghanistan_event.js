const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  await prisma.$connect();

  try {
    const filePath = path.resolve(__dirname, '..', 'tmp_afg_event_nowruz.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const cleaned = raw.replace(/^\uFEFF/, '').trim();
    const data = JSON.parse(cleaned)?.data;
    if (!data || !data.slug) {
      throw new Error(`Missing event data in ${filePath}`);
    }

    const existing = await prisma.event.findUnique({ where: { slug: data.slug } });
    if (!existing) {
      console.warn('Event not found for restore:', data.slug);
      return;
    }

    const updated = await prisma.event.update({
      where: { slug: data.slug },
      data: {
        title: data.title,
        description: data.description,
        countryCode: data.countryCode,
        citySlug: data.citySlug,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        tags: data.tags,
        featured: data.featured,
        trending: data.trending,
        enabled: data.enabled,
        image: data.image,
      },
    });

    console.log('RESTORED_EVENT', updated.slug, updated.title, updated.featured, updated.enabled);
  } catch (error) {
    console.error('ERROR', error);
  } finally {
    await prisma.$disconnect();
  }
})();
