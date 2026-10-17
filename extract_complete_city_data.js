import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the raw extracted text
const rawText = fs.readFileSync(path.join(__dirname, 'tmp_docx_raw_text.txt'), 'utf-8');

// Split by city profiles
const cityMatches = rawText.matchAll(/^([A-Z][a-z]+(?:\s*\([^)]+\))?),\s*Azerbaijan — Complete City Profile/gm);
const cityPositions = [];

for (const match of cityMatches) {
  cityPositions.push({
    name: match[1],
    index: match.index
  });
}

// Extract each city's section
const cities = [];
for (let i = 0; i < cityPositions.length; i++) {
  const startIdx = cityPositions[i].index;
  const endIdx = i < cityPositions.length - 1 ? cityPositions[i + 1].index : rawText.length;
  const citySection = rawText.substring(startIdx, endIdx);
  
  cities.push({
    name: cityPositions[i].name,
    content: citySection
  });
}

console.log(`Found ${cities.length} cities in the document:\n`);
cities.forEach((city, idx) => {
  console.log(`${idx + 1}. ${city.name}`);
});

// Function to extract field values
function extractField(content, fieldNumber, fieldName) {
  // Create pattern to find the field header - look for "N. FieldName" pattern
  // The field name might be split across lines in the text
  const escapedName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Try pattern 1: exact match with field number and name on same line
  let fieldPattern = new RegExp(
    `^\\s*${fieldNumber}\\.\\s+${escapedName}\\s*$`,
    'im'
  );
  
  let match = content.match(fieldPattern);
  if (!match) {
    // Try pattern 2: with partial match if extraction didn't get exact format
    fieldPattern = new RegExp(
      `${fieldNumber}\\.\\s+${escapedName}`,
      'i'
    );
    match = content.match(fieldPattern);
  }
  
  if (!match) {
    return "NOT IN DOCX";
  }
  
  // Find the start position after the field header
  const fieldStartPos = match.index + match[0].length;
  
  // Find the next field (look for pattern like "N. FieldName" where N is a number)
  const remainingContent = content.substring(fieldStartPos);
  const nextFieldPattern = /^\s*\d+\.\s+/m;
  const nextFieldMatch = remainingContent.match(nextFieldPattern);
  
  let fieldContent;
  if (nextFieldMatch) {
    fieldContent = remainingContent.substring(0, nextFieldMatch.index);
  } else {
    fieldContent = remainingContent;
  }
  
  // Clean up the content
  const cleaned = fieldContent
    .trim()
    .replace(/\n\s+/g, ' ')      // Replace line breaks with spaces
    .replace(/\s+/g, ' ')        // Collapse multiple spaces
    .trim();
  
  if (cleaned && cleaned.length > 0) {
    return cleaned;
  }
  
  return "NOT IN DOCX";
}

// The 45 fields requested - updated to include fields 38-46
const fields = [
  { num: 1, name: 'City Population' },
  { num: 2, name: 'Nickname' },
  { num: 3, name: 'Overview' },
  { num: 4, name: 'History' },
  { num: 5, name: 'Founded' },
  { num: 6, name: 'Historical Significance' },
  { num: 7, name: 'Area' },
  { num: 8, name: 'Elevation' },
  { num: 9, name: 'Rivers' },
  { num: 10, name: 'Climate' },
  { num: 11, name: 'Coordinates' },
  { num: 12, name: 'UNESCO Sites' },
  { num: 13, name: 'Famous Landmarks' },
  { num: 14, name: 'Museums' },
  { num: 15, name: 'Parks' },
  { num: 16, name: 'Traditional Food' },
  { num: 17, name: 'Street Food' },
  { num: 18, name: 'Popular Restaurants' },
  { num: 19, name: 'Festivals' },
  { num: 20, name: 'Cultural Events' },
  { num: 21, name: 'Arts' },
  { num: 22, name: 'Music' },
  { num: 23, name: 'Major Industries' },
  { num: 24, name: 'Technology' },
  { num: 25, name: 'Tourism' },
  { num: 26, name: 'Manufacturing' },
  { num: 27, name: 'Finance' },
  { num: 28, name: 'Metro' },
  { num: 29, name: 'Airport' },
  { num: 30, name: 'Railway' },
  { num: 31, name: 'Bus Network' },
  { num: 32, name: 'Major Roads' },
  { num: 33, name: 'Movies Filmed Here' },
  { num: 34, name: 'TV Shows' },
  { num: 35, name: 'Sports' },
  { num: 36, name: 'Stadiums' },
  { num: 37, name: 'Famous People' },
  { num: 38, name: 'Nickname' },
  { num: 39, name: 'World Records' },
  { num: 40, name: 'Interesting Facts' },
  { num: 41, name: 'Unique Customs' },
  { num: 42, name: 'Unique Transportation' },
  { num: 43, name: 'Surprising Facts' },
  { num: 44, name: 'Population' },
  { num: 45, name: 'Time Zone' },
  { num: 46, name: 'Postal Code' }
];

// Extract data for all cities
const extractedData = [];
let summaryData = {};

for (const city of cities) {
  const cityData = {
    name: city.name,
    fields: {}
  };
  
  console.log(`\nExtracting data for: ${city.name}...`);
  
  for (const field of fields) {
    const value = extractField(city.content, field.num, field.name);
    cityData.fields[field.num] = value;
    
    // Track which fields are present for this city
    if (value !== "NOT IN DOCX") {
      if (!summaryData[field.num]) {
        summaryData[field.num] = { name: field.name, present: [] };
      }
      summaryData[field.num].present.push(city.name);
    }
  }
  
  extractedData.push(cityData);
}

// Generate output
let output = '';
output += '='.repeat(100) + '\n';
output += 'AZERBAIJAN CITIES - COMPLETE DATA EXTRACTION\n';
output += '='.repeat(100) + '\n\n';

// Output data for each city
for (const city of extractedData) {
  output += `CITY: ${city.name}\n`;
  output += '-'.repeat(80) + '\n';
  
  for (const field of fields) {
    const value = city.fields[field.num];
    output += `Field ${field.num} - ${field.name}: ${value}\n`;
  }
  
  output += '\n\n';
}

// Generate summary
output += '='.repeat(100) + '\n';
output += 'SUMMARY: FIELD AVAILABILITY BY CITY\n';
output += '='.repeat(100) + '\n\n';

for (const fieldNum of Object.keys(summaryData).sort((a, b) => parseInt(a) - parseInt(b))) {
  const data = summaryData[fieldNum];
  output += `Field ${fieldNum} - ${data.name}:\n`;
  output += `  Present in: ${data.present.join(', ')}\n`;
  output += `  Missing in: ${cities.filter(c => !data.present.includes(c.name)).map(c => c.name).join(', ') || 'None'}\n\n`;
}

// Save output to file
const outputPath = path.join(__dirname, 'Azerbaijan_CityData_Complete_Extraction.txt');
fs.writeFileSync(outputPath, output, 'utf-8');

console.log(`\n\nExtraction complete! Output saved to: Azerbaijan_CityData_Complete_Extraction.txt`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
