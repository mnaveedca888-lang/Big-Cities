const fetch = global.fetch || require('node-fetch');
(async () => {
  const base = 'http://127.0.0.1:4000';
  const email = 'test-events-admin@example.com';
  const password = 'password123';
  try {
    const loginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const loginBody = await loginRes.json();
    if (!loginBody.success) throw new Error('Login failed: ' + JSON.stringify(loginBody));
    const token = loginBody.data.accessToken;
    const payload = {
      name: 'Afghanistan',
      profile: {
        area: 'Approximately 652,230 km²',
        capital: 'Kabul',
        economy: 'The economy remains heavily dependent on agriculture, trade, services, construction, mining and remittances.',
        sources: ['UN demographic statistics', 'World Bank', 'UNESCO', 'Afghanistan Ministry of Foreign Affairs', 'Timeanddate'],
        currency: 'Afghan Afghani',
        overview: 'Afghanistan is a landlocked country bordered by Pakistan, Iran, Turkmenistan, Uzbekistan, Tajikistan and China. Kabul is the national capital and largest urban centre.',
        bigCities: ['Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Khost'],
        continent: 'Asia',
        geography: 'The country has highly varied terrain, including the Hindu Kush, high plateaus, valleys, deserts and fertile river basins. Major river systems include the Amu Darya, Kabul River, Helmand River and Hari River.',
        thumbnail: null,
        totalArea: 'Approximately 652,230 km²',
        government: 'Afghanistan is currently governed de facto by the Taliban / Islamic Emirate of Afghanistan, which has exercised control since August 2021. International recognition remains contested.',
        population: 'Approximately 45.1 million (2026 estimate)',
        areaSqMiles: 'Approximately 251,830 sq mi',
        currencyCode: 'AFN',
        flagImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Flag_of_Afghanistan.svg',
        heroImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Kabul%2C_Afghanistan_view.jpg',
        currencySymbol: '؋ / Af',
        populationYear: 2026,
        shortDescription: 'A landlocked South-Central Asian country at the crossroads of Central and South Asia, known for its mountainous geography, long history and diverse cultural heritage.',
        numberOfBigCities: 5,
        officialLanguages: ['Dari', 'Pashto'],
      },
    };
    const patchRes = await fetch(`${base}/countries/AF`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const patchBody = await patchRes.json();
    console.log('RESTORE PATCH', patchRes.status, JSON.stringify(patchBody, null, 2));
    const getRes = await fetch(`${base}/countries/AF`, { headers: { Authorization: `Bearer ${token}` } });
    const getBody = await getRes.json();
    console.log('GET AFTER RESTORE', getRes.status, JSON.stringify(getBody, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();