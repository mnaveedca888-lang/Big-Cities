import fs from 'fs';
import path from 'path';

const imagesDir = path.join(__dirname, 'public', 'Images', 'Events in Pakistan');
const files = fs.readdirSync(imagesDir).filter((file) => /\.(jpe?g|png|webp)$/i.test(file));
const target = 'Urs of Shah Rukn-e-Alam.webp';
const exact = files.includes(target);
console.log('HAS EXACT', exact);
console.log('FILES');
for (const file of files) {
  console.log(JSON.stringify(file));
}
console.log('ENCODED URL', ['/images', 'Events in Pakistan', target].map(encodeURIComponent).join('/'));
console.log('PATH ON DISK', path.join(imagesDir, target));
console.log('EXISTS ON DISK', fs.existsSync(path.join(imagesDir, target)));
