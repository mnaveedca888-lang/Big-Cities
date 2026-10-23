type AirportDisplayOverride = {
  originalName: string;
  displayName: string;
};

const airportDisplayOverrides: Record<string, AirportDisplayOverride> = {
  'ao-quatro-de-fevereiro-international-airport-lad-luanda': { originalName: 'Quatro de Fevereiro International Airport (LAD)', displayName: 'Luanda International Airport' },
  'bj-cadjehoun-international-airport-coo-cotonou': { originalName: 'Cadjehoun International Airport (COO)', displayName: 'Cotonou International Airport' },
  'bw-kasane-international-airport-bbk-kasane': { originalName: 'Kasane International Airport (BBK)', displayName: 'Kasane International Airport' },
  'bw-maun-international-airport-mub-maun': { originalName: 'Maun International Airport (MUB)', displayName: 'Maun International Airport' },
  'bw-sir-seretse-khama-international-airport-gbe-gaborone': { originalName: 'Sir Seretse Khama International Airport (GBE)', displayName: 'Gaborone International Airport' },
  'az-fuzuli': { originalName: 'Fuzuli International Airport', displayName: 'Fuzuli' },
  'az-gabala': { originalName: 'Gabala International Airport', displayName: 'Gabala' },
  'az-ganja': { originalName: 'Ganja International Airport', displayName: 'Ganja' },
  'az-lachin': { originalName: 'Lachin International Airport', displayName: 'Lachin' },
  'az-nakhchivan': { originalName: 'Nakhchivan International Airport', displayName: 'Nakhchivan' },
  'az-zangilan': { originalName: 'Zangilan International Airport', displayName: 'Zangilan' },
  'az-zaqatala': { originalName: 'Zaqatala International Airport', displayName: 'Zaqatala' },
  'cn-changchun': { originalName: 'Changchun Longjia International Airport', displayName: 'Changchun International Airport' },
  'cn-changsha': { originalName: 'Changsha Huanghua International Airport', displayName: 'Changsha International Airport' },
  'cn-chongqing': { originalName: 'Chongqing Jiangbei International Airport', displayName: 'Chongqing International Airport' },
  'cn-dalian': { originalName: 'Dalian Zhoushuizi International Airport', displayName: 'Dalian International Airport' },
  'cn-fuzhou': { originalName: 'Fuzhou Changle International Airport', displayName: 'Fuzhou International Airport' },
  'cn-guangzhou': { originalName: 'Guangzhou Baiyun International Airport', displayName: 'Guangzhou International Airport' },
  'cn-guilin': { originalName: 'Guilin Liangjiang International Airport', displayName: 'Guilin International Airport' },
  'cn-guiyang': { originalName: 'Guiyang Longdongbao International Airport', displayName: 'Guiyang International Airport' },
  'cn-haikou': { originalName: 'Haikou Meilan International Airport', displayName: 'Haikou International Airport' },
  'cn-hangzhou': { originalName: 'Hangzhou Xiaoshan International Airport', displayName: 'Hangzhou International Airport' },
  'cn-harbin': { originalName: 'Harbin Taiping International Airport', displayName: 'Harbin International Airport' },
  'cn-hefei': { originalName: 'Hefei Xinqiao International Airport', displayName: 'Hefei International Airport' },
  'cn-hohhot': { originalName: 'Hohhot Baita International Airport', displayName: 'Hohhot International Airport' },
  'cn-jinan': { originalName: 'Jinan Yaoqiang International Airport', displayName: 'Jinan International Airport' },
  'cn-kashgar': { originalName: 'Kashgar Laining International Airport', displayName: 'Kashgar International Airport' },
  'cn-kunming': { originalName: 'Kunming Changshui International Airport', displayName: 'Kunming International Airport' },
  'cn-lanzhou': { originalName: 'Lanzhou Zhongchuan International Airport', displayName: 'Lanzhou International Airport' },
  'cn-lhasa': { originalName: 'Lhasa Gonggar International Airport', displayName: 'Lhasa International Airport' },
  'cn-mangshi-dehong': { originalName: 'Mangshi International Airport', displayName: 'Mangshi (Dehong) International Airport' },
  'cn-nanchang': { originalName: 'Nanchang Changbei International Airport', displayName: 'Nanchang International Airport' },
  'cn-nanjing': { originalName: 'Nanjing Lukou International Airport', displayName: 'Nanjing International Airport' },
  'cn-nanning': { originalName: 'Nanning Wuxu International Airport', displayName: 'Nanning International Airport' },
  'cn-ningbo': { originalName: 'Ningbo Lishe International Airport', displayName: 'Ningbo International Airport' },
  'cn-qingdao': { originalName: 'Qingdao Jiaodong International Airport', displayName: 'Qingdao International Airport' },
  'cn-r-mqi': { originalName: 'Urumqi Tianshan International Airport', displayName: 'Ürümqi International Airport' },
  'cn-sanya': { originalName: 'Sanya Phoenix International Airport', displayName: 'Sanya International Airport' },
  'cn-shenyang': { originalName: 'Shenyang Taoxian International Airport', displayName: 'Shenyang International Airport' },
  'cn-shenzhen': { originalName: "Shenzhen Bao'an International Airport", displayName: 'Shenzhen International Airport' },
  'cn-shijiazhuang': { originalName: 'Shijiazhuang Zhengding International Airport', displayName: 'Shijiazhuang International Airport' },
  'cn-taiyuan': { originalName: 'Taiyuan Wusu International Airport', displayName: 'Taiyuan International Airport' },
  'cn-tianjin': { originalName: 'Tianjin Binhai International Airport', displayName: 'Tianjin International Airport' },
  'cn-wenzhou': { originalName: 'Wenzhou Longwan International Airport', displayName: 'Wenzhou International Airport' },
  'cn-wuhan': { originalName: 'Wuhan Tianhe International Airport', displayName: 'Wuhan International Airport' },
  'cn-yanji': { originalName: 'Yanji Chaoyangchuan International Airport', displayName: 'Yanji International Airport' },
  'cn-yinchuan': { originalName: 'Yinchuan Hedong International Airport', displayName: 'Yinchuan International Airport' },
  'cn-zhengzhou': { originalName: 'Zhengzhou Xinzheng International Airport', displayName: 'Zhengzhou International Airport' },
  'cn-zhuhai': { originalName: 'Zhuhai Jinwan International Airport', displayName: 'Zhuhai International Airport' },
  'dz-ahmed-ben-bella-international-airport-orn-oran': { originalName: 'Ahmed Ben Bella International Airport (ORN)', displayName: 'Oran International Airport' },
  'dz-mohamed-boudiaf-international-airport-czl-constantine': { originalName: 'Mohamed Boudiaf International Airport (CZL)', displayName: 'Constantine International Airport' },
  'in-goa': { originalName: 'Goa International Airport (Dabolim)', displayName: 'Goa International Airport' },
  'ir-chabahar': { originalName: 'Chabahar Konarak International Airport', displayName: 'Chabahar International Airport' },
  'ir-lar': { originalName: 'Larestan International Airport', displayName: 'Lar International Airport' },
  'jo-amman': { originalName: 'Amman Civil Airport (Marka International Airport)', displayName: 'Amman International Airport' },
  'jp-osaka': { originalName: 'Osaka International Airport (Itami)', displayName: 'Osaka International Airport' },
  'kh-siem-reap': { originalName: 'Siem Reap–Angkor International Airport', displayName: 'Siem Reap International Airport' },
  'kh-sihanoukville': { originalName: 'Sihanouk International Airport', displayName: 'Sihanoukville International Airport' },
  'kp-pyongyang': { originalName: 'Pyongyang Sunan International Airport', displayName: 'Pyongyang International Airport' },
  'kr-jeju-city': { originalName: 'Jeju International Airport', displayName: 'Jeju City International Airport' },
  'kw-kuwait-city': { originalName: 'Kuwait International Airport', displayName: 'Kuwait City International Airport' },
  'kz-kyzylorda': { originalName: 'Kyzylorda Korkyt Ata International Airport', displayName: 'Kyzylorda International Airport' },
  'lb-beirut': { originalName: 'Beirut–Rafic Hariri International Airport', displayName: 'Beirut International Airport' },
  'lk-colombo': { originalName: 'Colombo International Airport (Ratmalana)', displayName: 'Colombo International Airport' },
  'my-sepang-kuala-lumpur': { originalName: 'Kuala Lumpur International Airport', displayName: 'Sepang International Airport' },
  'ph-davao-city': { originalName: 'Davao International Airport (Francisco Bangoy International Airport)', displayName: 'Davao City International Airport' },
  'ph-zamboanga-city': { originalName: 'Zamboanga International Airport', displayName: 'Zamboanga City International Airport' },
  'ru-samara': { originalName: 'Samara Kurumoch International Airport', displayName: 'Samara International Airport' },
  'sy-latakia': { originalName: 'Latakia International Airport (Bassel Al', displayName: 'Latakia International Airport' },
  'uz-tashkent': { originalName: 'Islam Karimov Tashkent International Airport', displayName: 'Tashkent International Airport' },
  'vn-hanoi': { originalName: 'Noi Bai International Airport', displayName: 'Hanoi International Airport' },
};

export function getBigCityDisplayName(slug: string, name: string) {
  const override = airportDisplayOverrides[slug];
  return override?.originalName === name ? override.displayName : name;
}

function normalizeDisplayNameQuery(query: string) {
  return query.trim().toLocaleLowerCase();
}

export function getBigCityDisplayNameAliasSlugs(query: string) {
  const normalizedQuery = normalizeDisplayNameQuery(query);
  if (!normalizedQuery) return [];

  return Object.entries(airportDisplayOverrides)
    .filter(([, override]) => {
      const displayName = override.displayName.toLocaleLowerCase();
      const originalName = override.originalName.toLocaleLowerCase();
      return displayName.includes(normalizedQuery) && !originalName.includes(normalizedQuery);
    })
    .map(([slug]) => slug);
}

export function getBigCityDisplayNameExcludedSlugs(query: string) {
  const normalizedQuery = normalizeDisplayNameQuery(query);
  if (!normalizedQuery) return [];

  return Object.entries(airportDisplayOverrides)
    .filter(([, override]) => {
      const displayName = override.displayName.toLocaleLowerCase();
      const originalName = override.originalName.toLocaleLowerCase();
      return originalName.includes(normalizedQuery) && !displayName.includes(normalizedQuery);
    })
    .map(([slug]) => slug);
}