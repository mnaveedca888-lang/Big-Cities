const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  await prisma.$connect();
  try {
    const updates = [
      {
        slug: 'af-kabul',
        name: 'Kabul',
        profile: {
          heroImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Kabul%2C_Afghanistan_view.jpg',
          shortDescription: 'Kabul is the national capital and largest urban centre of Afghanistan.',
          overview: 'National capital and largest city; ancient settlement and long-standing political centre.',
          history: 'Ancient city with roots over 2,500 years, capital of modern Afghanistan and former seat of the Durrani Empire.',
          founded: 'Founded in the 5th century BC (as Kabol)',
          historicalSignificance: 'Longstanding political and cultural centre connecting Central and South Asia.',
          nickname: 'Heart of Asia',
          population: 'Approximately 5,635,737 (2025 estimate)',
          populationRank: 1,
          elevation: '~1,790 m',
          coordinates: '34.53°N, 69.17°E',
          area: 'Varies by administrative boundary; exact city-proper area depends on district definitions.',
          geography: 'Kabul River; cold semi-arid/continental climate; located in a mountain valley.',
          tourism: 'Bagh-e Babur, Darul Aman Palace, Kabul Citadel/Bala Hissar, National Museum, Qargha Reservoir, Paghman.',
          famousLandmarks: ['Bagh-e Babur','Darul Aman Palace','Kabul Citadel/Bala Hissar','National Museum','Qargha Reservoir','Paghman'],
          traditionalFood: 'Kabuli palaw, mantu, ashak, qorma',
          streetFood: 'bolani, kebabs, naan, samosas',
          popularRestaurants: 'Traditional restaurants and kebab houses around Wazir Akbar Khan, Shahr-e Naw and Kabul City Center.',
          culture: 'Dari/Pashto poetry, music, handicrafts, hospitality and traditional dress.',
          festivals: 'Nowruz, Eid al-Fitr, Eid al-Adha, Independence Day and local cultural festivals.',
          culturalEvents: 'Poetry readings, music gatherings, public celebrations and trade fairs.',
          arts: 'Dari and Pashto poetry, calligraphy, carpet weaving, and traditional handicrafts.',
          music: 'Traditional Afghan music with rubab, ghazal singing and folk performances.',
          rivers: 'Kabul River',
          climate: 'Cold semi-arid climate with hot summers and cold, snowy winters.',
          unescoSites: 'No UNESCO World Heritage sites yet, but several historic gardens and palaces are strong candidates.',
          transportation: 'Hamid Karzai International Airport (Kabul International Airport); buses, minibuses, taxis and highway links to Jalalabad and Kandahar.',
          metro: 'No operational metro system; proposed metro plans remain incomplete.',
          airport: 'Hamid Karzai International Airport (Kabul International Airport)',
          railway: 'No active passenger railway service; freight and military rail links are limited.',
          busNetwork: 'Municipal buses, private minibuses, shared taxis and airport shuttles provide city transit.',
          majorRoads: 'Kabul–Jalalabad Road, Kabul–Kandahar Highway, Darulaman Road and Airport Road.',
          museums: ['National Museum of Afghanistan','National Gallery of Afghanistan','National Archives of Afghanistan','OMAR Mine Museum'],
          parks: ['Gardens of Babur','Zarnegar Park','Shahr-e Naw Park','Qargha Reservoir','Wazir Akbar Khan Park'],
          economy: 'Kabul is the economic centre of Afghanistan: agriculture, trade, industrial parks, manufacturing, retail, hotels and real estate.',
          manufacturing: 'Manufacturing, construction and food processing.',
          technology: 'Emerging ICT sector with mobile services and local startups, still limited by infrastructure.',
          majorIndustries: 'manufacturing, construction, finance, hospitality and retail',
          finance: 'Trade, remittances and banking services are the main financial drivers.',
          entertainment: 'Documentaries, news and cultural television are the main media outputs; large-scale commercial film shoots are limited by security conditions.',
          moviesFilmedHere: 'Local documentaries, news segments and cultural features occasionally use Kabul locations.',
          tvShows: 'Local television news, cultural programs and Dari/Pashto variety shows.',
          sports: 'Football, cricket, volleyball and traditional buzkashi.',
          stadiums: 'Ghazi Stadium',
          famousPeople: ['Ahmad Shah Massoud','Hamid Karzai','Amanullah Khan','Mahmud Tarzi','Khaled Hosseini'],
          worldRecords: 'One of the world’s highest capital cities by elevation.',
          interestingFacts: ['Kabul is located in a narrow mountain valley at nearly 1,800 meters elevation.'],
          uniqueCustoms: 'Strong hospitality traditions and Pashtunwali social codes.',
          uniqueTransportation: 'Shared minibuses, taxis and private vehicles dominate city transport.',
          surprisingFacts: 'Kabul sits at almost 1,800 meters elevation, higher than most national capitals.',
          timeZone: 'AFT UTC+4:30',
          postalCode: '10XX',
          country: 'Afghanistan',
          sources: ['Afghanistan — Country & 5-City Dataset (8 Aug 2026)']
        }
      },
      {
        slug: 'af-kandahar',
        name: 'Kandahar',
        profile: {
          heroImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/Aerial_view_of_a_section_of_Kandahar_in_2013.jpg',
          shortDescription: 'Kandahar is a major southern city with historic ties to the Durrani state.',
          overview: 'Major southern city; ancient settlement closely associated with Ahmad Shah Durrani and the Durrani state.',
          history: 'Historic city founded before the 4th century BC and capital of the Durrani Empire under Ahmad Shah Durrani.',
          founded: 'Founded around the 5th century BC',
          historicalSignificance: 'Key political and cultural centre in southern Afghanistan and the origin of modern Afghanistan.',
          nickname: 'Heart of the Pashtun South',
          population: 'Approximately 799,015 (2025 estimate)',
          populationRank: 3,
          elevation: '~1,010 m',
          postalCode: 'varies by district',
          coordinates: '31.62°N, 65.72°E',
          area: 'Varies by administrative boundary; exact city-proper area depends on district definitions.',
          geography: 'Arghandab River region; hot arid climate with dry summers and cool winters.',
          rivers: 'Arghandab River, Arghistan River, Dori River',
          tourism: 'Shrine of the Cloak, Kandahar Citadel/Old City heritage areas, Ahmad Shah Durrani Mausoleum, Arghandab Valley.',
          famousLandmarks: ['Shrine of the Cloak','Kandahar Citadel','Ahmad Shah Durrani Mausoleum'],
          traditionalFood: 'Kandahari naan, meat kebabs, rice dishes',
          streetFood: 'kebabs, bolani, naan',
          popularRestaurants: 'Traditional restaurants around the Old City and close to the Shrine of the Cloak.',
          culture: 'Pashtun poetry and traditional music; Pashtunwali and jirga traditions.',
          festivals: 'Nowruz, Eid al-Fitr, Eid al-Adha and local harvest celebrations.',
          culturalEvents: 'Religious observances, tribal gatherings and cultural markets.',
          arts: 'Pashtun embroidery, woodwork and traditional crafts.',
          music: 'Pashto folk music and traditional tribal songs.',
          transportation: 'Ahmad Shah Baba International Airport; buses/minibuses/taxis; Kandahar–Kabul Highway.',
          metro: 'No metro system.',
          airport: 'Ahmad Shah Baba International Airport',
          railway: 'No regular passenger railway service.',
          busNetwork: 'Minibuses, shared taxis and intercity coaches.',
          majorRoads: 'Kandahar–Kabul Highway, Kandahar–Spin Boldak Road, Kandahar–Herat Road.',
          museums: ['Kandahar Museum'],
          parks: ['Bagh-e-Pul Park','Kandahar Shahi Park','Kokaran Park'],
          economy: 'Kandahar economy is focused on agriculture (grapes, pomegranates), trade, transport and growing industrial areas.',
          manufacturing: 'Food/agricultural processing and small-scale manufacturing.',
          technology: 'Growing telecommunications and mobile connectivity; limited formal tech industry.',
          majorIndustries: 'agriculture (fruit drying/packing), food processing, small-scale manufacturing',
          finance: 'Trade, agriculture finance and informal market services.',
          entertainment: 'Local cultural events and sports such as cricket and football.',
          moviesFilmedHere: 'Local documentary and television productions have been filmed in Kandahar.',
          tvShows: 'Regional Pashto television programming and news.',
          sports: 'Cricket, football and traditional wrestling.',
          stadiums: 'Kandahar Cricket Stadium',
          famousPeople: ['Ahmad Shah Durrani','Abdul Ghani Baradar','Mullah Mohammed Omar','Mirwais Hotak'],
          worldRecords: 'Birthplace of Ahmad Shah Durrani, founder of modern Afghanistan.',
          interestingFacts: ['Kandahar was the capital of the Afghan Durrani Empire in the 18th century.'],
          uniqueCustoms: 'Pashtunwali hospitality and jirga decision-making traditions.',
          uniqueTransportation: 'Shared minibuses, taxis and pickup trucks on major roads.',
          surprisingFacts: 'Kandahar is one of Afghanistan’s oldest continuously inhabited cities.',
          timeZone: 'AFT UTC+4:30',
          country: 'Afghanistan',
          sources: ['Afghanistan — Country & 5-City Dataset (8 Aug 2026)']
        }
      }
    ];

    for (const update of updates) {
      const city = await prisma.city.findUnique({ where: { slug: update.slug } });
      if (!city) {
        console.warn('City not found, skipping', update.slug);
        continue;
      }
      const result = await prisma.city.update({
        where: { slug: update.slug },
        data: { name: update.name, profile: update.profile },
      });
      console.log('RESTORED', result.slug, result.name);
    }
  } catch (err) {
    console.error('ERROR', err);
  } finally {
    await prisma.$disconnect();
  }
})();