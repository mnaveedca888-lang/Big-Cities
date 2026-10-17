const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const codes = ['AF','AE','AM','AZ','BD','BH','BN','BT','CN','CY','GE','ID','IL','IN','IQ','JO','JP','KG','KH','KP','KR','KW','KZ','LA','LB','LK','MM','MN','MV','MY','NP','OM','PH','PK','QA','RU','SA','SG','SY','TJ','TL','TM','TR','UZ','VN','YE'];
  const results = [];

  for (const code of codes) {
    try {
      const url = `http://localhost:5173/country/${code}`;
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const imgs = await page.locator('img').evaluateAll((nodes) => nodes.map((img) => ({
        src: img.currentSrc || img.src || '',
        naturalWidth: img.naturalWidth || 0,
        naturalHeight: img.naturalHeight || 0,
        complete: img.complete,
      })));
      const broken = imgs.filter((img) => !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0).length;
      results.push({ code, status: response ? response.status() : 0, imgCount: imgs.length, brokenImages: broken });
    } catch (error) {
      results.push({ code, status: 'error', error: String(error.message || error) });
    }
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
