const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(process.cwd(), 'public', 'Images', 'Africa cities images');
fs.mkdirSync(dir, { recursive: true });

const jobs = [
  {
    file: 'nosy-be.webp',
    urls: ['https://live.staticflickr.com/4743/40355267662_1527ee1db6_b.jpg'],
  },
  {
    file: 'plaine-magnien.webp',
    urls: ['https://upload.wikimedia.org/wikipedia/commons/f/f0/Plaine_magnien_2019-10-01.jpg'],
  },
  {
    file: 'livingstone.webp',
    urls: ['https://upload.wikimedia.org/wikipedia/commons/d/dd/Mosi-oa-Tunya%2C_Livingstone_%2820260519-P1075675%29.jpg'],
  },
  {
    file: 'ndola.webp',
    urls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Ndola_view_-_Flickr.jpg/1280px-Ndola_view_-_Flickr.jpg'],
  },
];

async function downloadAndConvert(job) {
  for (const url of job.urls) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'BigCitiesAfrica/1.0' },
      });
      if (!response.ok) {
        console.log(`skip ${job.file}: ${response.status} for ${url}`);
        continue;
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const webp = await sharp(buffer)
        .rotate()
        .resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      fs.writeFileSync(path.join(dir, job.file), webp);
      console.log(`saved ${job.file} from ${url}`);
      return true;
    } catch (error) {
      console.log(`failed ${job.file} from ${url}: ${error.message}`);
    }
  }
  console.log(`no valid source found for ${job.file}`);
  return false;
}

(async () => {
  for (const job of jobs) {
    await downloadAndConvert(job);
  }
  console.log('done');
})();
