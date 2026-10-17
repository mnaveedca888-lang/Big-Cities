const query = 'SELECT DISTINCT ?city ?label ?image WHERE { ?country wdt:P297 "BD". ?city (wdt:P17|wdt:P131+/wdt:P17) ?country; wdt:P18 ?image; (rdfs:label|skos:altLabel) ?label. VALUES ?targetLabel { "Chattogram"@en } FILTER(LANG(?label) = "en" && LCASE(STR(?label)) = LCASE(STR(?targetLabel))) }';
(async () => {
  const body = new URLSearchParams({ query, format: 'json' });
  const response = await fetch('https://query.wikidata.org/sparql', {
    method: 'POST',
    headers: { 'User-Agent': 'BigCitiesImageAudit/1.0 (city image verification)', 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/sparql-results+json' },
    body,
    signal: AbortSignal.timeout(30000),
  });
  console.log(JSON.stringify({ status: response.status, body: await response.text() }));
})().catch((error) => { console.error(error); process.exit(1); });
