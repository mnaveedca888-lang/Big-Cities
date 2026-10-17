const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../tmp_afg_docx_extracted/document_clean.txt');
const raw = fs.readFileSync(filePath, 'utf8');
const normalized = raw.replace(/\r/g, '').replace(/â€”|â€“|â€œ|â€�/g, '—').replace(/&amp;/g, '&');
function extract(section) {
  const idx = normalized.indexOf(section);
  if (idx === -1) return null;
  const nextIdx = normalized.indexOf('17. Country / Regional Events', idx + 1);
  if (nextIdx !== -1) return normalized.slice(idx, nextIdx);
  return normalized.slice(idx);
}
const body = extract('16. City Events');
if (!body) { console.error('missing section'); process.exit(1); }
const cities = ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Khost'];
const parts = body.split(/(Kabul —|Kandahar —|Herat —|Mazar-i-Sharif —|Khost —)/);
let current = null;
const result = [];
for (let i = 0; i < parts.length; i++) {
  const part = parts[i];
  if (cities.some(c => part.startsWith(c))) {
    current = part.replace(' —', '').trim();
    continue;
  }
  if (current) {
    result.push({ city: current, text: part.trim() });
    current = null;
  }
}
const formatted = result.map(item => item.city + ': ' + item.text).join('\n\n');
fs.writeFileSync(path.join(__dirname, 'tmp_docx_city_events_parsed.txt'), formatted, 'utf8');
const region = normalized.slice(normalized.indexOf('17. Country / Regional Events'), normalized.indexOf('18. Event Details'));
fs.writeFileSync(path.join(__dirname, 'tmp_docx_country_events_parsed.txt'), region.replace(/(\d+\s[A-Za-z]+ — )/g, '\n$1'), 'utf8');
console.log('WROTE');
