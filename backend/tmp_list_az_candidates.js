const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'public', 'Images', 'Asia historical events');
const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|gif|tif|tiff)$/i.test(f)).sort();
const keywords = ['Azerbaijan', 'AZ-', 'Karachi', 'Ijtema', 'National', 'Novruz', 'Khojaly', 'Republic', 'Flag', 'Revival', 'Salvation', 'Solidarity', 'Armed'];
const matches = files.filter((file) => keywords.some((k) => file.toLowerCase().includes(k.toLowerCase())));
console.log(matches.join('\n'));
