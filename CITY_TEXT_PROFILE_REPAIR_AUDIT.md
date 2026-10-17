# Verified City Text Profile Repair Audit

Read-only discovery followed by targeted text-only updates. No image fields, verification flags, city names/slugs, events, schema, or application logic were changed.

## Summary

- Original targets checked: 258
- Fully complete across all 46 rendered text fields: 0
- Still incomplete: 258
- Profiles receiving at least one source-backed text value: 176
- Profiles with no safe source-backed text values: 82
- Text fields populated: 4226
- Empty text fields remaining across targets: 7642
- Public API: 981 cities; all 258 target detail routes returned successfully; 0 value mismatches.
- Unrelated city text profiles unchanged: true
- Database counts unchanged: 1219 city rows, 981 verified.
- Frontend build: passed with the existing chunk-size warning; backend TypeScript build: passed; city detail and Big Cities tests: 2 passed.

## Source Search and Limits

- Scanned 487 project text/source files across JSON, CSV, Markdown, text, JavaScript/TypeScript, YAML, SQL, and DOCX; image-only directories/data were excluded from field search.
- Inspected all six regional Excel workbooks and their City_Details sheets, static profile seed scripts, locality classification/crosswalk artifacts, generated extraction documents, and same-country duplicate city records in the database.
- 174 targets had an exact same-country City_Details source row. Two more population values were found in the project GeoNames variant report for Oral and Oskemen.
- 82 targets had no exact usable text-profile source in the checked project data and remain unchanged.
- `shortDescription` was not present in any City_Details workbook header, seed profile, or structured matching source; it remains empty for all 258.
- 3,179 generic fallback strings and 260 misaligned North America tail-field cells were not imported. Other empty fields with no source value were left unchanged.
- The workbook-to-profile mapping is literal by field header. No Overview-to-shortDescription copying, related-city transfer, or guessed alias was used.

## Remaining Empty Fields by Field

- shortDescription: 258
- country: 84
- population: 86
- nickname: 140
- overview: 136
- history: 192
- founded: 192
- historicalSignificance: 140
- area: 211
- elevation: 211
- rivers: 145
- climate: 136
- coordinates: 154
- unescoSites: 136
- famousLandmarks: 84
- museums: 140
- parks: 140
- traditionalFood: 192
- streetFood: 206
- popularRestaurants: 214
- festivals: 210
- culturalEvents: 154
- arts: 154
- music: 154
- majorIndustries: 144
- technology: 162
- tourism: 154
- manufacturing: 140
- finance: 140
- metro: 205
- airport: 135
- railway: 205
- busNetwork: 206
- majorRoads: 154
- moviesFilmedHere: 206
- tvShows: 206
- sports: 144
- stadiums: 154
- famousPeople: 140
- worldRecords: 211
- interestingFacts: 140
- uniqueCustoms: 206
- uniqueTransportation: 214
- surprisingFacts: 148
- timeZone: 145
- postalCode: 214

## City-by-City Audit

### Abraham González (Mexico)
- Slug: mx-abraham-gonz-lez-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Abuja (Nigeria)
- Slug: ng-nnamdi-azikiwe-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 102 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Acapulco (Mexico)
- Slug: mx-general-juan-n-lvarez-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 86 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Accra (Ghana)
- Slug: gh-kotoka-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 56 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Addis Ababa (Ethiopia)
- Slug: et-addis-ababa-bole-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 50 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Al Aaroui (Morocco)
- Slug: ma-nador-al-aaroui-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Alghero (Italy)
- Slug: it-alghero-fertilia-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Alicante (Spain)
- Slug: es-alicante-elche-miguel-hern-ndez-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 287 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Amsterdam (Netherlands)
- Slug: nl-amsterdam-airport-schiphol
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 70 (fields: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Anchorage (United States)
- Slug: us-ted-stevens-anchorage-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 157 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Andorra la Vella (Andorra)
- Slug: ad-andorra-la-vella
- Fields populated: country, population, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, airport, sports, famousPeople, timeZone
- Source/location: Europe.xlsx / City_Details, row 365 (fields: country, population, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, airport, sports, famousPeople, timeZone)
- Remaining empty fields: shortDescription, nickname, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, manufacturing, finance, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, postalCode

### Ángel Albino Corzo (Mexico)
- Slug: mx-ngel-albino-corzo-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Apia (Samoa)
- Slug: ws-faleolo-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, famousPeople, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, postalCode
- Source/location: Australia .xlsx / City_Details, row 49 (fields: country, population, nickname, overview, history, founded, historicalSignificance, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, famousPeople, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, postalCode)
- Remaining empty fields: shortDescription, area, elevation, rivers, sports, worldRecords, timeZone

### Astypalaia (Greece)
- Slug: gr-astypalaia-island-national-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 222 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Atlanta (United States)
- Slug: us-hartsfield-jackson-atlanta-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 113 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Aurel Vlaicu (Romania)
- Slug: ro-aurel-vlaicu-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Austin (United States)
- Slug: us-austin-bergstrom-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 138 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Bajío (Mexico)
- Slug: mx-baj-o-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Baltimore (United States)
- Slug: us-baltimore-washington-international-thurgood-marshall-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 137 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Bamako (Mali)
- Slug: ml-modibo-keita-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 77 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Bangui (Central African Republic)
- Slug: cf-bangui-m-poko-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 24 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Banjarmasin (Indonesia)
- Slug: id-banjarmasin
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Barcelona (Spain)
- Slug: es-josep-tarradellas-barcelona-el-prat-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 284 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Bari (Italy)
- Slug: it-bari-karol-wojty-a-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 238 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### barsana (India)
- Slug: in-barsana
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Basseterre (Saint Kitts and Nevis)
- Slug: kn-robert-l-bradshaw-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 107 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Bastia (France)
- Slug: fr-bastia-poretta-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 32 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Belgrade (Serbia)
- Slug: rs-belgrade-nikola-tesla-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 277 (fields: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Belize City (Belize)
- Slug: bz-philip-s-w-goldson-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 17 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Bergen (Norway)
- Slug: no-bergen-airport-flesland
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 108 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Bergerac (France)
- Slug: fr-bergerac-dordogne-p-rigord-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 45 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Berlin (Germany)
- Slug: de-berlin-brandenburg-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 51 (fields: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Biarritz (France)
- Slug: fr-biarritz-pays-basque-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 26 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Bissau (Guinea-Bissau)
- Slug: gw-osvaldo-vieira-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 58 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Blantyre (Malawi)
- Slug: mw-chileka-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 76 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Bloemfontein (South Africa)
- Slug: za-bram-fischer-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 120 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Bologna (Italy)
- Slug: it-bologna-guglielmo-marconi-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 233 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Borg El Arab (Egypt)
- Slug: eg-borg-el-arab-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Borlange (Sweden)
- Slug: se-dala-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 148 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Boston (United States)
- Slug: us-boston-logan-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 114 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Brest (France)
- Slug: fr-brest-bretagne-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 27 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Bridgetown (Barbados)
- Slug: bb-grantley-adams-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 16 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Brno–Tuřany (Czechia)
- Slug: cz-brno-tu-any-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Budapest (Hungary)
- Slug: hu-budapest-ferenc-liszt-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 326 (fields: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Buffalo (United States)
- Slug: us-buffalo-niagara-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 159 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Bujumbura (Burundi)
- Slug: bi-burundi
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 15 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Bulawayo (Zimbabwe)
- Slug: zw-joshua-mqabuko-nkomo-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms
- Source/location: Africa.xlsx / City_Details, row 140 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms)
- Remaining empty fields: shortDescription, popularRestaurants, majorIndustries, technology, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Bydgoszcz (Poland)
- Slug: pl-bydgoszcz-ignacy-jan-paderewski-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 338 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Caen (France)
- Slug: fr-caen-carpiquet-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 47 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Cagliari (Italy)
- Slug: it-cagliari-elmas-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 241 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Calvi (France)
- Slug: fr-calvi-sainte-catherine-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 33 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Camaguey (Cuba)
- Slug: cu-ignacio-agramonte-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 41 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Can Tho (Vietnam)
- Slug: vn-can-tho
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Casablanca (Morocco)
- Slug: ma-mohammed-v-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 84 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Castries (Saint Lucia)
- Slug: lc-george-f-l-charles-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 109 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Catania (Italy)
- Slug: it-catania-fontanarossa-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 235 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Ceuta (Spain)
- Slug: es-ceuta-heliport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 315 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Charleroi (Belgium)
- Slug: be-brussels-south-charleroi-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 9 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Charlestown (Ireland)
- Slug: ie-ireland-west-airport-knock
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Charlestown (Saint Kitts and Nevis)
- Slug: kn-vance-w-amory-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 108 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Charlotte (United States)
- Slug: us-charlotte-douglas-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 115 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Chihuahua (Mexico)
- Slug: mx-general-roberto-fierro-villalobos-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 77 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Chios (Greece)
- Slug: gr-chios-island-national-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 218 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Ciudad Madero (Mexico)
- Slug: mx-general-francisco-javier-mina-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Clermont-Ferrand (France)
- Slug: fr-clermont-ferrand-auvergne-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 41 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Cleveland (United States)
- Slug: us-cleveland-hopkins-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 139 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Cluj-Napoca (Romania)
- Slug: ro-avram-iancu-cluj-international-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 345 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Columbus (United States)
- Slug: us-john-glenn-columbus-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 140 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Coxen Hole (Honduras)
- Slug: hn-juan-manuel-g-lvez-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Dakar (Senegal)
- Slug: sn-blaise-diagne-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 110 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Dar es Salaam (Tanzania)
- Slug: tz-julius-nyerere-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 125 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### David (Panama)
- Slug: pa-enrique-malek-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 105 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Deauville (France)
- Slug: fr-deauville-normandie-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 48 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Detroit (United States)
- Slug: us-detroit-metropolitan-wayne-county-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 119 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Dinard (France)
- Slug: fr-dinard-pleurtuit-saint-malo-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Dire Dawa (Ethiopia)
- Slug: et-aba-tenna-dejazmach-yilma-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 51 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Dulles (United States)
- Slug: us-washington-dulles-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Durban (South Africa)
- Slug: za-king-shaka-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 118 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### East London (South Africa)
- Slug: za-king-phalo-airport
- Fields populated: country, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 121 (fields: country, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription, population

### Enfidha (Tunisia)
- Slug: tn-enfidha-hammamet-international-airport
- Fields populated: country, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms
- Source/location: Africa.xlsx / City_Details, row 133 (fields: country, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms)
- Remaining empty fields: shortDescription, population, popularRestaurants, majorIndustries, technology, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Erfurt (Germany)
- Slug: de-erfurt-weimar-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 68 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Ermoupoli (Greece)
- Slug: gr-syros-island-national-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Felipe Ángeles (Mexico)
- Slug: mx-felipe-ngeles-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Figari (France)
- Slug: fr-figari-sud-corse-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 30 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Fort Lauderdale (United States)
- Slug: us-fort-lauderdale-hollywood-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 120 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Fort Myers (United States)
- Slug: us-southwest-florida-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 170 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Franceville (Gabon)
- Slug: ga-m-vengue-el-hadj-omar-bongo-ondimba-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 53 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Francisco Sarabia (Mexico)
- Slug: mx-francisco-sarabia-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Frank País (Cuba)
- Slug: cu-frank-pa-s-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Freeport (Bahamas)
- Slug: bs-grand-bahama-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 4 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Freiburg (Switzerland)
- Slug: ch-euroairport-basel-mulhouse-freiburg
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Fua'amotu (Tonga)
- Slug: to-fua-amotu-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### General Francisco J. Mujica (Mexico)
- Slug: mx-general-francisco-j-mujica-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### General Lucio Blanco (Mexico)
- Slug: mx-general-lucio-blanco-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### George Enescu (Romania)
- Slug: ro-george-enescu-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Girona (Spain)
- Slug: es-girona-costa-brava-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 305 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Goroka (Papua New Guinea)
- Slug: pg-goroka-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Greensboro (United States)
- Slug: us-piedmont-triad-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 167 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Grenoble (France)
- Slug: fr-grenoble-alpes-is-re-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 34 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Groningen (Netherlands)
- Slug: nl-groningen-airport-eelde
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 74 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Guatemala City (Guatemala)
- Slug: gt-la-aurora-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 54 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Hamilton (Canada)
- Slug: ca-john-c-munro-hamilton-international-airport-catsa
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 33 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Harare (Zimbabwe)
- Slug: zw-robert-gabriel-mugabe-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms
- Source/location: Africa.xlsx / City_Details, row 138 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms)
- Remaining empty fields: shortDescription, popularRestaurants, majorIndustries, technology, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Hargeisa (Somalia)
- Slug: so-egal-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 114 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Heraklion (Greece)
- Slug: gr-heraklion-international-airport-nikos-kazantzakis
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 202 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Houston (United States)
- Slug: us-george-bush-intercontinental-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 121 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Ilopango (El Salvador)
- Slug: sv-ilopango-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Ivato (Madagascar)
- Slug: mg-ivato-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Jerez (Spain)
- Slug: es-jerez-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Johannesburg (South Africa)
- Slug: za-o-r-tambo-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 116 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Kano (Nigeria)
- Slug: ng-mallam-aminu-kano-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 104 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Karpathos (Greece)
- Slug: gr-karpathos-island-national-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 217 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Katsina (Nigeria)
- Slug: ng-umaru-musa-yar-adua-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 107 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Kavala (Greece)
- Slug: gr-kavala-international-airport-alexander-the-great
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 213 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Kavieng (Papua New Guinea)
- Slug: pg-kavieng-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Kawakawa (New Zealand)
- Slug: nz-bay-of-islands-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Keflavík (Iceland)
- Slug: is-keflav-k-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Kingston (Jamaica)
- Slug: jm-norman-manley-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 62 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Kingstown (Saint Vincent and the Grenadines)
- Slug: vc-argyle-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 110 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Kisangani (Democratic Republic of the Congo)
- Slug: cd-bangoka-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 30 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### kohima (India)
- Slug: in-kohima
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Kokshetau (Kazakhstan)
- Slug: kz-kokshetau
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Kraljevo (Serbia)
- Slug: rs-morava-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 279 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### kullu (India)
- Slug: in-kullu
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Kyiv (Ukraine)
- Slug: ua-kyiv
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 362 (fields: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Kythira (Greece)
- Slug: gr-kithira-island-national-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 220 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Laage (Germany)
- Slug: de-rostock-laage-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Lagos (Nigeria)
- Slug: ng-murtala-muhammed-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 101 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Lajes (Portugal)
- Slug: pt-lajes-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Lakselv (Norway)
- Slug: no-lakselv-airport-banak
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 122 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Larnaca (Cyprus)
- Slug: cy-larnaca-international-airport
- Fields populated: country, population, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Asia.xlsx / City_Details, row 72 (fields: country, population, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription, nickname

### Las Vegas (United States)
- Slug: us-harry-reid-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 122 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### leh (India)
- Slug: in-leh
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Liverpool (United Kingdom)
- Slug: gb-liverpool-john-lennon-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 165 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Livingstone (Zambia)
- Slug: zm-harry-mwanga-nkumbula-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms
- Source/location: Africa.xlsx / City_Details, row 136 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms)
- Remaining empty fields: shortDescription, popularRestaurants, majorIndustries, technology, uniqueTransportation, surprisingFacts, timeZone, postalCode

### London (United Kingdom)
- Slug: gb-london-heathrow-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 159 (fields: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### London City (United Kingdom)
- Slug: gb-london-city-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Louisville (United States)
- Slug: us-louisville-muhammad-ali-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 169 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Luganville (Vanuatu)
- Slug: vu-santo-pekoa-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, famousPeople, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Australia .xlsx / City_Details, row 54 (fields: country, population, nickname, overview, history, founded, historicalSignificance, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, famousPeople, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription, area, elevation, rivers, festivals, sports, worldRecords

### Luqa (Malta)
- Slug: mt-malta-international-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 262 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Lusaka (Zambia)
- Slug: zm-kenneth-kaunda-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms
- Source/location: Africa.xlsx / City_Details, row 135 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms)
- Remaining empty fields: shortDescription, popularRestaurants, majorIndustries, technology, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Luxembourg (Luxembourg)
- Slug: lu-luxembourg-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Maastricht (Netherlands)
- Slug: nl-maastricht-aachen-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 73 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Madang (Papua New Guinea)
- Slug: pg-madang-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Mahajanga (Madagascar)
- Slug: mg-amborovy-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 73 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Majuro (Marshall Islands)
- Slug: mh-marshall-islands-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, famousPeople, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Australia .xlsx / City_Details, row 23 (fields: country, population, nickname, overview, history, founded, historicalSignificance, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, famousPeople, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription, area, elevation, rivers, festivals, sports, worldRecords

### Managua (Nicaragua)
- Slug: ni-augusto-c-sandino-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 103 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Manzanillo (Mexico)
- Slug: mx-playa-de-oro-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 83 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Maribor (Slovenia)
- Slug: si-maribor-edvard-rusjan-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 281 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Marigot (Dominica)
- Slug: dm-douglas-charles-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Marrakesh (Morocco)
- Slug: ma-marrakesh-menara-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 86 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Marsh Harbour (Bahamas)
- Slug: bs-leonard-m-thompson-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 5 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Maya-Maya (Republic of the Congo)
- Slug: cg-maya-maya-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Mexicali (Mexico)
- Slug: mx-general-rodolfo-s-nchez-taboada-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 79 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Mihail Kogălniceanu (Romania)
- Slug: ro-mihail-kog-lniceanu-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Milos (Greece)
- Slug: gr-milos-island-national-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 225 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Mo i Rana (Norway)
- Slug: no-mo-i-rana-airport-r-ssvoll
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 130 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Mogadishu (Somalia)
- Slug: so-aden-adde-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 113 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Mombasa (Kenya)
- Slug: ke-moi-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 60 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Monaco (Monaco)
- Slug: mc-monaco
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, airport, sports, famousPeople, timeZone
- Source/location: Europe.xlsx / City_Details, row 364 (fields: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, airport, sports, famousPeople, timeZone)
- Remaining empty fields: shortDescription, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, manufacturing, finance, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, postalCode

### Monastir (Tunisia)
- Slug: tn-monastir-habib-bourguiba-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms
- Source/location: Africa.xlsx / City_Details, row 131 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms)
- Remaining empty fields: shortDescription, popularRestaurants, majorIndustries, technology, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Monrovia (Liberia)
- Slug: lr-roberts-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 64 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Montego Bay (Jamaica)
- Slug: jm-sangster-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 63 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Moroni (Comoros)
- Slug: km-prince-said-ibrahim-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 26 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Mount Hagen (Papua New Guinea)
- Slug: pg-mount-hagen-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### mysuru (India)
- Slug: in-mysuru
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Nairobi (Kenya)
- Slug: ke-jomo-kenyatta-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 59 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Nantes (France)
- Slug: fr-nantes-atlantique-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 19 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Napier (New Zealand)
- Slug: nz-hawke-s-bay-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Australia .xlsx / City_Details, row 39 (fields: country, population, nickname, overview, history, founded, historicalSignificance, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription, area, elevation, rivers, festivals, worldRecords

### Nassau (Bahamas)
- Slug: bs-lynden-pindling-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 3 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Nausori (Fiji)
- Slug: fj-nausori-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Naxos (Greece)
- Slug: gr-naxos-island-national-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 223 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Ndola (Zambia)
- Slug: zm-simon-mwansa-kapwepwe-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms
- Source/location: Africa.xlsx / City_Details, row 137 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms)
- Remaining empty fields: shortDescription, popularRestaurants, majorIndustries, technology, uniqueTransportation, surprisingFacts, timeZone, postalCode

### New Orleans (United States)
- Slug: us-louis-armstrong-new-orleans-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 145 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### New York (United States)
- Slug: us-john-f-kennedy-international-airport
- Fields populated: country, population, nickname, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, metro, airport, railway, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 127 (fields: country, population, nickname, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, metro, airport, railway, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Newark (United States)
- Slug: us-newark-liberty-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 126 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Newcastle (United Kingdom)
- Slug: gb-newcastle-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Newquay (United Kingdom)
- Slug: gb-cornwall-airport-newquay
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 177 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Niamey (Niger)
- Slug: ne-diori-hamani-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 100 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Niigata (Japan)
- Slug: jp-niigata
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Oakland (United States)
- Slug: us-oakland-san-francisco-bay-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 146 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Ohrid (North Macedonia)
- Slug: mk-ohrid-st-paul-the-apostle-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 266 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Omaha (United States)
- Slug: us-eppley-airfield
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 168 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Oostende (Belgium)
- Slug: be-ostend-bruges-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Oral (Kazakhstan)
- Slug: kz-oral-uralsk
- Fields populated: population
- Source/location: backend/tmp_city_gazetteer_variants.json; record “Oral (Uralsk)”, matched place “Oral”, GeoNames ID 608668 (fields: population)
- Remaining empty fields: shortDescription, country, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Oskemen (Kazakhstan)
- Slug: kz-oskemen-ust-kamenogorsk
- Fields populated: population
- Source/location: backend/tmp_city_gazetteer_variants.json; record “Oskemen (Ust-Kamenogorsk)”, matched place “Ust-Kamenogorsk”, GeoNames ID 1520316 (fields: population)
- Remaining empty fields: shortDescription, country, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Owerri (Nigeria)
- Slug: ng-sam-mbakwe-international-cargo-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 106 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Palm Beach (United States)
- Slug: us-palm-beach-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### panjim (India)
- Slug: in-panjim
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Paphos (Cyprus)
- Slug: cy-paphos-international-airport
- Fields populated: country, population, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Asia.xlsx / City_Details, row 73 (fields: country, population, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription, nickname

### Paris (France)
- Slug: fr-paris
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 13 (fields: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Pavlodar (Kazakhstan)
- Slug: kz-pavlodar
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Pemba (Mozambique)
- Slug: mz-pemba-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Pescara (Italy)
- Slug: it-abruzzo-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 249 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Phoenix (United States)
- Slug: us-phoenix-sky-harbor-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 130 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Plaine Magnien (Mauritius)
- Slug: mu-sir-seewoosagur-ramgoolam-international-airport
- Fields populated: country, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 83 (fields: country, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription, population

### Ponciano Arriaga (Mexico)
- Slug: mx-ponciano-arriaga-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Ponta Delgada (Portugal)
- Slug: pt-jo-o-paulo-ii-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 271 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Pontianak (Indonesia)
- Slug: id-pontianak
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Poprad (Slovakia)
- Slug: sk-poprad-tatry-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 361 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Port-au-Prince (Haiti)
- Slug: ht-toussaint-louverture-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 55 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Port of Spain (Trinidad and Tobago)
- Slug: tt-piarco-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 111 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Port Sudan (Sudan)
- Slug: sd-port-sudan-new-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 124 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Port Vila (Vanuatu)
- Slug: vu-bauerfield-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, famousPeople, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Australia .xlsx / City_Details, row 53 (fields: country, population, nickname, overview, history, founded, historicalSignificance, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, famousPeople, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription, area, elevation, rivers, festivals, sports, worldRecords

### Prague (Czechia)
- Slug: cz-v-clav-havel-airport-prague
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Praia (Cabo Verde)
- Slug: cv-nelson-mandela-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Preveza (Greece)
- Slug: gr-aktion-national-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 212 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### puri (India)
- Slug: in-puri
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### pushkar (India)
- Slug: in-pushkar
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Rabaul (Papua New Guinea)
- Slug: pg-rabaul-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Rabil (Cabo Verde)
- Slug: cv-aristides-pereira-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Radom (Poland)
- Slug: pl-warsaw-radom-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 343 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Rhodes (Greece)
- Slug: gr-rhodes-international-airport-diagoras
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 203 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Rotterdam (Netherlands)
- Slug: nl-rotterdam-the-hague-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 71 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Saint George's (Grenada)
- Slug: gd-maurice-bishop-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### San Andros (Bahamas)
- Slug: bs-san-andros-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### San Marino (San Marino)
- Slug: sm-san-marino
- Fields populated: country, population, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, airport, sports, famousPeople, timeZone
- Source/location: Europe.xlsx / City_Details, row 368 (fields: country, population, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, airport, sports, famousPeople, timeZone)
- Remaining empty fields: shortDescription, nickname, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, manufacturing, finance, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, postalCode

### Santander (Spain)
- Slug: es-seve-ballesteros-santander-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 306 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Santiago (Dominican Republic)
- Slug: do-cibao-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Santiago (Cuba)
- Slug: cu-antonio-maceo-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Santiago de Compostela (Spain)
- Slug: es-santiago-rosal-a-de-castro-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 297 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Saskatoon (Canada)
- Slug: ca-saskatoon-john-g-diefenbaker-international-airport-catsa
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 30 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Savannah (United States)
- Slug: us-savannah-hilton-head-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 166 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Scarborough (Trinidad and Tobago)
- Slug: tt-a-n-r-robinson-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 112 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Schkeuditz (Germany)
- Slug: de-leipzig-halle-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Semey (Kazakhstan)
- Slug: kz-semey
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Skyros (Greece)
- Slug: gr-skyros-island-national-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 227 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### South Tarawa (Kiribati)
- Slug: ki-bonriki-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### St Louis (United States)
- Slug: us-st-louis-lambert-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 153 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Stavanger (Norway)
- Slug: no-stavanger-airport-sola
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 109 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Stockholm (Sweden)
- Slug: se-stockholm-arlanda-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 132 (fields: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Tabubil (Papua New Guinea)
- Slug: pg-tabubil-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Tallinn (Estonia)
- Slug: ee-lennart-meri-tallinn-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 85 (fields: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Taraz (Kazakhstan)
- Slug: kz-taraz
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### tawang (India)
- Slug: in-tawang
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Tenerife (Spain)
- Slug: es-tenerife-north-ciudad-de-la-laguna-airport
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 289 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### thrissur (India)
- Slug: in-thrissur
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Toamasina (Madagascar)
- Slug: mg-toamasina-ambalamanasy-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 71 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Tocumen (Panama)
- Slug: pa-tocumen-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Tripoli (Libya)
- Slug: ly-mitiga-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 65 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Tunis (Tunisia)
- Slug: tn-tunis-carthage-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms
- Source/location: Africa.xlsx / City_Details, row 130 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, festivals, culturalEvents, arts, music, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms)
- Remaining empty fields: shortDescription, popularRestaurants, majorIndustries, technology, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Vaduz (Liechtenstein)
- Slug: li-vaduz
- Fields populated: country, population, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, airport, sports, famousPeople, timeZone
- Source/location: Europe.xlsx / City_Details, row 363 (fields: country, population, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, airport, sports, famousPeople, timeZone)
- Remaining empty fields: shortDescription, nickname, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, manufacturing, finance, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, postalCode

### Vanimo (Papua New Guinea)
- Slug: pg-vanimo-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Vatican City (Vatican City)
- Slug: va-vatican-city
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Veracruz (Mexico)
- Slug: mx-general-heriberto-jara-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 91 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Victoria (Seychelles)
- Slug: sc-seychelles-international-airport
- Fields populated: country, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 111 (fields: country, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription, population

### Vieux Fort (Saint Lucia)
- Slug: lc-hewanorra-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Villahermosa (Mexico)
- Slug: mx-carlos-rovirosa-p-rez-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 92 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Warsaw (Poland)
- Slug: pl-warsaw-chopin-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 330 (fields: country, population, nickname, overview, history, founded, historicalSignificance, rivers, climate, unescoSites, famousLandmarks, museums, parks, traditionalFood, majorIndustries, manufacturing, finance, airport, sports, famousPeople, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, area, elevation, coordinates, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, stadiums, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### West Island (Australia)
- Slug: au-cocos-keeling-islands-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Wewak (Papua New Guinea)
- Slug: pg-wewak-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Windhoek (Namibia)
- Slug: na-hosea-kutako-international-airport
- Fields populated: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode
- Source/location: Africa.xlsx / City_Details, row 98 (fields: country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode)
- Remaining empty fields: shortDescription

### Winnipeg (Canada)
- Slug: ca-winnipeg-james-armstrong-richardson-international-airport-catsa
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 25 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Xoxocotlán (Mexico)
- Slug: mx-xoxocotl-n-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Yekaterinburg (Russia)
- Slug: ru-yekaterinburg
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Zacatecas (Mexico)
- Slug: mx-general-leobardo-c-ruiz-international-airport
- Fields populated: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople
- Source/location: North America.xlsx / City_Details, row 98 (fields: country, population, historicalSignificance, rivers, coordinates, famousLandmarks, museums, parks, culturalEvents, arts, music, technology, tourism, majorRoads, sports, stadiums, famousPeople)
- Remaining empty fields: shortDescription, nickname, overview, history, founded, area, elevation, climate, unescoSites, traditionalFood, streetFood, popularRestaurants, festivals, majorIndustries, manufacturing, finance, metro, airport, railway, busNetwork, moviesFilmedHere, tvShows, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

### Zakynthos (Greece)
- Slug: gr-zakynthos-international-airport-dionysios-solomos
- Fields populated: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone
- Source/location: Europe.xlsx / City_Details, row 207 (fields: country, population, nickname, overview, climate, unescoSites, famousLandmarks, majorIndustries, manufacturing, finance, airport, interestingFacts, surprisingFacts, timeZone)
- Remaining empty fields: shortDescription, history, founded, historicalSignificance, area, elevation, rivers, coordinates, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, technology, tourism, metro, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, uniqueCustoms, uniqueTransportation, postalCode

### Zanzibar (Tanzania)
- Slug: tz-abeid-amani-karume-international-airport
- Fields populated: None
- Source/location: No matching source found; profile left unchanged.
- Remaining empty fields: shortDescription, country, population, nickname, overview, history, founded, historicalSignificance, area, elevation, rivers, climate, coordinates, unescoSites, famousLandmarks, museums, parks, traditionalFood, streetFood, popularRestaurants, festivals, culturalEvents, arts, music, majorIndustries, technology, tourism, manufacturing, finance, metro, airport, railway, busNetwork, majorRoads, moviesFilmedHere, tvShows, sports, stadiums, famousPeople, worldRecords, interestingFacts, uniqueCustoms, uniqueTransportation, surprisingFacts, timeZone, postalCode

