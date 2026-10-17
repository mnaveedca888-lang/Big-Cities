const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'data', 'non_asia_country_image_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const existing = new Set((manifest.countries || []).map(c => c.code));
const missing = [
  ['NR','Nauru'],['NZ','New Zealand'],['PA','Panama'],['PE','Peru'],['PG','Papua New Guinea'],['PL','Poland'],['PT','Portugal'],['PW','Palau'],['PY','Paraguay'],['RO','Romania'],['RS','Serbia'],['RW','Rwanda'],['SB','Solomon Islands'],['SC','Seychelles'],['SD','Sudan'],['SE','Sweden'],['SI','Slovenia'],['SK','Slovakia'],['SL','Sierra Leone'],['SM','San Marino'],['SN','Senegal'],['SO','Somalia'],['SR','Suriname'],['SS','South Sudan'],['ST','São Tomé and Príncipe'],['SV','El Salvador'],['SZ','Eswatini'],['TD','Chad'],['TG','Togo'],['TN','Tunisia'],['TO','Tonga'],['TT','Trinidad and Tobago'],['TV','Tuvalu'],['TZ','Tanzania'],['UA','Ukraine'],['UG','Uganda'],['US','United States of America'],['UY','Uruguay'],['VA','Vatican City'],['VC','Saint Vincent and the Grenadines'],['VE','Venezuela'],['VU','Vanuatu'],['WS','Samoa'],['ZA','South Africa'],['ZM','Zambia'],['ZW','Zimbabwe']
];

async function fetchResult(query) {
  const url = 'https://www.pexels.com/search/' + encodeURIComponent(query) + '/';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 BigCitiesCountryImageImporter/1.0' } });
  const html = await res.text();
  const imageMatch = html.match(/https:\/\/images\.pexels\.com\/photos\/\d+\/[^"'\s]+/i);
  const photoMatch = html.match(/href="\/(?:photo|videos)\/[^"#?]+\/"/i);
  return { htmlSnippet: html.slice(0, 400), url, imageMatch: imageMatch ? imageMatch[0] : null, photoMatch: photoMatch ? 'https://www.pexels.com' + photoMatch[0].replace(/^href="/, '').replace(/"$/, '') : null };
}

(async () => {
  const results = [];
  for (const [code, country] of missing) {
    const q = country.replace(/&/g, ' and ');
    const r = await fetchResult(q);
    results.push({ code, country, query: q, image: r.imageMatch, page: r.photoMatch, url: r.url });
  }
  console.log(JSON.stringify(results, null, 2));
})();
