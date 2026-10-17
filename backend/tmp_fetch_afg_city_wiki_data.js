const cities = [
  { slug: 'af-kabul', url: 'https://en.wikipedia.org/wiki/Kabul' },
  { slug: 'af-kandahar', url: 'https://en.wikipedia.org/wiki/Kandahar' },
  { slug: 'af-herat', url: 'https://en.wikipedia.org/wiki/Herat' },
  { slug: 'af-mazar-i-sharif', url: 'https://en.wikipedia.org/wiki/Mazar-i-Sharif' },
  { slug: 'af-khost', url: 'https://en.wikipedia.org/wiki/Khost' }
];

function extractFirstImage(html) {
  const imgMatch = html.match(/<table[^>]*class="infobox[^"]*"[\s\S]*?<img[^>]*src="([^"]+)"/i);
  if (!imgMatch) return null;
  let src = imgMatch[1];
  if (src.startsWith('//')) src = 'https:' + src;
  return src;
}

function extractInfoboxValue(html, label) {
  const regex = new RegExp(`<th[^>]*>(?:<div[^>]*>)?\\s*${label}\\s*(?:<\\/div>)?<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, 'i');
  const match = html.match(regex);
  if (!match) return null;
  return match[1].replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '').replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1').replace(/<[^>]+>/g, '').trim();
}

(async () => {
  for (const city of cities) {
    const res = await fetch(city.url);
    const html = await res.text();
    const intro = (html.match(/<p>([\s\S]*?)<\/p>/i) || [])[1]?.replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '').replace(/<[^>]+>/g, '').trim() || '';
    const image = extractFirstImage(html);
    const area = extractInfoboxValue(html, 'Area total') || extractInfoboxValue(html, 'Area');
    const postalCode = extractInfoboxValue(html, 'Postal code') || extractInfoboxValue(html, 'Postal codes');
    const coordinates = extractInfoboxValue(html, 'Coordinates');
    console.log(`=== ${city.slug} ===`);
    console.log('URL:', city.url);
    console.log('INTRO:', intro.slice(0, 250));
    console.log('IMAGE:', image);
    console.log('AREA:', area);
    console.log('POSTAL_CODE:', postalCode);
    console.log('COORDINATES:', coordinates);
    console.log('');
  }
})();
