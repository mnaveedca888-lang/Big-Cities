const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBaku() {
  try {
    const baku = await prisma.city.findUnique({
      where: { slug: 'az-baku' }
    });

    if (!baku) {
      console.error('Baku not found');
      return;
    }

    const profile = baku.profile || {};
    
    // Ensure these fields are explicitly set
    const updatedProfile = {
      ...profile,
      movies_filmed: profile.movies_filmed || [],
      tv_shows: profile.tv_shows || []
    };

    await prisma.city.update({
      where: { slug: 'az-baku' },
      data: { profile: updatedProfile }
    });

    console.log('✓ Baku updated with movies_filmed and tv_shows fields');
  } finally {
    await prisma.$disconnect();
  }
}

fixBaku();
