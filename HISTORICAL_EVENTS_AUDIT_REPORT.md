# Historical Events country-by-country audit

**Audit date:** 15 October 2026  
**Scope:** read-only inspection of live PostgreSQL database, backend `/events` and `/countries` APIs, importer scripts, frontend country page, and per-country event rows.

## Summary

- Supported countries inspected: **195**.
- Database event rows inspected: **1,135** (951 enabled and exposed by public `/events`; 184 disabled).
- Historical-section candidate rows: **938** across **194** countries. **State of Palestine (PS)** has none.
- Exact duplicate triples (normalized title + same description + same start date) found: **0**.
- Same normalized title clusters to manually review: **16 clusters / 111 rows**. Same title does not establish duplicate identity; these include city-specific iterations of shared recurring festivals.
- Confirmed destructive changes made: **none**. No database records or app files modified.

## Flow and structural findings

Historical events are ordinary `Event` rows (no separate HistoricalEvent model or country-event join). `countryCode` is a single country association; `citySlug` can distinguish local instances. Category is nullable. The live importer in `backend/scripts/import_historical_events.js` loads regional workbook event rows and checks title/country/city before insert; other scripts also import events. There is no single canonical historical-event source. The API lists enabled rows, defaults to 20, caps page size at 100, and orders by `startAt desc`; it does not join in a way that multiplies records.

`src/pages/CountryDetailPage.tsx` requests `perPage:100`, filters returned rows again by countryCode, considers source-less descriptions containing ?Document date:? or ?Historical/cultural significance:? historical, and also puts any expired event in the historical section. It deduplicates display by normalized title + end/start date. All country totals are at most 100, so the request cap does not omit a current country?s rows. Title/date UI deduplication can conceal duplicate records from the display while leaving them in the API/database.

Historical eligibility is heuristic, not a reliable type: 922 historical-section candidates have no `categoryId`. Many are city-level observances of the same national festival and therefore appear multiple times in a country page inventory.

## Confirmed record-level issues

No rows are labeled confirmed duplicates from string checks alone: each same-title case must be interpreted with city and description because several records are legitimate city-specific observances. Exact normalized title + identical description + date triples were not found. The following are suspicious and need targeted decisions/evidence:

- **AF Afghanistan ? nowruz** (4 rows; dates 2026-03-01, 2026-03-21). IDs: c5a1cd29-3090-4668-b845-857a43f9b78f, 44e81087-c38b-45e9-b629-fc8903273d65, f0b20998-a827-4dae-afdd-3d7a2b0f5ab9, c0993efe-5049-46e1-b12d-060d05c1be7c.
- **AF Afghanistan ? nowruz persian new year** (2 rows; dates 2026-03-01, 2026-08-19). IDs: 95ebe779-800e-4dcc-bd0d-baf8e1e334b0, 47b9cc8f-6952-40de-abc2-2dba32aaca8e.
- **AM Armenia ? nowruz** (2 rows; dates 2026-03-01; repeated same-year identity, city-scoped rows require review). IDs: e04d558e-22b6-4d44-9d45-7c1486257754, 3edeaf55-8b0e-4b3b-afca-011426f6cd5a.
- **AZ Azerbaijan ? novruz bayram spring festival** (10 rows; dates 2026-03-01, 2026-03-20). IDs: a0cc3d50-7c2b-4698-b9e7-59004cb73288, d3273173-6fbf-46c5-a664-a302402e0ed8, 896e7342-3085-43b5-b6fd-e0ef4f0e824f, 1510b5b5-c42e-441d-9a25-963e395dbf24, fbcff8f2-a4b6-47b9-b484-151c59a3de43, 91771871-643d-4e46-897a-3f47338a4bbd, 683c1c7d-f79f-4dac-9373-e099522a35f5, 877df8a6-14d4-48d3-b5a3-9ef593055351, 7885e1af-33c5-45ab-9bff-2461628a9a5e, 7bac09c0-7854-4763-8f0a-1f2dd6ffd7b8.
- **IR Iran ? nowruz persian new year** (19 rows; dates 2026-03-01; repeated same-year identity, city-scoped rows require review). IDs: fabf29cc-29f2-4503-8a69-d781c0c8429c, 6e38752e-23ef-46f7-a88b-fcf48ce1281e, 80e9ada1-c4d4-438b-af6c-0aeeb35f4645, 882d0a3f-c8a2-4b34-8390-4cbdb7543b5b, 05fd84d8-a892-4aa9-95f5-cf958dd8f395, 35f09644-3187-4161-b74b-1b642ef31f3a, 986e0a4f-0241-443b-a660-c35a3a6bcee9, 37c74dc0-3a1d-43d5-bb00-04f1d764de6c, 022015d7-03c4-4246-8135-6fae3de920ec, 18427b66-f3f8-47dd-8eab-944a342581ff, a0d5bbbf-f86b-4239-9ac5-6050bb4ee2d0, fc06f1e1-aa69-450d-b094-f2d6700b4010, 760048ce-b9db-4004-9640-62508b53c4c0, 89529123-2e89-4fc0-9195-88d07066aa1c, 35c788e2-3662-4add-ab92-11b2d91d8b27, aa8b7df3-01f5-4e13-9640-13fa4ca052a5, 9be96d2c-4b88-4ed8-b721-afbae77e3aca, 7b7c8abb-8251-4939-ae1c-b7e5a69e3211, c8367dce-f185-47ce-8428-ca40a49a2921.
- **IQ Iraq ? nowruz kurdish regions** (7 rows; dates 2026-03-01; repeated same-year identity, city-scoped rows require review). IDs: 3f20c56f-42ce-4003-a868-a1a1fcf16e28, a68f32fc-b41a-4451-8b5b-277900e296a4, dca3f679-737e-4171-be49-cac278328d13, 3721b25f-4411-425f-ae69-62b015f489ea, 017ea472-c935-4faf-b8f4-79ae698f12c9, c49428a6-c188-431e-9878-6da3238aefca, 74b2cc8f-27bf-435e-960e-1fbf0c97cc1b.
- **KZ Kazakhstan ? nauryz spring new year festival** (11 rows; dates 2026-03-01; repeated same-year identity, city-scoped rows require review). IDs: 72418a63-4f16-4cdf-a604-626cddf83001, 0c20cf92-0d89-4ef8-857c-30aabbdc8867, 6142d800-bacc-4e5b-a71c-ea0ed2070466, 697670ce-4c4b-4152-a178-7981a111a38a, ee669bf4-00b2-44e8-b2e1-0f41aafe72ce, 8804238b-0f83-45aa-949f-0378fa6ac334, 104166ce-c0cb-430f-b3a5-af1c5be2eca8, 227285b5-04e0-433e-913e-267b068d4d37, 0db76212-166c-4e26-8e88-e2f12a47ec88, 870d5aa1-8625-4db0-a12c-286d757f8e87, 431718be-6655-4728-97f8-73d5f11822a9.
- **MN Mongolia ? naadam festival wrestling archery horse racing** (6 rows; dates 2026-07-01; repeated same-year identity, city-scoped rows require review). IDs: 63ce7bf1-349b-4ae9-a6e3-3a90f6d63d64, 2c12f940-09ac-4983-9871-fa887817179d, d7c9e442-01b7-457f-9a42-a3abe5af7497, 174c7134-7e9d-4e91-a77a-4d5e2c379fd3, c547c8e8-073e-4c52-af99-a00f2183e90d, 795981ac-db77-4986-8f67-79d35689cd94.
- **PK Pakistan ? national horse cattle show** (2 rows; dates 2026-02-01; repeated same-year identity, city-scoped rows require review). IDs: 928af49e-016b-499b-af79-1fc926639372, bd643dda-d599-41e0-b54c-f6493a698a0d.
- **PK Pakistan ? pakistan flower show** (2 rows; dates 2026-02-01; repeated same-year identity, city-scoped rows require review). IDs: f4de8102-5338-4047-8238-d83606a294f2, 09828893-e5e2-4a73-88a9-16c106828314.
- **PK Pakistan ? lok mela** (2 rows; dates 2026-11-01; repeated same-year identity, city-scoped rows require review). IDs: e1ab16ae-d7f7-4042-aa20-65f054014f70, 1af3de74-a8d4-43d5-a13b-2e9a4ac9d52d.
- **RU Russia ? orthodox christmas traditions** (12 rows; dates 2026-12-01; repeated same-year identity, city-scoped rows require review). IDs: 83fce12f-7926-48a7-9e02-f6cb4203d45f, 802a38cd-6e2c-4235-96ec-bb424ff8282f, d9238e72-d7dd-4447-b169-056fd71350e6, 18688faa-ebcd-4d85-bc81-6f58b14970a2, 1d88c0ee-fce1-4213-a0e0-3b47dbbf54f3, 32085d7c-60ff-4257-bacd-a78e9a2f1778, 53e65b60-2a2b-4e5e-b231-94aba12d0442, bcda5dff-6b67-4b9c-acdd-0c8e60dc78e0, de258ad7-705f-48ce-b82e-041d99470ce1, 0e62a2c5-fba6-484b-bed1-ceef6ea728e6, 40598600-1a9e-4ab6-bc9a-f9da1e851449, 2ccfb850-31b0-4547-9118-c398b489cb05.
- **TJ Tajikistan ? navruz spring new year festival** (4 rows; dates 2026-03-01; repeated same-year identity, city-scoped rows require review). IDs: c3cc3cd9-067d-428f-99df-700dced9313c, 8acfe9ca-47bf-45d2-89d5-4191cd44579b, 261d955d-e65f-43b5-a27a-4eaa95c63558, cea06ddc-4059-48f0-a22e-c913ae032896.
- **TH Thailand ? songkran thai new year water festival** (11 rows; dates 2026-04-01; repeated same-year identity, city-scoped rows require review). IDs: e8bf06f6-fb22-4eac-b3bd-69cfc6f096e7, 1c8bd31f-cbec-4e33-bd6a-4be61c2b1f53, dfaa105e-2103-42a7-b5e0-baa34cf25269, 18949924-13a6-4692-8326-369e2e9fb03d, 54b2c0f1-7496-4e07-a122-fbdb8f609278, 6a0f170e-5c7b-408a-a327-0d93f94725d3, 1b18f64b-bad2-415c-aee8-96a5ec53ab67, 070a91d7-2144-40d8-ac38-39763f648f40, 814bef83-9621-4a37-b354-0ff846289af3, 2c66f3cd-bc17-437d-bf13-36353a6b63ea, 418dc66d-c8c5-4581-9cd2-caefbab281fe.
- **TM Turkmenistan ? nowruz spring new year festival** (6 rows; dates 2026-03-01; repeated same-year identity, city-scoped rows require review). IDs: cdd2a20e-ad4d-43a1-b9b8-8b1f8819ed25, bbed05c2-8c82-4035-9aac-6216ff78c7ea, 6a1cafda-a69c-4a8b-91af-fccafab8851d, 305d076d-20c9-41ce-8cbc-02702dfdb10a, 31fa257e-3fe8-4e53-a6e2-1cd93e22d514, e63f0102-949f-433f-9e09-8fa20122b528.
- **UZ Uzbekistan ? navruz spring new year festival** (11 rows; dates 2026-03-01; repeated same-year identity, city-scoped rows require review). IDs: 9ae6a975-6281-4683-af7d-fa73d7862595, b9270bbb-8f99-45af-bc42-fbe7e43bb5b3, e29d09d1-c06e-4719-aa3d-d766f80422fd, 955495ae-8ae9-4c55-a8b1-48a974b7c8cf, 3712fbed-6e27-4a9a-b9a7-a2b41e498ac3, 6526a551-00dc-4910-8983-088da0280a7d, eba657c4-eb23-42e8-9935-095b58deed5f, 9736f7de-b194-4cc6-bfe4-24b33b1f3f4d, 2adb92e1-6d52-47f2-80c9-06375814f74b, f79200e3-09c1-47b7-90e8-91b42275bee5, 916cb32e-e5cc-4a60-9f03-eab7680aa2d0.

The IDs, titles, dates, city slugs, images, and full descriptions for all clusters are in `HISTORICAL_EVENTS_DUPLICATE_CANDIDATES.json`. The country-by-country event rows, database IDs, title/date/description/image, category, city and source metadata are in `HISTORICAL_EVENTS_COUNTRY_AUDIT.json`.

## Historical reference checks

- UNESCO?s multinational intangible heritage listing explicitly includes Afghanistan, Azerbaijan, India, Iran, Iraq, Kazakhstan, Kyrgyzstan, Uzbekistan, Pakistan, Tajikistan, T?rkiye, Turkmenistan, and Mongolia as participants in the joint Nowruz/Nauryz/Navruz element. It describes it as shared living heritage; cross-country occurrence is legitimate and must not be removed as a duplicate. UNESCO identifies March 21 as International Nowruz Day. [UNESCO listing](https://ich.unesco.org/en/RL/nowruz-02097), [UNESCO date and country overview](https://ich.unesco.org/en/news/21-march-the-international-day-of-nowruz-13299).
- UNESCO says Naadam is celebrated annually in Mongolia from July 11?13. Database Naadam rows use July 1; this is a date precision error in the represented event date. [UNESCO Naadam entry](https://ich.unesco.org/en/RL/naadam-mongolian-traditional-festival-00395).
- UNESCO describes Songkran as occurring in mid-April. Thailand database rows use April 1, indicating imprecise month-only placeholder date. [UNESCO Songkran entry](https://ich.unesco.org/en/RL/songkran-in-thailand-traditional-thai-new-year-festival-01719).
- Many Nowruz-related rows set `startAt` to March 1 while their description says March 20?21; annual dates should be normalized only after deciding how to represent a recurring observance. [UNESCO overview](https://ich.unesco.org/en/news/21-march-the-international-day-of-nowruz-13299).

## API/frontend verification

- Backend readiness: `/health/ready` returned `ready`. Frontend dev server at `http://localhost:5173` returned HTTP 200.
- `/countries?perPage=500` returned 195 countries. Country event counts sum to 1,135 rows.
- `/events?perPage=100` reports 951 enabled rows over 10 pages. These are distinct DB rows; EventService returns one item per event row, without multi-valued joins.
- Frontend performs title/date deduplication. Page-level actual browser rendering for all 195 pages was not individually visually checked; data and rendering logic were inspected, but end-to-end visual review across 195 countries remains unverified.

## Country-by-country breakdown

Counts are historical-section candidates according to existing frontend/category heuristics, not a verified count of accurate historical events. See the JSON inventory for every row ID and metadata.

- **AF ? Afghanistan:** 27 candidate rows.
- **AL ? Albania:** 1 candidate rows.
- **DZ ? Algeria:** 8 candidate rows.
- **AD ? Andorra:** 1 candidate rows.
- **AO ? Angola:** 2 candidate rows.
- **AG ? Antigua and Barbuda:** 2 candidate rows.
- **AR ? Argentina:** 11 candidate rows.
- **AM ? Armenia:** 6 candidate rows.
- **AU ? Australia:** 2 candidate rows.
- **AT ? Austria:** 1 candidate rows.
- **AZ ? Azerbaijan:** 25 candidate rows.
- **BS ? Bahamas:** 4 candidate rows.
- **BH ? Bahrain:** 6 candidate rows.
- **BD ? Bangladesh:** 6 candidate rows.
- **BB ? Barbados:** 2 candidate rows.
- **BY ? Belarus:** 1 candidate rows.
- **BE ? Belgium:** 1 candidate rows.
- **BZ ? Belize:** 2 candidate rows.
- **BJ ? Benin:** 2 candidate rows.
- **BT ? Bhutan:** 6 candidate rows.
- **BO ? Bolivia:** 7 candidate rows.
- **BA ? Bosnia and Herzegovina:** 1 candidate rows.
- **BW ? Botswana:** 4 candidate rows.
- **BR ? Brazil:** 11 candidate rows.
- **BN ? Brunei:** 6 candidate rows.
- **BG ? Bulgaria:** 1 candidate rows.
- **BF ? Burkina Faso:** 2 candidate rows.
- **BI ? Burundi:** 2 candidate rows.
- **CV ? Cabo Verde:** 5 candidate rows.
- **KH ? Cambodia:** 6 candidate rows.
- **CM ? Cameroon:** 5 candidate rows.
- **CA ? Canada:** 17 candidate rows.
- **CF ? Central African Republic:** 2 candidate rows.
- **TD ? Chad:** 2 candidate rows.
- **CL ? Chile:** 8 candidate rows.
- **CN ? China:** 7 candidate rows.
- **CO ? Colombia:** 8 candidate rows.
- **KM ? Comoros:** 2 candidate rows.
- **CR ? Costa Rica:** 3 candidate rows.
- **CI ? Côte d'Ivoire:** 2 candidate rows.
- **HR ? Croatia:** 1 candidate rows.
- **CU ? Cuba:** 4 candidate rows.
- **CY ? Cyprus:** 7 candidate rows.
- **CZ ? Czechia:** 1 candidate rows.
- **CD ? Democratic Republic of the Congo:** 6 candidate rows.
- **DK ? Denmark:** 1 candidate rows.
- **DJ ? Djibouti:** 2 candidate rows.
- **DM ? Dominica:** 2 candidate rows.
- **DO ? Dominican Republic:** 4 candidate rows.
- **EC ? Ecuador:** 9 candidate rows.
- **EG ? Egypt:** 11 candidate rows.
- **SV ? El Salvador:** 2 candidate rows.
- **GQ ? Equatorial Guinea:** 3 candidate rows.
- **ER ? Eritrea:** 2 candidate rows.
- **EE ? Estonia:** 1 candidate rows.
- **SZ ? Eswatini:** 2 candidate rows.
- **ET ? Ethiopia:** 3 candidate rows.
- **FM ? Federated States of Micronesia:** 2 candidate rows.
- **FJ ? Fiji:** 2 candidate rows.
- **FI ? Finland:** 1 candidate rows.
- **FR ? France:** 1 candidate rows.
- **GA ? Gabon:** 4 candidate rows.
- **GE ? Georgia:** 6 candidate rows.
- **DE ? Germany:** 1 candidate rows.
- **GH ? Ghana:** 2 candidate rows.
- **GR ? Greece:** 1 candidate rows.
- **GD ? Grenada:** 2 candidate rows.
- **GT ? Guatemala:** 2 candidate rows.
- **GN ? Guinea:** 2 candidate rows.
- **GW ? Guinea-Bissau:** 2 candidate rows.
- **GY ? Guyana:** 8 candidate rows.
- **HT ? Haiti:** 3 candidate rows.
- **HN ? Honduras:** 4 candidate rows.
- **HU ? Hungary:** 1 candidate rows.
- **IS ? Iceland:** 1 candidate rows.
- **IN ? India:** 50 candidate rows.
- **ID ? Indonesia:** 6 candidate rows.
- **IR ? Iran:** 20 candidate rows.
- **IQ ? Iraq:** 8 candidate rows.
- **IE ? Ireland:** 1 candidate rows.
- **IL ? Israel:** 6 candidate rows.
- **IT ? Italy:** 1 candidate rows.
- **JM ? Jamaica:** 4 candidate rows.
- **JP ? Japan:** 6 candidate rows.
- **JO ? Jordan:** 6 candidate rows.
- **KZ ? Kazakhstan:** 12 candidate rows.
- **KE ? Kenya:** 5 candidate rows.
- **KI ? Kiribati:** 2 candidate rows.
- **KW ? Kuwait:** 6 candidate rows.
- **KG ? Kyrgyzstan:** 6 candidate rows.
- **LA ? Laos:** 6 candidate rows.
- **LV ? Latvia:** 1 candidate rows.
- **LB ? Lebanon:** 6 candidate rows.
- **LS ? Lesotho:** 2 candidate rows.
- **LR ? Liberia:** 2 candidate rows.
- **LY ? Libya:** 5 candidate rows.
- **LI ? Liechtenstein:** 1 candidate rows.
- **LT ? Lithuania:** 1 candidate rows.
- **LU ? Luxembourg:** 1 candidate rows.
- **MG ? Madagascar:** 7 candidate rows.
- **MW ? Malawi:** 3 candidate rows.
- **MY ? Malaysia:** 6 candidate rows.
- **MV ? Maldives:** 6 candidate rows.
- **ML ? Mali:** 5 candidate rows.
- **MT ? Malta:** 1 candidate rows.
- **MH ? Marshall Islands:** 2 candidate rows.
- **MR ? Mauritania:** 3 candidate rows.
- **MU ? Mauritius:** 2 candidate rows.
- **MX ? Mexico:** 4 candidate rows.
- **MD ? Moldova:** 1 candidate rows.
- **MC ? Monaco:** 1 candidate rows.
- **MN ? Mongolia:** 7 candidate rows.
- **ME ? Montenegro:** 1 candidate rows.
- **MA ? Morocco:** 11 candidate rows.
- **MZ ? Mozambique:** 5 candidate rows.
- **MM ? Myanmar:** 6 candidate rows.
- **NA ? Namibia:** 3 candidate rows.
- **NR ? Nauru:** 2 candidate rows.
- **NP ? Nepal:** 6 candidate rows.
- **NL ? Netherlands:** 1 candidate rows.
- **NZ ? New Zealand:** 2 candidate rows.
- **NI ? Nicaragua:** 2 candidate rows.
- **NE ? Niger:** 2 candidate rows.
- **NG ? Nigeria:** 8 candidate rows.
- **KP ? North Korea:** 6 candidate rows.
- **MK ? North Macedonia:** 1 candidate rows.
- **NO ? Norway:** 1 candidate rows.
- **OM ? Oman:** 6 candidate rows.
- **PK ? Pakistan:** 41 candidate rows.
- **PW ? Palau:** 2 candidate rows.
- **PA ? Panama:** 3 candidate rows.
- **PG ? Papua New Guinea:** 2 candidate rows.
- **PY ? Paraguay:** 11 candidate rows.
- **PE ? Peru:** 9 candidate rows.
- **PH ? Philippines:** 6 candidate rows.
- **PL ? Poland:** 1 candidate rows.
- **PT ? Portugal:** 1 candidate rows.
- **QA ? Qatar:** 6 candidate rows.
- **CG ? Republic of the Congo:** 3 candidate rows.
- **RO ? Romania:** 1 candidate rows.
- **RU ? Russia:** 13 candidate rows.
- **RW ? Rwanda:** 2 candidate rows.
- **KN ? Saint Kitts and Nevis:** 3 candidate rows.
- **LC ? Saint Lucia:** 2 candidate rows.
- **VC ? Saint Vincent and the Grenadines:** 2 candidate rows.
- **WS ? Samoa:** 2 candidate rows.
- **SM ? San Marino:** 1 candidate rows.
- **ST ? São Tomé and Príncipe:** 2 candidate rows.
- **SA ? Saudi Arabia:** 6 candidate rows.
- **SN ? Senegal:** 2 candidate rows.
- **RS ? Serbia:** 1 candidate rows.
- **SC ? Seychelles:** 2 candidate rows.
- **SL ? Sierra Leone:** 2 candidate rows.
- **SG ? Singapore:** 6 candidate rows.
- **SK ? Slovakia:** 1 candidate rows.
- **SI ? Slovenia:** 1 candidate rows.
- **SB ? Solomon Islands:** 2 candidate rows.
- **SO ? Somalia:** 4 candidate rows.
- **ZA ? South Africa:** 7 candidate rows.
- **KR ? South Korea:** 6 candidate rows.
- **SS ? South Sudan:** 2 candidate rows.
- **ES ? Spain:** 1 candidate rows.
- **LK ? Sri Lanka:** 6 candidate rows.
- **PS ? State of Palestine:** 0 candidate rows ? no historical events.
- **SD ? Sudan:** 3 candidate rows.
- **SR ? Suriname:** 6 candidate rows.
- **SE ? Sweden:** 1 candidate rows.
- **CH ? Switzerland:** 1 candidate rows.
- **SY ? Syria:** 6 candidate rows.
- **TJ ? Tajikistan:** 6 candidate rows.
- **TZ ? Tanzania:** 5 candidate rows.
- **TH ? Thailand:** 12 candidate rows.
- **GM ? The Gambia:** 2 candidate rows.
- **TL ? Timor-Leste:** 6 candidate rows.
- **TG ? Togo:** 2 candidate rows.
- **TO ? Tonga:** 2 candidate rows.
- **TT ? Trinidad and Tobago:** 3 candidate rows.
- **TN ? Tunisia:** 5 candidate rows.
- **TR ? Türkiye:** 6 candidate rows.
- **TM ? Turkmenistan:** 7 candidate rows.
- **TV ? Tuvalu:** 2 candidate rows.
- **UG ? Uganda:** 2 candidate rows.
- **UA ? Ukraine:** 1 candidate rows.
- **AE ? United Arab Emirates:** 6 candidate rows.
- **GB ? United Kingdom:** 1 candidate rows.
- **US ? United States:** 44 candidate rows.
- **UY ? Uruguay:** 8 candidate rows.
- **UZ ? Uzbekistan:** 12 candidate rows.
- **VU ? Vanuatu:** 2 candidate rows.
- **VA ? Vatican City:** 1 candidate rows.
- **VE ? Venezuela:** 6 candidate rows.
- **VN ? Vietnam:** 6 candidate rows.
- **YE ? Yemen:** 6 candidate rows.
- **ZM ? Zambia:** 4 candidate rows.
- **ZW ? Zimbabwe:** 4 candidate rows.

## Limits and next steps

A source-backed factual audit of every title, description, date, and modern-country attribution across 938 records has not been completed; entries without credible attached sources remain unresolved. The database has no source URL on many imported rows; imported descriptions often cite only a worksheet. This read-only pass surfaced structural issues and source-verified date errors, but does not justify merging city-specific records or rewriting recurring dates wholesale.

Before any edits, resolve the same-country duplicate clusters against the source workbook rows and decide whether the product intends city-level occurrences to appear in a country-level Historical Events section. A correct fix may be to separate local observances from historical events and preserve their city relationship, not delete records.
