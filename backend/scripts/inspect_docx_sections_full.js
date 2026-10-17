const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../../tmp_afg_docx_extracted/document_clean.txt');
const text = fs.readFileSync(filePath, 'utf8');
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
const out = [];
for (let i = 0; i < sections.length; i++) {
  const section = sections[i];
  const start = text.indexOf(section);
  if (start === -1) {
    out.push(`SECTION: ${section}`);
    out.push('MISSING');
    out.push('---');
    continue;
  }
  let end = text.length;
  for (let j = i + 1; j < sections.length; j++) {
    const nextStart = text.indexOf(sections[j], start + 1);
    if (nextStart !== -1) {
      end = nextStart;
      break;
    }
  }
  const slice = text.slice(start, end).replace(/\r/g, '');
  out.push(`SECTION: ${section}`);
  out.push(slice);
  out.push('---');
}
fs.writeFileSync(path.join(__dirname, '../../backend/tmp_afg_docx_sections_full.txt'), out.join('\n'), 'utf8');
console.log('DONE');
