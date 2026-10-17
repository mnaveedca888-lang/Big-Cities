const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../../tmp_afg_docx_extracted/document_clean.txt');
const raw = fs.readFileSync(filePath, 'utf8');
const text = raw.replace(/\r/g, '');
const queries = ['4. City Basic Information', 'Kabul —', 'Kabul \u2014', 'Kabul', '14. Fun & Interesting Facts', '14. Fun &amp; Interesting Facts', '14. City Fun Facts', '13. Famous People', '15. City Statistics'];
console.log('length', text.length);
for (const q of queries) {
  const idx = text.indexOf(q);
  console.log('QUERY:', JSON.stringify(q), 'IDX:', idx);
  if (idx !== -1) console.log('PREVIEW:', JSON.stringify(text.slice(Math.max(0, idx - 40), idx + 120)));
}
const sample = text.slice(0, 1200);
console.log('FIRST1200:', JSON.stringify(sample));
for (let i = 0; i < sample.length; i++) {
  if (i < 80 || (i > 200 && i < 300) || (i > 400 && i < 520)) {
    process.stdout.write(`${i}:${sample.charCodeAt(i)} `);
  }
}
console.log();
