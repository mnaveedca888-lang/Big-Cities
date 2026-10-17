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
  
  const text = await extractFromDocx(docPath);
  
  // Find Baku section
  const bakuIndex = text.toLowerCase().indexOf('baku, azerbaijan — complete city profile');
  const nextCityIndex = text.toLowerCase().indexOf(', azerbaijan — complete city profile', bakuIndex + 100);
  
  if (bakuIndex === -1) {
    console.log('BAKU section not found');
    return;
  }
  
  let bakuText;
  if (nextCityIndex !== -1) {
    // Find the next city marker after Baku
    bakuText = text.substring(bakuIndex, nextCityIndex);
  } else {
    // Take a large chunk if it's the last city
    bakuText = text.substring(bakuIndex);
  }
  
  // Save the raw Baku section
  fs.writeFileSync(
    path.join(__dirname, 'tmp_baku_complete_section.txt'),
    bakuText,
    'utf-8'
  );
  
  console.log('✓ Baku complete section saved to: tmp_baku_complete_section.txt');
  console.log(`\nTotal characters in Baku section: ${bakuText.length}`);
  console.log('\n=== BAKU DATA (FORMATTED) ===\n');
  
  // Parse and display numbered fields
  const lines = bakuText.split('\n');
  let fieldNumber = 1;
  let currentField = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if line starts with a number and a dot (field marker)
    const fieldMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (fieldMatch) {
      if (currentField) {
        console.log(currentField);
        console.log('---');
      }
      currentField = line;
    } else if (line && currentField) {
      currentField += '\n' + line;
    }
  }
  
  if (currentField) {
    console.log(currentField);
  }
}

extractBakuData().catch(console.error);
