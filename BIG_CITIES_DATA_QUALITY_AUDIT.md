# Big Cities Data Quality Audit

- Audit date: 2026-10-08
- Original City records audited: 1230
- City rows remaining in database: 1219
- Verified localities listed by GET /cities: 976
- Records retained for manual review and excluded from GET /cities: 243
- City names corrected: 215
- Duplicate/invalid rows removed or merged: 11
- Event citySlug remaps: 1

## Root Cause

The City table had no locality type or verification field. The available importer extracts a display name by splitting source cells on dashes or commas, then upserts it without validating that it represents a populated place. The catalog API returned every City row, and the Big Cities page listed that complete response after name search only. Airport names and region labels therefore flowed through as city names.

The importer now skips obvious airport/facility, region, placeholder, country-name, organization and URL labels. A new `City.isVerifiedCity` field defaults to false. The `/cities` listing API only returns verified records; detail lookups remain available for retained review records. The existing City slug is preserved for renamed records so city-detail routing and related data continue to resolve.

## Verification Method

- Audited the full live database snapshot, not the first page: every row was matched by ISO country code and normalized name against GeoNames `cities500` populated-place data.
- Airport-derived names were additionally checked against OurAirports airport name, country and municipality fields. A municipality was accepted only when independently present as a same-country populated place, with explicit source checks for special cases.
- The `cities500` extract has population/administrative-seat thresholds and does not cover every small locality. Names lacking independent evidence remain in the manual-review list and are excluded from Big Cities rather than being guessed or deleted.
- Source: [GeoNames readme](https://download.geonames.org/export/dump/readme.txt); [OurAirports data](https://ourairports.com/data/airports.csv).
- The documented workbook `Data/Big City Info (1).xlsx` is absent from the current workspace; only regional/profile spreadsheets remain. The original source workbook could not be audited directly.
- Audit country labels are derived from ISO-3166 codes. The existing `AR` Country row is currently named `TEST SAVE`; it was left unchanged because country data is outside this task’s scope.

## Disposition Summary

- Kept as verified, no name change: 761
- Renamed to a verified locality: 215
- Removed as duplicates/non-city placeholders: 11
- Manual review: 243

Manual-review records remain in the database with `isVerifiedCity = false`; they are not returned by `GET /cities` and do not appear on Big Cities. Their existing direct detail routes remain available where the record itself was retained.

## Complete Audit Table

This table covers all 1230 records from the pre-audit snapshot. Manual-review rows remain in City with isVerifiedCity=false and are excluded from Big Cities.

| Country | Current city name | Is it really a city? | Correct city name / action | Reason |
|---|---|---|---|---|
| Andorra | Andorra la Vella | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Arab Emirates | Abu Dhabi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Arab Emirates | Al Ain | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Arab Emirates | Dubai | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Arab Emirates | Fujairah | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Arab Emirates | Ras Al Khaimah | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Arab Emirates | Sharjah | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Afghanistan | Herat | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Afghanistan | Kabul | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Afghanistan | Kandahar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Afghanistan | Khost | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Afghanistan | Mazar-i-Sharif | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Antigua and Barbuda | V.C. Bird | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Osbourn is not independently verified as a GeoNames populated place. |
| Albania | Tirana Nënë Tereza | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Armenia | Gyumri | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Armenia | Yerevan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Angola | Luanda | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Angola | Luanda | No; duplicate record | Remove duplicate; merge into Luanda (ao-quatro-de-fevereiro-international-airport-lad-luanda) | Duplicate Luanda record; retain the record with two linked events. |
| Argentina | Buenos Aires | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Argentina | Córdoba | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Argentina | La Plata | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Argentina | Mendoza | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Argentina | Rosario | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Austria | Graz | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Austria | Innsbruck | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Austria | Klagenfurt | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Austria | Linz | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Austria | Salzburg W. A. Mozart | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Austria | Vienna | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Australia | Adelaide | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Australia | Ayers Rock | No, not as recorded; intended locality verified | Rename to Yulara | Northern Territory register identifies Yulara as a town; the airport is six kilometres north of Yulara. |
| Australia | Brisbane | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Australia | Broome | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Australia | Cairns | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Australia | Canberra | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Australia | Christmas Island | Not verified; held for manual review | Retain in database; exclude from Big Cities | Current label is the whole territory; airport data does not prove that Flying Fish Cove was the intended record. |
| Australia | Cocos Islands | No, not as recorded; intended locality verified | Rename to West Island | The airport is on West Island, the inhabited capital locality (population about 120). |
| Australia | Darwin | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Australia | Gold Coast | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Australia | Hobart | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Australia | Melbourne | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Australia | Newcastle | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Australia | Perth | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Australia | Port Hedland | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Australia | Sydney Kingsford Smith | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Sydney (Mascot) is not independently verified as a GeoNames populated place. |
| Australia | Townsville | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Azerbaijan | Baku | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Azerbaijan | Fuzuli | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Azerbaijan | Gabala | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Azerbaijan | Ganja | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Azerbaijan | Lachin | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Azerbaijan | Lankaran | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Azerbaijan | Nakhchivan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Azerbaijan | Zangilan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Azerbaijan | Zaqatala | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bosnia and Herzegovina | Banja Luka | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bosnia and Herzegovina | Mostar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bosnia and Herzegovina | Sarajevo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bosnia and Herzegovina | Tuzla | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Barbados | Grantley Adams | No, not as recorded; intended locality verified | Rename to Bridgetown | Current label is not a populated place; OurAirports municipality Bridgetown is an independently verified same-country populated place. |
| Bangladesh | Chattogram (Chittagong) | No, not as recorded; intended locality verified | Rename to Chattogram | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Bangladesh | Cox's Bazar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bangladesh | Dhaka | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bangladesh | Sylhet | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Belgium | Antwerp | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Belgium | Brussels | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Belgium | Brussels South Charleroi | No, not as recorded; intended locality verified | Rename to Charleroi | Current label is not a populated place; OurAirports municipality Charleroi is an independently verified same-country populated place. |
| Belgium | Liège | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Belgium | Ostend–Bruges | No, not as recorded; intended locality verified | Rename to Oostende | Current label is not a populated place; OurAirports municipality Oostende is an independently verified same-country populated place. |
| Burkina Faso | Ouagadougou | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bulgaria | Burgas | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bulgaria | Plovdiv | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bulgaria | Sofia | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bulgaria | Varna | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bahrain | Muharraq (serves Manama) | No, not as recorded; intended locality verified | Rename to Al Muharraq | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Burundi | Burundi | No, not as recorded; intended locality verified | Rename to Bujumbura | Profile asset and same-country gazetteer identify Bujumbura; current label is the country. |
| Burundi | Melchior Ndadaye | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Benin | Cotonou | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Brunei Darussalam | Bandar Seri Begawan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bolivia | Cochabamba | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bolivia | La Paz | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bolivia | Santa Cruz de la Sierra | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bolivia | Sucre | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Brazil | Belo Horizonte | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Brazil | Brasília | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Brazil | Curitiba | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Brazil | Fortaleza | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Brazil | Manaus | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Brazil | Rio de Janeiro | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Brazil | Salvador | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Brazil | São Paulo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bahamas | Chub Cay | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Chub Cay is not independently verified as a GeoNames populated place. |
| Bahamas | Exuma | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Moss Town is not independently verified as a GeoNames populated place. |
| Bahamas | Governor's Harbour | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bahamas | Grand Bahama | No, not as recorded; intended locality verified | Rename to Freeport | Current label is not a populated place; OurAirports municipality Freeport is an independently verified same-country populated place. |
| Bahamas | Great Harbour Cay | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Bullocks Harbour is not independently verified as a GeoNames populated place. |
| Bahamas | Leonard M. Thompson | No, not as recorded; intended locality verified | Rename to Marsh Harbour | Current label is not a populated place; OurAirports municipality Marsh Harbour is an independently verified same-country populated place. |
| Bahamas | Lynden Pindling | No, not as recorded; intended locality verified | Rename to Nassau | Current label is not a populated place; OurAirports municipality Nassau is an independently verified same-country populated place. |
| Bahamas | New Bight | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Cat Island is not independently verified as a GeoNames populated place. |
| Bahamas | North Eleuthera | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality North Eleuthera is not independently verified as a GeoNames populated place. |
| Bahamas | Rock Sound | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Rock Sound is not independently verified as a GeoNames populated place. |
| Bahamas | San Andros | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bahamas | South Bimini | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality South Bimini is not independently verified as a GeoNames populated place. |
| Bahamas | Staniel Cay | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Staniel Cay is not independently verified as a GeoNames populated place. |
| Bhutan | Gelephu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Bhutan | Paro | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Botswana | Gaborone | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Botswana | Kasane | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Botswana | Maun | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Belarus | Minsk | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Belize | Philip S. W. Goldson | No, not as recorded; intended locality verified | Rename to Belize City | Current label is not a populated place; OurAirports municipality Belize City is an independently verified same-country populated place. |
| Canada | Abbotsford | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Canada | Calgary | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Canada | Edmonton | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Canada | Halifax Stanfield | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Canada | John C. Munro Hamilton | No, not as recorded; intended locality verified | Rename to Hamilton | Current label is not a populated place; OurAirports municipality Hamilton is an independently verified same-country populated place. |
| Canada | Kelowna | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Canada | Montréal-Trudeau | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Canada | Ottawa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Canada | Québec City Jean Lesage | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Canada | Regina | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Canada | Saskatoon John G. Diefenbaker | No, not as recorded; intended locality verified | Rename to Saskatoon | Current label is not a populated place; OurAirports municipality Saskatoon is an independently verified same-country populated place. |
| Canada | St. John's | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Canada | Toronto Pearson | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Canada | Vancouver | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Canada | Victoria | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Canada | Winnipeg James Armstrong Richardson | No, not as recorded; intended locality verified | Rename to Winnipeg | Current label is not a populated place; OurAirports municipality Winnipeg is an independently verified same-country populated place. |
| Democratic Republic of the Congo | Bangoka | No, not as recorded; intended locality verified | Rename to Kisangani | Current label is not a populated place; OurAirports municipality Kisangani is an independently verified same-country populated place. |
| Democratic Republic of the Congo | Goma | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Democratic Republic of the Congo | Kindu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Democratic Republic of the Congo | Lubumbashi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Democratic Republic of the Congo | N'djili | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Central African Republic | Bangui M'Poko | No, not as recorded; intended locality verified | Rename to Bangui | Current label is not a populated place; OurAirports municipality Bangui is an independently verified same-country populated place. |
| Republic of the Congo | Agostinho-Neto | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Republic of the Congo | Maya-Maya | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Switzerland | Bern | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Switzerland | Freiburg | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Switzerland | Geneva | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Switzerland | Lugano | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Switzerland | Sion | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Switzerland | Zurich | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Cote d'Ivoire | Félix-Houphouët-Boigny | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Chile | Antofagasta | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Chile | Concepción | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Chile | La Serena | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Chile | Santiago | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Chile | Valparaíso | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Cameroon | Douala | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Cameroon | Garoua | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Cameroon | Maroua Salak | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Cameroon | Yaoundé Nsimalen | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| People's Republic of China | Beijing | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Changchun | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Changsha | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Chengdu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Chongqing | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Dalian | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Fuzhou | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Guangzhou | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Guilin | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Guiyang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Haikou | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Hangzhou | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Harbin | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Hefei | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Hohhot | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Jinan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Jinghong | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Kashgar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Kunming | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Lanzhou | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Lhasa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Mangshi (Dehong) | Yes | Keep | The current name identifies a recognized same-country urban locality; parenthetical prefecture text is retained as a disambiguator. |
| People's Republic of China | Nanchang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Nanjing | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Nanning | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Ningbo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Qingdao | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Sanya | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Shanghai | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Shenyang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Shenzhen | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Shijiazhuang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Taiyuan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Tianjin | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Ürümqi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Wenzhou | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Wuhan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Xi'an | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Xiamen | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Yanji | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Yinchuan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Zhengzhou | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| People's Republic of China | Zhuhai | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Colombia | Barranquilla | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Colombia | Bogotá | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Colombia | Cali | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Colombia | Cartagena | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Colombia | Medellín | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Costa Rica | Guanacaste | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Costa Rica | Juan Santamaría | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Costa Rica | Limón | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Cuba | Abel Santamaría | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Cuba | Antonio Maceo | No, not as recorded; intended locality verified | Rename to Santiago | Current label is not a populated place; OurAirports municipality Santiago is an independently verified same-country populated place. |
| Cuba | Frank País | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Cuba | Ignacio Agramonte | No, not as recorded; intended locality verified | Rename to Camaguey | Current label is not a populated place; OurAirports municipality Camaguey is an independently verified same-country populated place. |
| Cuba | Jardines del Rey | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Cayo Coco is not independently verified as a GeoNames populated place. |
| Cuba | José Martí | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Cuba | Juan Gualberto Gómez | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Cuba | Vilo Acuña | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Cape Verde | Amílcar Cabral | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Cape Verde | Aristides Pereira | No, not as recorded; intended locality verified | Rename to Rabil | Current label is not a populated place; OurAirports municipality Rabil is an independently verified same-country populated place. |
| Cape Verde | Cesária Évora | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Cape Verde | Nelson Mandela | No, not as recorded; intended locality verified | Rename to Praia | Current label is not a populated place; OurAirports municipality Praia is an independently verified same-country populated place. |
| Cyprus | Larnaca | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Cyprus | Larnaca | No; duplicate record | Remove duplicate; merge into Larnaca (cy-larnaca-international-airport) | Duplicate Larnaca record; retain the row with its existing local image/profile. |
| Cyprus | Northern Nicosia | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Cyprus | Paphos | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Cyprus | Paphos | No; duplicate record | Remove duplicate; merge into Paphos (cy-paphos-international-airport) | Duplicate Paphos record; retain the row with its existing local image/profile. |
| Czech Republic | Brno–Tuřany | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Czech Republic | Karlovy Vary | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Czech Republic | Leoš Janáček Ostrava | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Czech Republic | Pardubice | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Czech Republic | Václav Havel Prague | No, not as recorded; intended locality verified | Rename to Prague | Current label is not a populated place; OurAirports municipality Prague is an independently verified same-country populated place. |
| Germany | Berlin Brandenburg | No, not as recorded; intended locality verified | Rename to Berlin | Current label is not a populated place; OurAirports municipality Berlin is an independently verified same-country populated place. |
| Germany | Bremen | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Germany | Cologne Bonn | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality KÃ¶ln (Cologne) is not independently verified as a GeoNames populated place. |
| Germany | Dortmund | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Germany | Dresden | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Germany | Düsseldorf | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Germany | Erfurt–Weimar | No, not as recorded; intended locality verified | Rename to Erfurt | Current label is not a populated place; OurAirports municipality Erfurt is an independently verified same-country populated place. |
| Germany | Frankfurt | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Germany | Friedrichshafen | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Germany | Hamburg | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Germany | Hannover | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Germany | Karlsruhe/Baden-Baden | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality RheinmÃ¼nster is not independently verified as a GeoNames populated place. |
| Germany | Leipzig/Halle | No, not as recorded; intended locality verified | Rename to Schkeuditz | Current label is not a populated place; OurAirports municipality Schkeuditz is an independently verified same-country populated place. |
| Germany | Munich | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Germany | Münster Osnabrück | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Germany | Nuremberg | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Germany | Paderborn Lippstadt | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality BÃ¼ren is not independently verified as a GeoNames populated place. |
| Germany | Rostock–Laage | No, not as recorded; intended locality verified | Rename to Laage | Current label is not a populated place; OurAirports municipality Laage is an independently verified same-country populated place. |
| Germany | Saarbrücken | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Germany | Stuttgart | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Djibouti | Djibouti–Ambouli | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Djibouti City is not independently verified as a GeoNames populated place. |
| Denmark | Aalborg | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Denmark | Aarhus | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Denmark | Billund | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Denmark | Copenhagen | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Dominica | Douglas–Charles | No, not as recorded; intended locality verified | Rename to Marigot | Current label is not a populated place; OurAirports municipality Marigot is an independently verified same-country populated place. |
| Dominican Republic | Cibao | No, not as recorded; intended locality verified | Rename to Santiago | Current label is not a populated place; OurAirports municipality Santiago is an independently verified same-country populated place. |
| Dominican Republic | Gregorio Luperón | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Dominican Republic | La Romana | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Dominican Republic | Las Américas | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Dominican Republic | Punta Cana | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Dominican Republic | Samaná El Catey | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Algeria | Algiers | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Algeria | Annaba | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Algeria | Béjaïa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Algeria | Constantine | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Algeria | Oran | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Algeria | Sétif | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Algeria | Tlemcen | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Ecuador | Cuenca | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Ecuador | Guayaquil | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Ecuador | Loja | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Ecuador | Manta | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Ecuador | Quito | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Estonia | Lennart Meri Tallinn | No, not as recorded; intended locality verified | Rename to Tallinn | Current label is not a populated place; OurAirports municipality Tallinn is an independently verified same-country populated place. |
| Egypt | Assiut | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Egypt | Aswan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Egypt | Borg El Arab | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Egypt | Cairo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Egypt | Hurghada | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Egypt | Luxor | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Egypt | Marsa Alam | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Egypt | Sharm El Sheikh | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Egypt | Sohag | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Egypt | Sphinx | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Al Jiza is not independently verified as a GeoNames populated place. |
| Eritrea | Asmara | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | A Coruña | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | Adolfo Suárez Madrid–Barajas | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Spain | Alicante–Elche Miguel Hernández | No, not as recorded; intended locality verified | Rename to Alicante | Current label is not a populated place; OurAirports municipality Alicante is an independently verified same-country populated place. |
| Spain | Almería | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | Asturias | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality RanÃ³n is not independently verified as a GeoNames populated place. |
| Spain | Bilbao | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | Castellón–Costa Azahar | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Spain | César Manrique–Lanzarote | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality San BartolomÃ© is not independently verified as a GeoNames populated place. |
| Spain | Ceuta Heliport | No, not as recorded; intended locality verified | Rename to Ceuta | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Spain | El Hierro | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality El Hierro Island is not independently verified as a GeoNames populated place. |
| Spain | Federico García Lorca Granada–Jaén | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Spain | Fuerteventura | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality El Matorral is not independently verified as a GeoNames populated place. |
| Spain | Girona-Costa Brava | No, not as recorded; intended locality verified | Rename to Girona | Current label is not a populated place; OurAirports municipality Girona is an independently verified same-country populated place. |
| Spain | Gran Canaria | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Gran Canaria Island is not independently verified as a GeoNames populated place. |
| Spain | Ibiza | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | Jerez | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | Josep Tarradellas Barcelona–El Prat | No, not as recorded; intended locality verified | Rename to Barcelona | Current label is not a populated place; OurAirports municipality Barcelona is an independently verified same-country populated place. |
| Spain | La Gomera | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Alajero, La Gomera Island is not independently verified as a GeoNames populated place. |
| Spain | La Palma | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | Málaga-Costa del Sol | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality MÃ¡laga is not independently verified as a GeoNames populated place. |
| Spain | Melilla | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | Menorca | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality MahÃ³n (MaÃ³) is not independently verified as a GeoNames populated place. |
| Spain | Palma de Mallorca | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | Región de Murcia | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Spain | Reus | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | Santiago–Rosalía de Castro | No, not as recorded; intended locality verified | Rename to Santiago de Compostela | Current label is not a populated place; OurAirports municipality Santiago de Compostela is an independently verified same-country populated place. |
| Spain | Seve Ballesteros–Santander | No, not as recorded; intended locality verified | Rename to Santander | Current label is not a populated place; OurAirports municipality Santander is an independently verified same-country populated place. |
| Spain | Seville | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | Tenerife North–Ciudad de La Laguna | No, not as recorded; intended locality verified | Rename to Tenerife | Current label is not a populated place; OurAirports municipality Tenerife is an independently verified same-country populated place. |
| Spain | Tenerife South | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Spain | Valencia | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | Valladolid | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | Vigo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Spain | Zaragoza | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Ethiopia | Aba Tenna Dejazmach Yilma | No, not as recorded; intended locality verified | Rename to Dire Dawa | Current label is not a populated place; OurAirports municipality Dire Dawa is an independently verified same-country populated place. |
| Ethiopia | Addis Ababa Bole | No, not as recorded; intended locality verified | Rename to Addis Ababa | Current label is not a populated place; OurAirports municipality Addis Ababa is an independently verified same-country populated place. |
| Finland | Helsinki-Vantaa | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Helsinki (Vantaa) is not independently verified as a GeoNames populated place. |
| Finland | Ivalo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Finland | Kittilä | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Finland | Kuusamo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Finland | Mariehamn | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Mariehamn is not independently verified as a GeoNames populated place. |
| Finland | Oulu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Finland | Rovaniemi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Finland | Tampere-Pirkkala | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Tampere / Pirkkala is not independently verified as a GeoNames populated place. |
| Finland | Turku | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Finland | Vaasa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Fiji | Nadi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Fiji | Nausori | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Nausori is not independently verified as a GeoNames populated place. |
| Micronesia, Federated States of | Chuuk | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Weno Island is not independently verified as a GeoNames populated place. |
| Micronesia, Federated States of | Kosrae | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Okat is not independently verified as a GeoNames populated place. |
| Micronesia, Federated States of | None. | No; placeholder/country label | Remove; no city replacement established | Placeholder, not a locality; no intended city can be established. |
| Micronesia, Federated States of | Pohnpei | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Pohnpei Island is not independently verified as a GeoNames populated place. |
| Micronesia, Federated States of | Yap | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Yap Island is not independently verified as a GeoNames populated place. |
| France | Ajaccio Napoleon Bonaparte | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| France | Bastia–Poretta | No, not as recorded; intended locality verified | Rename to Bastia | Current label is not a populated place; OurAirports municipality Bastia is an independently verified same-country populated place. |
| France | Beauvais–Tillé | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| France | Bergerac Dordogne Périgord | No, not as recorded; intended locality verified | Rename to Bergerac | Current label is not a populated place; OurAirports municipality Bergerac is an independently verified same-country populated place. |
| France | Biarritz Pays Basque | No, not as recorded; intended locality verified | Rename to Biarritz | Current label is not a populated place; OurAirports municipality Biarritz is an independently verified same-country populated place. |
| France | Bordeaux–Mérignac | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| France | Brest Bretagne | No, not as recorded; intended locality verified | Rename to Brest | Current label is not a populated place; OurAirports municipality Brest is an independently verified same-country populated place. |
| France | Caen–Carpiquet | No, not as recorded; intended locality verified | Rename to Caen | Current label is not a populated place; OurAirports municipality Caen is an independently verified same-country populated place. |
| France | Calvi–Sainte-Catherine | No, not as recorded; intended locality verified | Rename to Calvi | Current label is not a populated place; OurAirports municipality Calvi is an independently verified same-country populated place. |
| France | Carcassonne | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| France | Chambéry | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| France | Clermont-Ferrand Auvergne | No, not as recorded; intended locality verified | Rename to Clermont-Ferrand | Current label is not a populated place; OurAirports municipality Clermont-Ferrand is an independently verified same-country populated place. |
| France | Deauville–Normandie | No, not as recorded; intended locality verified | Rename to Deauville | Current label is not a populated place; OurAirports municipality Deauville is an independently verified same-country populated place. |
| France | Dinard–Pleurtuit–Saint-Malo | No, not as recorded; intended locality verified | Rename to Dinard | Current label is not a populated place; OurAirports municipality Dinard is an independently verified same-country populated place. |
| France | Figari–Sud Corse | No, not as recorded; intended locality verified | Rename to Figari | Current label is not a populated place; OurAirports municipality Figari is an independently verified same-country populated place. |
| France | Freiburg | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| France | Grenoble–Alpes–Isère | No, not as recorded; intended locality verified | Rename to Grenoble | Current label is not a populated place; OurAirports municipality Grenoble is an independently verified same-country populated place. |
| France | La Rochelle–Île de Ré | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| France | Lille | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| France | Limoges–Bellegarde | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| France | Lyon–Saint-Exupéry | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Colombier-Saugnieu, RhÃ´ne is not independently verified as a GeoNames populated place. |
| France | Marseille Provence | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Marignane, Bouches-du-RhÃ´ne is not independently verified as a GeoNames populated place. |
| France | Metz–Nancy–Lorraine | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Goin is not independently verified as a GeoNames populated place. |
| France | Montpellier–Méditerranée | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| France | Nantes Atlantique | No, not as recorded; intended locality verified | Rename to Nantes | Current label is not a populated place; OurAirports municipality Nantes is an independently verified same-country populated place. |
| France | Nice Côte d’Azur | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Nice, Alpes-Maritimes is not independently verified as a GeoNames populated place. |
| France | Nîmes–Alès–Camargue–Cévennes | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| France | Paris | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| France | Paris Charles de Gaulle | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Paris (Roissy-en-France, Val-d'Oise) is not independently verified as a GeoNames populated place. |
| France | Paris Orly | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Paris (Orly, Val-de-Marne) is not independently verified as a GeoNames populated place. |
| France | Pau Pyrénées | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| France | Perpignan–Rivesaltes | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| France | Poitiers–Biard | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Poitiers/Biard is not independently verified as a GeoNames populated place. |
| France | Rennes–Saint-Jacques | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Saint-Jacques-de-la-Lande, Ille-et-Vilaine is not independently verified as a GeoNames populated place. |
| France | Strasbourg | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| France | Tarbes–Lourdes–Pyrénées | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| France | Toulouse–Blagnac | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Toulouse/Blagnac is not independently verified as a GeoNames populated place. |
| France | Tours Val de Loire | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Tours, Indre-et-Loire is not independently verified as a GeoNames populated place. |
| Gabon | Léon-Mba | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Gabon | M'Vengue El Hadj Omar Bongo Ondimba | No, not as recorded; intended locality verified | Rename to Franceville | Current label is not a populated place; OurAirports municipality Franceville is an independently verified same-country populated place. |
| Gabon | Port-Gentil | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | Aberdeen | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | Belfast | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | Birmingham | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | Bournemouth | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | Bristol | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | Cardiff | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | City of Derry | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Derry, Derry and Strabane is not independently verified as a GeoNames populated place. |
| United Kingdom | Cornwall Newquay | No, not as recorded; intended locality verified | Rename to Newquay | Current label is not a populated place; OurAirports municipality Newquay is an independently verified same-country populated place. |
| United Kingdom | Doncaster Sheffield | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Doncaster, South Yorkshire is not independently verified as a GeoNames populated place. |
| United Kingdom | East Midlands | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Nottingham, Leicestershire is not independently verified as a GeoNames populated place. |
| United Kingdom | Edinburgh | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | Exeter | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | George Best Belfast City | No; duplicate record | Remove duplicate; merge into Belfast (gb-belfast-international-airport) | Duplicate airport-named Belfast entry; retain the existing verified Belfast record. |
| United Kingdom | Glasgow | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | Glasgow Prestwick | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Prestwick, South Ayrshire is not independently verified as a GeoNames populated place. |
| United Kingdom | Guernsey | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| United Kingdom | Inverness | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | Isle of Man | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| United Kingdom | Jersey | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| United Kingdom | Leeds Bradford | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Leeds, West Yorkshire is not independently verified as a GeoNames populated place. |
| United Kingdom | Liverpool John Lennon | No, not as recorded; intended locality verified | Rename to Liverpool | Current label is not a populated place; OurAirports municipality Liverpool is an independently verified same-country populated place. |
| United Kingdom | London City | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | London Gatwick | No; duplicate record | Remove duplicate; merge into London (gb-london-heathrow-airport) | Duplicate airport-derived London entry; retain one London locality record. |
| United Kingdom | London Heathrow | No, not as recorded; intended locality verified | Rename to London | Current label is not a populated place; OurAirports municipality London is an independently verified same-country populated place. |
| United Kingdom | London Luton | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Luton, Luton is not independently verified as a GeoNames populated place. |
| United Kingdom | London Stansted | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality London, Essex is not independently verified as a GeoNames populated place. |
| United Kingdom | Manchester | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | Newcastle | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | Norwich | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | Southampton | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Kingdom | Teesside | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Darlington, Durham is not independently verified as a GeoNames populated place. |
| Grenada | Maurice Bishop | No, not as recorded; intended locality verified | Rename to Saint George's | Current label is not a populated place; OurAirports municipality Saint George's is an independently verified same-country populated place. |
| Georgia | Batumi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Georgia | Kutaisi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Georgia | Tbilisi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Ghana | Kotoka | No, not as recorded; intended locality verified | Rename to Accra | Current label is not a populated place; OurAirports municipality Accra is an independently verified same-country populated place. |
| Republic of The Gambia | Banjul | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Guinea | Ahmed Sékou Touré | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Equatorial Guinea | Bata | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Equatorial Guinea | Malabo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Greece | Aktion | No, not as recorded; intended locality verified | Rename to Preveza | Current label is not a populated place; OurAirports municipality Preveza is an independently verified same-country populated place. |
| Greece | Astypalaia Island | No, not as recorded; intended locality verified | Rename to Astypalaia | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Greece | Athens | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Greece | Chania “Ioannis Daskalogiannis” | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Greece | Chios Island | No, not as recorded; intended locality verified | Rename to Chios | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Greece | Corfu “Ioannis Kapodistrias” | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Kerkyra (Corfu) is not independently verified as a GeoNames populated place. |
| Greece | Heraklion “Nikos Kazantzakis” | No, not as recorded; intended locality verified | Rename to Heraklion | Current label is not a populated place; OurAirports municipality Heraklion is an independently verified same-country populated place. |
| Greece | Ikaria Island | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Greece | Ioannina | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Greece | Kalamata “Captain Vassilis Constantakopoulos” | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Greece | Karpathos Island | No, not as recorded; intended locality verified | Rename to Karpathos | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Greece | Kavala “Alexander the Great” | No, not as recorded; intended locality verified | Rename to Kavala | Current label is not a populated place; OurAirports municipality Kavala is an independently verified same-country populated place. |
| Greece | Kefalonia “Anna Pollatou” | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Greece | Kithira Island | No, not as recorded; intended locality verified | Rename to Kythira | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Greece | Kos “Hippocrates” | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Greece | Lemnos | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Greece | Milos Island | No, not as recorded; intended locality verified | Rename to Milos | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Greece | Mykonos | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Greece | Mytilene “Odysseas Elytis” | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Greece | Naxos Island | No, not as recorded; intended locality verified | Rename to Naxos | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Greece | Paros | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Greece | Rhodes “Diagoras” | No, not as recorded; intended locality verified | Rename to Rhodes | Current label is not a populated place; OurAirports municipality Rhodes is an independently verified same-country populated place. |
| Greece | Samos “Aristarchos of Samos” | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Greece | Santorini | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Santorini Island is not independently verified as a GeoNames populated place. |
| Greece | Skiathos “Alexandros Papadiamantis” | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Greece | Skyros Island | No, not as recorded; intended locality verified | Rename to Skyros | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Greece | Syros Island | No, not as recorded; intended locality verified | Rename to Ermoupoli | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Greece | Thessaloniki “Makedonia” | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Greece | Zakynthos “Dionysios Solomos” | No, not as recorded; intended locality verified | Rename to Zakynthos | Current label is not a populated place; OurAirports municipality Zakynthos is an independently verified same-country populated place. |
| Guatemala | La Aurora | No, not as recorded; intended locality verified | Rename to Guatemala City | Current label is not a populated place; OurAirports municipality Guatemala City is an independently verified same-country populated place. |
| Guinea-Bissau | Osvaldo Vieira | No, not as recorded; intended locality verified | Rename to Bissau | Current label is not a populated place; OurAirports municipality Bissau is an independently verified same-country populated place. |
| Guyana | Georgetown | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Guyana | Linden | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Guyana | New Amsterdam | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Honduras | Golosón | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Honduras | Juan Manuel Gálvez | No, not as recorded; intended locality verified | Rename to Coxen Hole | Current label is not a populated place; OurAirports municipality Coxen Hole is an independently verified same-country populated place. |
| Honduras | Palmerola | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Palmerola is not independently verified as a GeoNames populated place. |
| Honduras | Ramón Villeda Morales | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Honduras | Toncontín | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Croatia | Brač | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Croatia | Dubrovnik | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Croatia | Franjo Tuđman | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Croatia | Osijek | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Croatia | Pula | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Croatia | Rijeka | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Croatia | Split | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Croatia | Zadar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Haiti | Cap-Haïtien | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Haiti | Toussaint Louverture | No, not as recorded; intended locality verified | Rename to Port-au-Prince | Current label is not a populated place; OurAirports municipality Port-au-Prince is an independently verified same-country populated place. |
| Hungary | Budapest Ferenc Liszt | No, not as recorded; intended locality verified | Rename to Budapest | Current label is not a populated place; OurAirports municipality Budapest is an independently verified same-country populated place. |
| Hungary | Debrecen | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Hungary | Hévíz–Balaton | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Indonesia | Ambon | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Balikpapan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Banda Aceh | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Bandar Lampung | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Banjarmasin | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Banyuwangi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Batam | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Biak | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Denpasar (Bali) | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Jakarta | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Jayapura | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Kupang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Labuan Bajo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Lombok (Praya) | No, not as recorded; intended locality verified | Rename to Praya | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Indonesia | Makassar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Manado | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Medan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Padang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Palembang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Pekanbaru | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Pontianak | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Surabaya | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Surakarta (Solo) | No, not as recorded; intended locality verified | Rename to Surakarta | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Indonesia | Tangerang (Jakarta) | No, not as recorded; intended locality verified | Rename to Tangerang | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Indonesia | Tanjung Pinang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Yogyakarta | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Indonesia | Yogyakarta (limited international operations) | No; duplicate record | Remove duplicate; merge into Yogyakarta (id-yogyakarta) | Duplicate Yogyakarta record; retain the canonical Yogyakarta row with the existing city image/profile. |
| Ireland | Cork | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Ireland | Dublin | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Ireland | Ireland West Knock | No, not as recorded; intended locality verified | Rename to Charlestown | Current label is not a populated place; OurAirports municipality Charlestown is an independently verified same-country populated place. |
| Ireland | Shannon | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Israel | Eilat | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Israel | Haifa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Israel | Tel Aviv | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Ahmedabad | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Amritsar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | barsana | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Bengaluru | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Bhubaneswar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Chandigarh | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Chennai | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Coimbatore | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Delhi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | district kutch | Not verified; held for manual review | Retain in database; exclude from Big Cities | District/region label; the linked event and record fields do not establish which locality was intended. |
| India | Goa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Guwahati | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Hyderabad | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Imphal | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Indore | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Jaipur | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Jodhpur | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Kannur | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Kochi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | kohima | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Kolkata | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Kozhikode | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | kullu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Kushinagar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | leh | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Lucknow | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Madurai | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Mangaluru | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Mumbai | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | mysuru | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Nagpur | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | panjim | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Patna | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Port Blair | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Pune | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | puri | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | pushkar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Ranchi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | shantiniketan | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| India | Shirdi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Srinagar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Surat | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | tawang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Thiruvananthapuram | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Thoothukudi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | thrissur | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Tiruchirappalli | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Vadodara | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Varanasi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| India | Visakhapatnam | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Iraq | Baghdad | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Iraq | Basra | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Iraq | Erbil | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Iraq | Kirkuk | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Iraq | Mosul | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Iraq | Najaf | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Iraq | Sulaymaniyah | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Abadan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Ahvaz | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Asaluyeh | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Bandar Abbas | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Birjand | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Chabahar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Hamadan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Isfahan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Kerman | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Kish Island | No, not as recorded; intended locality verified | Rename to Kish | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Islamic Republic of Iran | Lamerd | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Lar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Mashhad | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Qeshm Island | No, not as recorded; intended locality verified | Rename to Qeshm | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Islamic Republic of Iran | Sari | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Shiraz | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Tabriz | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Tehran | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Islamic Republic of Iran | Zahedan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Iceland | Akureyri | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Iceland | Egilsstaðir | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Iceland | Keflavík | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Abruzzo | No, not as recorded; intended locality verified | Rename to Pescara | Current label is not a populated place; OurAirports municipality Pescara is an independently verified same-country populated place. |
| Italy | Alghero–Fertilia | No, not as recorded; intended locality verified | Rename to Alghero | Current label is not a populated place; OurAirports municipality Alghero is an independently verified same-country populated place. |
| Italy | Bari Karol Wojtyła | No, not as recorded; intended locality verified | Rename to Bari | Current label is not a populated place; OurAirports municipality Bari is an independently verified same-country populated place. |
| Italy | Bologna Guglielmo Marconi | No, not as recorded; intended locality verified | Rename to Bologna | Current label is not a populated place; OurAirports municipality Bologna is an independently verified same-country populated place. |
| Italy | Bolzano | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Brindisi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Cagliari Elmas | No, not as recorded; intended locality verified | Rename to Cagliari | Current label is not a populated place; OurAirports municipality Cagliari is an independently verified same-country populated place. |
| Italy | Catania–Fontanarossa | No, not as recorded; intended locality verified | Rename to Catania | Current label is not a populated place; OurAirports municipality Catania is an independently verified same-country populated place. |
| Italy | Comiso | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Crotone | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Cuneo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Falcone Borsellino | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Italy | Federico Fellini | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Rimini (RN) is not independently verified as a GeoNames populated place. |
| Italy | Florence , Peretola | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Firenze (FI) is not independently verified as a GeoNames populated place. |
| Italy | Forlì | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Lamezia Terme | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Lampedusa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Leonardo da Vinci–Fiumicino | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Italy | Marche | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Falconara Marittima (AN) is not independently verified as a GeoNames populated place. |
| Italy | Milan Bergamo | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Italy | Milan Linate | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Italy | Milan Malpensa | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Ferno (VA) is not independently verified as a GeoNames populated place. |
| Italy | Naples | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Olbia Costa Smeralda | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Olbia (SS) is not independently verified as a GeoNames populated place. |
| Italy | Pantelleria | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Parma | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Perugia San Francesco d'Assisi–Umbria | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Perugia (PG) is not independently verified as a GeoNames populated place. |
| Italy | Pisa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Reggio Calabria | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Trapani–Birgi | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Italy | Treviso | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Trieste | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Turin | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Italy | Venice Marco Polo | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Venezia (VE) is not independently verified as a GeoNames populated place. |
| Italy | Verona Villafranca | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Jamaica | Ian Fleming | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Boscobel is not independently verified as a GeoNames populated place. |
| Jamaica | Norman Manley | No, not as recorded; intended locality verified | Rename to Kingston | Current label is not a populated place; OurAirports municipality Kingston is an independently verified same-country populated place. |
| Jamaica | Sangster | No, not as recorded; intended locality verified | Rename to Montego Bay | Current label is not a populated place; OurAirports municipality Montego Bay is an independently verified same-country populated place. |
| Jordan | Amman | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Jordan | Aqaba | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Akita | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Aomori | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Asahikawa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Fukuoka | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Hakodate | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Higashine | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Hiroshima | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Kagoshima | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Kitakyushu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Komatsu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Kumamoto | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Makinohara | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Miyazaki | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Nagasaki | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Nagoya | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Naha (Okinawa) | No, not as recorded; intended locality verified | Rename to Naha | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Japan | Narita (Tokyo) | No, not as recorded; intended locality verified | Rename to Narita | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Japan | Niigata | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Oita | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Okayama | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Omitama | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Osaka | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Sapporo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Sendai | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Takamatsu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Tokushima | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Tokyo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Toyama | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Japan | Yonago | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kenya | Eldoret | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kenya | Jomo Kenyatta | No, not as recorded; intended locality verified | Rename to Nairobi | Current label is not a populated place; OurAirports municipality Nairobi is an independently verified same-country populated place. |
| Kenya | Kisumu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kenya | Moi | No, not as recorded; intended locality verified | Rename to Mombasa | Current label is not a populated place; OurAirports municipality Mombasa is an independently verified same-country populated place. |
| Kyrgyzstan | Bishkek | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kyrgyzstan | Osh | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kyrgyzstan | Tamchy (Issyk-Kul Region) | Not verified; held for manual review | Retain in database; exclude from Big Cities | Proposed target “Tamchy” lacks a same-country GeoNames cities500 match; held for review. |
| Cambodia | Phnom Penh | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Cambodia | Siem Reap | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Cambodia | Sihanoukville | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kiribati | Bonriki | No, not as recorded; intended locality verified | Rename to South Tarawa | Current label is not a populated place; OurAirports municipality South Tarawa is an independently verified same-country populated place. |
| Kiribati | Cassidy | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Kiritimati is not independently verified as a GeoNames populated place. |
| Comoros | Prince Said Ibrahim | No, not as recorded; intended locality verified | Rename to Moroni | Current label is not a populated place; OurAirports municipality Moroni is an independently verified same-country populated place. |
| Saint Kitts and Nevis | Robert L. Bradshaw | No, not as recorded; intended locality verified | Rename to Basseterre | Current label is not a populated place; OurAirports municipality Basseterre is an independently verified same-country populated place. |
| Saint Kitts and Nevis | Vance W. Amory | No, not as recorded; intended locality verified | Rename to Charlestown | Current label is not a populated place; OurAirports municipality Charlestown is an independently verified same-country populated place. |
| North Korea | Pyongyang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| South Korea | Busan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| South Korea | Cheongju | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| South Korea | Daegu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| South Korea | Incheon | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| South Korea | Jeju City | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| South Korea | Seoul | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| South Korea | Yangyang | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Kuwait | Kuwait City | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Aktau | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Aktobe | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Almaty | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Astana | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Atyrau | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Karaganda | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Kokshetau | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Kostanay | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Kyzylorda | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Oral (Uralsk) | No, not as recorded; intended locality verified | Rename to Oral | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Kazakhstan | Oskemen (Ust-Kamenogorsk) | No, not as recorded; intended locality verified | Rename to Oskemen | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Kazakhstan | Pavlodar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Petropavl | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Semey | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Shymkent | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Taraz | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Kazakhstan | Turkistan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Lao People's Democratic Republic | Luang Prabang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Lao People's Democratic Republic | Pakse | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Lao People's Democratic Republic | Savannakhet | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Lao People's Democratic Republic | Vientiane | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Lebanon | Beirut | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Saint Lucia | George F. L. Charles | No, not as recorded; intended locality verified | Rename to Castries | Current label is not a populated place; OurAirports municipality Castries is an independently verified same-country populated place. |
| Saint Lucia | Hewanorra | No, not as recorded; intended locality verified | Rename to Vieux Fort | Current label is not a populated place; OurAirports municipality Vieux Fort is an independently verified same-country populated place. |
| Liechtenstein | Vaduz | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sri Lanka | Batticaloa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sri Lanka | Colombo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sri Lanka | Hambantota | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sri Lanka | Jaffna | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sri Lanka | Katunayake (Colombo) | No, not as recorded; intended locality verified | Rename to Katunayake | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Liberia | Roberts | No, not as recorded; intended locality verified | Rename to Monrovia | Current label is not a populated place; OurAirports municipality Monrovia is an independently verified same-country populated place. |
| Lesotho | Moshoeshoe I | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Maseru(Mazenod) is not independently verified as a GeoNames populated place. |
| Lithuania | Kaunas | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Lithuania | Palanga | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Lithuania | Vilnius | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Luxembourg | Luxembourg | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Latvia | Riga | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Libya | Benina | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Benina is not independently verified as a GeoNames populated place. |
| Libya | Misrata | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Libya | Mitiga | No, not as recorded; intended locality verified | Rename to Tripoli | Current label is not a populated place; OurAirports municipality Tripoli is an independently verified same-country populated place. |
| Libya | Sebha | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Morocco | Agadir–Al Massira | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Morocco | Dakhla | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Morocco | Fès–Saïs | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Morocco | Hassan I | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Morocco | Marrakesh Menara | No, not as recorded; intended locality verified | Rename to Marrakesh | Current label is not a populated place; OurAirports municipality Marrakesh is an independently verified same-country populated place. |
| Morocco | Mohammed V | No, not as recorded; intended locality verified | Rename to Casablanca | Current label is not a populated place; OurAirports municipality Casablanca is an independently verified same-country populated place. |
| Morocco | Nador Al Aaroui | No, not as recorded; intended locality verified | Rename to Al Aaroui | Current label is not a populated place; OurAirports municipality Al Aaroui is an independently verified same-country populated place. |
| Morocco | Ouarzazate | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Morocco | Oujda Angads | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Ahl Angad is not independently verified as a GeoNames populated place. |
| Morocco | Rabat–Salé | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Morocco | Tangier Ibn Battouta | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Monaco | Monaco | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Moldova, Republic of | Chișinău | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Montenegro | Podgorica | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Montenegro | Tivat | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Madagascar | Amborovy | No, not as recorded; intended locality verified | Rename to Mahajanga | Current label is not a populated place; OurAirports municipality Mahajanga is an independently verified same-country populated place. |
| Madagascar | Arrachart | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Antisiranana is not independently verified as a GeoNames populated place. |
| Madagascar | Fascene | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Madagascar | Ivato | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Madagascar | Marillac | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Madagascar | Toamasina Ambalamanasy | No, not as recorded; intended locality verified | Rename to Toamasina | Current label is not a populated place; OurAirports municipality Toamasina is an independently verified same-country populated place. |
| Marshall Islands | Bucholz Army Airfield | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Marshall Islands | Marshall Islands | No, not as recorded; intended locality verified | Rename to Majuro | Airport article locates it in Majuro; Majuro is the capital and a same-country populated city. |
| The Republic of North Macedonia | Ohrid St. Paul the Apostle | No, not as recorded; intended locality verified | Rename to Ohrid | Current label is not a populated place; OurAirports municipality Ohrid is an independently verified same-country populated place. |
| The Republic of North Macedonia | Skopje | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mali | Gao | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mali | Kayes | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mali | Modibo Keita | No, not as recorded; intended locality verified | Rename to Bamako | Current label is not a populated place; OurAirports municipality Bamako is an independently verified same-country populated place. |
| Mali | Mopti Ambodedjo | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Myanmar | Bagan (Nyaung U) | Not verified; held for manual review | Retain in database; exclude from Big Cities | Profile describes a regional/archaeological area; requires source review to choose Bagan or Nyaung U. |
| Myanmar | Dawei | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Myanmar | Heho | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Myanmar | Kawthaung | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Myanmar | Mandalay | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Myanmar | Mawlamyine | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Myanmar | Naypyidaw | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Myanmar | Sittwe | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Myanmar | Thandwe (Ngapali) | No, not as recorded; intended locality verified | Rename to Thandwe | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Myanmar | Yangon | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mongolia | Choibalsan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mongolia | Khovd | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mongolia | Mörön | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mongolia | Ölgii | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mongolia | Ulaanbaatar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mongolia | Ulaanbaatar (Sergelen, Töv Province) | No; duplicate record | Remove duplicate; merge into Ulaanbaatar (mn-ulaanbaatar) | Airport-location duplicate; profile explicitly says it serves Ulaanbaatar and to see the existing Ulaanbaatar entry. |
| Mauritania | Nouadhibou | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mauritania | Nouakchott–Oumtounsy | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Malta | Malta | No, not as recorded; intended locality verified | Rename to Luqa | Malta International Airport is physically in Luqa; Luqa is a recognized town. |
| Mauritius | Sir Seewoosagur Ramgoolam | No, not as recorded; intended locality verified | Rename to Plaine Magnien | Current label is not a populated place; OurAirports municipality Plaine Magnien is an independently verified same-country populated place. |
| Maldives | Gan (Addu City) | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Maldives | Hanimaadhoo | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Maldives | Maafaru | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Maldives | Maamigili | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Maldives | Malé (Hulhulé Island) | No, not as recorded; intended locality verified | Rename to Malé | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Malawi | Chileka | No, not as recorded; intended locality verified | Rename to Blantyre | Current label is not a populated place; OurAirports municipality Blantyre is an independently verified same-country populated place. |
| Malawi | Kamuzu | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Lumbadzi is not independently verified as a GeoNames populated place. |
| Mexico | Abraham González | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | Ángel Albino Corzo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | Bajío | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | Cancún | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | Carlos Rovirosa Pérez | No, not as recorded; intended locality verified | Rename to Villahermosa | Current label is not a populated place; OurAirports municipality Villahermosa is an independently verified same-country populated place. |
| Mexico | Cozumel | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | Don Miguel Hidalgo y Costilla | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Mexico | Federal de Bachigualato | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Mexico | Felipe Ángeles | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | Francisco Sarabia | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | General Abelardo L. Rodríguez | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Mexico | General Francisco J. Mujica | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | General Francisco Javier Mina | No, not as recorded; intended locality verified | Rename to Ciudad Madero | Current label is not a populated place; OurAirports municipality Ciudad Madero is an independently verified same-country populated place. |
| Mexico | General Heriberto Jara | No, not as recorded; intended locality verified | Rename to Veracruz | Current label is not a populated place; OurAirports municipality Veracruz is an independently verified same-country populated place. |
| Mexico | General Ignacio Pesqueira García | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Mexico | General Juan N. Álvarez | No, not as recorded; intended locality verified | Rename to Acapulco | Current label is not a populated place; OurAirports municipality Acapulco is an independently verified same-country populated place. |
| Mexico | General Leobardo C. Ruiz | No, not as recorded; intended locality verified | Rename to Zacatecas | Current label is not a populated place; OurAirports municipality Zacatecas is an independently verified same-country populated place. |
| Mexico | General Lucio Blanco | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | General Mariano Escobedo | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Mexico | General Rafael Buelna | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality MazatlÃ n is not independently verified as a GeoNames populated place. |
| Mexico | General Roberto Fierro Villalobos | No, not as recorded; intended locality verified | Rename to Chihuahua | Current label is not a populated place; OurAirports municipality Chihuahua is an independently verified same-country populated place. |
| Mexico | General Rodolfo Sánchez Taboada | No, not as recorded; intended locality verified | Rename to Mexicali | Current label is not a populated place; OurAirports municipality Mexicali is an independently verified same-country populated place. |
| Mexico | Hermanos Serdán | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Mexico | Huatulco | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | Ixtapa-Zihuatanejo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | Lic. Adolfo López Mateos | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Mexico | Lic. Gustavo Díaz Ordaz | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Mexico | Lic. Jesús Terán Peredo | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Mexico | Loreto | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | Los Cabos | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality San JosÃ© del Cabo is not independently verified as a GeoNames populated place. |
| Mexico | Manuel Crescencio Rejón | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Mexico | Manuel Márquez de León | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Mexico | Mexico City | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | Playa de Oro | No, not as recorded; intended locality verified | Rename to Manzanillo | Current label is not a populated place; OurAirports municipality Manzanillo is an independently verified same-country populated place. |
| Mexico | Ponciano Arriaga | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | Puerto Escondido | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | Querétaro Intercontinental | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Mexico | Tapachula | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mexico | Xoxocotlán | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Bintulu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Ipoh | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Johor Bahru | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Kota Bharu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Kota Kinabalu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Kuala Terengganu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Kuching | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Labuan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Langkawi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Miri | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Penang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Sepang (Kuala Lumpur) | No, not as recorded; intended locality verified | Rename to Sepang | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Malaysia | Sibu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Subang Jaya | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Malaysia | Tawau | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mozambique | Beira | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mozambique | Maputo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mozambique | Nampula | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mozambique | Pemba | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Mozambique | Vilankulo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Namibia | Hosea Kutako | No, not as recorded; intended locality verified | Rename to Windhoek | Current label is not a populated place; OurAirports municipality Windhoek is an independently verified same-country populated place. |
| Namibia | Walvis Bay | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Niger | Diori Hamani | No, not as recorded; intended locality verified | Rename to Niamey | Current label is not a populated place; OurAirports municipality Niamey is an independently verified same-country populated place. |
| Nigeria | Akanu Ibiam | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Enegu is not independently verified as a GeoNames populated place. |
| Nigeria | Mallam Aminu Kano | No, not as recorded; intended locality verified | Rename to Kano | Current label is not a populated place; OurAirports municipality Kano is an independently verified same-country populated place. |
| Nigeria | Murtala Muhammed | No, not as recorded; intended locality verified | Rename to Lagos | Current label is not a populated place; OurAirports municipality Lagos is an independently verified same-country populated place. |
| Nigeria | Nnamdi Azikiwe | No, not as recorded; intended locality verified | Rename to Abuja | Current label is not a populated place; OurAirports municipality Abuja is an independently verified same-country populated place. |
| Nigeria | Port Harcourt | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Nigeria | Sam Mbakwe Cargo | No, not as recorded; intended locality verified | Rename to Owerri | Current label is not a populated place; OurAirports municipality Owerri is an independently verified same-country populated place. |
| Nigeria | Umaru Musa Yar'Adua | No, not as recorded; intended locality verified | Rename to Katsina | Current label is not a populated place; OurAirports municipality Katsina is an independently verified same-country populated place. |
| Nicaragua | Augusto C. Sandino | No, not as recorded; intended locality verified | Rename to Managua | Current label is not a populated place; OurAirports municipality Managua is an independently verified same-country populated place. |
| Netherlands | Amsterdam Schiphol | No, not as recorded; intended locality verified | Rename to Amsterdam | Current label is not a populated place; OurAirports municipality Amsterdam is an independently verified same-country populated place. |
| Netherlands | Eindhoven | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Netherlands | Groningen Eelde | No, not as recorded; intended locality verified | Rename to Groningen | Current label is not a populated place; OurAirports municipality Groningen is an independently verified same-country populated place. |
| Netherlands | Maastricht Aachen | No, not as recorded; intended locality verified | Rename to Maastricht | Current label is not a populated place; OurAirports municipality Maastricht is an independently verified same-country populated place. |
| Netherlands | Rotterdam The Hague | No, not as recorded; intended locality verified | Rename to Rotterdam | Current label is not a populated place; OurAirports municipality Rotterdam is an independently verified same-country populated place. |
| Norway | Ålesund , Vigra | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Norway | Alta | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Norway | Bergen , Flesland | No, not as recorded; intended locality verified | Rename to Bergen | Current label is not a populated place; OurAirports municipality Bergen is an independently verified same-country populated place. |
| Norway | Bodø | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Norway | Brønnøysund , Brønnøy | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Norway | Florø | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Norway | Harstad/Narvik , Evenes | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Norway | Haugesund , Karmøy | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Norway | Kirkenes , Høybuktmoen | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Norway | Kristiansand , Kjevik | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Norway | Kristiansund , Kvernberget | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Kvernberget is not independently verified as a GeoNames populated place. |
| Norway | Lakselv , Banak | No, not as recorded; intended locality verified | Rename to Lakselv | Current label is not a populated place; OurAirports municipality Lakselv is an independently verified same-country populated place. |
| Norway | Leknes | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Norway | Mo i Rana , Røssvoll | No, not as recorded; intended locality verified | Rename to Mo i Rana | Current label is not a populated place; OurAirports municipality Mo i Rana is an independently verified same-country populated place. |
| Norway | Molde , Årø | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Norway | Oslo , Gardermoen | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Oslo (Gardermoen) is not independently verified as a GeoNames populated place. |
| Norway | Rørvik , Ryum | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Norway | Sandefjord , Torp | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Sandefjord(Torp) is not independently verified as a GeoNames populated place. |
| Norway | Sandnessjøen , Stokka | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Norway | Stavanger , Sola | No, not as recorded; intended locality verified | Rename to Stavanger | Current label is not a populated place; OurAirports municipality Stavanger is an independently verified same-country populated place. |
| Norway | Stokmarknes , Skagen | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Hadsel is not independently verified as a GeoNames populated place. |
| Norway | Svalbard , Longyear | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Longyearbyen is not independently verified as a GeoNames populated place. |
| Norway | Svolvær , Helle | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Norway | Tromsø , Langnes | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Norway | Trondheim , Værnes | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Nepal | Bhairahawa (Siddharthanagar) | No, not as recorded; intended locality verified | Rename to Bhairahawa | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Nepal | Kathmandu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Nepal | Pokhara | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Nauru | Nauru | No; placeholder/country label | Remove; no city replacement established | Nauru is a country, not a city; the airport is in Yaren District and Nauru has no formal cities. |
| New Zealand | Auckland | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| New Zealand | Bay of Islands | No, not as recorded; intended locality verified | Rename to Kawakawa | Current label is not a populated place; OurAirports municipality Kawakawa is an independently verified same-country populated place. |
| New Zealand | Christchurch | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| New Zealand | Dunedin | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| New Zealand | Gisborne | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| New Zealand | Hamilton | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| New Zealand | Hawke's Bay | No, not as recorded; intended locality verified | Rename to Napier | Current label is not a populated place; OurAirports municipality Napier is an independently verified same-country populated place. |
| New Zealand | Invercargill | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| New Zealand | Marlborough | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| New Zealand | Nelson | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| New Zealand | New Plymouth | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| New Zealand | Palmerston North | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| New Zealand | Queenstown | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| New Zealand | Rotorua | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| New Zealand | Taupō | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| New Zealand | Wellington | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| New Zealand | Whangārei | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Oman | Duqm | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Oman | Muscat | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Oman | Salalah | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Oman | Sohar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Panama | Bocas del Toro “Isla Colón” | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Panama | Enrique Malek | No, not as recorded; intended locality verified | Rename to David | Current label is not a populated place; OurAirports municipality David is an independently verified same-country populated place. |
| Panama | Tocumen | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Peru | Arequipa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Peru | Chiclayo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Peru | Cusco | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Peru | Iquitos | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Peru | Lima | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Peru | Trujillo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Papua New Guinea | Goroka | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Papua New Guinea | Jacksons | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Papua New Guinea | Kavieng | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Papua New Guinea | Lae Nadzab | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Papua New Guinea | Madang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Papua New Guinea | Mount Hagen | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Papua New Guinea | Rabaul | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Papua New Guinea | Tabubil | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Papua New Guinea | Vanimo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Papua New Guinea | Wewak | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Philippines | Angeles (Clark, Pampanga) | No, not as recorded; intended locality verified | Rename to Angeles City | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Philippines | Davao City | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Philippines | Iloilo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Philippines | Kalibo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Philippines | Laoag | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Philippines | Lapu-Lapu (Cebu) | No, not as recorded; intended locality verified | Rename to Lapu-Lapu City | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Philippines | Manila | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Philippines | Puerto Princesa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Philippines | Zamboanga City | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Pakistan | Faisalabad | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Pakistan | Islamabad | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Pakistan | Karachi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Pakistan | Lahore | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Pakistan | Multan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Pakistan | Peshawar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Pakistan | Quetta | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Pakistan | Rawalpindi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Pakistan | Sialkot | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Poland | Bydgoszcz Ignacy Jan Paderewski | No, not as recorded; intended locality verified | Rename to Bydgoszcz | Current label is not a populated place; OurAirports municipality Bydgoszcz is an independently verified same-country populated place. |
| Poland | Gdańsk Lech Wałęsa | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Poland | John Paul II Kraków-Balice | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Poland | Katowice | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Poland | Łódź Władysław Reymont | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Poland | Lublin | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Poland | Olsztyn-Mazury | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Szymany is not independently verified as a GeoNames populated place. |
| Poland | Poznań–Ławica | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Poland | Rzeszów–Jasionka | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Poland | Solidarity Szczecin–Goleniów | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Poland | Warsaw Chopin | No, not as recorded; intended locality verified | Rename to Warsaw | Current label is not a populated place; OurAirports municipality Warsaw is an independently verified same-country populated place. |
| Poland | Warsaw Modlin | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Nowy DwÃ³r Mazowiecki is not independently verified as a GeoNames populated place. |
| Poland | Warsaw Radom | No, not as recorded; intended locality verified | Rename to Radom | Current label is not a populated place; OurAirports municipality Radom is an independently verified same-country populated place. |
| Poland | Wrocław | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Poland | Zielona Góra | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Portugal | Beja | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Portugal | Cristiano Ronaldo Madeira | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Portugal | Faro | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Portugal | Francisco Sá Carneiro | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Portugal | Horta | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Portugal | Humberto Delgado | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Portugal | João Paulo II | No, not as recorded; intended locality verified | Rename to Ponta Delgada | Current label is not a populated place; OurAirports municipality Ponta Delgada is an independently verified same-country populated place. |
| Portugal | Lajes | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Portugal | Porto Santo | No, not as recorded; intended locality verified | Rename to Vila Baleira | Current label is not a populated place; OurAirports municipality Vila Baleira is an independently verified same-country populated place. |
| Portugal | Santa Maria | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Palau | Roman Tmetuchl | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Babelthuap Island is not independently verified as a GeoNames populated place. |
| Paraguay | Asunción | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Paraguay | Ciudad del Este | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Paraguay | Encarnación | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Paraguay | San Lorenzo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Qatar | Doha | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Romania | Arad | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Romania | Aurel Vlaicu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Romania | Avram Iancu Cluj | No, not as recorded; intended locality verified | Rename to Cluj-Napoca | Current label is not a populated place; OurAirports municipality Cluj-Napoca is an independently verified same-country populated place. |
| Romania | Brașov-Ghimbav | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Romania | Craiova | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Romania | George Enescu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Romania | Henri Coandă | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Romania | Iași | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Romania | Maramureș | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Romania | Mihail Kogălniceanu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Romania | Oradea | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Romania | Satu Mare | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Romania | Sibiu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Romania | Suceava | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Romania | Târgu Mureș | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Romania | Timișoara Traian Vuia | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality TimiÅoara is not independently verified as a GeoNames populated place. |
| Serbia | Belgrade Nikola Tesla | No, not as recorded; intended locality verified | Rename to Belgrade | Current label is not a populated place; OurAirports municipality Belgrade is an independently verified same-country populated place. |
| Serbia | Morava | No, not as recorded; intended locality verified | Rename to Kraljevo | Current label is not a populated place; OurAirports municipality Kraljevo is an independently verified same-country populated place. |
| Serbia | Niš Constantine the Great | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality NiÅ¡ is not independently verified as a GeoNames populated place. |
| Russian Federation | Irkutsk | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Russian Federation | Kaliningrad | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Russian Federation | Kazan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Russian Federation | Krasnoyarsk | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Russian Federation | Mineralnye Vody | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Russian Federation | Moscow | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Russian Federation | Novosibirsk | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Russian Federation | Saint Petersburg | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Russian Federation | Samara | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Russian Federation | Sochi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Russian Federation | Ufa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Russian Federation | Vladivostok | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Russian Federation | Yekaterinburg | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Rwanda | Kigali | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Saudi Arabia | Abha | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Saudi Arabia | Dammam | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Saudi Arabia | Jeddah | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Saudi Arabia | Madinah | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Saudi Arabia | Riyadh | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Saudi Arabia | Taif | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Solomon Islands | Honiara | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Seychelles | Seychelles | No, not as recorded; intended locality verified | Rename to Victoria | The airport municipality crosswalk identifies Victoria; Victoria is the capital and a populated locality. |
| Sudan | Khartoum | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sudan | Port Sudan New | No, not as recorded; intended locality verified | Rename to Port Sudan | Current label is not a populated place; OurAirports municipality Port Sudan is an independently verified same-country populated place. |
| Sweden | Ängelholm–Helsingborg | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Sweden | Åre Östersund | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Sweden | Arvidsjaur | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Dala | No, not as recorded; intended locality verified | Rename to Borlange | Current label is not a populated place; OurAirports municipality Borlange is an independently verified same-country populated place. |
| Sweden | Gällivare Lapland | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Sweden | Göteborg Landvetter | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Sweden | Halmstad City | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Sweden | Hemavan | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Hemavan is not independently verified as a GeoNames populated place. |
| Sweden | Jönköping | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Kalmar Öland | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Sweden | Karlstad | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Kiruna | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Linköping City | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Sweden | Luleå | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Malmö | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Norrköping | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Örebro | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Örnsköldsvik | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Pajala | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Ronneby | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Skellefteå | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Stockholm Arlanda | No, not as recorded; intended locality verified | Rename to Stockholm | Current label is not a populated place; OurAirports municipality Stockholm is an independently verified same-country populated place. |
| Sweden | Stockholm Bromma | No; duplicate record | Remove duplicate; merge into Stockholm (se-stockholm-arlanda-airport) | Duplicate airport-derived Stockholm entry; retain one Stockholm locality record. |
| Sweden | Stockholm Skavsta | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality NykÃ¶ping is not independently verified as a GeoNames populated place. |
| Sweden | Sundsvall Timrå | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Sweden | Umeå | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Växjö Småland | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Sweden | Vilhelmina | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sweden | Visby | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Singapore | Singapore | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Slovenia | Ljubljana Jože Pučnik | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Slovenia | Maribor Edvard Rusjan | No, not as recorded; intended locality verified | Rename to Maribor | Current label is not a populated place; OurAirports municipality Maribor is an independently verified same-country populated place. |
| Slovenia | Portorož | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Slovakia | Bratislava | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Slovakia | Košice | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Slovakia | Poprad-Tatry | No, not as recorded; intended locality verified | Rename to Poprad | Current label is not a populated place; OurAirports municipality Poprad is an independently verified same-country populated place. |
| Sierra Leone | Freetown | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| San Marino | San Marino | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Senegal | Blaise Diagne | No, not as recorded; intended locality verified | Rename to Dakar | Current label is not a populated place; OurAirports municipality Dakar is an independently verified same-country populated place. |
| Somalia | Aden Adde | No, not as recorded; intended locality verified | Rename to Mogadishu | Current label is not a populated place; OurAirports municipality Mogadishu is an independently verified same-country populated place. |
| Somalia | Berbera | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Somalia | Egal | No, not as recorded; intended locality verified | Rename to Hargeisa | Current label is not a populated place; OurAirports municipality Hargeisa is an independently verified same-country populated place. |
| Suriname | Lelydorp | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Suriname | Nieuw Nickerie | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Suriname | Paramaribo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| South Sudan | Juba | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Sao Tome and Principe | São Tomé | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| El Salvador | El Salvador Saint Óscar Arnulfo Romero y Galdámez | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality San Salvador (San Luis Talpa) is not independently verified as a GeoNames populated place. |
| El Salvador | Ilopango | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Syrian Arab Republic | Aleppo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Syrian Arab Republic | Damascus | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Syrian Arab Republic | Deir ez-Zor | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Syrian Arab Republic | Latakia | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Syrian Arab Republic | Qamishli | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Eswatini | King Mswati III | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Mpaka is not independently verified as a GeoNames populated place. |
| Chad | Hassan Djamous | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Togo | Lomé–Tokoin | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Thailand | Bangkok | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Thailand | Chiang Mai | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Thailand | Chiang Rai | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Thailand | Hat Yai | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Thailand | Khon Kaen | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Thailand | Ko Samui | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Thailand | Krabi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Thailand | Phuket | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Thailand | Rayong | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Thailand | Surat Thani | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Thailand | Ubon Ratchathani | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Thailand | Udon Thani | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Tajikistan | Bokhtar | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Tajikistan | Dushanbe | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Tajikistan | Khujand | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Tajikistan | Kulob | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Timor-Leste | Dili | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Turkmenistan | Ashgabat | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Turkmenistan | Dashoguz | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Turkmenistan | Kerki | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Turkmenistan | Mary | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Turkmenistan | Turkmenabat | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Turkmenistan | Turkmenbashi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Tunisia | Djerba–Zarzis | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Mellita is not independently verified as a GeoNames populated place. |
| Tunisia | Enfidha–Hammamet | No, not as recorded; intended locality verified | Rename to Enfidha | Current label is not a populated place; OurAirports municipality Enfidha is an independently verified same-country populated place. |
| Tunisia | Monastir Habib Bourguiba | No, not as recorded; intended locality verified | Rename to Monastir | Current label is not a populated place; OurAirports municipality Monastir is an independently verified same-country populated place. |
| Tunisia | Tunis–Carthage | No, not as recorded; intended locality verified | Rename to Tunis | Current label is not a populated place; OurAirports municipality Tunis is an independently verified same-country populated place. |
| Tonga | Fua'amotu | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Türkiye | Adana | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Türkiye | Ankara | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Türkiye | Antalya | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Türkiye | Diyarbakır | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Türkiye | Erzurum | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Türkiye | Gaziantep | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Türkiye | Hatay | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Türkiye | Istanbul | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Türkiye | İzmir | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Türkiye | Kayseri | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Türkiye | Mersin/Adana region | Not verified; held for manual review | Retain in database; exclude from Big Cities | Explicitly a region containing separate cities; choosing Mersin or Adana would be a guess. |
| Türkiye | Muğla (Bodrum) | No, not as recorded; intended locality verified | Rename to Bodrum | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Türkiye | Muğla (Dalaman) | No, not as recorded; intended locality verified | Rename to Dalaman | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Türkiye | Trabzon | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Türkiye | Van | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Trinidad and Tobago | A. N. R. Robinson | No, not as recorded; intended locality verified | Rename to Scarborough | Current label is not a populated place; OurAirports municipality Scarborough is an independently verified same-country populated place. |
| Trinidad and Tobago | Piarco | No, not as recorded; intended locality verified | Rename to Port of Spain | Current label is not a populated place; OurAirports municipality Port of Spain is an independently verified same-country populated place. |
| Tuvalu | Funafuti | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United Republic of Tanzania | Abeid Amani Karume | No, not as recorded; intended locality verified | Rename to Zanzibar | Current label is not a populated place; OurAirports municipality Zanzibar is an independently verified same-country populated place. |
| United Republic of Tanzania | Julius Nyerere | No, not as recorded; intended locality verified | Rename to Dar es Salaam | Current label is not a populated place; OurAirports municipality Dar es Salaam is an independently verified same-country populated place. |
| United Republic of Tanzania | Kilimanjaro | No, not as recorded; intended locality verified | Rename to Arusha | Current label is not a populated place; OurAirports municipality Arusha is an independently verified same-country populated place. |
| United Republic of Tanzania | Mwanza | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Ukraine | Kyiv | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uganda | Entebbe | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Albuquerque International Sunport | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| United States of America | Austin–Bergstrom | No, not as recorded; intended locality verified | Rename to Austin | Current label is not a populated place; OurAirports municipality Austin is an independently verified same-country populated place. |
| United States of America | Baltimore/Washington Thurgood Marshall | No, not as recorded; intended locality verified | Rename to Baltimore | Current label is not a populated place; OurAirports municipality Baltimore is an independently verified same-country populated place. |
| United States of America | Boston Logan | No, not as recorded; intended locality verified | Rename to Boston | Current label is not a populated place; OurAirports municipality Boston is an independently verified same-country populated place. |
| United States of America | Buffalo Niagara | No, not as recorded; intended locality verified | Rename to Buffalo | Current label is not a populated place; OurAirports municipality Buffalo is an independently verified same-country populated place. |
| United States of America | Charleston | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Charlotte Douglas | No, not as recorded; intended locality verified | Rename to Charlotte | Current label is not a populated place; OurAirports municipality Charlotte is an independently verified same-country populated place. |
| United States of America | Cincinnati/Northern Kentucky | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Cincinnati / Covington is not independently verified as a GeoNames populated place. |
| United States of America | Cleveland Hopkins | No, not as recorded; intended locality verified | Rename to Cleveland | Current label is not a populated place; OurAirports municipality Cleveland is an independently verified same-country populated place. |
| United States of America | Dallas/Fort Worth | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Dallas-Fort Worth is not independently verified as a GeoNames populated place. |
| United States of America | Daniel K. Inouye | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Honolulu, Oahu is not independently verified as a GeoNames populated place. |
| United States of America | Denver | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Detroit Metropolitan Wayne County | No, not as recorded; intended locality verified | Rename to Detroit | Current label is not a populated place; OurAirports municipality Detroit is an independently verified same-country populated place. |
| United States of America | Eppley Airfield | No, not as recorded; intended locality verified | Rename to Omaha | Current label is not a populated place; OurAirports municipality Omaha is an independently verified same-country populated place. |
| United States of America | Fort Lauderdale–Hollywood | No, not as recorded; intended locality verified | Rename to Fort Lauderdale | Current label is not a populated place; OurAirports municipality Fort Lauderdale is an independently verified same-country populated place. |
| United States of America | George Bush Intercontinental | No, not as recorded; intended locality verified | Rename to Houston | Current label is not a populated place; OurAirports municipality Houston is an independently verified same-country populated place. |
| United States of America | Harry Reid | No, not as recorded; intended locality verified | Rename to Las Vegas | Current label is not a populated place; OurAirports municipality Las Vegas is an independently verified same-country populated place. |
| United States of America | Hartsfield–Jackson Atlanta | No, not as recorded; intended locality verified | Rename to Atlanta | Current label is not a populated place; OurAirports municipality Atlanta is an independently verified same-country populated place. |
| United States of America | Indianapolis | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Jacksonville | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | John F. Kennedy | No, not as recorded; intended locality verified | Rename to New York | Current label is not a populated place; OurAirports municipality New York is an independently verified same-country populated place. |
| United States of America | John Glenn Columbus | No, not as recorded; intended locality verified | Rename to Columbus | Current label is not a populated place; OurAirports municipality Columbus is an independently verified same-country populated place. |
| United States of America | Kahului | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Kansas City | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Los Angeles | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Louis Armstrong New Orleans | No, not as recorded; intended locality verified | Rename to New Orleans | Current label is not a populated place; OurAirports municipality New Orleans is an independently verified same-country populated place. |
| United States of America | Louisville Muhammad Ali | No, not as recorded; intended locality verified | Rename to Louisville | Current label is not a populated place; OurAirports municipality Louisville is an independently verified same-country populated place. |
| United States of America | Memphis | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Miami | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Milwaukee Mitchell | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| United States of America | Minneapolis–Saint Paul | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| United States of America | Nashville | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Newark Liberty | No, not as recorded; intended locality verified | Rename to Newark | Current label is not a populated place; OurAirports municipality Newark is an independently verified same-country populated place. |
| United States of America | Norfolk | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Norman Y. Mineta San José | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| United States of America | O'Hare | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| United States of America | Oakland San Francisco Bay | No, not as recorded; intended locality verified | Rename to Oakland | Current label is not a populated place; OurAirports municipality Oakland is an independently verified same-country populated place. |
| United States of America | Ontario | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Orlando | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Orlando Sanford | No; duplicate record | Remove duplicate; merge into Orlando (us-orlando-international-airport) | Duplicate airport-named Orlando entry; retain the existing verified Orlando record. |
| United States of America | Palm Beach | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Philadelphia | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Phoenix Sky Harbor | No, not as recorded; intended locality verified | Rename to Phoenix | Current label is not a populated place; OurAirports municipality Phoenix is an independently verified same-country populated place. |
| United States of America | Piedmont Triad | No, not as recorded; intended locality verified | Rename to Greensboro | Current label is not a populated place; OurAirports municipality Greensboro is an independently verified same-country populated place. |
| United States of America | Pittsburgh | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Portland | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Raleigh-Durham | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Raleigh/Durham is not independently verified as a GeoNames populated place. |
| United States of America | Richmond | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Sacramento | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Salt Lake City | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | San Antonio | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | San Diego | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | San Francisco | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Sarasota-Bradenton | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Sarasota/Bradenton is not independently verified as a GeoNames populated place. |
| United States of America | Savannah/Hilton Head | No, not as recorded; intended locality verified | Rename to Savannah | Current label is not a populated place; OurAirports municipality Savannah is an independently verified same-country populated place. |
| United States of America | Seattle–Tacoma | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| United States of America | Southwest Florida | No, not as recorded; intended locality verified | Rename to Fort Myers | Current label is not a populated place; OurAirports municipality Fort Myers is an independently verified same-country populated place. |
| United States of America | St. Louis Lambert | No, not as recorded; intended locality verified | Rename to St Louis | Current label is not a populated place; OurAirports municipality St Louis is an independently verified same-country populated place. |
| United States of America | Tampa | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| United States of America | Ted Stevens Anchorage | No, not as recorded; intended locality verified | Rename to Anchorage | Current label is not a populated place; OurAirports municipality Anchorage is an independently verified same-country populated place. |
| United States of America | Washington Dulles | No, not as recorded; intended locality verified | Rename to Dulles | Current label is not a populated place; OurAirports municipality Dulles is an independently verified same-country populated place. |
| Uruguay | Montevideo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uruguay | Paysandú | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uruguay | Rivera | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uruguay | Salto | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uzbekistan | Andijan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uzbekistan | Bukhara | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uzbekistan | Fergana | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uzbekistan | Karshi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uzbekistan | Namangan | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uzbekistan | Navoi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uzbekistan | Nukus | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uzbekistan | Samarkand | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uzbekistan | Tashkent | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uzbekistan | Termez | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Uzbekistan | Urgench | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Holy See (Vatican City State) | Vatican City | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Saint Vincent and the Grenadines | Argyle | No, not as recorded; intended locality verified | Rename to Kingstown | Current label is not a populated place; OurAirports municipality Kingstown is an independently verified same-country populated place. |
| Venezuela | Barquisimeto | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Venezuela | Caracas | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Venezuela | Ciudad Guayana | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Venezuela | Maracaibo | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Venezuela | Maracay | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Venezuela | Valencia | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Vietnam | Can Tho | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Vietnam | Da Lat | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Vietnam | Da Nang | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Vietnam | Hai Phong | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Vietnam | Hanoi | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Vietnam | Ho Chi Minh City | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Vietnam | Hue | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Vietnam | Nha Trang (Khanh Hoa) | No, not as recorded; intended locality verified | Rename to Nha Trang | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Vietnam | Phu Quoc Island | No, not as recorded; intended locality verified | Rename to Phu Quoc | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Vietnam | Van Don (Quang Ninh) | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Vietnam | Vinh | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Vanuatu | Bauerfield | No, not as recorded; intended locality verified | Rename to Port Vila | Current label is not a populated place; OurAirports municipality Port Vila is an independently verified same-country populated place. |
| Vanuatu | Santo-Pekoa | No, not as recorded; intended locality verified | Rename to Luganville | Current label is not a populated place; OurAirports municipality Luganville is an independently verified same-country populated place. |
| Samoa | Faleolo | No, not as recorded; intended locality verified | Rename to Apia | Current label is not a populated place; OurAirports municipality Apia is an independently verified same-country populated place. |
| Yemen | Aden | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Yemen | Al Ghaydah (Al Mahrah) | No, not as recorded; intended locality verified | Rename to Al Ghaydah | Name includes a facility, island, region, or service note; the corrected same-country populated locality is supported by GeoNames and geographic context. |
| Yemen | Mukalla | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Yemen | Sana'a | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| Yemen | Seiyun (Hadhramaut) | Not verified; held for manual review | Retain in database; exclude from Big Cities | No exact same-country populated-place match or verified airport municipality was found. |
| Yemen | Socotra Island | Not verified; held for manual review | Retain in database; exclude from Big Cities | Island/region label; the record does not identify a specific town on Socotra. |
| South Africa | Bram Fischer | No, not as recorded; intended locality verified | Rename to Bloemfontein | Current label is not a populated place; OurAirports municipality Bloemfontein is an independently verified same-country populated place. |
| South Africa | Cape Town | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |
| South Africa | Chief Dawid Stuurman | Not verified; held for manual review | Retain in database; exclude from Big Cities | Airport municipality Gqeberha (Port Elizabeth) is not independently verified as a GeoNames populated place. |
| South Africa | King Phalo | No, not as recorded; intended locality verified | Rename to East London | Current label is not a populated place; OurAirports municipality East London is an independently verified same-country populated place. |
| South Africa | King Shaka | No, not as recorded; intended locality verified | Rename to Durban | Current label is not a populated place; OurAirports municipality Durban is an independently verified same-country populated place. |
| South Africa | O. R. Tambo | No, not as recorded; intended locality verified | Rename to Johannesburg | Current label is not a populated place; OurAirports municipality Johannesburg is an independently verified same-country populated place. |
| Zambia | Harry Mwanga Nkumbula | No, not as recorded; intended locality verified | Rename to Livingstone | Current label is not a populated place; OurAirports municipality Livingstone is an independently verified same-country populated place. |
| Zambia | Kenneth Kaunda | No, not as recorded; intended locality verified | Rename to Lusaka | Current label is not a populated place; OurAirports municipality Lusaka is an independently verified same-country populated place. |
| Zambia | Simon Mwansa Kapwepwe | No, not as recorded; intended locality verified | Rename to Ndola | Current label is not a populated place; OurAirports municipality Ndola is an independently verified same-country populated place. |
| Zimbabwe | Joshua Mqabuko Nkomo | No, not as recorded; intended locality verified | Rename to Bulawayo | Current label is not a populated place; OurAirports municipality Bulawayo is an independently verified same-country populated place. |
| Zimbabwe | Robert Gabriel Mugabe | No, not as recorded; intended locality verified | Rename to Harare | Current label is not a populated place; OurAirports municipality Harare is an independently verified same-country populated place. |
| Zimbabwe | Victoria Falls | Yes | Keep | Current name matches a GeoNames populated place in the same ISO country. |

## Final Assertions

- GET /cities returns 976 rows, matching the database verification flag.
- A. N. R. Robinson is no longer a City display name; its verified municipality is Scarborough, Trinidad and Tobago. The original slug remains as the stable record key.
- Duplicate verified country/name pairs: 0 (checked after correction).
- Existing city profile image fields were not rewritten. Where duplicate city rows were merged, the row with the existing image/profile or event linkage was retained.
- Linked event preserved: the one event associated with the Ulaanbaatar airport duplicate was reassigned to the existing Ulaanbaatar slug before duplicate removal.

- Backend build and frontend build are recorded in the completion summary after the final verification run.

