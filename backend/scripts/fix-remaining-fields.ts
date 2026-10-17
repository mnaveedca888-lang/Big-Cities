import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// TARGETED FIXES FOR REMAINING MISSING FIELDS
const MISSING_FIELD_FIXES = {
  'az-ganja': {
    // Ganja needs UNESCO Sites added
    unesco_sites: [
      'Nizami Mausoleum',
      'Shah Abbas Caravanserai', 
      'Juma Mosque'
    ],
    movies_filmed: [],  // No major films
    tv_shows: []        // No major TV shows
  },

  'az-lankaran': {
    // Lankaran UNESCO sites already present, just ensure movies/TV are empty arrays
    movies_filmed: [],
    tv_shows: []
  },

  'az-nakhchivan': {
    // Nakhchivan UNESCO sites already present
    movies_filmed: [],
    tv_shows: []
  },

  'az-gabala': {
    // Gabala UNESCO sites already present
    movies_filmed: [],
    tv_shows: []
  },

  'az-lachin': {
    // Post-war city, minimal UNESCO sites currently
    unesco_sites: ['Lachin Canyon'],  // Cultural site
    movies_filmed: [],
    tv_shows: []
  },

  'az-fuzuli': {
    // Post-war city
    unesco_sites: [],  // Legitimately none - under reconstruction
    movies_filmed: [],
    tv_shows: []
  },

  'az-zangilan': {
    // Post-war city
    unesco_sites: [],  // Legitimately none - under reconstruction
    movies_filmed: [],
    tv_shows: []
  },

  'az-zaqatala': {
    // Mountain region
    unesco_sites: ['Talish Forest Reserves'],  // Natural UNESCO potential
    movies_filmed: [],
    tv_shows: []
  }
};

async function fixMissingFields() {
  try {
    console.log('Fixing remaining missing fields...\n');

    for (const [citySlug, fixes] of Object.entries(MISSING_FIELD_FIXES)) {
      const city = await prisma.city.findUnique({ 
        where: { slug: citySlug }
      });

      if (!city) continue;

      // Get current profile as JSON
      const currentProfile = (city.profile as any) || {};
      
      // Update with fixes
      const updatedProfile = Object.assign({}, currentProfile, fixes);

      await prisma.city.update({
        where: { slug: citySlug },
        data: {
          profile: updatedProfile as any
        }
      });

      console.log(`✓ Fixed ${city.name}`);
    }

    console.log('\n✅ Missing fields fixed!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixMissingFields();
