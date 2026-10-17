const fs = require('fs');
const path = require('path');
const xmlPath = path.join(__dirname, '../../tmp_afg_docx_extracted/document.xml');
const xml = fs.readFileSync(xmlPath, 'utf8');
const paragraphRegex = /<w:p[\s\S]*?<\/w:p>/gi;
const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/gi;
const paragraphs = [...xml.match(paragraphRegex)].map((p) => {
  const texts = [];
  let m;
  while ((m = textRegex.exec(p))) {
    texts.push(m[1]);
  }
  return texts.join('').replace(/\s+/g, ' ').trim();
}).filter(Boolean);
const headings = ['4. City Basic Information', '5. City About', '6. City Geography', '7. City Tourism', '8. City Food', '9. City Culture', '10. City Economy', '11. City Transportation', '12. City Entertainment', '13. City Famous People', '14. City Fun Facts', '15. City Statistics', '16. City Events'];
for (let i = 0; i < paragraphs.length; i++) {
  const p = paragraphs[i];
  if (headings.some((h) => p.startsWith(h))) {
    console.log('HEADING:', p);
    for (let j = 1; j <= 10 && i + j < paragraphs.length; j++) {
      console.log(`${i + j}: ${paragraphs[i + j]}`);
    }
    console.log('---');
  }
}
