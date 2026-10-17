import { normalizeImageUrl } from './src/utils/imageValidation.js';
const url = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/India_Gate_in_New_Delhi_03-2016.jpg';
console.log('url:', url);
console.log('normalized:', normalizeImageUrl(url));
