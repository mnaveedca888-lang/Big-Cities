const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const dataDirectory = path.resolve(__dirname, '..', 'Data');
const workbookFiles = fs.readdirSync(dataDirectory).filter((fileName) => fileName.toLowerCase().endsWith('.xlsx'));
const needle = /robinson|airport|heliport|none\b/i;
const results = [];
for (const fileName of workbookFiles) {
  const workbook = xlsx.readFile(path.join(dataDirectory, fileName));
  for (const sheetName of workbook.SheetNames) {
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
    const matches = [];
    for (const [index, row] of rows.entries()) {
      for (const [header, value] of Object.entries(row)) {
        if (value !== null && value !== undefined && needle.test(String(value))) {
          matches.push({ row: index + 2, header, value: String(value).trim() });
        }
      }
    }
    results.push({ fileName, sheetName, rowCount: rows.length, headers: rows.length ? Object.keys(rows[0]) : [], sampleRows: rows.slice(0, 2), suspiciousMatches: matches.slice(0, 15) });
  }
}
console.log(JSON.stringify({ dataDirectory, workbooks: results }, null, 2));
