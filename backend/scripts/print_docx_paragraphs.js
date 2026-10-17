const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'tmp_afg_docx_paragraphs.txt');
const buffer = fs.readFileSync(filePath);
const text = buffer.toString('utf8');
const lines = text.split(/\r?\n/);
for (let i = 0; i < Math.min(120, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
