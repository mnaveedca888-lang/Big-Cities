const path = require('path');
const fs = require('fs');

function normalizeValue(value) {
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[-_&]/g, ' ')
    .replace(/[^a-z0-9'" ]+/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

const titles = ['Quaid-e-Azam Day', 'National Horse & Cattle Show', 'Urs of Bahauddin Zakariya', 'Iqbal Day', 'Pakistan Day'];
const files = fs.readdirSync(path.join(__dirname, 'public', 'Images', 'Events in Pakistan')).filter((file) => /\.(jpe?g|png|webp)$/i.test(file));
for (const title of titles) {
  const target = normalizeValue(title);
  console.log('TITLE', title, '=>', target);
  for (const file of files) {
    const fileBase = file.replace(/\.[^.]+$/, '');
    const normalizedFile = normalizeValue(fileBase);
    if (normalizedFile.includes(target) || target.includes(normalizedFile)) {
      console.log('  MATCH', file, '=>', normalizedFile);
    }
    const imageTokens = normalizedFile.split(' ').filter(Boolean).filter((t) => !['the','a','an','of','in','on','and','for','to','near','at','by','with','day','festival','celebrations','celebration','show','conference','mela'].includes(t));
    const titleTokens = target.split(' ').filter(Boolean).filter((t) => !['the','a','an','of','in','on','and','for','to','near','at','by','with','day','festival','celebrations','celebration','show','conference','mela'].includes(t));
    const matchedTokens = imageTokens.filter((token) => titleTokens.some((titleToken) => titleToken.includes(token) || token.includes(titleToken)));
    if (matchedTokens.length) {
      console.log('  TOKENS', file, '=>', imageTokens, titleTokens, matchedTokens);
    }
  }
}
