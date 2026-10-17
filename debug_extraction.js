import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the raw extracted text
const rawText = fs.readFileSync(path.join(__dirname, 'tmp_docx_raw_text.txt'), 'utf-8');

// Get Baku section
const bakuStart = rawText.indexOf('Baku, Azerbaijan — Complete City Profile');
const fuzuliStart = rawText.indexOf('Fuzuli, Azerbaijan — Complete City Profile');
const bakuSection = rawText.substring(bakuStart, fuzuliStart);

console.log('=== BAKU SECTION (first 1500 chars) ===');
console.log(bakuSection.substring(0, 1500));
console.log('\n=== TESTING FIELD EXTRACTION ===\n');

// Test extraction
const testField = (fieldNum, fieldName) => {
  const escapedName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fieldPattern = new RegExp(
    `^\\s*${fieldNum}\\.\\s+${escapedName}\\s*$`,
    'im'
  );
  
  console.log(`Testing: "${fieldNum}. ${fieldName}"`);
  console.log(`Pattern: ${fieldPattern}`);
  
  let match = bakuSection.match(fieldPattern);
  if (!match) {
    console.log(`  First pattern didn't match, trying flexible pattern...`);
    const flexPattern = new RegExp(
      `${fieldNum}\\.\\s+${escapedName}`,
      'i'
    );
    match = bakuSection.match(flexPattern);
  }
  
  if (match) {
    console.log(`✓ MATCH FOUND`);
    console.log(`  Full match: "${match[0]}"`);
    console.log(`  Index: ${match.index}`);
    
    // Extract content
    const fieldStartPos = match.index + match[0].length;
    const remainingContent = bakuSection.substring(fieldStartPos);
    const nextFieldPattern = /^\s*\d+\.\s+/m;
    const nextFieldMatch = remainingContent.match(nextFieldPattern);
    
    let fieldContent;
    if (nextFieldMatch) {
      fieldContent = remainingContent.substring(0, nextFieldMatch.index);
    } else {
      fieldContent = remainingContent.substring(0, 200);
    }
    
    const cleaned = fieldContent
      .trim()
      .replace(/\n\s+/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 200)
      .trim();
    
    console.log(`  Content: ${cleaned}...`);
  } else {
    console.log(`✗ NO MATCH`);
  }
  console.log();
};

// Test a few fields
testField(1, 'City Population');
testField(2, 'Nickname');
testField(3, 'Overview');
testField(4, 'History');
