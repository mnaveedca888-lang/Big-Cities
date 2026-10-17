const fs = require('fs');
const path = require('path');
const xml = fs.readFileSync(path.join(__dirname, '../../tmp_afg_docx_extracted/word/document.xml'), 'utf8');
const paragraphRegex = /<w:p[\s\S]*?<\/w:p>/gi;
const textRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/gi;
const paragraphs = [...xml.match(paragraphRegex)].map((p) => {
  const texts = [];
  let m;
  while ((m = textRegex.exec(p))) {
    texts.push(m[1]);
  }
  return texts.join('');
});
const cleaned = paragraphs.map((p) => p.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
for (let i = 0; i < cleaned.length; i += 1) {
  console.log(`${i + 1}: ${cleaned[i]}`);
}
