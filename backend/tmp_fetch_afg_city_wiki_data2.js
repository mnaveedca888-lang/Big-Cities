const cities = [
  { slug: 'af-kabul', url: 'https://en.wikipedia.org/wiki/Kabul' },
  { slug: 'af-kandahar', url: 'https://en.wikipedia.org/wiki/Kandahar' },
  { slug: 'af-herat', url: 'https://en.wikipedia.org/wiki/Herat' },
  { slug: 'af-mazar-i-sharif', url: 'https://en.wikipedia.org/wiki/Mazar-i-Sharif' },
  { slug: 'af-khost', url: 'https://en.wikipedia.org/wiki/Khost' }
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

function extractRow(infobox, labelRegex) {
  const regex = new RegExp(`<tr[^>]*>\s*<th[^>]*>(?:[\s\S]*?)${labelRegex}(?:[\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>`, 'i');
  const match = infobox.match(regex);
  return match ? stripTags(match[1]) : null;
}

function extractCoordinates(html) {
  const geoMatch = html.match(/<span[^>]*class="geo[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
  if (geoMatch) return stripTags(geoMatch[1]);
  const coordMatch = html.match(/<span[^>]*class="coordinates[^"]*"[\s\S]*?<a[^>]*title="Coordinates"[^>]*>[\s\S]*?<\/a>[\s\S]*?<span[^>]*class="geo[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
  return coordMatch ? stripTags(coordMatch[1]) : null;
}

function extractImage(html) {
  const match = html.match(/<table[^>]*class="infobox[\s\S]*?<img[^>]*src="([^"]+)"/i);
  if (!match) return null;
  let src = match[1];
  if (src.startsWith('//')) src = 'https:' + src;
  return src.replace(/&amp;/g, '&');
}

(async () => {
  for (const city of cities) {
    try {
      const res = await fetch(city.url);
      const html = await res.text();
      const infobox = extractInfobox(html);
      const intro = stripTags((html.match(/<p>([\s\S]*?)<\/p>/i) || [])[1] || '');
      const image = extractImage(html);
      const area = infobox ? extractRow(infobox, 'Area|Area total|Area total\s*\(.*?\)') : null;
      const postalCode = infobox ? extractRow(infobox, 'Postal code|Postal codes') : null;
      const coords = extractCoordinates(html);
      console.log(`=== ${city.slug} ===`);
      console.log('IMAGE:', image);
      console.log('AREA:', area);
      console.log('POSTAL_CODE:', postalCode);
      console.log('COORDINATES:', coords);
      console.log('INTRO:', intro.slice(0, 200));
      console.log('');
    } catch (err) {
      console.error('ERROR', city.slug, err.message);
    }
  }
})();
