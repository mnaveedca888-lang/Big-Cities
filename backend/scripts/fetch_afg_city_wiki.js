const cities = [
  { slug: 'af-kabul', url: 'https://en.wikipedia.org/wiki/Kabul' },
  { slug: 'af-kandahar', url: 'https://en.wikipedia.org/wiki/Kandahar' },
  { slug: 'af-herat', url: 'https://en.wikipedia.org/wiki/Herat' },
  { slug: 'af-mazar-i-sharif', url: 'https://en.wikipedia.org/wiki/Mazar-i-Sharif' },
  { slug: 'af-khost', url: 'https://en.wikipedia.org/wiki/Khost' }
];

(async () => {
  for (const city of cities) {
    try {
      const res = await fetch(city.url);
      const html = await res.text();
      const introMatch = html.match(/<p>([\s\S]*?)<\/p>/i);
      const intro = introMatch ? introMatch[1].replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '').replace(/<[^>]+>/g, '').replace(/\[.*?\]/g, '').trim() : '';
      const infoMatches = [...html.matchAll(/<th[^>]*>([^<]+)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)];
      const info = infoMatches.slice(0, 20).map(([_, key, value]) => ({ key: key.trim(), value: value.replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '').replace(/<[^>]+>/g, '').trim() })).filter(item => item.value).slice(0, 20);
      console.log('===', city.slug, '===');
      console.log('URL:', city.url);
      console.log('INTRO:', intro);
      console.log('INFO:', JSON.stringify(info, null, 2));
      console.log('');
    } catch (error) {
      console.error('ERROR', city.slug, error.message);
    }
  }
})();
