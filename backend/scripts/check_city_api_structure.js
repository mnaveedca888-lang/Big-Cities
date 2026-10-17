const canonical = [
  'airport', 'area', 'arts', 'busNetwork', 'climate', 'coordinates', 'country', 'culturalEvents',
  'elevation', 'famousLandmarks', 'famousPeople', 'festivals', 'finance', 'flagImageUrl', 'founded',
  'heroImageUrl', 'historicalSignificance', 'history', 'interestingFacts', 'majorIndustries', 'majorRoads',
  'manufacturing', 'metro', 'moviesFilmedHere', 'museums', 'music', 'nickname', 'overview', 'parks',
  'popularRestaurants', 'population', 'postalCode', 'railway', 'rivers', 'shortDescription', 'sources',
  'sports', 'stadiums', 'streetFood', 'surprisingFacts', 'technology', 'thumbnail', 'timeZone', 'tourism',
  'traditionalFood', 'tvShows', 'unescoSites', 'uniqueCustoms', 'uniqueTransportation', 'worldRecords',
];

async function main() {
  const slugs = ['pk-islamabad', 'af-kabul', 'in-ahmedabad', 'ar-buenos-aires', 'fr-ajaccio-napoleon-bonaparte-airport', 'jp-akita', 'za-cape-town-international-airport'];
  for (const slug of slugs) {
    const response = await fetch(`http://localhost:4000/cities/${slug}`);
    if (!response.ok) throw new Error(`${slug}: HTTP ${response.status}`);
    const payload = await response.json();
    const city = payload.data;
    const profile = city.profile || {};
    const missing = canonical.filter((key) => !Object.prototype.hasOwnProperty.call(profile, key));
    const extra = Object.keys(profile).filter((key) => !canonical.includes(key));
    console.log(`CITY_API ${slug} ${city.countryCode} present=${canonical.length - missing.length} missing=${missing.length} extra=${extra.length} name=${city.name}`);
  }
}

main().catch((error) => {
  console.error('CITY_API_CHECK_FAILED');
  console.error(error && error.message ? error.message : error);
  process.exitCode = 1;
});
