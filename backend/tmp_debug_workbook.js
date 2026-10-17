const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const dir = path.join(__dirname, '..', 'Data');
for (const file of fs.readdirSync(dir).filter(f => /\.(xlsx|xls)$/i.test(f)).slice(0, 3)) {
  const wb = xlsx.readFile(path.join(dir, file));
  const sheet = wb.Sheets['City_Details'];
  if (!sheet) continue;
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: false, blankrows: false });
  console.log('FILE', file, 'ROWS', rows.length);
  for (let i = 0; i < Math.min(rows.length, 3); i++) {
    const row = rows[i];
    console.log(JSON.stringify(row, null, 2));
  }
  console.log('---');
}
