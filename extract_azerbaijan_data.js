import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function extractAzerbaijanData() {
  try {
    const docxPath = path.join(__dirname, 'Data', 'Azerbaijan', 'Azerbaijan.docx');
    
    // Read the DOCX file using mammoth.extractRawText with a file path
    const result = await mammoth.extractRawText({ path: docxPath });
    
    const text = result.value;
    
    // Log the entire extracted text to see its structure
    console.log('=== RAW TEXT FROM DOCX ===');
    console.log(text);
    console.log('=== END RAW TEXT ===\n');
    
    // Save the raw text to a file for inspection
    fs.writeFileSync(path.join(__dirname, 'tmp_docx_raw_text.txt'), text, 'utf-8');
    console.log('Raw text saved to tmp_docx_raw_text.txt');
    
  } catch (error) {
    console.error('Error extracting DOCX:', error.message);
    console.error(error);
  }
}

extractAzerbaijanData();
