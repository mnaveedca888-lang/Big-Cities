const cities = [
  { slug: 'in-delhi', url: 'https://en.wikipedia.org/wiki/Delhi' },
  { slug: 'in-mumbai', url: 'https://en.wikipedia.org/wiki/Mumbai' },
  { slug: 'in-bengaluru', url: 'https://en.wikipedia.org/wiki/Bengaluru' },
  { slug: 'in-kolkata', url: 'https://en.wikipedia.org/wiki/Kolkata' },
  { slug: 'in-chennai', url: 'https://en.wikipedia.org/wiki/Chennai' }
];

function stripTags(value) {
  return value.replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractInfobox(html) {
  const match = html.match(/<table[^>]*class="infobox[\s\S]*?<\/table>/i);
  return match ? match[0] : null;
}

function getValue(infobox, label) {
  if (!infobox) return null;
  const regex = new RegExp(`<tr[^>]*>\s*<th[^>]*>(?:[\s\S]*?)${label}(?:[\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>`, 'i');
  const match = infobox.match(regex);
  return match ? stripTags(match[1]) : null;
}

function extractImage(html) {
  const match = html.match(/<table[^>]*class="infobox[\s\S]*?<img[^>]*src="([^"]+)"/i);
  if (!match) return null;
  let src = match[1];
  if (src.startsWith('//')) src = 'https:' + src;
  return src.replace(/&amp;/g, '&');
}

function extractFirstParagraph(html) {
  const match = html.match(/<p>([\s\S]*?)<\/p>/i);
  if (!match) return null;
  return stripTags(match[1]);
}

(async () => {
  const countryUrl = 'https://en.wikipedia.org/wiki/India';
  const countryHtml = await (await fetch(countryUrl)).text();
  console.log('=== Country ===');
  console.log('URL:', countryUrl);
  console.log('INTRO:', extractFirstParagraph(countryHtml).slice(0, 300));
  console.log('IMAGE:', extractImage(countryHtml));
  const countryInfobox = extractInfobox(countryHtml);
  console.log('CAPITAL:', getValue(countryInfobox, 'Capital'));
  console.log('POPULATION:', getValue(countryInfobox, 'Population')?.slice(0, 100));
  console.log('AREA:', getValue(countryInfobox, 'Area'));
  console.log('CURRENCY:', getValue(countryInfobox, 'Currency'));
  console.log('OFFICIAL:', getValue(countryInfobox, 'Official languages'));
  console.log('');
  for (const city of cities) {
    const html = await (await fetch(city.url)).text();
    const infobox = extractInfobox(html);
    console.log('===', city.slug, '===');
    console.log('URL:', city.url);
    console.log('INTRO:', extractFirstParagraph(html).slice(0, 300));
    console.log('IMAGE:', extractImage(html));
    console.log('POPULATION:', getValue(infobox, 'Population'));
    console.log('AREA:', getValue(infobox, 'Area') || getValue(infobox, 'Area total'));
    console.log('ELEVATION:', getValue(infobox, 'Elevation'));
    console.log('COORDINATES:', getValue(infobox, 'Coordinates'));
    console.log('AIRPORT:', getValue(infobox, 'Airport'));
    console.log('RAILWAY:', getValue(infobox, 'Railway'));
    console.log('');
  }
})();
