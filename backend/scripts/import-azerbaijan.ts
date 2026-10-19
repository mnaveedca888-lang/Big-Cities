import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const installLocalImageWriteGuard = require('./local-image-write-guard.cjs') as (client: PrismaClient) => void;
installLocalImageWriteGuard(prisma);

// Azerbaijan Country Data
const azerbaijanCountry = {
  code: 'AZ',
  name: 'Azerbaijan',
  profile: {
    official_name: 'Republic of Azerbaijan',
    local_name: 'Azərbaycan Respublikası',
    capital: 'Baku',
    population: 10450000,
    area: 86600,
    area_unit: 'km²',
    coordinates: {
      latitude: 40.1431,
      longitude: 47.5769,
    },
    currency: 'Azerbaijani Manat',
    currency_code: 'AZN',
    government: 'Presidential republic',
    leader: 'President Ilham Aliyev',
    gdp_nominal_2026: 78370000000,
    gdp_per_capita: 7467,
    major_industries: [
      'Oil and gas',
      'Non-ferrous metallurgy',
      'Agriculture',
      'Tourism',
      'Technology',
    ],
    international_airports: 7,
    principal_airport: 'Heydar Aliyev International Airport (Baku)',
    region: 'South Caucasus',
    strategic_context: 'Armenia-Azerbaijan peace process ongoing',
    flagImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Flag_of_Azerbaijan.svg/1200px-Flag_of_Azerbaijan.svg.png',
    heroImageUrl: 'https://images.unsplash.com/photo-1552531881-e7cf2a1ec1da?auto=format&fit=crop&w=1600&q=80',
  },
};

// Azerbaijan Cities Data
const azerbaijanCities = [
  {
    slug: 'az-baku',
    name: 'Baku',
    countryCode: 'AZ',
    profile: {
      nickname: 'City of Winds',
      population: 2390000,
      area: 2140,
      elevation: -28,
      coordinates: {
        latitude: 40.3775,
        longitude: 49.8965,
      },
      founded: 1000,
      history:
        'Baku, the capital of Azerbaijan, is one of the oldest cities in the world. Known as the "City of Winds" for its strong winds coming from the Caspian Sea. Home to the Old City, a UNESCO World Heritage Site.',
      climate: 'Semi-arid with hot summers',
      major_landmarks: [
        'Flame Towers',
        'Old City (Icherisheher)',
        'Heydar Aliyev Center',
        'Maiden Tower',
        'Baku Boulevard',
      ],
      museums: [
        'Azerbaijan National Museum',
        'Museum of Azerbaijani Carpet and Applied Arts',
        'Museum of Modern Art',
      ],
      parks: ['Baku Boulevard', 'Fanvaux Park', 'Bulbul Garden'],
      famous_food: 'Plov (rice pilaf), Lula Kebab, Qutab',
      street_food: 'Doner, Lavangi, Tandoori bread',
      popular_restaurants: [
        'Nardaran',
        'Chinar',
        'Sultanahmet',
      ],
      festivals: ['Novruz Bayram', 'Baku International Jazz Festival'],
      major_industries: [
        'Oil and gas',
        'Tourism',
        'Finance',
        'Technology',
      ],
      tourism: 'Major hub for Caspian region tourism',
      airport: 'Heydar Aliyev International Airport',
      metro: 'Baku Metro - modern underground railway system',
      railway: 'Baku Railway Station - major transport hub',
      major_roads: 'Ring Road, Heydar Aliyev Avenue, Baku Boulevard',
      international_airport: true,
      universities: [
        'Baku State University',
        'Azerbaijan Technical University',
        'Baku Engineering University',
      ],
      famous_people: 'Heydar Aliyev (former president), Bulbul (composer)',
      unique_characteristics: [
        'Only city in the world below sea level (Caspian Depression)',
        'UNESCO World Heritage Site (Old City)',
        'Home to the annual F1 Grand Prix',
        'Modern architecture mixed with historical sites',
      ],
      heroImageUrl: 'https://images.unsplash.com/photo-1552531881-e7cf2a1ec1da?auto=format&fit=crop&w=1600&q=80',
    },
  },
  {
    slug: 'az-ganja',
    name: 'Ganja',
    countryCode: 'AZ',
    profile: {
      nickname: 'City of Nizami',
      population: 330663,
      area: 2140,
      coordinates: {
        latitude: 40.6831,
        longitude: 46.3597,
      },
      founded: 1139,
      history:
        'Ganja is the second-largest city in Azerbaijan and was the birthplace of the legendary poet Nizami Ganjavi. The city has a rich cultural heritage dating back centuries.',
      climate: 'Humid continental',
      major_landmarks: [
        'Nizami Mausoleum',
        'Shah Abbas Caravanserai',
        'Juma Mosque',
        'Ganja Fortress ruins',
      ],
      museums: ['Nizami Ganjavi Museum', 'Museum of Azerbaijani Carpet Art'],
      parks: ['Nizami Park', 'Central Park'],
      famous_food: 'Traditional Azerbaijani cuisine, Shashlik',
      major_industries: [
        'Agriculture',
        'Textiles',
        'Manufacturing',
        'Light industry',
      ],
      tourism: 'Important cultural and historical destination',
      railway: 'Ganja Railway Station',
      bus_network: 'Extensive local and regional bus service',
      universities: ['Ganja State University'],
      famous_people: 'Nizami Ganjavi (poet and philosopher, 12th century)',
      interesting_facts: [
        'Birth place of poet Nizami Ganjavi',
        'One of the oldest cities in the Caucasus',
        'Important trade hub historically',
      ],
      heroImageUrl: 'https://images.unsplash.com/photo-1582074169319-dfea2a1f93e1?auto=format&fit=crop&w=1600&q=80',
    },
  },
  {
    slug: 'az-lankaran',
    name: 'Lankaran',
    countryCode: 'AZ',
    profile: {
      nickname: 'Subtropical Pearl',
      population: 89300,
      coordinates: {
        latitude: 38.7647,
        longitude: 48.8517,
      },
      founded: 1735,
      history:
        'Lankaran is a port city in southern Azerbaijan on the Caspian Sea, known for its subtropical climate and UNESCO Creative City status for gastronomy. Important historical trading center.',
      climate: 'Subtropical humid',
      major_landmarks: [
        'Lankaran Lighthouse',
        'Lankaran Fort',
        'Lankaran Promenade',
        'Local bazaar',
      ],
      parks: ['Lankaran Boulevard', 'Coastal Park'],
      famous_food: 'Seafood, rice dishes, local fish',
      traditional_food: ['Baliq (fish)', 'Spiced rice', 'Local tea'],
      street_food: 'Grilled fish, seafood kebabs',
      major_industries: [
        'Fishing',
        'Agriculture',
        'Tourism',
        'Hazelnut farming',
      ],
      tourism: 'UNESCO Creative City of Gastronomy, coastal resort destination',
      airport: 'Lankaran International Airport',
      railway: 'Lankaran Railway Station',
      major_roads: 'Coastal Highway, M-1 to Baku',
      festivals: ['Seafood Festival', 'Hazelnut Harvest Festival'],
      universities: ['Lankaran University'],
      unique_characteristics: [
        'UNESCO Creative City for Gastronomy',
        'Gateway to Talish region',
        'Subtropical microclimate',
        'Rich biodiversity',
      ],
      heroImageUrl: 'https://images.unsplash.com/photo-1549144611-11ee0e8e96d2?auto=format&fit=crop&w=1600&q=80',
    },
  },
  {
    slug: 'az-nakhchivan',
    name: 'Nakhchivan',
    countryCode: 'AZ',
    profile: {
      nickname: 'Land of Noah',
      population_city: 94500,
      population_ar: 468600,
      coordinates: {
        latitude: 39.2144,
        longitude: 45.4038,
      },
      founded: 3000,
      history:
        'Nakhchivan is the capital of the Nakhchivan Autonomous Republic, an exclave of Azerbaijan. Home to the legendary Noah\'s Tomb and rich Caucasian heritage.',
      climate: 'Dry subtropical',
      major_landmarks: [
        'Noah\'s Tomb (Nebi Nouh)',
        'Ashkhanat Mausoleum',
        'Nakhchivan Walls',
        'Alinja Fortress',
      ],
      museums: ['Nakhchivan Museum of Carpet and Applied Arts'],
      parks: ['Central Park'],
      famous_food: 'Local bread, herbs, dried fruits',
      major_industries: [
        'Agriculture',
        'Mining',
        'Tourism',
        'Fruit production',
      ],
      tourism: 'Religious and historical pilgrimage site',
      airport: 'Nakhchivan International Airport (new)',
      railway: 'Regional railway connections',
      universities: ['Nakhchivan State University'],
      unique_characteristics: [
        'Landlocked exclave of Azerbaijan',
        'Rich ancient heritage',
        'Pilgrimage destination',
        'Border with Iran and Turkey',
      ],
      heroImageUrl: 'https://images.unsplash.com/photo-1582074169319-dfea2a1f93e1?auto=format&fit=crop&w=1600&q=80',
    },
  },
  {
    slug: 'az-gabala',
    name: 'Gabala',
    countryCode: 'AZ',
    profile: {
      nickname: 'Musical Capital',
      population: 35000,
      coordinates: {
        latitude: 40.6538,
        longitude: 47.8381,
      },
      founded: 1000,
      history:
        'Gabala, also known as Qabala, is home to ancient Caucasian Albania archaeological sites. The city is now known as Azerbaijan\'s Musical Capital.',
      climate: 'Temperate mountain',
      major_landmarks: [
        'Chukhur Qabalа archaeological site',
        'Gabala Fortress remains',
        'Vecin Bаbа',
        'Natural reserves',
      ],
      museums: ['Caucasian Albania Museum'],
      parks: ['Mountain parks', 'Nature reserves'],
      major_industries: [
        'Tourism',
        'Culture',
        'Music festivals',
        'Agriculture',
      ],
      tourism: 'UNESCO historical and cultural site',
      festivals: ['Gabala International Music Festival'],
      universities: ['Qabala State University'],
      unique_characteristics: [
        'Site of ancient Caucasian Albania capital',
        'International music festival venue',
        'Mountain tourism destination',
        'Archaeological importance',
      ],
      heroImageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80',
    },
  },
  {
    slug: 'az-lachin',
    name: 'Lachin',
    countryCode: 'AZ',
    profile: {
      nickname: 'Gateway to Karabakh',
      population: 2190,
      coordinates: {
        latitude: 39.5597,
        longitude: 46.6331,
      },
      history:
        'Lachin is a city in the Lachin District, part of post-war reconstruction efforts in Karabakh. Recently received a new international airport.',
      climate: 'Mountain climate',
      major_landmarks: [
        'Lachin Canyon',
        'New International Airport (2025)',
        'Reconstruction projects',
      ],
      major_industries: [
        'Tourism',
        'Infrastructure development',
        'Agriculture',
      ],
      tourism: 'Emerging destination for tourism',
      airport: 'Lachin International Airport (new, 2025)',
      unique_characteristics: [
        'Post-war reconstruction city',
        'New modern airport',
        'Mountain geography',
        'Strategic location',
      ],
      heroImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
    },
  },
  {
    slug: 'az-fuzuli',
    name: 'Fuzuli',
    countryCode: 'AZ',
    profile: {
      nickname: 'Homeland',
      population: 17500,
      coordinates: {
        latitude: 39.4833,
        longitude: 47.1833,
      },
      history:
        'Fuzuli is the center of the Fuzuli District, undergoing major post-war reconstruction. Named after the famous Azerbaijani poet Fuzuli.',
      climate: 'Temperate continental',
      major_landmarks: [
        'Fuzuli City reconstruction',
        'Monument to Fuzuli (poet)',
        'New administrative buildings',
      ],
      major_industries: [
        'Reconstruction and development',
        'Agriculture',
        'Tourism',
      ],
      tourism: 'Emerging reconstruction destination',
      unique_characteristics: [
        'Post-war reconstruction city',
        'Named after poet Fuzuli',
        'Modern urban planning',
        'Growing infrastructure',
      ],
      heroImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
    },
  },
  {
    slug: 'az-zangilan',
    name: 'Zangilan',
    countryCode: 'AZ',
    profile: {
      nickname: 'Pearl of Karabakh',
      population: 45200,
      coordinates: {
        latitude: 38.8333,
        longitude: 47.3333,
      },
      history:
        'Zangilan is the center of the Zangilan District in Karabakh region, undergoing significant post-war reconstruction and development.',
      climate: 'Temperate continental',
      major_landmarks: [
        'Reconstruction projects',
        'New administrative center',
        'Cultural centers',
      ],
      major_industries: [
        'Infrastructure development',
        'Agriculture',
        'Tourism',
      ],
      tourism: 'Emerging destination',
      unique_characteristics: [
        'Post-war reconstruction focus',
        'Modern infrastructure development',
        'Agricultural revival',
      ],
      heroImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80',
    },
  },
  {
    slug: 'az-zaqatala',
    name: 'Zaqatala',
    countryCode: 'AZ',
    profile: {
      nickname: 'Nut Capital',
      population: 32171,
      coordinates: {
        latitude: 41.6211,
        longitude: 46.6508,
      },
      founded: 1000,
      history:
        'Zaqatala is a city in northern Azerbaijan known for its hazelnut production. Surrounded by forested mountains, it\'s an important agricultural center.',
      climate: 'Humid continental, mountain forest climate',
      major_landmarks: [
        'Hazelnut orchards and farms',
        'Mountain peaks',
        'Nature reserves',
      ],
      parks: ['Forest reserves', 'Natural parks'],
      major_industries: [
        'Hazelnut farming',
        'Agriculture',
        'Forestry',
        'Tourism',
      ],
      tourism: 'Agritourism destination',
      unique_characteristics: [
        'Leading hazelnut production center',
        'Mountain agriculture focus',
        'Forest ecosystems',
        'Rural tourism',
      ],
      heroImageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80',
    },
  },
];

// Azerbaijan Events Data for 2026
const azerbaijanEvents = [
  {
    slug: 'az-new-year-holidays',
    title: 'New Year Holidays',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-01-01'),
    endAt: new Date('2026-01-02'),
    description:
      'Celebration of the New Year, a major public holiday in Azerbaijan with festivities, family gatherings, and cultural events.',
    category: 'National Holiday',
    featured: false,
  },
  {
    slug: 'az-martyrs-day',
    title: "Martyrs' Day (Black January)",
    countryCode: 'AZ',
    citySlug: 'az-baku',
    startAt: new Date('2026-01-20'),
    endAt: new Date('2026-01-20'),
    description:
      'Commemoration of the victims of the January 1990 tragedy in Baku. Public holiday with ceremonies and remembrance events.',
    featured: false,
  },
  {
    slug: 'az-khojaly-genocide-memorial',
    title: 'Khojaly Genocide Memorial Day',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-02-26'),
    endAt: new Date('2026-02-26'),
    description:
      'Commemoration of the Khojaly tragedy of 1992. National remembrance and memorial ceremonies throughout the country.',
    category: 'National Holiday',
    featured: false,
  },
  {
    slug: 'az-womens-day',
    title: 'International Women\'s Day',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-03-08'),
    endAt: new Date('2026-03-08'),
    description:
      'Celebration of women\'s achievements and contributions to society. Cultural events and festivities across the nation.',
    category: 'Cultural Celebration',
    featured: false,
  },
  {
    slug: 'az-novruz-bayram',
    title: 'Novruz Bayram (Spring Festival)',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-03-20'),
    endAt: new Date('2026-03-24'),
    description:
      'UNESCO Intangible Cultural Heritage celebration marking the spring equinox. Major national holiday with festivities, traditional foods, and family gatherings. Traditional bonfires and new beginnings symbolize the celebration.',
    category: 'Traditional Festival',
    featured: true,
  },
  {
    slug: 'az-victory-day-fascism',
    title: 'Victory Day over Fascism',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-05-09'),
    endAt: new Date('2026-05-09'),
    description:
      'Commemoration of the victory over Nazi Germany in World War II. Parades, ceremonies, and public gatherings throughout the country.',
    category: 'National Holiday',
    featured: false,
  },
  {
    slug: 'az-republic-day',
    title: 'Republic Day',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-05-28'),
    endAt: new Date('2026-05-28'),
    description:
      'National celebration of the founding of the Azerbaijan Democratic Republic in 1918. Public holiday with cultural events and festivities.',
    category: 'National Holiday',
    featured: false,
  },
  {
    slug: 'az-national-salvation-day',
    title: 'Day of National Salvation',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-06-15'),
    endAt: new Date('2026-06-15'),
    description:
      'Commemoration of the restoration of constitutional order in 1993. National remembrance and reflection.',
    category: 'National Holiday',
    featured: false,
  },
  {
    slug: 'az-armed-forces-day',
    title: 'Azerbaijan Armed Forces Day',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-06-26'),
    endAt: new Date('2026-06-26'),
    description:
      'Celebration honoring the Azerbaijan Armed Forces. Military parades and ceremonies throughout the country.',
    category: 'National Holiday',
    featured: false,
  },
  {
    slug: 'az-national-independence-day',
    title: 'National Independence Day',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-10-18'),
    endAt: new Date('2026-10-18'),
    description:
      'Celebration of Azerbaijan\'s independence from the Soviet Union in 1991. Major national holiday with festivities, parades, and cultural events.',
    category: 'National Holiday',
    featured: true,
  },
  {
    slug: 'az-victory-day-republic',
    title: 'Victory Day of the Republic',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-11-08'),
    endAt: new Date('2026-11-08'),
    description:
      'Commemoration of the end of the 2020 Karabakh War. National celebration with parades and official ceremonies.',
    category: 'National Holiday',
    featured: false,
  },
  {
    slug: 'az-state-flag-day',
    title: 'State Flag Day',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-11-09'),
    endAt: new Date('2026-11-09'),
    description:
      'Celebration of the national flag of Azerbaijan. Symbolic public displays and flag-raising ceremonies throughout the nation.',
    category: 'National Holiday',
    featured: false,
  },
  {
    slug: 'az-constitution-day',
    title: 'Constitution Day',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-11-12'),
    endAt: new Date('2026-11-12'),
    description:
      'Commemoration of the adoption of the Constitution of Azerbaijan in 1995. Educational and civic events nationwide.',
    category: 'National Holiday',
    featured: false,
  },
  {
    slug: 'az-national-revival-day',
    title: 'National Revival Day',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-11-17'),
    endAt: new Date('2026-11-17'),
    description:
      'Commemoration of the beginning of the national independence movement in 1988. Rallies and public demonstrations of national pride.',
    category: 'National Holiday',
    featured: false,
  },
  {
    slug: 'az-world-azerbaijanis-solidarity-day',
    title: 'World Azerbaijanis Solidarity Day',
    countryCode: 'AZ',
    citySlug: null,
    startAt: new Date('2026-12-31'),
    endAt: new Date('2026-12-31'),
    description:
      'Celebration of Azerbaijani identity and global diaspora solidarity. Cultural events and international recognition of Azerbaijani heritage.',
    category: 'Cultural Celebration',
    featured: false,
  },
];

async function main() {
  try {
    console.log('Starting Azerbaijan data import...');

    // 1. Create or update Azerbaijan country
    console.log('Upserting Azerbaijan country...');
    const country = await prisma.country.upsert({
      where: { code: 'AZ' },
      update: {
        name: azerbaijanCountry.name,
        profile: azerbaijanCountry.profile,
      },
      create: azerbaijanCountry,
    });
    console.log(`✓ Country: ${country.name} (${country.code})`);

    // 2. Create or update all Azerbaijan cities
    console.log(`\nUpserting ${azerbaijanCities.length} cities...`);
    for (const city of azerbaijanCities) {
      const created = await prisma.city.upsert({
        where: { slug: city.slug },
        update: {
          name: city.name,
          countryCode: city.countryCode,
          profile: city.profile,
        },
        create: city,
      });
      console.log(`  ✓ City: ${created.name} (${created.slug})`);
    }

    // 3. Create or update all Azerbaijan events
    console.log(`\nUpserting ${azerbaijanEvents.length} events...`);
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

    // Ensure event categories exist
    const requiredCategories = [
      { name: 'National Holiday', slug: 'national-holiday' },
      { name: 'Cultural Celebration', slug: 'cultural-celebration' },
      { name: 'Traditional Festival', slug: 'traditional-festival' },
    ];

    for (const cat of requiredCategories) {
      if (!categoryMap.has(cat.slug)) {
        const created = await prisma.category.create({ data: cat });
        categoryMap.set(created.slug, created.id);
      }
    }

    for (const event of azerbaijanEvents) {
      const categoryId = categoryMap.get(event.category?.toLowerCase().replace(/ /g, '-') || 'national-holiday');

      const created = await prisma.event.upsert({
        where: { slug: event.slug },
        update: {
          title: event.title,
          description: event.description,
          categoryId: categoryId || null,
          countryCode: event.countryCode,
          citySlug: event.citySlug,
          startAt: event.startAt,
          endAt: event.endAt,
          featured: event.featured,
          tags: JSON.stringify(event.category ? [event.category] : []),
        },
        create: {
          slug: event.slug,
          title: event.title,
          description: event.description,
          categoryId: categoryId || null,
          countryCode: event.countryCode,
          citySlug: event.citySlug,
          startAt: event.startAt,
          endAt: event.endAt,
          featured: event.featured,
          tags: JSON.stringify(event.category ? [event.category] : []),
        },
      });
      console.log(`  ✓ Event: ${created.title} (${created.slug})`);
    }

    console.log('\n✓ Azerbaijan data import completed successfully!');
    console.log(`\nSummary:`);
    console.log(`  - Country: 1 (Azerbaijan)`);
    console.log(`  - Cities: ${azerbaijanCities.length}`);
    console.log(`  - Events: ${azerbaijanEvents.length}`);
  } catch (error) {
    console.error('Error importing Azerbaijan data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
