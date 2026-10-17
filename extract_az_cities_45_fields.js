#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the XML file
const xmlPath = path.join(__dirname, 'Data', 'Azerbaijan', 'AZ_extracted', 'word', 'document.xml');
const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

// Define the 44 fields we're looking for
const fields = [
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

// Extract text from XML - parse w:t tags
function extractTextFromXml(xml) {
  const regex = /<w:t>([^<]*)<\/w:t>/g;
  let match;
  const texts = [];
  while ((match = regex.exec(xml)) !== null) {
    texts.push(match[1]);
  }
  return texts;
}

// Get all text content from the XML
const allText = extractTextFromXml(xmlContent);
const fullText = allText.join('\n');

console.log('Total text blocks extracted:', allText.length);
console.log('Full text length:', fullText.length);
console.log('\nFirst 2000 characters of extracted text:');
console.log(fullText.substring(0, 2000));
console.log('\n---\n');

// Try to find city sections
cities.forEach(city => {
  const regex = new RegExp(city + '.*?(?=' + (cities.indexOf(city) < cities.length - 1 ? cities[cities.indexOf(city) + 1] : '$') + ')', 'is');
  const match = fullText.match(regex);
  if (match) {
    console.log(`\n=== ${city} ===`);
    console.log(match[0].substring(0, 500));
  } else {
    console.log(`\n=== ${city} === NOT FOUND`);
  }
});

// Write full text to a file for inspection
fs.writeFileSync(path.join(__dirname, 'tmp_az_full_text_extracted.txt'), fullText, 'utf-8');
console.log('\n\nFull extracted text saved to: tmp_az_full_text_extracted.txt');
