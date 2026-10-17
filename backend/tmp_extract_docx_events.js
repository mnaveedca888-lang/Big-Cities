const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../tmp_afg_docx_extracted/document_clean.txt');
const text = fs.readFileSync(filePath, 'utf8');
const start = text.indexOf('18. Event Details');
if (start === -1) {
  console.error('START NOT FOUND');
  process.exit(1);
}
const end = text.indexOf('19.', start);
const slice = end === -1 ? text.slice(start) : text.slice(start, end);
console.log(slice);
