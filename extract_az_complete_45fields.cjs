#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the extracted text file
const textPath = path.join(__dirname, 'tmp_az_full_text_extracted.txt');
const fullText = fs.readFileSync(textPath, 'utf-8');

// Cities to extract
const cities = [
  'Baku',
  'Ganja',
  'Lankaran',
  'Nakhchivan',
  'Gabala',
  'Lachin',
  'Fuzuli',
  'Zangilan',
  'Zaqatala'
];

// Field names (44 fields requested)
const fieldNames = [
  'city_population',
  'nickname',
  'overview',
  'history',
  'founded',
  'historical_significance',
  'area',
  'elevation',
  'rivers',
  'climate',
  'coordinates',
  'unesco_sites',
  'famous_landmarks',
  'museums',
  'parks',
  'traditional_food',
  'street_food',
  'popular_restaurants',
  'festivals',
  'cultural_events',
  'arts',
  'music',
  'major_industries',
  'technology',
  'tourism',
  'manufacturing',
  'finance',
  'metro',
  'airport',
  'railway',
  'bus_network',
  'major_roads',
  'movies_filmed_here',
  'tv_shows',
  'sports',
  'stadiums',
  'famous_people',
  'world_records',
  'interesting_facts',
  'unique_customs',
  'unique_transportation',
  'surprising_facts',
  'time_zone',
  'postal_code'
];

// Parse city sections
function extractCityData(text, cityName) {
  // Find the section that starts with the city name
  // Pattern: "City Name, Azerbaijan — Complete City Profile (2026)" or similar variations
  const patterns = [
    new RegExp(cityName + '.*?Azerbaijan.*?Complete City Profile.*?2026', 'i'),
    new RegExp(cityName + '.*?Azerbaijan', 'i'),
    new RegExp(cityName + '\\s*\\(.*?\\).*?Azerbaijan', 'i')
  ];

  let startIdx = -1;
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      startIdx = text.indexOf(match[0]);
      break;
    }
  }

  if (startIdx === -1) {
    console.log(`Warning: Could not find section for ${cityName}`);
    return null;
  }

  // Find the end of this city's section (start of next city or end of file)
  let endIdx = text.length;
  for (const otherCity of cities) {
    if (otherCity !== cityName) {
      const otherPattern = new RegExp(otherCity + '.*?Azerbaijan.*?Complete City Profile', 'i');
      const otherMatch = text.match(otherPattern);
      if (otherMatch) {
        const otherIdx = text.indexOf(otherMatch[0], startIdx + 1);
        if (otherIdx > startIdx && otherIdx < endIdx) {
          endIdx = otherIdx;
        }
      }
    }
  }

  const citySection = text.substring(startIdx, endIdx);
  
  // Extract fields - look for numbered fields like "1. City Population"
  const fields = {};
  
  for (let fieldNum = 1; fieldNum <= 44; fieldNum++) {
    const fieldLabel = fieldNames[fieldNum - 1];
    
    // Try to find the field by number
    const fieldPattern = new RegExp(`${fieldNum}\\.\\s+(.+?)\\n(.*?)(?=\\n(?:\\d+\\.\\s+|$))`, 's');
    const fieldMatch = citySection.match(fieldPattern);
    
    if (fieldMatch) {
      // Extract the content (everything after the field title until next numbered field or end)
      let content = fieldMatch[2].trim();
      
      // Clean up the content - remove citation markers and extra whitespace
      content = content
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\+\s*\d+/g, '') // Remove citation markers like "+ 2"
        .trim();
      
      // If the content is empty or just says "Not available", mark as null
      if (!content || content.toLowerCase().includes('not available') || content.toLowerCase().includes('not verified')) {
        fields[fieldLabel] = null;
      } else {
        fields[fieldLabel] = content;
      }
    } else {
      fields[fieldLabel] = null;
    }
  }
  
  return fields;
}

// Extract all cities
const result = {
  extraction_date: new Date().toISOString(),
  total_cities: cities.length,
  cities: {}
};

console.log('Starting extraction for 9 cities with 44 fields each...\n');

for (const city of cities) {
  console.log(`Extracting: ${city}...`);
  const cityData = extractCityData(fullText, city);
  if (cityData) {
    result.cities[city] = cityData;
    console.log(`  ✓ Found ${Object.values(cityData).filter(v => v !== null).length}/44 fields`);
  } else {
    result.cities[city] = {};
    console.log(`  ✗ Failed to extract`);
  }
}

// Write results to JSON file
const jsonPath = path.join(__dirname, 'AZERBAIJAN_CITIES_45_FIELDS_EXTRACTED.json');
fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');

console.log(`\n✓ Extraction complete!`);
console.log(`✓ Output saved to: AZERBAIJAN_CITIES_45_FIELDS_EXTRACTED.json`);

// Also create a markdown table for easier viewing
let markdownOutput = '# Azerbaijan Cities - 44 Fields Extraction\n\n';
markdownOutput += `**Extraction Date:** ${new Date().toISOString()}\n\n`;

for (const city of cities) {
  markdownOutput += `## ${city}\n\n`;
  markdownOutput += '| Field | Value |\n';
  markdownOutput += '|-------|-------|\n';
  
  const cityData = result.cities[city];
  for (let i = 0; i < fieldNames.length; i++) {
    const fieldName = fieldNames[i];
    const fieldValue = cityData[fieldName] || 'Not available';
    const cleanValue = fieldValue ? fieldValue.substring(0, 100) + (fieldValue.length > 100 ? '...' : '') : 'Not available';
    markdownOutput += `| ${fieldName} | ${cleanValue} |\n`;
  }
  markdownOutput += '\n';
}

const markdownPath = path.join(__dirname, 'AZERBAIJAN_CITIES_45_FIELDS_EXTRACTED.md');
fs.writeFileSync(markdownPath, markdownOutput, 'utf-8');

console.log(`✓ Markdown table saved to: AZERBAIJAN_CITIES_45_FIELDS_EXTRACTED.md`);
