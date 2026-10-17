# Africa Big City Image Audit

Read-only baseline audit of the live database, existing city API, React city-image behavior, and `Data/Africa.xlsx`. No database rows or image assets were changed.

## Scope and Findings

- African countries in the live database: **54**. All have at least one City row.
- African City rows returned by the API: **143**.
- Explicit `bigCities` arrays/counts in African country profiles: **0**. The app's current Big City listing is the complete City table for each country.
- City records with a non-empty `profile.heroImageUrl` or `profile.thumbnail`: **0/143**.
- API city records returning an image URL: **0/143**; all country-city API routes responded successfully.
- Frontend image result: no URL is available to load; the sampled city detail route renders `Image unavailable`.
- Existing Africa city-image folder: **none**. Existing folders are for Asia, Azerbaijan, and Pakistan; no Africa image set is present.
- Current status totals: valid images **0**; missing image URLs **143**; broken assigned URLs **0** (none exist to request); placeholder URL assignments **0**; invalid assigned image files **0**; duplicate/wrong-country assignments **0**. The frontend fallback is shown for missing images.
- Non-African baseline before implementation: **1,087** City records; **240** have a hero/thumbnail URL and **847** do not.

## Catalog Conflict Blocking Safe Image Assignment

`Data/Africa.xlsx` contains **139** `City_Details` rows. **58** live database rows match a source city by country and normalized name, but two of those rows are separate Luanda records; therefore only **57** distinct source-city entries are represented, and **82** source cities have no corresponding database record. The database has **85** additional rows whose names are airport names or otherwise not in `City_Details`. There is one duplicate country/city name: Angola's Luanda appears under two airport slugs. Examples of other inconsistent records include `Burundi | bi-burundi` and airport-named rows such as `Félix-Houphouët-Boigny` and `Julius Nyerere`.

The requested image-only scope forbids renaming or creating city records. Assigning cityscape images to airport-named records or to rows for absent cities could therefore produce mislabeled or wrong-city imagery. This must be resolved before image sourcing/implementation.

## Exact Missing-Image Rows

`City ID/slug` is the City table primary key (`slug`); the schema has no separate city `id`. Every row below currently has `MISSING_IMAGE_URL` in both database image fields and in the API output.

| Country | ISO | City | City ID/slug | Current image status |
|---|---|---|---|---|
| Angola | AO | Luanda | ao-quatro-de-fevereiro-international-airport-lad-luanda | MISSING_IMAGE_URL |
| Angola | AO | Luanda | ao-dr-ant-nio-agostinho-neto-international-airport-nbj-luanda | MISSING_IMAGE_URL |
| Burkina Faso | BF | Ouagadougou | bf-ouagadougou-airport | MISSING_IMAGE_URL |
| Burundi | BI | Burundi | bi-burundi | MISSING_IMAGE_URL |
| Burundi | BI | Melchior Ndadaye | bi-melchior-ndadaye-international-airport-tourisme-gov-bi | MISSING_IMAGE_URL |
| Benin | BJ | Cotonou | bj-cadjehoun-international-airport-coo-cotonou | MISSING_IMAGE_URL |
| Botswana | BW | Gaborone | bw-sir-seretse-khama-international-airport-gbe-gaborone | MISSING_IMAGE_URL |
| Botswana | BW | Kasane | bw-kasane-international-airport-bbk-kasane | MISSING_IMAGE_URL |
| Botswana | BW | Maun | bw-maun-international-airport-mub-maun | MISSING_IMAGE_URL |
| Democratic Republic of the Congo | CD | Bangoka | cd-bangoka-international-airport | MISSING_IMAGE_URL |
| Democratic Republic of the Congo | CD | Goma | cd-goma-international-airport | MISSING_IMAGE_URL |
| Democratic Republic of the Congo | CD | Kindu | cd-kindu-airport | MISSING_IMAGE_URL |
| Democratic Republic of the Congo | CD | Lubumbashi | cd-lubumbashi-international-airport | MISSING_IMAGE_URL |
| Democratic Republic of the Congo | CD | N'djili | cd-n-djili-international-airport | MISSING_IMAGE_URL |
| Central African Republic | CF | Bangui M'Poko | cf-bangui-m-poko-international-airport | MISSING_IMAGE_URL |
| Republic of the Congo | CG | Agostinho-Neto | cg-agostinho-neto-international-airport | MISSING_IMAGE_URL |
| Republic of the Congo | CG | Maya-Maya | cg-maya-maya-airport | MISSING_IMAGE_URL |
| Côte d'Ivoire | CI | Félix-Houphouët-Boigny | ci-f-lix-houphou-t-boigny-international-airport | MISSING_IMAGE_URL |
| Cameroon | CM | Douala | cm-douala-international-airport | MISSING_IMAGE_URL |
| Cameroon | CM | Garoua | cm-garoua-international-airport | MISSING_IMAGE_URL |
| Cameroon | CM | Maroua Salak | cm-maroua-salak-international-airport | MISSING_IMAGE_URL |
| Cameroon | CM | Yaoundé Nsimalen | cm-yaound-nsimalen-international-airport | MISSING_IMAGE_URL |
| Cabo Verde | CV | Amílcar Cabral | cv-am-lcar-cabral-international-airport | MISSING_IMAGE_URL |
| Cabo Verde | CV | Aristides Pereira | cv-aristides-pereira-international-airport | MISSING_IMAGE_URL |
| Cabo Verde | CV | Cesária Évora | cv-ces-ria-vora-airport | MISSING_IMAGE_URL |
| Cabo Verde | CV | Nelson Mandela | cv-nelson-mandela-international-airport | MISSING_IMAGE_URL |
| Djibouti | DJ | Djibouti–Ambouli | dj-djibouti-ambouli-international-airport | MISSING_IMAGE_URL |
| Algeria | DZ | Algiers | dz-houari-boumediene-airport-alg-algiers | MISSING_IMAGE_URL |
| Algeria | DZ | Annaba | dz-rabah-bitat-airport-aae-annaba | MISSING_IMAGE_URL |
| Algeria | DZ | Béjaïa | dz-abane-ramdane-airport-bja-b-ja-a | MISSING_IMAGE_URL |
| Algeria | DZ | Constantine | dz-mohamed-boudiaf-international-airport-czl-constantine | MISSING_IMAGE_URL |
| Algeria | DZ | Oran | dz-ahmed-ben-bella-international-airport-orn-oran | MISSING_IMAGE_URL |
| Algeria | DZ | Sétif | dz-8-mai-1945-airport-qsf-s-tif | MISSING_IMAGE_URL |
| Algeria | DZ | Tlemcen | dz-messali-hadj-airport-tlm-tlemcen | MISSING_IMAGE_URL |
| Egypt | EG | Assiut | eg-assiut-international-airport | MISSING_IMAGE_URL |
| Egypt | EG | Aswan | eg-aswan-international-airport | MISSING_IMAGE_URL |
| Egypt | EG | Borg El Arab | eg-borg-el-arab-international-airport | MISSING_IMAGE_URL |
| Egypt | EG | Cairo | eg-cairo-international-airport | MISSING_IMAGE_URL |
| Egypt | EG | Hurghada | eg-hurghada-international-airport | MISSING_IMAGE_URL |
| Egypt | EG | Luxor | eg-luxor-international-airport | MISSING_IMAGE_URL |
| Egypt | EG | Marsa Alam | eg-marsa-alam-international-airport | MISSING_IMAGE_URL |
| Egypt | EG | Sharm El Sheikh | eg-sharm-el-sheikh-international-airport | MISSING_IMAGE_URL |
| Egypt | EG | Sohag | eg-sohag-international-airport | MISSING_IMAGE_URL |
| Egypt | EG | Sphinx | eg-sphinx-international-airport | MISSING_IMAGE_URL |
| Eritrea | ER | Asmara | er-asmara-international-airport | MISSING_IMAGE_URL |
| Ethiopia | ET | Aba Tenna Dejazmach Yilma | et-aba-tenna-dejazmach-yilma-international-airport | MISSING_IMAGE_URL |
| Ethiopia | ET | Addis Ababa Bole | et-addis-ababa-bole-international-airport | MISSING_IMAGE_URL |
| Gabon | GA | Léon-Mba | ga-l-on-mba-international-airport | MISSING_IMAGE_URL |
| Gabon | GA | M'Vengue El Hadj Omar Bongo Ondimba | ga-m-vengue-el-hadj-omar-bongo-ondimba-international-airport | MISSING_IMAGE_URL |
| Gabon | GA | Port-Gentil | ga-port-gentil-international-airport | MISSING_IMAGE_URL |
| Ghana | GH | Kotoka | gh-kotoka-international-airport | MISSING_IMAGE_URL |
| The Gambia | GM | Banjul | gm-banjul-international-airport | MISSING_IMAGE_URL |
| Guinea | GN | Ahmed Sékou Touré | gn-ahmed-s-kou-tour-international-airport | MISSING_IMAGE_URL |
| Equatorial Guinea | GQ | Bata | gq-bata-airport | MISSING_IMAGE_URL |
| Equatorial Guinea | GQ | Malabo | gq-malabo-international-airport | MISSING_IMAGE_URL |
| Guinea-Bissau | GW | Osvaldo Vieira | gw-osvaldo-vieira-international-airport | MISSING_IMAGE_URL |
| Kenya | KE | Eldoret | ke-eldoret-international-airport | MISSING_IMAGE_URL |
| Kenya | KE | Jomo Kenyatta | ke-jomo-kenyatta-international-airport | MISSING_IMAGE_URL |
| Kenya | KE | Kisumu | ke-kisumu-international-airport | MISSING_IMAGE_URL |
| Kenya | KE | Moi | ke-moi-international-airport | MISSING_IMAGE_URL |
| Comoros | KM | Prince Said Ibrahim | km-prince-said-ibrahim-international-airport | MISSING_IMAGE_URL |
| Liberia | LR | Roberts | lr-roberts-international-airport | MISSING_IMAGE_URL |
| Lesotho | LS | Moshoeshoe I | ls-moshoeshoe-i-international-airport | MISSING_IMAGE_URL |
| Libya | LY | Benina | ly-benina-international-airport | MISSING_IMAGE_URL |
| Libya | LY | Misrata | ly-misrata-international-airport | MISSING_IMAGE_URL |
| Libya | LY | Mitiga | ly-mitiga-international-airport | MISSING_IMAGE_URL |
| Libya | LY | Sebha | ly-sebha-international-airport | MISSING_IMAGE_URL |
| Morocco | MA | Agadir–Al Massira | ma-agadir-al-massira-airport | MISSING_IMAGE_URL |
| Morocco | MA | Dakhla | ma-dakhla-airport | MISSING_IMAGE_URL |
| Morocco | MA | Fès–Saïs | ma-f-s-sa-s-airport | MISSING_IMAGE_URL |
| Morocco | MA | Hassan I | ma-hassan-i-airport | MISSING_IMAGE_URL |
| Morocco | MA | Marrakesh Menara | ma-marrakesh-menara-airport | MISSING_IMAGE_URL |
| Morocco | MA | Mohammed V | ma-mohammed-v-international-airport | MISSING_IMAGE_URL |
| Morocco | MA | Nador Al Aaroui | ma-nador-al-aaroui-international-airport | MISSING_IMAGE_URL |
| Morocco | MA | Ouarzazate | ma-ouarzazate-airport | MISSING_IMAGE_URL |
| Morocco | MA | Oujda Angads | ma-oujda-angads-airport | MISSING_IMAGE_URL |
| Morocco | MA | Rabat–Salé | ma-rabat-sal-airport | MISSING_IMAGE_URL |
| Morocco | MA | Tangier Ibn Battouta | ma-tangier-ibn-battouta-airport | MISSING_IMAGE_URL |
| Madagascar | MG | Amborovy | mg-amborovy-airport | MISSING_IMAGE_URL |
| Madagascar | MG | Arrachart | mg-arrachart-airport | MISSING_IMAGE_URL |
| Madagascar | MG | Fascene | mg-fascene-airport | MISSING_IMAGE_URL |
| Madagascar | MG | Ivato | mg-ivato-international-airport | MISSING_IMAGE_URL |
| Madagascar | MG | Marillac | mg-marillac-airport | MISSING_IMAGE_URL |
| Madagascar | MG | Toamasina Ambalamanasy | mg-toamasina-ambalamanasy-airport | MISSING_IMAGE_URL |
| Mali | ML | Gao | ml-gao-international-airport | MISSING_IMAGE_URL |
| Mali | ML | Kayes | ml-kayes-airport | MISSING_IMAGE_URL |
| Mali | ML | Modibo Keita | ml-modibo-keita-international-airport | MISSING_IMAGE_URL |
| Mali | ML | Mopti Ambodedjo | ml-mopti-ambodedjo-airport | MISSING_IMAGE_URL |
| Mauritania | MR | Nouadhibou | mr-nouadhibou-international-airport | MISSING_IMAGE_URL |
| Mauritania | MR | Nouakchott–Oumtounsy | mr-nouakchott-oumtounsy-international-airport | MISSING_IMAGE_URL |
| Mauritius | MU | Sir Seewoosagur Ramgoolam | mu-sir-seewoosagur-ramgoolam-international-airport | MISSING_IMAGE_URL |
| Malawi | MW | Chileka | mw-chileka-international-airport | MISSING_IMAGE_URL |
| Malawi | MW | Kamuzu | mw-kamuzu-international-airport | MISSING_IMAGE_URL |
| Mozambique | MZ | Beira | mz-beira-international-airport | MISSING_IMAGE_URL |
| Mozambique | MZ | Maputo | mz-maputo-international-airport | MISSING_IMAGE_URL |
| Mozambique | MZ | Nampula | mz-nampula-airport | MISSING_IMAGE_URL |
| Mozambique | MZ | Pemba | mz-pemba-airport | MISSING_IMAGE_URL |
| Mozambique | MZ | Vilankulo | mz-vilankulo-airport | MISSING_IMAGE_URL |
| Namibia | NA | Hosea Kutako | na-hosea-kutako-international-airport | MISSING_IMAGE_URL |
| Namibia | NA | Walvis Bay | na-walvis-bay-international-airport | MISSING_IMAGE_URL |
| Niger | NE | Diori Hamani | ne-diori-hamani-international-airport | MISSING_IMAGE_URL |
| Nigeria | NG | Akanu Ibiam | ng-akanu-ibiam-international-airport | MISSING_IMAGE_URL |
| Nigeria | NG | Mallam Aminu Kano | ng-mallam-aminu-kano-international-airport | MISSING_IMAGE_URL |
| Nigeria | NG | Murtala Muhammed | ng-murtala-muhammed-international-airport | MISSING_IMAGE_URL |
| Nigeria | NG | Nnamdi Azikiwe | ng-nnamdi-azikiwe-international-airport | MISSING_IMAGE_URL |
| Nigeria | NG | Port Harcourt | ng-port-harcourt-international-airport | MISSING_IMAGE_URL |
| Nigeria | NG | Sam Mbakwe Cargo | ng-sam-mbakwe-international-cargo-airport | MISSING_IMAGE_URL |
| Nigeria | NG | Umaru Musa Yar'Adua | ng-umaru-musa-yar-adua-international-airport | MISSING_IMAGE_URL |
| Rwanda | RW | Kigali | rw-kigali-international-airport | MISSING_IMAGE_URL |
| Seychelles | SC | Seychelles | sc-seychelles-international-airport | MISSING_IMAGE_URL |
| Sudan | SD | Khartoum | sd-khartoum-international-airport | MISSING_IMAGE_URL |
| Sudan | SD | Port Sudan New | sd-port-sudan-new-international-airport | MISSING_IMAGE_URL |
| Sierra Leone | SL | Freetown | sl-freetown-international-airport | MISSING_IMAGE_URL |
| Senegal | SN | Blaise Diagne | sn-blaise-diagne-international-airport | MISSING_IMAGE_URL |
| Somalia | SO | Aden Adde | so-aden-adde-international-airport | MISSING_IMAGE_URL |
| Somalia | SO | Berbera | so-berbera-international-airport | MISSING_IMAGE_URL |
| Somalia | SO | Egal | so-egal-international-airport | MISSING_IMAGE_URL |
| South Sudan | SS | Juba | ss-juba-international-airport | MISSING_IMAGE_URL |
| São Tomé and Príncipe | ST | São Tomé | st-s-o-tom-international-airport | MISSING_IMAGE_URL |
| Eswatini | SZ | King Mswati III | sz-king-mswati-iii-international-airport | MISSING_IMAGE_URL |
| Chad | TD | Hassan Djamous | td-hassan-djamous-international-airport | MISSING_IMAGE_URL |
| Togo | TG | Lomé–Tokoin | tg-lom-tokoin-international-airport | MISSING_IMAGE_URL |
| Tunisia | TN | Djerba–Zarzis | tn-djerba-zarzis-international-airport | MISSING_IMAGE_URL |
| Tunisia | TN | Enfidha–Hammamet | tn-enfidha-hammamet-international-airport | MISSING_IMAGE_URL |
| Tunisia | TN | Monastir Habib Bourguiba | tn-monastir-habib-bourguiba-international-airport | MISSING_IMAGE_URL |
| Tunisia | TN | Tunis–Carthage | tn-tunis-carthage-international-airport | MISSING_IMAGE_URL |
| Tanzania | TZ | Abeid Amani Karume | tz-abeid-amani-karume-international-airport | MISSING_IMAGE_URL |
| Tanzania | TZ | Julius Nyerere | tz-julius-nyerere-international-airport | MISSING_IMAGE_URL |
| Tanzania | TZ | Kilimanjaro | tz-kilimanjaro-international-airport | MISSING_IMAGE_URL |
| Tanzania | TZ | Mwanza | tz-mwanza-airport | MISSING_IMAGE_URL |
| Uganda | UG | Entebbe | ug-entebbe-international-airport | MISSING_IMAGE_URL |
| South Africa | ZA | Bram Fischer | za-bram-fischer-international-airport | MISSING_IMAGE_URL |
| South Africa | ZA | Cape Town | za-cape-town-international-airport | MISSING_IMAGE_URL |
| South Africa | ZA | Chief Dawid Stuurman | za-chief-dawid-stuurman-international-airport | MISSING_IMAGE_URL |
| South Africa | ZA | King Phalo | za-king-phalo-airport | MISSING_IMAGE_URL |
| South Africa | ZA | King Shaka | za-king-shaka-international-airport | MISSING_IMAGE_URL |
| South Africa | ZA | O. R. Tambo | za-o-r-tambo-international-airport | MISSING_IMAGE_URL |
| Zambia | ZM | Harry Mwanga Nkumbula | zm-harry-mwanga-nkumbula-international-airport | MISSING_IMAGE_URL |
| Zambia | ZM | Kenneth Kaunda | zm-kenneth-kaunda-international-airport | MISSING_IMAGE_URL |
| Zambia | ZM | Simon Mwansa Kapwepwe | zm-simon-mwansa-kapwepwe-international-airport | MISSING_IMAGE_URL |
| Zimbabwe | ZW | Joshua Mqabuko Nkomo | zw-joshua-mqabuko-nkomo-international-airport | MISSING_IMAGE_URL |
| Zimbabwe | ZW | Robert Gabriel Mugabe | zw-robert-gabriel-mugabe-international-airport | MISSING_IMAGE_URL |
| Zimbabwe | ZW | Victoria Falls | zw-victoria-falls-international-airport | MISSING_IMAGE_URL |
