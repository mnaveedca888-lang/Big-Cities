const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../../tmp_afg_docx_extracted/document_clean.txt');
const text = fs.readFileSync(filePath, 'utf8').replace(/\r/g, '');
const headings = [
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
for (const h of headings) {
  const idx = text.indexOf(h);
  console.log('HEADING:', h, 'IDX:', idx);
  if (idx !== -1) {
    const snippet = text.slice(idx, idx + 600).replace(/\r?\n/g, ' ');
    console.log(snippet);
    console.log('---');
  }
}
