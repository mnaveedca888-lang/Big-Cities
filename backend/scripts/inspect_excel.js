const xlsx = require('xlsx');
const path = require('path');
const wbPath = path.resolve(__dirname, '..', '..', 'Data', 'Big City Info (1).xlsx');
console.log('Reading', wbPath);
const wb = xlsx.readFile(wbPath);
console.log('Sheets:', wb.SheetNames);
const sheet = wb.Sheets[wb.SheetNames[0]];
const json = xlsx.utils.sheet_to_json(sheet, {defval: null});
console.log('Row count:', json.length);
if (json.length > 0) {
  console.log('Columns:', Object.keys(json[0]).join(', '));
  console.log('First 5 rows sample:');
  console.log(json.slice(0,5));
}
