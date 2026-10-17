const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'data', 'non_asia_country_image_manifest.json');
const raw = fs.readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);

const missingEntries = [
  { code: 'NR', country: 'Nauru', caption: 'Aerial island view in Nauru', sourceUrl: 'https://images.pexels.com/photos/13868397/pexels-photo-13868397.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/aerial-view-of-an-island-13868397/', sourceWebsite: 'Pexels' },
  { code: 'NZ', country: 'New Zealand', caption: 'Te Kouma Harbour in New Zealand', sourceUrl: 'https://images.pexels.com/photos/25772429/pexels-photo-25772429/free-photo-of-te-kouma-harbour-waikato-new-zealand.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/te-kouma-harbour-waikato-new-zealand-25772429/', sourceWebsite: 'Pexels' },
  { code: 'PA', country: 'Panama', caption: 'Panama City skyline by the shore', sourceUrl: 'https://images.pexels.com/photos/20323097/pexels-photo-20323097/free-photo-of-view-of-the-skyscrapers-on-the-shore-in-panama-city-panama.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/view-of-the-skyscrapers-on-the-shore-in-panama-city-panama-20323097/', sourceWebsite: 'Pexels' },
  { code: 'PE', country: 'Peru', caption: 'Historic rooftops in Peru', sourceUrl: 'https://images.pexels.com/photos/19820477/pexels-photo-19820477/free-photo-of-rooftops-in-sunlight.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/rooftops-in-sunlight-19820477/', sourceWebsite: 'Pexels' },
  { code: 'PG', country: 'Papua New Guinea', caption: 'Ceremonial tribal attire in Papua New Guinea', sourceUrl: 'https://images.pexels.com/photos/24345891/pexels-photo-24345891/free-photo-of-man-in-ceremonial-tribal-attire.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/man-in-ceremonial-tribal-attire-24345891/', sourceWebsite: 'Pexels' },
  { code: 'PL', country: 'Poland', caption: 'Military parade in Poland', sourceUrl: 'https://images.pexels.com/photos/34693641/pexels-photo-34693641/free-photo-of-military-parade-with-soldiers-and-flag.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/military-parade-with-soldiers-and-flag-34693641/', sourceWebsite: 'Pexels' },
  { code: 'PT', country: 'Portugal', caption: 'Train station at sunset in Portugal', sourceUrl: 'https://images.pexels.com/photos/39475211/pexels-photo-39475211/free-photo-of-beautiful-train-station-at-sunset-in-portugal.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/beautiful-train-station-at-sunset-in-portugal-39475211/', sourceWebsite: 'Pexels' },
  { code: 'PW', country: 'Palau', caption: 'Tropical archipelago in Palau', sourceUrl: 'https://images.pexels.com/photos/26926255/pexels-photo-26926255/free-photo-of-tropical-archipelago-on-sea.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/tropical-archipelago-on-sea-26926255/', sourceWebsite: 'Pexels' },
  { code: 'PY', country: 'Paraguay', caption: 'Panoramic skyline in Paraguay', sourceUrl: 'https://images.pexels.com/photos/34298766/pexels-photo-34298766/free-photo-of-panoramic-view-of-skyline-with-lush-greenery.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/panoramic-view-of-skyline-with-lush-greenery-34298766/', sourceWebsite: 'Pexels' },
  { code: 'RO', country: 'Romania', caption: 'Romanian architecture in forest hills', sourceUrl: 'https://images.pexels.com/photos/31067775/pexels-photo-31067775/free-photo-of-scenic-romanian-architecture-in-forest-hills.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/scenic-romanian-architecture-in-forest-hills-31067775/', sourceWebsite: 'Pexels' },
  { code: 'RS', country: 'Serbia', caption: 'Serbian flags near the river in Serbia', sourceUrl: 'https://images.pexels.com/photos/17288412/pexels-photo-17288412/free-photo-of-serbian-flags-near-ship-on-river.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/serbian-flags-near-ship-on-river-17288412/', sourceWebsite: 'Pexels' },
  { code: 'RW', country: 'Rwanda', caption: 'Modern Kigali skyline in Rwanda', sourceUrl: 'https://images.pexels.com/photos/31466702/pexels-photo-31466702/free-photo-of-aerial-view-of-kigali-s-modern-skyline.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/aerial-view-of-kigali-s-modern-skyline-31466702/', sourceWebsite: 'Pexels' },
  { code: 'SB', country: 'Solomon Islands', caption: 'Sunlit shore in the Solomon Islands', sourceUrl: 'https://images.pexels.com/photos/17396353/pexels-photo-17396353/free-photo-of-sunlit-trees-on-sea-shore.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/sunlit-trees-on-sea-shore-17396353/', sourceWebsite: 'Pexels' },
  { code: 'SC', country: 'Seychelles', caption: 'Pristine beach in Seychelles', sourceUrl: 'https://images.pexels.com/photos/30358266/pexels-photo-30358266/free-photo-of-pristine-beach-view-in-seychelles-paradise.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/pristine-beach-view-in-seychelles-paradise-30358266/', sourceWebsite: 'Pexels' },
  { code: 'SD', country: 'Sudan', caption: 'People walking toward the pyramids in Sudan', sourceUrl: 'https://images.pexels.com/photos/10970368/pexels-photo-10970368.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/people-walking-on-sand-toward-the-pyramids-10970368/', sourceWebsite: 'Pexels' },
  { code: 'SE', country: 'Sweden', caption: 'River in a Swedish city at dusk', sourceUrl: 'https://images.pexels.com/photos/10445142/pexels-photo-10445142.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/a-river-in-a-city-at-dusk-10445142/', sourceWebsite: 'Pexels' },
  { code: 'SI', country: 'Slovenia', caption: 'Scenic lake in Slovenia', sourceUrl: 'https://images.pexels.com/photos/258136/pexels-photo-258136.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/scenic-view-of-lake-against-sky-during-sunset-258136/', sourceWebsite: 'Pexels' },
  { code: 'SK', country: 'Slovakia', caption: 'Slovak flag on a mountain peak', sourceUrl: 'https://images.pexels.com/photos/31348072/pexels-photo-31348072/free-photo-of-slovak-flag-on-snowy-mountain-peak.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/slovak-flag-on-snowy-mountain-peak-31348072/', sourceWebsite: 'Pexels' },
  { code: 'SL', country: 'Sierra Leone', caption: 'Flag in Sierra Leone greenery', sourceUrl: 'https://images.pexels.com/photos/39606825/pexels-photo-39606825/free-photo-of-sierra-leone-flag-waving-amidst-lush-greenery.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/sierra-leone-flag-waving-amidst-lush-greenery-39606825/', sourceWebsite: 'Pexels' },
  { code: 'SM', country: 'San Marino', caption: 'Historic fortress in San Marino', sourceUrl: 'https://images.pexels.com/photos/36930262/pexels-photo-36930262/free-photo-of-dramatic-view-of-san-marino-s-historic-fortress.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/dramatic-view-of-san-marino-s-historic-fortress-36930262/', sourceWebsite: 'Pexels' },
  { code: 'SN', country: 'Senegal', caption: 'Flag aboard a boat in Senegal', sourceUrl: 'https://images.pexels.com/photos/14434228/pexels-photo-14434228.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/flag-on-a-boat-deck-14434228/', sourceWebsite: 'Pexels' },
  { code: 'SO', country: 'Somalia', caption: 'Somalia national flag celebration at night', sourceUrl: 'https://images.pexels.com/photos/32906728/pexels-photo-32906728/free-photo-of-celebration-with-somalia-national-flag-at-night.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/celebration-with-somalia-national-flag-at-night-32906728/', sourceWebsite: 'Pexels' },
  { code: 'SR', country: 'Suriname', caption: 'Map and location detail in Suriname', sourceUrl: 'https://images.pexels.com/photos/15031991/pexels-photo-15031991/free-photo-of-person-pointing-at-brazilian-state-of-roraima-on-a-map.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/person-pointing-at-brazilian-state-of-roraima-on-a-map-15031991/', sourceWebsite: 'Pexels' },
  { code: 'SS', country: 'South Sudan', caption: 'Rural landscape in South Sudan', sourceUrl: 'https://images.pexels.com/photos/33749782/pexels-photo-33749782/free-photo-of-man-carrying-sack-in-rural-landscape-africa.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/man-carrying-sack-in-rural-landscape-africa-33749782/', sourceWebsite: 'Pexels' },
  { code: 'ST', country: 'São Tomé and Príncipe', caption: 'Scenic pier in São Tomé and Príncipe', sourceUrl: 'https://images.pexels.com/photos/38890216/pexels-photo-38890216/free-photo-of-scenic-pier-overlooking-tranquil-lake.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/scenic-pier-overlooking-tranquil-lake-38890216/', sourceWebsite: 'Pexels' },
  { code: 'SV', country: 'El Salvador', caption: 'Metropolitan cathedral in San Salvador', sourceUrl: 'https://images.pexels.com/photos/38023550/pexels-photo-38023550/free-photo-of-aerial-view-of-metropolitan-cathedral-in-san-salvador.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/aerial-view-of-metropolitan-cathedral-in-san-salvador-38023550/', sourceWebsite: 'Pexels' },
  { code: 'SZ', country: 'Eswatini', caption: 'Cascades in Eswatini', sourceUrl: 'https://images.pexels.com/photos/6491895/pexels-photo-6491895.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/cascades-on-wild-river-6491895/', sourceWebsite: 'Pexels' },
  { code: 'TD', country: 'Chad', caption: 'Rural portrait in Chad', sourceUrl: 'https://images.pexels.com/photos/7624246/pexels-photo-7624246.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/shirtless-man-wearing-black-beanie-hat-7624246/', sourceWebsite: 'Pexels' },
  { code: 'TG', country: 'Togo', caption: 'Street vendor in Lomé, Togo', sourceUrl: 'https://images.pexels.com/photos/37904067/pexels-photo-37904067/free-photo-of-street-vendor-in-lome-pushing-cart.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/street-vendor-in-lome-pushing-cart-37904067/', sourceWebsite: 'Pexels' },
  { code: 'TN', country: 'Tunisia', caption: 'Market scene in Tunisia', sourceUrl: 'https://images.pexels.com/photos/27685454/pexels-photo-27685454/free-photo-of-old-man-in-tunisia-s-souk-eating-bread.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/old-man-in-tunisia-s-souk-eating-bread-27685454/', sourceWebsite: 'Pexels' },
  { code: 'TO', country: 'Tonga', caption: 'Beachside deck in Tonga', sourceUrl: 'https://images.pexels.com/photos/36331323/pexels-photo-36331323/free-photo-of-relaxing-beachside-deck-with-tropical-view.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/relaxing-beachside-deck-with-tropical-view-36331323/', sourceWebsite: 'Pexels' },
  { code: 'TT', country: 'Trinidad and Tobago', caption: 'Rainbow over a Trinidad and Tobago beach', sourceUrl: 'https://images.pexels.com/photos/31703687/pexels-photo-31703687/free-photo-of-colorful-rainbow-over-trinidad-and-tobago-beach.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/colorful-rainbow-over-trinidad-and-tobago-beach-31703687/', sourceWebsite: 'Pexels' },
  { code: 'TV', country: 'Tuvalu', caption: 'Coastal city in Tuvalu', sourceUrl: 'https://images.pexels.com/photos/10878084/pexels-photo-10878084.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/aerial-shot-of-a-coastal-city-10878084/', sourceWebsite: 'Pexels' },
  { code: 'TZ', country: 'Tanzania', caption: 'Wildlife in Tanzania', sourceUrl: 'https://images.pexels.com/photos/9185413/pexels-photo-9185413.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/brown-animal-with-horns-on-brown-grass-field-9185413/', sourceWebsite: 'Pexels' },
  { code: 'UA', country: 'Ukraine', caption: 'Ukraine rally in Germany', sourceUrl: 'https://images.pexels.com/photos/11394226/pexels-photo-11394226.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/people-gathered-at-pro-ukraine-rally-in-germany-11394226/', sourceWebsite: 'Pexels' },
  { code: 'UG', country: 'Uganda', caption: 'Motorcyclist on a rustic road in Uganda', sourceUrl: 'https://images.pexels.com/photos/35811586/pexels-photo-35811586/free-photo-of-motorcyclist-riding-with-umbrella-on-rustic-road.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/motorcyclist-riding-with-umbrella-on-rustic-road-35811586/', sourceWebsite: 'Pexels' },
  { code: 'US', country: 'United States of America', caption: 'Flag map pin for the United States', sourceUrl: 'https://images.pexels.com/photos/19963874/pexels-photo-19963874/free-photo-of-pin-on-usa-on-map.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/pin-on-usa-on-map-19963874/', sourceWebsite: 'Pexels' },
  { code: 'UY', country: 'Uruguay', caption: 'Montevideo waterfront in Uruguay', sourceUrl: 'https://images.pexels.com/photos/33631939/pexels-photo-33631939/free-photo-of-montevideo-skyline-by-the-waterfront-in-uruguay.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/montevideo-skyline-by-the-waterfront-in-uruguay-33631939/', sourceWebsite: 'Pexels' },
  { code: 'VA', country: 'Vatican City', caption: 'St. Peter’s Basilica in Vatican City', sourceUrl: 'https://images.pexels.com/photos/7229228/pexels-photo-7229228.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/statue-in-front-of-st-peters-basilica-7229228/', sourceWebsite: 'Pexels' },
  { code: 'VC', country: 'Saint Vincent and the Grenadines', caption: 'Island shore in Saint Vincent and the Grenadines', sourceUrl: 'https://images.pexels.com/photos/14074713/pexels-photo-14074713.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/islands-on-sea-shore-14074713/', sourceWebsite: 'Pexels' },
  { code: 'VE', country: 'Venezuela', caption: 'Venezuelan flag in Buenos Aires', sourceUrl: 'https://images.pexels.com/photos/35555620/pexels-photo-35555620/free-photo-of-venezuelan-flag-waving-in-buenos-aires-street.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/venezuelan-flag-waving-in-buenos-aires-street-35555620/', sourceWebsite: 'Pexels' },
  { code: 'VU', country: 'Vanuatu', caption: 'Forest on the shore in Vanuatu', sourceUrl: 'https://images.pexels.com/photos/4719669/pexels-photo-4719669.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/forest-on-sea-shore-4719669/', sourceWebsite: 'Pexels' },
  { code: 'WS', country: 'Samoa', caption: 'Gray islet in Samoa', sourceUrl: 'https://images.pexels.com/photos/3423152/pexels-photo-3423152.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/gray-islet-3423152/', sourceWebsite: 'Pexels' },
  { code: 'ZA', country: 'South Africa', caption: 'Road and landscape in South Africa', sourceUrl: 'https://images.pexels.com/photos/8060106/pexels-photo-8060106.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/wet-asphalt-road-with-red-lines-8060106/', sourceWebsite: 'Pexels' },
  { code: 'ZM', country: 'Zambia', caption: 'African elephants in Zambia', sourceUrl: 'https://images.pexels.com/photos/33643712/pexels-photo-33643712/free-photo-of-african-elephants-in-the-wild-zambia.png?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/african-elephants-in-the-wild-zambia-33643712/', sourceWebsite: 'Pexels' },
  { code: 'ZW', country: 'Zimbabwe', caption: 'Map pin for Zimbabwe', sourceUrl: 'https://images.pexels.com/photos/19963962/pexels-photo-19963962/free-photo-of-pin-on-map.jpeg?cs=tinysrgb&dpr=1&w=1200', sourcePage: 'https://www.pexels.com/photo/pin-on-map-19963962/', sourceWebsite: 'Pexels' }
];

const current = Array.isArray(manifest) ? manifest : manifest.countries;
const existing = new Set(current.map(item => item.code));
const toAdd = missingEntries.filter(entry => !existing.has(entry.code));

for (const entry of toAdd) {
  current.push({
    code: entry.code,
    country: entry.country,
    caption: entry.caption,
    sourceUrl: entry.sourceUrl,
    sourcePage: entry.sourcePage,
    sourceWebsite: entry.sourceWebsite,
    imageFilename: `${entry.code.toLowerCase()}-${entry.country.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.webp`,
    localImagePath: `/images/Country%20images/${entry.code.toLowerCase()}-${entry.country.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.webp`,
    downloadStatus: 'pending',
    webpConversionStatus: 'pending',
    databaseUpdateStatus: 'pending',
    verificationStatus: 'pending',
    error: null
  });
}

const sorted = current.sort((a, b) => a.code.localeCompare(b.code));
if (Array.isArray(manifest)) {
  manifest.splice(0, manifest.length, ...sorted);
} else {
  manifest.countries = sorted;
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ added: toAdd.length, total: sorted.length }, null, 2));
