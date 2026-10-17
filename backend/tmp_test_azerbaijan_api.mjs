import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000/api';

async function testAzerbaijanAPI() {
  console.log('=== AZERBAIJAN API TESTS ===\n');

  try {
    // 1. Get Azerbaijan country
    console.log('1. Fetching Azerbaijan country...');
    const countryRes = await fetch(`${BASE_URL}/countries/AZ`);
    const countryData = await countryRes.json();
    if (countryData.success) {
      console.log(`   ✓ Country: ${countryData.data.name}`);
      console.log(`   Population: ${countryData.data.profile?.population?.toLocaleString()}`);
      console.log(`   Cities: ${countryData.data.cities}`);
      console.log(`   Events: ${countryData.data.events}`);
    } else {
      console.log(`   ✗ Error: ${countryData.error?.message}`);
    }
    console.log();

    // 2. Get Azerbaijan cities
    console.log('2. Fetching Azerbaijan cities...');
    const citiesRes = await fetch(`${BASE_URL}/countries/AZ/cities`);
    const citiesData = await citiesRes.json();
    if (citiesData.success) {
      console.log(`   ✓ Total cities: ${citiesData.data.length}`);
      for (const city of citiesData.data.slice(0, 3)) {
        console.log(`   - ${city.name} (${city.slug}): ${city.population?.toLocaleString() || 'N/A'} pop`);
      }
    } else {
      console.log(`   ✗ Error: ${citiesData.error?.message}`);
    }
    console.log();

    // 3. Get Azerbaijan events
    console.log('3. Fetching Azerbaijan events...');
    const eventsRes = await fetch(`${BASE_URL}/events?country=AZ`);
    const eventsData = await eventsRes.json();
    if (eventsData.success) {
      console.log(`   ✓ Total events: ${eventsData.data.items.length}`);
      for (const event of eventsData.data.items.slice(0, 3)) {
        console.log(`   - ${event.title} (${event.startAt?.split('T')[0]})`);
        if (event.image) {
          console.log(`     Image: ${event.image}`);
        }
      }
    } else {
      console.log(`   ✗ Error: ${eventsData.error?.message}`);
    }
    console.log();

    // 4. Get Baku city detail
    console.log('4. Fetching Baku city detail...');
    const bakuRes = await fetch(`${BASE_URL}/cities/az-baku`);
    const bakuData = await bakuRes.json();
    if (bakuData.success) {
      console.log(`   ✓ City: ${bakuData.data.name}`);
      console.log(`   Population: ${bakuData.data.population?.toLocaleString()}`);
      if (bakuData.data.image) {
        console.log(`   Image URL: ${bakuData.data.image}`);
      }
    } else {
      console.log(`   ✗ Error: ${bakuData.error?.message}`);
    }
    console.log();

    // 5. Get Baku events
    console.log('5. Fetching Baku city events...');
    const bakuEventsRes = await fetch(`${BASE_URL}/events?city=az-baku`);
    const bakuEventsData = await bakuEventsRes.json();
    if (bakuEventsData.success) {
      console.log(`   ✓ Events in Baku: ${bakuEventsData.data.items.length}`);
      for (const event of bakuEventsData.data.items) {
        console.log(`   - ${event.title}`);
      }
    } else {
      console.log(`   ✗ Error: ${bakuEventsData.error?.message}`);
    }

    console.log('\n=== API TESTS COMPLETE ===');
  } catch (error) {
    console.error('Error testing API:', error);
    process.exit(1);
  }
}

testAzerbaijanAPI();
