const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../../tmp_afg_docx_extracted/document_clean.txt');
const buffer = fs.readFileSync(filePath);
const hasBom = buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
const text = buffer.toString('utf8');
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
  '14. City Fun Facts',
  '15. City Statistics',
  '16. City Events'
];

console.log('BOM:', hasBom);
console.log('LENGTH:', text.length);
console.log('SLICE:', JSON.stringify(text.slice(0, 400)));
for (const section of sections) {
  console.log('SEARCH:', section, text.indexOf(section));
}

function extractSection(section) {
  const idx = text.indexOf(section);
  if (idx < 0) return null;
  let slice = text.slice(idx);
  let nextIdx = text.length;
  for (const other of sections) {
    if (other === section) continue;
    const pos = slice.indexOf(other);
    if (pos >= 0 && pos < nextIdx) nextIdx = pos;
  }
  if (nextIdx !== text.length) slice = slice.slice(0, nextIdx);
  return slice.replace(/\r/g, '');
}

for (const section of sections) {
  const sectionText = extractSection(section);
  console.log('SECTION:', section);
  if (!sectionText) {
    console.log('MISSING');
  } else {
    console.log(sectionText.slice(0, 2600));
  }
  console.log('\n---\n');
}
