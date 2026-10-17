# Big Cities Airport Name Review

## Outcome

- 222 verified catalog rows currently have a displayed name containing `International Airport`.
- 144 already match the verified locality plus `International Airport` and are unchanged.
- 64 display names are corrected below.
- 14 rows remain unchanged for review: 9 already held for manual review in the project audit and 5 with conflicting city/airport identities.
- Corrections are display-only and keyed by the preserved city slug and exact original name. No database, profile, image, route, or city record was changed.

The locality basis is the project’s [final city audit plan](backend/tmp_final_city_audit_plan.json), which records the same-country populated-place decision for each existing slug. `E1` means the audit marked the locality `KEEP_VERIFIED`, matched it to a same-country GeoNames populated place, and the slug or airport title supports the locality. `E2` means the audit explicitly corrected this row to the locality shown. The `International Airport` suffix is a Big Cities display label, not a change to the official airport name.

The source workbook referenced by the audit was not present in this workspace or its neighboring data folder. The archived workbook inspection output is available at [tmp_inspect_excel_output.txt](backend/tools/tmp_inspect_excel_output.txt); its conflicting rows are called out below.

## Corrections

All rows use the display-only override in `src/data/bigCitiesAirportDisplayNames.ts`, rendered by `src/pages/BigCitiesPage.tsx`. Each override is guarded by the original database name so a future catalog correction takes precedence.

| Slug | Original name | Corrected display name | Evidence |
|---|---|---|---|
| `ao-quatro-de-fevereiro-international-airport-lad-luanda` | Quatro de Fevereiro International Airport (LAD) | Luanda International Airport | E1 |
| `bj-cadjehoun-international-airport-coo-cotonou` | Cadjehoun International Airport (COO) | Cotonou International Airport | E1 |
| `bw-kasane-international-airport-bbk-kasane` | Kasane International Airport (BBK) | Kasane International Airport | E1 |
| `bw-maun-international-airport-mub-maun` | Maun International Airport (MUB) | Maun International Airport | E1 |
| `bw-sir-seretse-khama-international-airport-gbe-gaborone` | Sir Seretse Khama International Airport (GBE) | Gaborone International Airport | E1 |
| `cn-changchun` | Changchun Longjia International Airport | Changchun International Airport | E1 |
| `cn-changsha` | Changsha Huanghua International Airport | Changsha International Airport | E1 |
| `cn-chongqing` | Chongqing Jiangbei International Airport | Chongqing International Airport | E1 |
| `cn-dalian` | Dalian Zhoushuizi International Airport | Dalian International Airport | E1 |
| `cn-fuzhou` | Fuzhou Changle International Airport | Fuzhou International Airport | E1 |
| `cn-guangzhou` | Guangzhou Baiyun International Airport | Guangzhou International Airport | E1 |
| `cn-guilin` | Guilin Liangjiang International Airport | Guilin International Airport | E1 |
| `cn-guiyang` | Guiyang Longdongbao International Airport | Guiyang International Airport | E1 |
| `cn-haikou` | Haikou Meilan International Airport | Haikou International Airport | E1 |
| `cn-hangzhou` | Hangzhou Xiaoshan International Airport | Hangzhou International Airport | E1 |
| `cn-harbin` | Harbin Taiping International Airport | Harbin International Airport | E1 |
| `cn-hefei` | Hefei Xinqiao International Airport | Hefei International Airport | E1 |
| `cn-hohhot` | Hohhot Baita International Airport | Hohhot International Airport | E1 |
| `cn-jinan` | Jinan Yaoqiang International Airport | Jinan International Airport | E1 |
| `cn-kashgar` | Kashgar Laining International Airport | Kashgar International Airport | E1 |
| `cn-kunming` | Kunming Changshui International Airport | Kunming International Airport | E1 |
| `cn-lanzhou` | Lanzhou Zhongchuan International Airport | Lanzhou International Airport | E1 |
| `cn-lhasa` | Lhasa Gonggar International Airport | Lhasa International Airport | E1 |
| `cn-mangshi-dehong` | Mangshi International Airport | Mangshi (Dehong) International Airport | E1 |
| `cn-nanchang` | Nanchang Changbei International Airport | Nanchang International Airport | E1 |
| `cn-nanjing` | Nanjing Lukou International Airport | Nanjing International Airport | E1 |
| `cn-nanning` | Nanning Wuxu International Airport | Nanning International Airport | E1 |
| `cn-ningbo` | Ningbo Lishe International Airport | Ningbo International Airport | E1 |
| `cn-qingdao` | Qingdao Jiaodong International Airport | Qingdao International Airport | E1 |
| `cn-r-mqi` | Urumqi Tianshan International Airport | Ürümqi International Airport | E1 |
| `cn-sanya` | Sanya Phoenix International Airport | Sanya International Airport | E1 |
| `cn-shenyang` | Shenyang Taoxian International Airport | Shenyang International Airport | E1 |
| `cn-shenzhen` | Shenzhen Bao'an International Airport | Shenzhen International Airport | E1 |
| `cn-shijiazhuang` | Shijiazhuang Zhengding International Airport | Shijiazhuang International Airport | E1 |
| `cn-taiyuan` | Taiyuan Wusu International Airport | Taiyuan International Airport | E1 |
| `cn-tianjin` | Tianjin Binhai International Airport | Tianjin International Airport | E1 |
| `cn-wenzhou` | Wenzhou Longwan International Airport | Wenzhou International Airport | E1 |
| `cn-wuhan` | Wuhan Tianhe International Airport | Wuhan International Airport | E1 |
| `cn-yanji` | Yanji Chaoyangchuan International Airport | Yanji International Airport | E1 |
| `cn-yinchuan` | Yinchuan Hedong International Airport | Yinchuan International Airport | E1 |
| `cn-zhengzhou` | Zhengzhou Xinzheng International Airport | Zhengzhou International Airport | E1 |
| `cn-zhuhai` | Zhuhai Jinwan International Airport | Zhuhai International Airport | E1 |
| `dz-ahmed-ben-bella-international-airport-orn-oran` | Ahmed Ben Bella International Airport (ORN) | Oran International Airport | E1 |
| `dz-mohamed-boudiaf-international-airport-czl-constantine` | Mohamed Boudiaf International Airport (CZL) | Constantine International Airport | E1 |
| `in-goa` | Goa International Airport (Dabolim) | Goa International Airport | E1 |
| `ir-chabahar` | Chabahar Konarak International Airport | Chabahar International Airport | E1 |
| `ir-lar` | Larestan International Airport | Lar International Airport | E1 |
| `jo-amman` | Amman Civil Airport (Marka International Airport) | Amman International Airport | E1 |
| `jp-osaka` | Osaka International Airport (Itami) | Osaka International Airport | E1 |
| `kh-siem-reap` | Siem Reap–Angkor International Airport | Siem Reap International Airport | E1 |
| `kh-sihanoukville` | Sihanouk International Airport | Sihanoukville International Airport | E1 |
| `kp-pyongyang` | Pyongyang Sunan International Airport | Pyongyang International Airport | E1 |
| `kr-jeju-city` | Jeju International Airport | Jeju City International Airport | E1 |
| `kw-kuwait-city` | Kuwait International Airport | Kuwait City International Airport | E1 |
| `kz-kyzylorda` | Kyzylorda Korkyt Ata International Airport | Kyzylorda International Airport | E1 |
| `lb-beirut` | Beirut–Rafic Hariri International Airport | Beirut International Airport | E1 |
| `lk-colombo` | Colombo International Airport (Ratmalana) | Colombo International Airport | E1 |
| `my-sepang-kuala-lumpur` | Kuala Lumpur International Airport | Sepang International Airport | E2 |
| `ph-davao-city` | Davao International Airport (Francisco Bangoy International Airport) | Davao City International Airport | E1 |
| `ph-zamboanga-city` | Zamboanga International Airport | Zamboanga City International Airport | E1 |
| `ru-samara` | Samara Kurumoch International Airport | Samara International Airport | E1 |
| `sy-latakia` | Latakia International Airport (Bassel Al | Latakia International Airport | E1 |
| `uz-tashkent` | Islam Karimov Tashkent International Airport | Tashkent International Airport | E1 |
| `vn-hanoi` | Noi Bai International Airport | Hanoi International Airport | E1 |

## Review Required

These rows are unchanged. The first nine were marked `MANUAL_REVIEW` by the final audit plan. The last five conflict with the database name/profile, workbook snapshot, or audited locality and need source reconciliation before labeling.

| Slug | Current name | Review reason |
|---|---|---|
| `kr-yangyang` | Yangyang International Airport | No same-country populated-place match or verified airport municipality in the audit. |
| `mm-bagan-nyaung-u` | Nyaung U International Airport | Audit says profile describes a regional/archaeological area and does not resolve Bagan versus Nyaung U. |
| `mv-gan-addu-city` | Gan International Airport | No same-country populated-place match or verified airport municipality in the audit. |
| `mv-hanimaadhoo` | Hanimaadhoo International Airport | No same-country populated-place match or verified airport municipality in the audit. |
| `mv-maamigili` | Villa International Airport (Maamigili) | No same-country populated-place match or verified airport municipality in the audit. |
| `om-duqm` | Duqm International Airport | No same-country populated-place match or verified airport municipality in the audit. |
| `sy-qamishli` | Qamishli International Airport | No same-country populated-place match or verified airport municipality in the audit. |
| `ye-seiyun-hadhramaut` | Seiyun International Airport | No same-country populated-place match or verified airport municipality in the audit. |
| `ye-socotra-island` | Socotra International Airport | Audit identifies an island/region label, not a specific town. |
| `ae-abu-dhabi` | Abu Dhabi Al Ain International Airport | The database slug/audit points to Abu Dhabi, while the archived workbook snapshot associates this airport label with Al Ain. |
| `in-thiruvananthapuram` | Sri Guru Ram Dass Jee International Airport | Database airport name identifies an airport unrelated to the Thiruvananthapuram slug/locality. |
| `lk-katunayake-colombo` | Colombo International Airport (Ratmalana) | Audit/workbook locality is Katunayake, but the database airport name/profile identifies Ratmalana; reconcile before display correction. |
| `my-kota-bharu` | Kota Kinabalu International Airport | Database airport name conflicts with the Kota Bharu slug/audited locality. |
| `vn-da-lat` | Da Nang International Airport | Database airport name conflicts with the Da Lat slug/audited locality. |

The application changes are limited to `src/data/bigCitiesAirportDisplayNames.ts`, `src/pages/BigCitiesPage.tsx`, `src/pages/CountryDetailPage.tsx`, `src/pages/CityDetailPage.tsx`, and the focused page tests in `src/pages/__tests__/BigCitiesPage.test.tsx`, `src/pages/__tests__/CountryDetailPage.test.tsx`, and `src/pages/__tests__/CityDetailPage.test.tsx`. The database and all city records remain unchanged.

## Azerbaijan Follow-up

The first pass only wired the display helper into the global `/cities` page. The reported heading, `Big Cities in Azerbaijan`, is rendered separately by `CountryDetailPage`, whose city links used raw `city.name`; `CityDetailPage` also used the raw API name for the profile heading and page title. These bypasses explain why opening a city still showed an airport name even after the country list was corrected. Both detail renderers now apply the existing overrides only for Azerbaijan. The database records retain the expected Azerbaijan slugs and are verified; their `profile.airport` fields separately preserve airport names. The [final city audit plan](backend/tmp_final_city_audit_plan.json) verifies each slug as a same-country populated place, and [Azerbaijan_CityData_Complete_Extraction.txt](Azerbaijan_CityData_Complete_Extraction.txt) documents the city identities and their airports.

| Slug | Original database name | Big Cities display name | Evidence |
|---|---|---|---|
| `az-fuzuli` | Fuzuli International Airport | Fuzuli | Verified Azerbaijan locality in the audit plan; city and airport are distinct profile fields. |
| `az-gabala` | Gabala International Airport | Gabala | Verified Azerbaijan locality in the audit plan; city and airport are distinct profile fields. |
| `az-ganja` | Ganja International Airport | Ganja | Verified Azerbaijan locality in the audit plan; city and airport are distinct profile fields. |
| `az-lachin` | Lachin International Airport | Lachin | Verified Azerbaijan locality in the audit plan; city and airport are distinct profile fields. |
| `az-nakhchivan` | Nakhchivan International Airport | Nakhchivan | Verified Azerbaijan locality in the audit plan; city and airport are distinct profile fields. |
| `az-zangilan` | Zangilan International Airport | Zangilan | Verified Azerbaijan locality in the audit plan; city and airport are distinct profile fields. |
| `az-zaqatala` | Zaqatala International Airport | Zaqatala | Verified Azerbaijan locality in the audit plan; city and airport are distinct profile fields. |

Baku and Lankaran remain unchanged. These are guarded display-only overrides; database names, slugs, links, and profile data are untouched.