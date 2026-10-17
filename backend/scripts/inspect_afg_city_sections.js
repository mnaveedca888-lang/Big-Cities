const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../../tmp_afg_docx_extracted/document_clean.txt');
const raw = fs.readFileSync(filePath, 'utf8');
const normalized = raw
  .replace(/\r/g, '')
  .replace(/â€”|â€“|â€”|â€"|â€”|–|—/g, '—')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

const sections = [
  '4. City Basic Information',
  '5. City About',
  '6. City Geography',
  '7. City Tourism',
  '8. City Food',
  '9. City Culture',
  '10. City Economy',
  '11. City Transportation',
  '12. City Entertainment',
  '13. Famous People',
  '14. Fun & Interesting Facts',
  '15. City Statistics',
  '16. City Events'
];
const cities = ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Khost'];

function sectionText(section) {
  const start = normalized.indexOf(section);
  if (start === -1) return null;
  let end = normalized.length;
  for (const next of sections) {
    if (next === section) continue;
    const idx = normalized.indexOf(next, start + section.length);
    if (idx !== -1 && idx > start && idx < end) end = idx;
  }
  return normalized.slice(start + section.length, end).trim();
}

function splitCityEntries(sectionBody) {
  const cityPattern = cities.map((c) => c.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  const separatorPattern = '(?:—|â€”|–|-)';
  const pattern = new RegExp(`(${cityPattern})\s+${separatorPattern}\s+`, 'g');
  const entries = [];
  let match;
  let lastIndex = 0;
  let lastCity = null;
  while ((match = pattern.exec(sectionBody)) !== null) {
    if (lastCity !== null) {
      entries.push({ city: lastCity, text: sectionBody.slice(lastIndex, match.index).trim() });
    }
    lastCity = match[1];
    lastIndex = match.index + match[0].length;
  }
  if (lastCity !== null) {
    entries.push({ city: lastCity, text: sectionBody.slice(lastIndex).trim() });
  }
  return entries;
}

const result = {};
for (const section of sections) {
  const body = sectionText(section);
  if (!body) {
    result[section] = { error: 'section not found' };
    continue;
  }
  result[section] = {
    raw: body,
    entries: splitCityEntries(body)
  };
}
fs.writeFileSync(path.join(__dirname, '../../backend/tmp_afg_docx_city_sections.json'), JSON.stringify(result, null, 2), 'utf8');
console.log('WROTE backend/tmp_afg_docx_city_sections.json');
