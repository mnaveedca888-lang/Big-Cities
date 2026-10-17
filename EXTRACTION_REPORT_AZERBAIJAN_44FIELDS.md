# AZERBAIJAN CITIES - 44 FIELDS EXTRACTION REPORT
**Date:** 2026-08-12  
**Source:** `Data/Azerbaijan/AZ_extracted/word/document.xml` (1.04MB+ DOCX content)  
**Status:** ✅ EXTRACTION COMPLETE

---

## EXECUTIVE SUMMARY

Successfully extracted all city data from the Azerbaijan DOCX document with the following results:

| City | Population Status | Fields Found | Completion % | Data Quality |
|------|------------------|-------------|-------------|--------------|
| **Baku** | 2.35–2.39 million | 44/44 | 100% | ✅ Complete |
| **Zaqatala** | ~32,000-36,000 | 43/44 | 98% | ✅ Near Complete |
| **Zangilan** | ~45,200 | 38/44 | 86% | ⚠️ Partial (Post-war reconstruction) |
| **Gabala** | ~15,000-35,000 | 33/44 | 75% | ⚠️ Partial |
| **Ganja** | ~335,600 | 34/44 | 77% | ⚠️ Partial |
| **Lankaran** | ~52,400 | 30/44 | 68% | ⚠️ Partial |
| **Nakhchivan** | ~63,700 | 27/44 | 61% | ⚠️ Partial |
| **Lachin** | Population displaced | 25/44 | 57% | ⚠️ Limited (Post-war reconstruction) |
| **Fuzuli** | Population displaced | 26/44 | 59% | ⚠️ Limited (Post-war reconstruction) |

**Total Fields Extracted:** 300/396 (76% coverage)

---

## EXTRACTION METHODOLOGY

### Data Source
- **File:** `document.xml` (extracted from DOCX archive)
- **Format:** Office Open XML (WordprocessingML)
- **Size:** 1,044,701 characters
- **Text Blocks:** 1,406 extracted `<w:t>` elements
- **Total Text Content:** 53,300+ characters

### Extraction Process
1. Parsed XML to extract all text content from `<w:t>` tags
2. Identified city sections using section headers (e.g., "Baku, Azerbaijan — Complete City Profile (2026)")
3. Extracted 44 fields for each city by number (1-44)
4. Cleaned citation markers and source references
5. Marked empty/unavailable fields as `null`
6. Generated JSON and Markdown outputs

### Field Mapping (44 Fields)
```
1. city_population
2. nickname
3. overview
4. history
5. founded
6. historical_significance
7. area
8. elevation
9. rivers
10. climate
11. coordinates
12. unesco_sites
13. famous_landmarks
14. museums
15. parks
16. traditional_food
17. street_food
18. popular_restaurants
19. festivals
20. cultural_events
21. arts
22. music
23. major_industries
24. technology
25. tourism
26. manufacturing
27. finance
28. metro
29. airport
30. railway
31. bus_network
32. major_roads
33. movies_filmed_here
34. tv_shows
35. sports
36. stadiums
37. famous_people
38. world_records
39. interesting_facts
40. unique_customs
41. unique_transportation
42. surprising_facts
43. time_zone
44. postal_code
```

---

## CITY-BY-CITY EXTRACTION SUMMARY

### 1. BAKU ✅ (44/44 fields - 100% COMPLETE)
- **Population:** 2.35–2.39 million
- **Status:** Fully documented with comprehensive data
- **Notable:** Capital city, largest Caspian Sea city, oil industry hub
- **Complete Fields:** All 44 fields successfully extracted

**Key Data Points:**
- Nickname: "City of Winds" (Persian: Bādkube)
- Area: 2,130–2,200 km²
- Elevation: 28 meters BELOW sea level
- Famous Landmarks: Maiden Tower, Flame Towers, Heydar Aliyev Center
- UNESCO Site: Walled City of Baku (Icherisheher)
- Time Zone: AZT (UTC+4)
- Postal Code: AZ1000–AZ1XXX

---

### 2. ZAQATALA ✅ (43/44 fields - 98% COMPLETE)
- **Population:** ~32,000-36,000
- **Status:** Nearly complete, only 1 field missing
- **Notable:** "Hazelnut/Nut Capital", mountainous region
- **Known Data:** 43 of 44 fields extracted

**Key Data Points:**
- Nickname: "Nut Capital" / "Hazelnut Capital"
- Rivers: Tala (Katekh) River
- Landmarks: Sumug Tower, Parigala ("Fairy Castle"), Qanslar Waterfall
- Films Filmed Here: CNN-documented Sumug Tower (Ilisu village)
- Time Zone: AZT (UTC+4)
- Postal Code: 62

---

### 3. ZANGILAN ✅ (38/44 fields - 86% EXTRACTION)
- **Population:** ~45,200 (pre-liberation nominal)
- **Status:** Post-war reconstruction area
- **Status Note:** Liberated October 2020, heavily damaged, in "Great Return" reconstruction program
- **Data Points:** 38 fields extracted

**Key Data Points:**
- Area: 707–730 km²
- Rivers: Okhchuchay (Voghji), Aras (Araz), Basitchay
- Notable Landmark: Zangilan International Airport (new)
- City Day: October 20 (liberation anniversary)
- Notable Feature: Basitchay plane tree forest (world record candidate)
- Agriculture/Tourism Revival: Planned major industry

---

### 4. GABALA ✅ (33/44 fields - 75% EXTRACTION)
- **Population:** ~15,000-35,000
- **Status:** Partial documentation, cultural tourism focus
- **Notable:** "Musical Capital of Azerbaijan", hosts international music festival
- **Data Points:** 33 fields extracted

**Key Data Points:**
- Known as: "Musical Capital of Azerbaijan"
- Landmarks: Chukhur Gabala, Tufandag Mountain Resort, Yeddi Gozel Waterfall
- Major Festival: Gabala International Music Festival (Gabalafest) - 15+ years running
- Airport: Gabala International Airport (GBB)
- Notable Person: Ismayil bey Gutgashinli (1806–1861)
- Surprising Fact: Small population but hosts major international festival with 30+ country performers

---

### 5. GANJA ✅ (34/44 fields - 77% EXTRACTION)
- **Population:** ~335,600
- **Status:** Azerbaijan's second-largest city, partially documented
- **Notable:** Birthplace of poet Nizami Ganjavi, first temporary capital of Azerbaijan DR (1918)
- **Data Points:** 34 fields extracted

**Key Data Points:**
- Nickname: "Qırmızı Şəhər" / "Red City"
- Notable Poet: Nizami Ganjavi (1141–1209)
- Landmarks: Nizami Ganjavi Mausoleum, Shah Abbas Mosque, Khan Bagi Park, Bottle House
- Mountains: Lesser Caucasus location (~408m elevation)
- Industries: Non-ferrous metallurgy, light industry, food processing
- Tourism: Lake Maralgol, Lake Goygol
- Designations: 2016 European Youth Capital, 2017 CIS Cultural Capital

---

### 6. LANKARAN ✅ (30/44 fields - 68% EXTRACTION)
- **Population:** ~52,400
- **Status:** Subtropical region, partially documented
- **Notable:** UNESCO Creative Cities Network (Gastronomy designation), tea and citrus production
- **Data Points:** 30 fields extracted

**Key Data Points:**
- Nickname: "Subtropical Pearl"
- Geography: Caspian Sea coast, Talysh Mountains backdrop
- Climate: Humid subtropical
- UNESCO Sites: Hyrcanian Forests, Creative Cities Gastronomy Network
- Notable Festival: Tea, Rice, and Citrus Festival of Lankaran
- Major Industries: Tea cultivation, citrus farming, tourism
- Airport: Lankaran International Airport (LLK)

---

### 7. NAKHCHIVAN ✅ (27/44 fields - 61% EXTRACTION)
- **Population:** ~63,700
- **Status:** Autonomous exclave, limited documentation
- **Notable:** Landlocked exclave bordering Iran/Turkey/Armenia, ancient city
- **Data Points:** 27 fields extracted

**Key Data Points:**
- Status: Nakhchivan Autonomous Republic (landlocked exclave)
- Designation: UNESCO Islamic Culture Capital
- Landmarks: Momine Khatun Mausoleum, Noah's Tomb, Ashabi-Kahf Cave, Alinja Castle
- Notable People: Heydar Aliyev (1923–2003), Huseyn Javid (1882–1941)
- Architecture: Medieval Islamic architecture (Momine Khatun Mausoleum)
- Unique Feature: Air travel primary connection to mainland Azerbaijan
- Time Zone: AZT (UTC+4)

---

### 8. LACHIN ✅ (25/44 fields - 57% EXTRACTION)
- **Population:** Displaced during conflict
- **Status:** Post-war reconstruction area, limited current documentation
- **Notable:** Liberated October 2020, name means "falcon", reconstructing infrastructure
- **Data Points:** 25 fields extracted (lowest coverage)

**Key Data Points:**
- Status: Karabakh region, formerly occupied (1993-2020), now under reconstruction
- Airport: Lachin International Airport (LHL) - highest-altitude airport in Azerbaijan
- World Record: Highest-altitude airport in Azerbaijan
- Reconstruction: State-led infrastructure development focus
- Notable Feature: Ongoing "Great Return" resettlement program
- Time Zone: AZT (UTC+4)
- Postal Code: 4100 (district-level)

---

### 9. FUZULI ✅ (26/44 fields - 59% EXTRACTION)
- **Population:** Displaced during conflict
- **Status:** Post-war reconstruction area, limited current documentation
- **Notable:** Named after 16th-century poet Muhammad Fuzuli, "smart city" development planned
- **Data Points:** 26 fields extracted

**Key Data Points:**
- Status: Karabakh region, occupied 1993-2020, liberated October 2020
- Named After: Muhammad Fuzuli (celebrated 16th-century Azerbaijani/Ottoman poet)
- Reconstruction: Centerpiece of government's Karabakh reconstruction program
- New Airport: Fuzuli International Airport (newly built)
- Planned Infrastructure: "Smart city" development, smart villages
- Cultural Tie: Poet Muhammad Fuzuli's legacy (mugham music association)
- Notable Site: Azykh Cave (paleoanthropological site of global interest)
- Time Zone: AZT (UTC+4)

---

## DATA QUALITY NOTES

### Complete Data Cities (Baku)
- All 44 fields fully populated with substantive information
- Minimal missing fields
- Rich descriptive content for all categories

### Substantially Complete Cities (Zaqatala, Zangilan, Gabala, Ganja, Lankaran)
- 75-98% field completion
- Some specialized fields empty (e.g., TV shows, stadiums)
- Good descriptive coverage for major categories

### Partially Complete Cities (Nakhchivan, Lachin, Fuzuli)
- 57-61% field completion
- Reflects post-conflict status and ongoing reconstruction
- Limited commercial/entertainment infrastructure
- Strong historical/cultural documentation

### Missing Field Patterns
- **TV Shows Filmed:** Most cities lack this data (understandable - not all cities host productions)
- **Stadiums:** Smaller cities often lack dedicated stadiums
- **Museums:** Reconstruction-era cities still developing infrastructure
- **Restaurants/Festivals:** Many cities lack current verified data

---

## FILES GENERATED

1. **AZERBAIJAN_CITIES_45_FIELDS_EXTRACTED.json**
   - Complete JSON export with all extracted fields
   - Format: {"cities": {"CityName": {field: value, ...}, ...}}
   - 396 total data points (44 fields × 9 cities)

2. **AZERBAIJAN_CITIES_45_FIELDS_EXTRACTED.md**
   - Markdown table format for easy viewing
   - Each city has a data table with field/value pairs
   - Values truncated to 100 characters for readability

3. **tmp_az_full_text_extracted.txt**
   - Raw text extraction from XML
   - All 1,406 text blocks concatenated
   - 53,300+ characters of raw content

---

## COMPARISON USE CASE

This extraction can be used to:
1. **Verify Database Accuracy**: Compare JSON values against database entries
2. **Identify Missing Data**: See which fields are null and need research
3. **Track Data Loss**: Monitor which fields don't make it through data pipeline
4. **Validate Sources**: Confirm DOCX is the authoritative source
5. **Find Discrepancies**: Detect where database values diverge from source

### Expected Use
```
1. Load AZERBAIJAN_CITIES_45_FIELDS_EXTRACTED.json
2. Query database for same cities/fields
3. Compare values field-by-field
4. Flag discrepancies for data team
5. Identify reconstruction/research needs
```

---

## TECHNICAL DETAILS

### Extraction Tools
- **Script:** `extract_az_complete_45fields.cjs`
- **Parser:** XML regex-based `<w:t>` tag extraction
- **Language:** Node.js CommonJS
- **Processing:** Text normalization, citation removal, null detection

### Challenges Overcome
1. **Large File Size:** Processed 1.04MB+ XML efficiently
2. **Complex Formatting:** Extracted text despite formatting tags
3. **Citation Markers:** Cleaned up source citations (e.g., "+ 2", "Wikipedia")
4. **Section Identification:** Robust pattern matching for city boundaries
5. **Missing Data:** Properly identified and marked null values

### Performance
- Extraction Time: < 1 second
- Text Blocks Parsed: 1,406
- Fields Successfully Mapped: 300/396
- Overall Success Rate: 76%

---

## RECOMMENDATIONS

1. **For Baku & Zaqatala**: Use as-is; data is comprehensive and complete
2. **For Other Cities**: Cross-reference with additional sources for verification
3. **For Post-War Cities**: Acknowledge limited current data; update as reconstruction progresses
4. **For Museums/Restaurants**: These may need current market research as venues continue opening

---

**Extraction Complete** ✅  
**Next Steps:** Compare against database, identify data pipeline issues
