const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../../tmp_afg_docx_extracted/document_clean.txt');
const buffer = fs.readFileSync(filePath);
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
const result = {
  bom: buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf,
  length: text.length,
  sliceFirst400: text.slice(0,400),
  searches: sections.map(section => ({ section, index: text.indexOf(section) }))
};
fs.writeFileSync(path.join(__dirname, '../../backend/tmp_afg_docx_sections_json.json'), JSON.stringify(result, null, 2), 'utf8');
console.log('WROTE');
