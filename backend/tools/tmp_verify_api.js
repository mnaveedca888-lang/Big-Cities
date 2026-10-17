const base = 'http://localhost:4000';
const paths = ['/countries/US', '/countries/US/cities', '/countries/GB', '/countries/GB/cities'];
(async () => {
  for (const path of paths) {
    try {
      const res = await fetch(base + path);
      const body = await res.text();
      console.log('PATH', path, 'STATUS', res.status);
      console.log(body);
    } catch (error) {
      console.error('ERROR', path, error.message);
    }
  }
})();
