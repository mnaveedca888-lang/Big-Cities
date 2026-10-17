import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function extractFromDocx(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.error('Error extracting DOCX:', error.message);
    throw error;
  }
}

async function extractBakuData() {
  const docPath = path.join(__dirname, 'Data/Azerbaijan/Azerbaijan.docx');
  
  console.log(`\nExtracting from: ${docPath}\n`);
  
  const text = await extractFromDocx(docPath);
  
  // Split into sections - look for Baku section
  const lines = text.split(/\n|(?<=[.!?])\s+/);
  
  // Find Baku section
  const bakuStartIndex = text.toLowerCase().indexOf('baku');
  if (bakuStartIndex === -1) {
    console.log('BAKU section not found in document');
    return;
  }
  
  // Extract a large chunk around Baku (e.g., 50KB or until next major city)
  const bakuSection = text.substring(bakuStartIndex, Math.min(bakuStartIndex + 100000, text.length));
  
  console.log('=== EXTRACTED BAKU SECTION (RAW) ===\n');
  console.log(bakuSection);
  console.log('\n=== END OF SECTION ===\n');
  
  // Save to file for analysis
  fs.writeFileSync(
    path.join(__dirname, 'tmp_baku_raw_extract.txt'),
    bakuSection,
    'utf-8'
  );
  
  console.log('Raw extract saved to: tmp_baku_raw_extract.txt');
}

extractBakuData().catch(console.error);
